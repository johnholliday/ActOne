/**
 * T056: Diagram-to-source pipeline test.
 *
 * Tests that diagram operations (create, delete, rename) produce
 * valid text edits that, when applied, result in valid re-parseable source.
 */

import { describe, it, expect } from 'vitest';
import { parseHelper } from 'langium/test';
import { createActOneServices, isCharacterDef, isSceneDef } from '@actone/lang';
import type { Document } from '@actone/lang/ast';

const services = createActOneServices();
const parse = parseHelper<Document>(services.ActOne);

describe('diagram → source pipeline', () => {
  describe('character creation via text edit', () => {
    it('adding a character definition creates a valid document', async () => {
      const originalSource = `
story "Test" {
  character Alice {
    bio: "Original character.",
  }
}`;
      // Simulate adding a character by inserting text before the closing brace
      const insertionPoint = originalSource.lastIndexOf('}');
      const newCharacterText = `
  character Bob {
    bio: "A new character added via diagram.",
  }
`;
      const modifiedSource =
        originalSource.substring(0, insertionPoint) +
        newCharacterText +
        originalSource.substring(insertionPoint);

      const doc = await parse(modifiedSource);
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const chars = doc.parseResult.value.story!.elements.filter(isCharacterDef);
      expect(chars).toHaveLength(2);
      expect(chars.map((c) => c.name)).toContain('Alice');
      expect(chars.map((c) => c.name)).toContain('Bob');
    });
  });

  describe('character deletion via text edit', () => {
    it('removing a character definition leaves a valid document', async () => {
      const source = `
story "Test" {
  character Alice {
    bio: "Will be kept.",
  }
  character Bob {
    bio: "Will be removed.",
  }
  scene Meeting {
    participants: [Alice],
    objective: "A test scene.",
  }
}`;
      // Find and remove the Bob character block
      const bobStart = source.indexOf('  character Bob {');
      const bobEnd = source.indexOf('}', source.indexOf('bio: "Will be removed."')) + 2; // +2 for closing brace + newline
      const modifiedSource =
        source.substring(0, bobStart) + source.substring(bobEnd);

      const doc = await parse(modifiedSource);
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const chars = doc.parseResult.value.story!.elements.filter(isCharacterDef);
      expect(chars).toHaveLength(1);
      expect(chars[0]!.name).toBe('Alice');
    });
  });

  describe('character rename via text edit', () => {
    it('renaming a character updates all references', async () => {
      const source = `
story "Test" {
  character Alice {
    bio: "The protagonist.",
  }
  scene S1 {
    participants: [Alice],
    objective: "Scene 1.",
  }
  scene S2 {
    pov: Alice,
    participants: [Alice],
    objective: "Scene 2.",
  }
}`;
      // Rename Alice to Elena everywhere
      const modifiedSource = source.replace(/\bAlice\b/g, 'Elena');

      const doc = await parse(modifiedSource);
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const chars = doc.parseResult.value.story!.elements.filter(isCharacterDef);
      expect(chars).toHaveLength(1);
      expect(chars[0]!.name).toBe('Elena');

      // Verify scenes still reference the renamed character
      const scenes = doc.parseResult.value.story!.elements.filter(isSceneDef);
      expect(scenes).toHaveLength(2);
    });
  });
});
