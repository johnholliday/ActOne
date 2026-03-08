import { describe, it } from 'vitest';
import { expectHover } from 'langium/test';
import { createActOneServices } from '../src/services/actone-module.js';

const services = createActOneServices();
const hover = expectHover(services.ActOne);

// ---------------------------------------------------------------------------
// T027 — Hover tooltip content
// ---------------------------------------------------------------------------

describe('character hover', () => {
  it('shows character information on hover', async () => {
    await hover({
      text: `
story "Test" {
  character Elena {
    nature: Human,
    bio: "A young painter searching for inspiration.",
    personality: {
      creativity: 85,
      introversion: 70,
    },
    relationships: [
      {
        to: Marco,
        weight: 60,
        label: "mentor",
      },
    ],
  }

  character Marco {
    nature: Human,
    bio: "An aging sculptor.",
  }

  scene Studio {
    participants: [<|>Elena],
  }
}`,
      index: 0,
      hover: /Elena/,
    });
  });

  it('shows character nature and bio excerpt', async () => {
    await hover({
      text: `
story "Test" {
  character <|>Elena {
    nature: Human,
    bio: "A young painter searching for inspiration in a quiet coastal town.",
    personality: {
      creativity: 85,
    },
  }
}`,
      index: 0,
      hover: /Nature: Human/,
    });
  });
});

describe('scene hover', () => {
  it('shows scene type and participants', async () => {
    await hover({
      text: `
story "Test" {
  character Alice {}

  scene <|>Awakening {
    type: Reflection,
    participants: [Alice],
    objective: "Alice contemplates.",
  }

  plot MainArc {
    subplot DecodingThread: {
      converges_at: Awakening,
    },
  }
}`,
      index: 0,
      hover: /Awakening/,
    });
  });
});

describe('theme hover', () => {
  it('shows theme statement', async () => {
    await hover({
      text: `
story "Test" {
  theme <|>Identity {
    statement: "Who we are is shaped by what we refuse to become.",
    motifs: ["mirrors", "masks"],
    counter: "We are the sum of our choices.",
    tension: "Characters confront reflections they cannot control.",
  }
}`,
      index: 0,
      hover: /Who we are is shaped by what we refuse to become/,
    });
  });
});

describe('world hover', () => {
  it('shows world period', async () => {
    await hover({
      text: `
story "Test" {
  world <|>QuantumLab {
    period: "Near future, 2087",
    locations: [
      {
        name: Observatory,
        description: "A dome with holographic displays.",
      },
    ],
    rules: [
      {
        rule: "Observation collapses probability.",
        category: Physical,
      },
    ],
  }
}`,
      index: 0,
      hover: /Near future, 2087/,
    });
  });
});
