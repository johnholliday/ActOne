/**
 * Test factory functions for creating fixture data.
 *
 * Each factory produces valid, sensible defaults that can be overridden
 * via partial parameter objects.
 */

import type {
  SerializedStory,
  SerializedCharacterDef,
  SerializedWorldDef,
  SerializedThemeDef,
  SerializedTimelineDef,
  SerializedSceneDef,
  SerializedPlotDef,
  SerializedInteractionDef,
  SerializedGenerateBlock,
} from '@repo/shared';

import type { DraftVersion, DraftStatus } from '$lib/ai/draft-manager.js';
import type {
  Manuscript,
  ManuscriptChapter,
  FrontMatter,
  BackMatter,
} from '$lib/publishing/manuscript-assembler.js';

// ── Character Factory ─────────────────────────────────────────────────

export function createTestCharacter(
  overrides: Partial<SerializedCharacterDef> = {},
): SerializedCharacterDef {
  return {
    $type: 'CharacterDef',
    name: 'Elena',
    nature: 'Human',
    bio: 'A young painter searching for inspiration.',
    role: 'Protagonist',
    voice: 'Observational and precise.',
    personality: [
      { name: 'creativity', value: 85 },
      { name: 'empathy', value: 70 },
    ],
    quirks: ['hums while painting'],
    goals: [
      {
        goal: 'Find inspiration',
        priority: 'Primary',
        stakes: 'Her artistic career',
      },
    ],
    conflicts: ['self-doubt vs. ambition'],
    strengths: ['observation'],
    flaws: ['perfectionism'],
    relationships: [],
    arc: {
      description: 'From stagnation to creative rebirth.',
      start: 'Blocked and frustrated.',
      end: 'Finds a new artistic vision.',
    },
    symbols: ['sunlight', 'canvas'],
    secret: undefined,
    notes: [],
    ...overrides,
  };
}

// ── Scene Factory ─────────────────────────────────────────────────────

export function createTestScene(
  overrides: Partial<SerializedSceneDef> = {},
): SerializedSceneDef {
  return {
    $type: 'SceneDef',
    name: 'Opening',
    sceneType: 'Reflection',
    location: 'Studio',
    pov: 'Elena',
    layer: undefined,
    participants: ['Elena'],
    atmosphere: [
      { name: 'calm', value: 70 },
      { name: 'wonder', value: 50 },
    ],
    objective: 'Elena contemplates the morning light.',
    trigger: undefined,
    transition: 'Cut',
    ...overrides,
  };
}

// ── World Factory ─────────────────────────────────────────────────────

export function createTestWorld(
  overrides: Partial<SerializedWorldDef> = {},
): SerializedWorldDef {
  return {
    $type: 'WorldDef',
    name: 'CoastalTown',
    period: 'Contemporary',
    sensory: ['sea breeze', 'gull cries'],
    locations: [
      {
        name: 'Studio',
        description: 'A sunlit room overlooking the harbor.',
        atmosphere: [{ name: 'calm', value: 70 }],
        connectsTo: ['Harbor'],
      },
      {
        name: 'Harbor',
        description: 'Fishing boats bob gently in the morning tide.',
        atmosphere: [{ name: 'vitality', value: 60 }],
        connectsTo: ['Studio'],
      },
    ],
    rules: [
      { rule: 'The tides follow a strict schedule.', category: 'Physical' },
    ],
    ...overrides,
  };
}

// ── Theme Factory ─────────────────────────────────────────────────────

export function createTestTheme(
  overrides: Partial<SerializedThemeDef> = {},
): SerializedThemeDef {
  return {
    $type: 'ThemeDef',
    name: 'Renewal',
    statement: 'Every ending seeds a beginning.',
    motifs: ['sunrise', 'tides'],
    counter: 'Some things are truly lost.',
    tension: 'Hope must coexist with grief.',
    ...overrides,
  };
}

// ── Timeline Factory ──────────────────────────────────────────────────

export function createTestTimeline(
  overrides: Partial<SerializedTimelineDef> = {},
): SerializedTimelineDef {
  return {
    $type: 'TimelineDef',
    name: 'MainTimeline',
    structure: 'Linear',
    span: 'One summer',
    layers: [
      { name: 'Present', description: 'Current events.', period: 'Summer' },
    ],
    ...overrides,
  };
}

// ── Plot Factory ──────────────────────────────────────────────────────

export function createTestPlot(
  overrides: Partial<SerializedPlotDef> = {},
): SerializedPlotDef {
  return {
    $type: 'PlotDef',
    name: 'MainArc',
    conflictType: 'Internal',
    resolutionPattern: 'Transformative',
    beats: [
      { beat: 'Elena arrives at the coastal town.', act: 1, type: 'Setup' },
      { beat: 'She discovers a hidden studio.', act: 2, type: 'Midpoint' },
      {
        beat: 'She completes her masterpiece.',
        act: 3,
        type: 'Resolution',
      },
    ],
    subplots: [],
    ...overrides,
  };
}

// ── Interaction Factory ───────────────────────────────────────────────

export function createTestInteraction(
  overrides: Partial<SerializedInteractionDef> = {},
): SerializedInteractionDef {
  return {
    $type: 'InteractionDef',
    name: 'ElenaMarcoMeeting',
    participants: ['Elena', 'Marco'],
    pattern: 'greeting -> curiosity -> warmth',
    styleMix: { Elena: 55, Marco: 45 },
    subtext: 'Both are cautious but drawn to each other.',
    powerDynamic: 'Equal — mutual curiosity.',
    emotionalArc: 'caution -> interest -> connection',
    ...overrides,
  };
}

// ── Generate Block Factory ────────────────────────────────────────────

export function createTestGenerateBlock(
  overrides: Partial<SerializedGenerateBlock> = {},
): SerializedGenerateBlock {
  return {
    $type: 'GenerateBlock',
    temperature: 0.8,
    maxTokens: 4000,
    continuityLoss: 0.1,
    styleBleed: true,
    genre: 'literary fiction',
    tone: ['contemplative', 'warm'],
    tense: 'Past',
    defaultPov: 'ThirdLimited',
    pacing: 'Measured',
    chapterBreaks: true,
    ...overrides,
  };
}

// ── Story Factory ─────────────────────────────────────────────────────

export function createTestStory(
  overrides: Partial<SerializedStory> & {
    characterCount?: number;
    sceneCount?: number;
  } = {},
): SerializedStory {
  const { characterCount, sceneCount, ...storyOverrides } = overrides;

  // Build characters
  const charNames = [
    'Elena',
    'Marco',
    'Sofia',
    'Luca',
    'Nina',
    'Kai',
    'Aria',
    'Bram',
    'Iris',
    'Ren',
  ];
  const numChars = characterCount ?? 2;
  const characters: SerializedCharacterDef[] = [];
  for (let i = 0; i < numChars; i++) {
    const name = charNames[i % charNames.length]!;
    characters.push(
      createTestCharacter({
        name,
        bio: `Character ${name} for testing.`,
        personality: [
          { name: 'trait_a', value: 50 + i * 5 },
          { name: 'trait_b', value: 40 + i * 3 },
        ],
        relationships:
          i > 0
            ? [
                {
                  to: charNames[(i - 1) % charNames.length]!,
                  weight: 50,
                  label: 'colleague',
                },
              ]
            : [],
      }),
    );
  }

  // Build scenes
  const sceneTypes = [
    'Action',
    'Dialogue',
    'Reflection',
    'Montage',
    'Revelation',
    'Confrontation',
    'Transition',
    'Climax',
  ];
  const numScenes = sceneCount ?? 2;
  const scenes: SerializedSceneDef[] = [];
  for (let i = 0; i < numScenes; i++) {
    scenes.push(
      createTestScene({
        name: `Scene${i + 1}`,
        sceneType: sceneTypes[i % sceneTypes.length],
        participants: [charNames[i % numChars]!],
        objective: `Scene ${i + 1} objective.`,
      }),
    );
  }

  const defaultElements = [
    createTestGenerateBlock(),
    createTestTheme(),
    ...characters,
    createTestWorld(),
    createTestTimeline(),
    ...scenes,
    createTestPlot(),
    createTestInteraction({
      participants:
        numChars >= 2
          ? [charNames[0]!, charNames[1]!]
          : [charNames[0]!, charNames[0]!],
    }),
  ];

  return {
    name: 'Test Story',
    elements: defaultElements,
    ...storyOverrides,
  };
}

// ── Draft Factory ─────────────────────────────────────────────────────

let _draftCounter = 0;

export function createTestDraft(
  overrides: Partial<DraftVersion> = {},
): DraftVersion {
  _draftCounter++;
  return {
    id: `00000000-0000-0000-0000-${String(_draftCounter).padStart(12, '0')}`,
    sceneName: 'Opening',
    paragraphIndex: 0,
    content: 'The morning light filtered through the studio windows.',
    status: 'pending' as DraftStatus,
    backend: 'claude-api',
    model: 'claude-sonnet-4-6',
    temperature: 0.8,
    tokenCount: 150,
    costUsd: 0.003,
    createdAt: new Date(
      Date.now() - (_draftCounter - 1) * 60_000,
    ).toISOString(),
    ...overrides,
  };
}

export function createTestDrafts(
  sceneName: string,
  paragraphCount: number,
  status: DraftStatus = 'accepted',
): DraftVersion[] {
  const drafts: DraftVersion[] = [];
  for (let i = 0; i < paragraphCount; i++) {
    drafts.push(
      createTestDraft({
        sceneName,
        paragraphIndex: i,
        content: `Paragraph ${i + 1} of scene "${sceneName}".`,
        status,
      }),
    );
  }
  return drafts;
}

// ── Manuscript Factory ────────────────────────────────────────────────

export function createTestManuscript(
  overrides: Partial<Manuscript> = {},
): Manuscript {
  const chapters: ManuscriptChapter[] = [
    {
      title: 'Chapter 1: Awakening',
      sceneName: 'Opening',
      paragraphs: [
        'The morning light filtered through the studio windows.',
        'Elena set her brush against the canvas and paused.',
        'Something in the air had shifted.',
      ],
    },
    {
      title: 'Chapter 2: Discovery',
      sceneName: 'Discovery',
      paragraphs: [
        'The harbor was alive with the sound of gulls.',
        'She found the hidden studio behind the old warehouse.',
      ],
    },
    {
      title: 'Chapter 3: Convergence',
      sceneName: 'Convergence',
      paragraphs: [
        'All the threads of the summer came together.',
        'Elena lifted her brush for the final stroke.',
        'The painting was complete.',
      ],
    },
  ];

  const frontMatter: FrontMatter = {
    halfTitle: 'The Morning Light',
    titlePage: { title: 'The Morning Light', author: 'Elena Voss' },
    copyright: `Copyright © ${new Date().getFullYear()} Elena Voss. All rights reserved.`,
    dedication: 'For those who seek the light.',
    tableOfContents: chapters.map((ch, i) => ({
      title: ch.title,
      index: i + 1,
    })),
  };

  const backMatter: BackMatter = {
    authorBio: 'Elena Voss is a fictional author created for testing.',
    characterIndex: [
      { name: 'Elena', firstAppearance: 1 },
      { name: 'Marco', firstAppearance: 2 },
    ],
  };

  return {
    frontMatter,
    chapters,
    backMatter,
    wordCount: chapters.reduce(
      (sum, ch) => sum + ch.paragraphs.join(' ').split(/\s+/).length,
      0,
    ),
    ...overrides,
  };
}

// ── Reset helpers ─────────────────────────────────────────────────────

/** Reset auto-incrementing counters between tests */
export function resetFactoryCounters(): void {
  _draftCounter = 0;
}
