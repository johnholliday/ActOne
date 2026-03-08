import { describe, it, expect } from 'vitest';
import { expectSymbols } from 'langium/test';
import { createActOneServices } from '../src/services/actone-module.js';

const services = createActOneServices();
const symbols = expectSymbols(services.ActOne);

// ---------------------------------------------------------------------------
// T030 — Document symbol hierarchy
// ---------------------------------------------------------------------------

describe('document symbol hierarchy', () => {
  it('story is the root symbol', async () => {
    await symbols({
      text: `
story "Minimal Story" {
  character Alice {
    nature: Human,
  }
}`,
      assert: (syms) => {
        expect(syms).toHaveLength(1);
        expect(syms[0]!.name).toBe('Minimal Story');
      },
    });
  });

  it('characters appear as children of story', async () => {
    await symbols({
      text: `
story "Test" {
  character Alice {
    nature: Human,
    bio: "First character.",
  }
  character Bob {
    nature: Human,
    bio: "Second character.",
  }
}`,
      assert: (syms) => {
        expect(syms).toHaveLength(1);
        const story = syms[0]!;
        const childNames = story.children?.map((c) => c.name) ?? [];
        expect(childNames).toContain('Alice');
        expect(childNames).toContain('Bob');
      },
    });
  });

  it('scenes appear as children of story', async () => {
    await symbols({
      text: `
story "Test" {
  character Alice {}

  scene Awakening {
    type: Reflection,
    participants: [Alice],
    objective: "Morning contemplation.",
  }
  scene Departure {
    type: Action,
    participants: [Alice],
    objective: "Alice leaves.",
  }
}`,
      assert: (syms) => {
        expect(syms).toHaveLength(1);
        const story = syms[0]!;
        const childNames = story.children?.map((c) => c.name) ?? [];
        expect(childNames).toContain('Awakening');
        expect(childNames).toContain('Departure');
      },
    });
  });

  it('all element types appear as symbols', async () => {
    await symbols({
      text: `
story "Test" {
  character Alice {}
  world W {}
  theme T {
    statement: "A theme.",
  }
  timeline TL {
    structure: Linear,
  }
  scene S {
    type: Action,
    participants: [Alice],
    objective: "Action.",
  }
  plot P {
    conflict_type: Interpersonal,
  }
  interaction I {
    participants: [Alice],
    pattern: "greeting -> farewell",
  }
  generate {
    temperature: 0.7,
  }
}`,
      assert: (syms) => {
        // Story is root
        expect(syms).toHaveLength(1);
        const story = syms[0]!;
        expect(story.name).toBe('Test');
        // All elements are children
        const childNames = story.children?.map((c) => c.name) ?? [];
        expect(childNames).toContain('Alice');
        expect(childNames).toContain('W');
        expect(childNames).toContain('T');
        expect(childNames).toContain('TL');
        expect(childNames).toContain('S');
        expect(childNames).toContain('P');
        expect(childNames).toContain('I');
      },
    });
  });

  it('personality traits appear as children of character', async () => {
    await symbols({
      text: `
story "Test" {
  character Elena {
    nature: Human,
    bio: "A painter.",
    personality: {
      creativity: 85,
      introversion: 70,
      empathy: 60,
    },
  }
}`,
      assert: (syms) => {
        expect(syms).toHaveLength(1);
        const story = syms[0]!;
        const elena = story.children?.find((c) => c.name === 'Elena');
        expect(elena).toBeDefined();
        // Personality traits should be nested somewhere under the character
        const allDescendantNames = collectDescendantNames(elena!);
        expect(allDescendantNames).toContain('creativity');
        expect(allDescendantNames).toContain('introversion');
        expect(allDescendantNames).toContain('empathy');
      },
    });
  });
});

/**
 * Recursively collects all descendant symbol names from a DocumentSymbol tree.
 */
function collectDescendantNames(
  symbol: import('vscode-languageserver-protocol').DocumentSymbol,
): string[] {
  const names: string[] = [];
  for (const child of symbol.children ?? []) {
    names.push(child.name);
    names.push(...collectDescendantNames(child));
  }
  return names;
}
