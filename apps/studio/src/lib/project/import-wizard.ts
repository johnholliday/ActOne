/**
 * Import wizard: extracts text from uploaded files, identifies project metadata
 * (title, genre) via AI, and generates .actone DSL files using the 'split' strategy.
 *
 * Uses @docugenix/sanyam-ai-import endpoints:
 *   POST /api/ai-import/extract   — extract text from uploaded files
 *   POST /api/ai-import/generate  — generate DSL from extracted text (SSE stream)
 */

import type { ExtractionResult } from '@docugenix/sanyam-ai-import';
import grammarRules from '@actone/lang/actone.langium?raw';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface ImportFileInput {
  fileBase64: string;
  filename: string;
}

export interface ExtractedDocument {
  filename: string;
  text: string;
  metadata: Record<string, unknown>;
  charCount: number;
  warnings: string[];
}

export interface ImportMetadata {
  title: string;
  genre: string;
}

export interface GeneratedFile {
  filename: string;
  content: string;
}

export interface ImportProgress {
  phase: 'extracting' | 'analyzing' | 'generating' | 'done' | 'error';
  message: string;
  /** For 'generating' phase: files completed so far */
  filesCompleted?: string[];
  /** For 'generating' phase: current file being written */
  currentFile?: string;
}

/* ── File conversion ───────────────────────────────────────────────── */

/** Convert a browser File to a base64-encoded input for the extract API. */
export async function fileToInput(file: File): Promise<ImportFileInput> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return {
    fileBase64: btoa(binary),
    filename: file.name,
  };
}

/* ── Step 1: Extract text from files ───────────────────────────────── */

export async function extractFiles(
  files: ImportFileInput[],
  fetchFn: typeof fetch = fetch,
): Promise<ExtractedDocument[]> {
  const res = await fetchFn('/api/ai-import/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message ?? `Extract failed (${res.status})`);
  }

  const data = await res.json() as { results: ExtractedDocument[] };
  return data.results;
}

/* ── Step 2: Analyze extracted text for title and genre ─────────────── */

/**
 * Uses the ai-text generate endpoint to ask the LLM to identify
 * the project title and genre from the extracted document text.
 */
export async function analyzeMetadata(
  documents: ExtractedDocument[],
  backendId: string,
  fetchFn: typeof fetch = fetch,
): Promise<ImportMetadata> {
  // Concatenate a sample of extracted text (first 4000 chars from each doc)
  const sample = documents
    .map((d) => `[${d.filename}]\n${d.text.slice(0, 4000)}`)
    .join('\n\n---\n\n')
    .slice(0, 12000);

  const res = await fetchFn('/api/ai-text/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      backendId,
      systemPrompt:
        'You are a literary analyst. Analyze the provided text and identify the story title and genre. ' +
        'Respond with ONLY a JSON object: {"title": "...", "genre": "..."}. ' +
        'For the title, use the actual title if found in the text, otherwise infer a suitable title. ' +
        'For genre, use a concise label like "Fantasy", "Science Fiction", "Literary Fiction", "Thriller", etc.',
      userPrompt: `Analyze these documents and identify the story title and genre:\n\n${sample}`,
      temperature: 0.3,
      maxTokens: 200,
    }),
  });

  if (!res.ok) {
    // Fall back to defaults if analysis fails
    return { title: 'Imported Project', genre: '' };
  }

  // Parse SSE response — collect all chunks
  let fullText = '';
  const reader = res.body?.getReader();
  if (!reader) return { title: 'Imported Project', genre: '' };

  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6)) as { text?: string };
          if (data.text) fullText += data.text;
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  }

  // Extract JSON from the response
  try {
    const jsonMatch = fullText.match(/\{[^}]*"title"\s*:\s*"[^"]*"[^}]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { title?: string; genre?: string };
      return {
        title: parsed.title || 'Imported Project',
        genre: parsed.genre || '',
      };
    }
  } catch {
    // Fall through to defaults
  }

  return { title: 'Imported Project', genre: '' };
}

/* ── Step 3: Generate DSL files using 'split' strategy ─────────────── */

/**
 * Streams DSL generation from the ai-import /generate endpoint
 * using the 'split' file strategy. Calls onProgress for UI updates.
 */
export async function generateDslFiles(
  documents: ExtractedDocument[],
  backendId: string,
  onProgress?: (progress: ImportProgress) => void,
  fetchFn: typeof fetch = fetch,
): Promise<GeneratedFile[]> {
  const texts: ExtractionResult[] = documents.map((d) => ({
    filename: d.filename,
    text: d.text,
    metadata: d.metadata,
    charCount: d.charCount,
    warnings: d.warnings,
  }));

  const res = await fetchFn('/api/ai-import/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts,
      grammarRules,
      backendId,
      fileStrategy: 'split',
      instructions:
        'Generate syntactically valid ActOne DSL files. ' +
        'Organize into logical files by category: characters, worlds, scenes, themes, etc. ' +
        'Use .actone file extension for all generated files. ' +
        'Mark the main entry file (containing the story declaration and generate block) as story.actone.',
      temperature: 0.5,
      maxTokens: 16384,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message ?? `Generation failed (${res.status})`);
  }

  // Parse SSE stream with file_start/chunk/file_end/done events
  const outputFiles = new Map<string, string>();
  let currentFile = '';
  const completedFiles: string[] = [];

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const message = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      let event = '';
      let data = '';
      for (const line of message.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7);
        if (line.startsWith('data: ')) data = line.slice(6);
      }

      if (!data) continue;
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }

      switch (event) {
        case 'file_start':
          currentFile = (parsed.filename as string) || '';
          outputFiles.set(currentFile, '');
          onProgress?.({
            phase: 'generating',
            message: `Generating ${currentFile}...`,
            currentFile,
            filesCompleted: [...completedFiles],
          });
          break;
        case 'chunk':
          if (currentFile && parsed.text) {
            outputFiles.set(
              currentFile,
              (outputFiles.get(currentFile) ?? '') + (parsed.text as string),
            );
          }
          break;
        case 'file_end':
          if (currentFile) {
            completedFiles.push(currentFile);
          }
          break;
        case 'done':
          onProgress?.({
            phase: 'done',
            message: `Generated ${completedFiles.length} files`,
            filesCompleted: [...completedFiles],
          });
          break;
      }
    }
  }

  // Also handle merge/separate fallback (single stream, no file events)
  // In that case outputFiles will be empty but buffer may have leftover text chunks
  if (outputFiles.size === 0 && buffer.trim()) {
    outputFiles.set('story.actone', buffer);
  }

  return Array.from(outputFiles.entries()).map(([filename, content]) => ({
    filename: filename.endsWith('.actone') ? filename : `${filename}.actone`,
    content,
  }));
}

/* ── Get default backend ID ────────────────────────────────────────── */

export async function getDefaultBackendId(
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  try {
    const res = await fetchFn('/api/ai-text/backends');
    if (!res.ok) return 'anthropic';
    const data = await res.json() as { backends: Array<{ id: string }> };
    return data.backends[0]?.id ?? 'anthropic';
  } catch {
    return 'anthropic';
  }
}
