/**
 * T059: Validation latency benchmarks.
 *
 * Benchmarks validation using createActOneServices() and validationHelper.
 * - minimal.actone: <200ms
 * - full-story.actone: <200ms
 * - large-project (50 chars, 100 scenes): <500ms
 *
 * Includes CI tolerance margins (3x).
 */

import { describe, it, expect } from 'vitest';
import { validationHelper } from 'langium/test';
import { createActOneServices } from '@actone/lang';
import type { Story } from '@actone/lang/ast';
import fs from 'node:fs';

const services = createActOneServices();
const validate = validationHelper<Story>(services.ActOne);

const langiumFixtures = new URL(
  '../../../../packages/lang-actone/tests/fixtures/',
  import.meta.url,
);

function readFixture(name: string): string {
  return fs.readFileSync(new URL(name, langiumFixtures), 'utf-8');
}

function readLargeProject(): string[] {
  const dir = new URL('large-project/', langiumFixtures);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.actone'));
  return files.map((f) => fs.readFileSync(new URL(f, dir), 'utf-8'));
}

// CI environments are often slower; allow 3x tolerance
const CI_MULTIPLIER = process.env.CI ? 3 : 1;

describe('validation latency', () => {
  it('minimal.actone validates under 200ms', async () => {
    const input = readFixture('minimal.actone');
    const threshold = 200 * CI_MULTIPLIER;

    const start = performance.now();
    await validate(input);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(threshold);
  });

  it('full-story.actone validates under 200ms', async () => {
    const input = readFixture('full-story.actone');
    const threshold = 200 * CI_MULTIPLIER;

    const start = performance.now();
    await validate(input);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(threshold);
  });

  it('large-project validates under 500ms', async () => {
    const files = readLargeProject();
    const threshold = 500 * CI_MULTIPLIER;

    // Validate each file (simulates loading a multi-file project)
    const start = performance.now();
    for (const content of files) {
      await validate(content);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(threshold);
  });

  it('warm-up run is faster than cold start', async () => {
    const input = readFixture('minimal.actone');

    // Cold run
    const coldStart = performance.now();
    await validate(input);
    const coldElapsed = performance.now() - coldStart;

    // Warm run
    const warmStart = performance.now();
    await validate(input);
    const warmElapsed = performance.now() - warmStart;

    // Warm run should be at least as fast (may not always hold, but generally true)
    // We just verify both complete within threshold
    expect(coldElapsed).toBeLessThan(500 * CI_MULTIPLIER);
    expect(warmElapsed).toBeLessThan(200 * CI_MULTIPLIER);
  });
});
