import { describe, it, expect } from 'vitest';
import { highlightHelper, expectSemanticToken } from 'langium/test';
import { SemanticTokenTypes } from 'vscode-languageserver-protocol';
import { createActOneServices } from '../src/services/actone-module.js';

const services = createActOneServices();
const highlight = highlightHelper(services.ActOne);

// ---------------------------------------------------------------------------
// T029 — Semantic token classification
// ---------------------------------------------------------------------------

describe('semantic token classification', () => {
  it('classifies type definitions correctly', async () => {
    const result = await highlight(`
story "Test" {
  character <|Elena|> {
    nature: Human,
    bio: "A test character.",
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.type,
    });
  });

  it('classifies world name as type', async () => {
    const result = await highlight(`
story "Test" {
  world <|CoastalTown|> {
    period: "Present day",
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.type,
    });
  });

  it('classifies theme name as type', async () => {
    const result = await highlight(`
story "Test" {
  theme <|Identity|> {
    statement: "Who we are.",
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.type,
    });
  });

  it('classifies scene name as type', async () => {
    const result = await highlight(`
story "Test" {
  scene <|Awakening|> {
    type: Reflection,
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.type,
    });
  });

  it('classifies plot name as type', async () => {
    const result = await highlight(`
story "Test" {
  plot <|MainArc|> {
    conflict_type: Interpersonal,
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.type,
    });
  });

  it('classifies timeline name as type', async () => {
    const result = await highlight(`
story "Test" {
  timeline <|MainTimeline|> {
    structure: Linear,
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.type,
    });
  });

  it('classifies interaction name as type', async () => {
    const result = await highlight(`
story "Test" {
  interaction <|MeetingScene|> {
    pattern: "greeting -> farewell",
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.type,
    });
  });

  it('classifies personality trait names as property', async () => {
    const result = await highlight(`
story "Test" {
  character Alice {
    personality: {
      <|creativity|>: 85,
    },
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.property,
    });
  });

  it('classifies mood entry names as property', async () => {
    const result = await highlight(`
story "Test" {
  world Town {
    locations: [
      {
        name: Studio,
        atmosphere: {
          <|unease|>: 70,
        },
      },
    ],
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.property,
    });
  });

  it('classifies style_mix character references as variable', async () => {
    const result = await highlight(`
story "Test" {
  character Alice {}
  character Bob {}
  interaction Meeting {
    participants: [Alice, Bob],
    style_mix: {
      <|Alice|>: 60,
      Bob: 40,
    },
  }
}`);
    expectSemanticToken(result, {
      rangeIndex: 0,
      tokenType: SemanticTokenTypes.variable,
    });
  });
});
