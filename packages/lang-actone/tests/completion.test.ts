import { describe, it, expect } from 'vitest';
import { expectCompletion } from 'langium/test';
import { createActOneServices } from '../src/services/actone-module.js';

const services = createActOneServices();
const completion = expectCompletion(services.ActOne);

describe('top-level keywords', () => {
  it('suggests all element keywords at story body position', async () => {
    await completion({
      text: `
story "Test" {
  <|>
}`,
      index: 0,
      assert: (completionList) => {
        const labels = completionList.items.map((i) => i.label);
        expect(labels).toContain('character');
        expect(labels).toContain('scene');
        expect(labels).toContain('world');
        expect(labels).toContain('theme');
        expect(labels).toContain('timeline');
        expect(labels).toContain('plot');
        expect(labels).toContain('interaction');
        expect(labels).toContain('generate');
      },
    });
  });
});

describe('character property keywords', () => {
  it('suggests character property keywords inside character body', async () => {
    await completion({
      text: `
story "Test" {
  character Foo {
    <|>
  }
}`,
      index: 0,
      expectedItems: [
        'nature',
        'bio',
        'role',
        'personality',
        'voice',
        'quirks',
        'goals',
        'conflicts',
        'strengths',
        'flaws',
        'relationships',
        'arc',
        'symbols',
        'secret',
        'notes',
      ],
    });
  });
});

describe('enum values', () => {
  it('suggests nature enum values', async () => {
    await completion({
      text: `
story "Test" {
  character Foo {
    nature: <|>
  }
}`,
      index: 0,
      expectedItems: [
        'Human',
        'Force',
        'Concept',
        'Animal',
        'Spirit',
        'Collective',
        'Environment',
      ],
    });
  });

  it('suggests scene type enum values', async () => {
    await completion({
      text: `
story "Test" {
  scene S1 {
    type: <|>
  }
}`,
      index: 0,
      expectedItems: [
        'Action',
        'Dialogue',
        'Reflection',
        'Montage',
        'Revelation',
        'Confrontation',
        'Transition',
        'Climax',
      ],
    });
  });

  it('suggests transition type enum values', async () => {
    await completion({
      text: `
story "Test" {
  scene S1 {
    transition: <|>
  }
}`,
      index: 0,
      expectedItems: [
        'Cut',
        'Dissolve',
        'Flashback',
        'FlashForward',
        'Parallel',
        'Smash',
        'Fade',
        'Montage',
      ],
    });
  });
});

describe('character name references', () => {
  it('suggests character names at participants position', async () => {
    await completion({
      text: `
story "Test" {
  character Alice {}
  character Bob {}
  scene S1 {
    participants: [<|>],
  }
}`,
      index: 0,
      assert: (completionList) => {
        const labels = completionList.items.map((i) => i.label);
        expect(labels).toContain('Alice');
        expect(labels).toContain('Bob');
      },
    });
  });
});

describe('no invalid suggestions', () => {
  it('does not suggest random text at invalid positions', async () => {
    await completion({
      text: `
story "Test" {
  character Foo {
    bio: "<|>"
  }
}`,
      index: 0,
      assert: (completionList) => {
        const labels = completionList.items.map((i) => i.label);
        // Inside a string value, we should not see structural keywords
        expect(labels).not.toContain('character');
        expect(labels).not.toContain('scene');
        expect(labels).not.toContain('world');
        expect(labels).not.toContain('nature');
        expect(labels).not.toContain('Human');
      },
    });
  });
});
