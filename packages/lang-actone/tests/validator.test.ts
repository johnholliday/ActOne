import { describe, it, expect } from 'vitest';
import { validationHelper, expectError, expectNoIssues } from 'langium/test';
import type { ValidationResult } from 'langium/test';
import { createActOneServices } from '../src/services/actone-module.js';
import type { Story } from '../src/generated/ast.js';
import { isCharacterDef, isGenerateBlock, isPersonalityTrait } from '../src/generated/ast.js';
import fs from 'node:fs';

const services = createActOneServices();
const validate = validationHelper<Story>(services.ActOne);
const fixturesDir = new URL('./fixtures/', import.meta.url);

// ---------------------------------------------------------------------------
// Helper: read a fixture file
// ---------------------------------------------------------------------------
function readFixture(name: string): string {
  return fs.readFileSync(new URL(name, fixturesDir), 'utf-8');
}

// ---------------------------------------------------------------------------
// Valid documents
// ---------------------------------------------------------------------------
describe('valid documents', () => {
  it('full-story.actone produces zero diagnostics', async () => {
    const input = readFixture('full-story.actone');
    const result = await validate(input);
    expectNoIssues(result);
  });

  it('minimal.actone produces zero diagnostics', async () => {
    const input = readFixture('minimal.actone');
    const result = await validate(input);
    expectNoIssues(result);
  });
});

// ---------------------------------------------------------------------------
// Personality trait range (0–100)
// ---------------------------------------------------------------------------
describe('personality trait range', () => {
  it('rejects trait value -1 at parser level (NUMBER terminal is unsigned)', async () => {
    // The grammar uses NUMBER (unsigned) for personality traits,
    // so negative values are rejected by the parser, not the validator.
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
    personality: {
      courage: -1,
    },
  }
}`;
    const result = await validate(input);
    // Parser error, not validation diagnostic
    expect(result.document.parseResult.parserErrors.length).toBeGreaterThan(0);
  });

  it('rejects trait value 101 (above maximum)', async () => {
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
    personality: {
      courage: 101,
    },
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain('between 0 and 100');
  });

  it('accepts trait value 0 (boundary)', async () => {
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
    personality: {
      courage: 0,
    },
  }
}`;
    const result = await validate(input);
    expectNoIssues(result);
  });

  it('accepts trait value 100 (boundary)', async () => {
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
    personality: {
      courage: 100,
    },
  }
}`;
    const result = await validate(input);
    expectNoIssues(result);
  });
});

// ---------------------------------------------------------------------------
// Relationship weight range (-100 to +100)
// ---------------------------------------------------------------------------
describe('relationship weight range', () => {
  it('rejects weight -101', async () => {
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
    relationships: [
      { to: Bob, weight: -101, label: "enemy" },
    ],
  }
  character Bob {
    nature: Human,
    bio: "Test.",
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain('between -100 and +100');
  });

  it('rejects weight 101', async () => {
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
    relationships: [
      { to: Bob, weight: 101, label: "close" },
    ],
  }
  character Bob {
    nature: Human,
    bio: "Test.",
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain('between -100 and +100');
  });

  it('accepts weight -100 (boundary)', async () => {
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
    relationships: [
      { to: Bob, weight: -100, label: "enemy" },
    ],
  }
  character Bob {
    nature: Human,
    bio: "Test.",
  }
}`;
    const result = await validate(input);
    expectNoIssues(result);
  });

  it('accepts weight 100 (boundary)', async () => {
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
    relationships: [
      { to: Bob, weight: 100, label: "best friend" },
    ],
  }
  character Bob {
    nature: Human,
    bio: "Test.",
  }
}`;
    const result = await validate(input);
    expectNoIssues(result);
  });
});

// ---------------------------------------------------------------------------
// Mood range (0–100)
// ---------------------------------------------------------------------------
describe('mood range', () => {
  it('rejects mood value -1 at parser level (NUMBER terminal is unsigned)', async () => {
    // The grammar uses NUMBER (unsigned) for mood values,
    // so negative values are rejected by the parser, not the validator.
    const input = `
story "Test" {
  world TestWorld {
    locations: [
      {
        name: TestPlace,
        description: "A test location.",
        atmosphere: {
          dread: -1,
        },
      },
    ],
  }
}`;
    const result = await validate(input);
    expect(result.document.parseResult.parserErrors.length).toBeGreaterThan(0);
  });

  it('rejects mood value 101', async () => {
    const input = `
story "Test" {
  world TestWorld {
    locations: [
      {
        name: TestPlace,
        description: "A test location.",
        atmosphere: {
          dread: 101,
        },
      },
    ],
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain('between 0 and 100');
  });

  it('accepts mood value 0 and 100', async () => {
    const input = `
story "Test" {
  world TestWorld {
    locations: [
      {
        name: TestPlace,
        description: "A test location.",
        atmosphere: {
          dread: 0,
          joy: 100,
        },
      },
    ],
  }
}`;
    const result = await validate(input);
    expectNoIssues(result);
  });
});

// ---------------------------------------------------------------------------
// Temperature range (0.0–2.0)
// ---------------------------------------------------------------------------
describe('temperature range', () => {
  it('rejects temperature 2.1', async () => {
    const input = `
story "Test" {
  generate {
    temperature: 2.1,
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain('between 0.0 and 2.0');
  });

  it('accepts temperature 0.0 and 2.0', async () => {
    const input = `
story "Test" {
  generate {
    temperature: 0.0,
  }
}`;
    const result1 = await validate(input);
    expectNoIssues(result1);

    const input2 = `
story "Test" {
  generate {
    temperature: 2.0,
  }
}`;
    const result2 = await validate(input2);
    expectNoIssues(result2);
  });
});

// ---------------------------------------------------------------------------
// Continuity loss range (0.0–1.0)
// ---------------------------------------------------------------------------
describe('continuity_loss range', () => {
  it('rejects continuity_loss 1.1', async () => {
    const input = `
story "Test" {
  generate {
    continuity_loss: 1.1,
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain('between 0.0 and 1.0');
  });

  it('accepts continuity_loss 0.0 and 1.0', async () => {
    const input = `
story "Test" {
  generate {
    continuity_loss: 0.0,
  }
}`;
    const result1 = await validate(input);
    expectNoIssues(result1);

    const input2 = `
story "Test" {
  generate {
    continuity_loss: 1.0,
  }
}`;
    const result2 = await validate(input2);
    expectNoIssues(result2);
  });
});

// ---------------------------------------------------------------------------
// Style mix range (0–100)
// ---------------------------------------------------------------------------
describe('style_mix range', () => {
  it('rejects style_mix value -1 at parser level (NUMBER terminal is unsigned)', async () => {
    // The grammar uses NUMBER (unsigned) for style_mix values,
    // so negative values are rejected by the parser, not the validator.
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
  }
  character Bob {
    nature: Human,
    bio: "Test.",
  }
  interaction TestInteraction {
    participants: [Alice, Bob],
    pattern: "test",
    style_mix: {
      Alice: -1,
    },
  }
}`;
    const result = await validate(input);
    expect(result.document.parseResult.parserErrors.length).toBeGreaterThan(0);
  });

  it('rejects style_mix value 101', async () => {
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
  }
  character Bob {
    nature: Human,
    bio: "Test.",
  }
  interaction TestInteraction {
    participants: [Alice, Bob],
    pattern: "test",
    style_mix: {
      Alice: 101,
    },
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain('between 0 and 100');
  });
});

// ---------------------------------------------------------------------------
// Max tokens range (1–100,000)
// ---------------------------------------------------------------------------
describe('max_tokens range', () => {
  it('rejects max_tokens 0', async () => {
    const input = `
story "Test" {
  generate {
    max_tokens: 0,
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain('between 1 and 100,000');
  });

  it('rejects max_tokens 100001', async () => {
    const input = `
story "Test" {
  generate {
    max_tokens: 100001,
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain('between 1 and 100,000');
  });

  it('accepts max_tokens 1 and 100000', async () => {
    const input = `
story "Test" {
  generate {
    max_tokens: 1,
  }
}`;
    const result1 = await validate(input);
    expectNoIssues(result1);

    const input2 = `
story "Test" {
  generate {
    max_tokens: 100000,
  }
}`;
    const result2 = await validate(input2);
    expectNoIssues(result2);
  });
});

// ---------------------------------------------------------------------------
// Structural violations
// ---------------------------------------------------------------------------
describe('structural violations', () => {
  it('rejects duplicate generate blocks', async () => {
    const input = `
story "Test" {
  generate {
    temperature: 0.5,
  }
  generate {
    temperature: 1.0,
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1);
    const dupError = result.diagnostics.find((d) =>
      d.message.includes('at most one generate block'),
    );
    expect(dupError).toBeDefined();
  });

  it('rejects self-relationships', async () => {
    const input = `
story "Test" {
  character Alice {
    nature: Human,
    bio: "Test.",
    relationships: [
      { to: Alice, weight: 50, label: "self" },
    ],
  }
}`;
    const result = await validate(input);
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1);
    const selfError = result.diagnostics.find((d) =>
      d.message.includes('cannot have a relationship with itself'),
    );
    expect(selfError).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// invalid-values.actone fixture
// ---------------------------------------------------------------------------
describe('invalid-values.actone fixture', () => {
  it('produces expected number of diagnostics', async () => {
    const input = readFixture('invalid-values.actone');
    const result = await validate(input);
    // The fixture contains multiple intentional violations:
    //   1. Duplicate generate block (1 error)
    //   2. Personality trait 101 (1 error)
    //   3. Self-relationship Alice->Alice (1 error)
    //   4. Relationship weight -101 (1 error)
    //   5. Relationship weight 101 (1 error)
    //   6. Mood value 101 (1 error)
    //   7. Style mix 101 (1 error)
    //   8. Unresolved reference UnknownCharacter (linking error)
    // Note: Negative values for mood/personality/style_mix are rejected
    // at the parser level (NUMBER terminal is unsigned), not by validators.
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(7);
  });
});
