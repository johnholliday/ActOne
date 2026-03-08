import { describe, it } from 'vitest';
import { expectFormatting } from 'langium/test';
import { createActOneServices } from '../src/services/actone-module.js';

const services = createActOneServices();
const formatting = expectFormatting(services.ActOne);

// ---------------------------------------------------------------------------
// T028 — Formatting
// ---------------------------------------------------------------------------

describe('indentation normalization', () => {
  it('normalizes 4-space indentation to 2-space', async () => {
    await formatting({
      before: [
        'story "Test" {',
        '    character Alice {',
        '        nature: Human,',
        '        bio: "A test character.",',
        '    }',
        '}',
      ].join('\n'),
      after: [
        'story "Test" {',
        '  character Alice {',
        '    nature: Human,',
        '    bio: "A test character.",',
        '  }',
        '}',
      ].join('\n'),
      options: { insertSpaces: true, tabSize: 2 },
    });
  });

  it('normalizes tab indentation to 2-space', async () => {
    await formatting({
      before: [
        'story "Test" {',
        '\tcharacter Bob {',
        '\t\tnature: Human,',
        '\t\tbio: "Another test character.",',
        '\t}',
        '}',
      ].join('\n'),
      after: [
        'story "Test" {',
        '  character Bob {',
        '    nature: Human,',
        '    bio: "Another test character.",',
        '  }',
        '}',
      ].join('\n'),
      options: { insertSpaces: true, tabSize: 2 },
    });
  });
});

describe('blank line normalization', () => {
  it('removes excessive blank lines between elements', async () => {
    await formatting({
      before: [
        'story "Test" {',
        '  character Alice {',
        '    nature: Human,',
        '  }',
        '',
        '',
        '',
        '',
        '  character Bob {',
        '    nature: Human,',
        '  }',
        '}',
      ].join('\n'),
      after: [
        'story "Test" {',
        '  character Alice {',
        '    nature: Human,',
        '  }',
        '  character Bob {',
        '    nature: Human,',
        '  }',
        '}',
      ].join('\n'),
      options: { insertSpaces: true, tabSize: 2 },
    });
  });
});

describe('idempotency', () => {
  it('formatting already-formatted text produces identical output', async () => {
    const formatted = [
      'story "Test" {',
      '  character Alice {',
      '    nature: Human,',
      '    bio: "A young painter.",',
      '    personality: {',
      '      creativity: 85,',
      '    },',
      '  }',
      '  scene Awakening {',
      '    type: Reflection,',
      '    participants: [Alice],',
      '    objective: "Elena contemplates the morning light.",',
      '  }',
      '}',
    ].join('\n');

    await formatting({
      before: formatted,
      after: formatted,
      options: { insertSpaces: true, tabSize: 2 },
    });
  });
});

describe('content preservation', () => {
  it('preserves string content', async () => {
    await formatting({
      before: [
        'story "The Morning Light" {',
        '    character Elena {',
        '        bio: "A young painter searching for inspiration in a quiet coastal town. She paints at dawn.",',
        '        voice: "Soft, meandering sentences that drift like watercolors on wet paper.",',
        '    }',
        '}',
      ].join('\n'),
      after: [
        'story "The Morning Light" {',
        '  character Elena {',
        '    bio: "A young painter searching for inspiration in a quiet coastal town. She paints at dawn.",',
        '    voice: "Soft, meandering sentences that drift like watercolors on wet paper.",',
        '  }',
        '}',
      ].join('\n'),
      options: { insertSpaces: true, tabSize: 2 },
    });
  });
});
