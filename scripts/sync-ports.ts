/**
 * sync-ports.ts — Propagates port assignments from ports.json into all config files.
 *
 * Usage:
 *   node --experimental-strip-types scripts/sync-ports.ts
 *   node --experimental-strip-types scripts/sync-ports.ts --dry-run
 *
 * Phases:
 *   1. Load & validate ports.json
 *   2. Apply replacements to downstream files
 *   3. Report what changed / unchanged / skipped
 *   4. Print OAuth provider reconfiguration instructions
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Types ──────────────────────────────────────────────────────────────

interface PortsConfig {
  devServer: {
    port: number;
    host: string;
  };
  supabase: {
    api: { port: number };
    db: { port: number };
    dbShadow: { port: number };
    studio: { port: number };
    inbucket: { port: number };
    smtp: { port: number };
    pop3: { port: number };
    analytics: { port: number };
    pooler: { port: number };
    edgeInspector: { port: number };
  };
  oauth: {
    providers: string[];
    callbackPath: string;
  };
}

interface FileUpdate {
  /** Path relative to repo root */
  relPath: string;
  /** If false, skip with warning when file is missing */
  required: boolean;
  /** Transform file content using the ports config */
  transform: (content: string, config: PortsConfig) => string;
}

type FileResult =
  | { status: 'changed'; relPath: string }
  | { status: 'unchanged'; relPath: string }
  | { status: 'skipped'; relPath: string; reason: string };

// ── Helpers ────────────────────────────────────────────────────────────

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

/**
 * Replace a key's value within a specific TOML section.
 *
 * Tracks [section.subsection] headers line-by-line and only replaces
 * within the matching section (before the next [...] header).
 */
function replaceInTomlSection(
  content: string,
  section: string,
  key: string,
  value: number | string,
): string {
  const lines = content.split('\n');
  let inSection = false;
  const sectionHeader = `[${section}]`;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();

    // Track section boundaries
    if (trimmed.startsWith('[') && !trimmed.startsWith('[[')) {
      inSection = trimmed === sectionHeader;
      continue;
    }

    if (inSection) {
      // Match: key = value (with optional whitespace)
      const keyRegex = new RegExp(`^(\\s*${escapeRegex(key)}\\s*=\\s*)(.+)$`);
      const match = lines[i]!.match(keyRegex);
      if (match) {
        const formattedValue = typeof value === 'string' ? `"${value}"` : String(value);
        lines[i] = `${match[1]}${formattedValue}`;
        break; // Only replace first occurrence in the section
      }
    }
  }

  return lines.join('\n');
}

/**
 * Replace a commented-out TOML key: `# key = value`
 */
function replaceCommentedTomlKey(
  content: string,
  key: string,
  value: number,
): string {
  const regex = new RegExp(
    `^(\\s*#\\s*${escapeRegex(key)}\\s*=\\s*)\\d+`,
    'm',
  );
  return content.replace(regex, `$1${value}`);
}

/**
 * Replace a TOML URL value by key name.
 * Handles both quoted strings and arrays of quoted strings.
 */
function replaceTomlUrl(
  content: string,
  key: string,
  newUrl: string,
): string {
  // Match: key = "http://..." or key = ["http://..."]
  const regex = new RegExp(
    `^(\\s*${escapeRegex(key)}\\s*=\\s*)(.+)$`,
    'm',
  );
  return content.replace(regex, (_match, prefix: string, existing: string) => {
    const trimmed = existing.trim();
    if (trimmed.startsWith('[')) {
      // Array of URLs — replace all http(s)://host:port patterns
      const updated = trimmed.replace(
        /http:\/\/[\w.-]+:\d+/g,
        newUrl,
      );
      return `${prefix}${updated}`;
    }
    // Single quoted URL
    return `${prefix}"${newUrl}"`;
  });
}

/**
 * Replace an env var line: KEY=<url-with-port>
 * Updates the port portion of URLs like http://host:PORT/...
 */
function replaceEnvUrl(
  content: string,
  key: string,
  host: string,
  port: number,
): string {
  const regex = new RegExp(
    `^(${escapeRegex(key)}=\\w*://)[\\w.-]+:\\d+(.*)$`,
    'm',
  );
  return content.replace(regex, `$1${host}:${port}$2`);
}

/**
 * Replace all `http://localhost:PORT` occurrences in test files.
 */
function replaceTestLocalhostPort(content: string, port: number): string {
  return content.replace(
    /http:\/\/localhost:\d+/g,
    `http://localhost:${port}`,
  );
}

/**
 * Replace `port: NNNNN` in Vite/JS config files.
 */
function replaceJsPort(content: string, port: number): string {
  return content.replace(
    /^(\s*port:\s*)\d+/m,
    `$1${port}`,
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Phase 1: Load & Validate ──────────────────────────────────────────

function loadConfig(): PortsConfig {
  const configPath = path.join(ROOT, 'ports.json');
  if (!fs.existsSync(configPath)) {
    console.error('Error: ports.json not found at repo root.');
    process.exit(1);
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  let config: PortsConfig;
  try {
    config = JSON.parse(raw) as PortsConfig;
  } catch (e) {
    console.error('Error: ports.json contains invalid JSON.');
    return process.exit(1) as never;
  }

  // Validate all port values
  const allPorts: Array<{ name: string; port: number }> = [
    { name: 'devServer', port: config.devServer.port },
  ];
  for (const [key, val] of Object.entries(config.supabase)) {
    allPorts.push({ name: `supabase.${key}`, port: val.port });
  }

  const errors: string[] = [];
  for (const { name, port } of allPorts) {
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
      errors.push(`  ${name}: ${port} (must be integer in 1024–65535)`);
    }
  }

  // Check for duplicate ports
  const seen = new Map<number, string>();
  for (const { name, port } of allPorts) {
    const existing = seen.get(port);
    if (existing) {
      errors.push(`  Duplicate port ${port}: ${existing} and ${name}`);
    }
    seen.set(port, name);
  }

  if (errors.length > 0) {
    console.error('Error: Invalid port configuration:\n' + errors.join('\n'));
    process.exit(1);
  }

  return config;
}

// ── Phase 2: Define File Updates ──────────────────────────────────────

function buildFileUpdates(config: PortsConfig): FileUpdate[] {
  const sb = config.supabase;
  const dev = config.devServer;
  const siteUrl = `http://${dev.host}:${dev.port}`;

  return [
    // 1. supabase/config.toml
    {
      relPath: 'supabase/config.toml',
      required: true,
      transform: (content) => {
        let result = content;

        // Section-aware port replacements
        result = replaceInTomlSection(result, 'api', 'port', sb.api.port);
        result = replaceInTomlSection(result, 'db', 'port', sb.db.port);
        result = replaceInTomlSection(result, 'db', 'shadow_port', sb.dbShadow.port);
        result = replaceInTomlSection(result, 'db.pooler', 'port', sb.pooler.port);
        result = replaceInTomlSection(result, 'studio', 'port', sb.studio.port);
        result = replaceInTomlSection(result, 'inbucket', 'port', sb.inbucket.port);
        result = replaceInTomlSection(result, 'analytics', 'port', sb.analytics.port);
        result = replaceInTomlSection(result, 'edge_runtime', 'inspector_port', sb.edgeInspector.port);

        // Commented-out SMTP/POP3 ports
        result = replaceCommentedTomlKey(result, 'smtp_port', sb.smtp.port);
        result = replaceCommentedTomlKey(result, 'pop3_port', sb.pop3.port);

        // URL fields in [auth]
        result = replaceTomlUrl(result, 'site_url', siteUrl);
        result = replaceTomlUrl(result, 'additional_redirect_urls', siteUrl);

        return result;
      },
    },

    // 2. apps/studio/.env (optional — gitignored)
    {
      relPath: 'apps/studio/.env',
      required: false,
      transform: (content) => {
        let result = content;
        result = replaceEnvUrl(result, 'PUBLIC_SUPABASE_URL', dev.host, sb.api.port);
        result = replaceEnvUrl(result, 'DATABASE_URL', dev.host, sb.db.port);
        return result;
      },
    },

    // 3. apps/studio/.env.example
    {
      relPath: 'apps/studio/.env.example',
      required: true,
      transform: (content) => {
        let result = content;
        result = replaceEnvUrl(result, 'PUBLIC_SUPABASE_URL', dev.host, sb.api.port);
        result = replaceEnvUrl(result, 'DATABASE_URL', dev.host, sb.db.port);
        return result;
      },
    },

    // 4. Vite config (dev server port)
    {
      relPath: 'apps/studio/vite.config.ts',
      required: true,
      transform: (content) => replaceJsPort(content, dev.port),
    },

    // 5. Playwright config
    {
      relPath: 'apps/studio/tests/e2e/playwright.config.ts',
      required: true,
      transform: (content) => replaceTestLocalhostPort(content, dev.port),
    },

    // 6. Load event mocks
    {
      relPath: 'apps/studio/tests/fixtures/mocks/load-event.ts',
      required: true,
      transform: (content) => replaceTestLocalhostPort(content, dev.port),
    },

    // 7. API test helpers
    {
      relPath: 'apps/studio/tests/integration/api/helpers.ts',
      required: true,
      transform: (content) => replaceTestLocalhostPort(content, dev.port),
    },
  ];
}

// ── Phase 3: Apply & Report ───────────────────────────────────────────

function applyUpdates(updates: FileUpdate[]): FileResult[] {
  const results: FileResult[] = [];

  for (const update of updates) {
    const absPath = path.join(ROOT, update.relPath);

    if (!fs.existsSync(absPath)) {
      if (update.required) {
        console.error(`Error: Required file not found: ${update.relPath}`);
        process.exit(1);
      }
      results.push({
        status: 'skipped',
        relPath: update.relPath,
        reason: 'file not found (optional)',
      });
      continue;
    }

    const original = fs.readFileSync(absPath, 'utf-8');
    const updated = update.transform(original, null!);

    if (updated === original) {
      results.push({ status: 'unchanged', relPath: update.relPath });
    } else {
      if (!dryRun) {
        fs.writeFileSync(absPath, updated, 'utf-8');
      }
      results.push({ status: 'changed', relPath: update.relPath });
    }
  }

  return results;
}

function printReport(results: FileResult[]): void {
  const prefix = dryRun ? '[DRY RUN] ' : '';
  console.log(`\n${prefix}Port sync results:\n`);

  const changed = results.filter((r) => r.status === 'changed');
  const unchanged = results.filter((r) => r.status === 'unchanged');
  const skipped = results.filter((r) => r.status === 'skipped');

  if (changed.length > 0) {
    const verb = dryRun ? 'Would update' : 'Updated';
    for (const r of changed) {
      console.log(`  ${verb}: ${r.relPath}`);
    }
  }

  if (unchanged.length > 0) {
    for (const r of unchanged) {
      console.log(`  Unchanged: ${r.relPath}`);
    }
  }

  if (skipped.length > 0) {
    for (const r of skipped) {
      if (r.status === 'skipped') {
        console.log(`  Skipped: ${r.relPath} (${r.reason})`);
      }
    }
  }

  console.log(
    `\n  Total: ${changed.length} ${dryRun ? 'would change' : 'changed'}, ${unchanged.length} unchanged, ${skipped.length} skipped`,
  );
}

// ── Phase 4: OAuth Instructions ───────────────────────────────────────

function printOAuthInstructions(config: PortsConfig): void {
  const dev = config.devServer;
  const sb = config.supabase;
  const supabaseCallbackUrl = `http://${dev.host}:${sb.api.port}/auth/v1/callback`;
  const appCallbackUrl = `http://${dev.host}:${dev.port}${config.oauth.callbackPath}`;
  const originUrl = `http://${dev.host}:${dev.port}`;

  const providerInstructions: Record<string, string> = {
    github: `── GitHub OAuth App ${'─'.repeat(56)}
   Dashboard:  https://github.com/settings/developers
   Find your OAuth App and update:
     Authorization callback URL:  ${supabaseCallbackUrl}
     Homepage URL:                ${originUrl}`,

    google: `── Google OAuth Client ${'─'.repeat(53)}
   Dashboard:  https://console.cloud.google.com/apis/credentials
   Find your OAuth 2.0 Client ID and update:
     Authorized redirect URIs:      ${supabaseCallbackUrl}
     Authorized JavaScript origins:  ${originUrl}`,

    entra_id: `── Microsoft Entra ID (Azure AD) ${'─'.repeat(43)}
   Dashboard:  https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
   Find your app registration and update:
     Redirect URIs (Web):  ${supabaseCallbackUrl}`,
  };

  console.log(`
${'='.repeat(80)}
  OAuth Provider Configuration
${'='.repeat(80)}

Provider callback URL (Supabase Auth API):

    ${supabaseCallbackUrl}

Post-auth redirect URL (your app):

    ${appCallbackUrl}

You MUST update the callback URL in each OAuth provider's admin console:
`);

  for (const provider of config.oauth.providers) {
    const instructions = providerInstructions[provider];
    if (instructions) {
      console.log(instructions);
      console.log();
    } else {
      console.log(`── ${provider} ${'─'.repeat(70 - provider.length)}`);
      console.log(`   Update callback URL to: ${callbackUrl}`);
      console.log();
    }
  }

  console.log(`NOTE: OAuth providers redirect to Supabase Auth (port ${sb.api.port}),
which then redirects the user to your app (port ${dev.port}).
The SvelteKit app constructs its callback URL dynamically from
url.origin, so no app code changes are needed — only external
provider consoles and Supabase config.
${'='.repeat(80)}`);
}

// ── Main ───────────────────────────────────────────────────────────────

function main(): void {
  console.log(dryRun ? 'Running in dry-run mode...\n' : 'Syncing ports...\n');

  // Phase 1
  const config = loadConfig();

  // Phase 2 & 3
  const updates = buildFileUpdates(config);
  const results = applyUpdates(updates);
  printReport(results);

  // Phase 4
  printOAuthInstructions(config);
}

main();
