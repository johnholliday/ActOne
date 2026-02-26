/**
 * T022: Shared package type exports smoke test.
 *
 * Verifies that all expected type and value exports from @repo/shared
 * are accessible and correctly typed. This catches accidental removal
 * of public API surface.
 */

import { describe, it, expect } from 'vitest';

// ── Value exports (testable at runtime) ─────────────────────────────

import {
  // Project lifecycle
  VALID_TRANSITIONS,
  isValidTransition,
  // Enum arrays
  CHARACTER_NATURES,
  SCENE_TYPES,
  TIMELINE_STRUCTURES,
  TRANSITION_TYPES,
  CONFLICT_TYPES,
  RESOLUTION_PATTERNS,
  BEAT_TYPES,
  TENSES,
  POVS,
  PACINGS,
  GOAL_PRIORITIES,
  RULE_CATEGORIES,
  // Color maps
  SCENE_TYPE_COLORS,
  BEAT_TYPE_COLORS,
  EDGE_STYLES,
  CHARACTER_NATURE_COLORS,
  // Validation ranges
  VALIDATION,
} from '@repo/shared';

// ── Type-only exports (compile-time verification) ───────────────────

import type {
  StableId,
  ActOneNode,
  ActOneEdge,
  SceneNodeData,
  BeatEdgeData,
  ChapterGroupData,
  CharacterNodeData,
  RelationshipEdgeData,
  WorldContainerData,
  LocationNodeData,
  LocationLinkData,
  TimelineLayerData,
  TimelineBlockData,
  ArcPhaseBandData,
  LifelineData,
  ExchangeArrowData,
  GenerationRequest,
  GenerationStreamEvent,
  CostEstimate,
  BackendInfo,
  ExportFormat,
  ExportConfig,
  ExportResult,
  LifecycleStage,
  CompositionMode,
  LifecycleTransition,
  SerializedStory,
  SerializedStoryElement,
  SerializedCharacterDef,
  SerializedWorldDef,
  SerializedThemeDef,
  SerializedTimelineDef,
  SerializedSceneDef,
  SerializedPlotDef,
  SerializedInteractionDef,
  SerializedGenerateBlock,
  CharacterNature,
  SceneType,
  TimelineStructure,
  TransitionType,
  ConflictType,
  ResolutionPattern,
  BeatType,
  Tense,
  POV,
  Pacing,
  GoalPriority,
  RuleCategory,
} from '@repo/shared';

// ── Tests ───────────────────────────────────────────────────────────

describe('@repo/shared type exports', () => {
  describe('lifecycle transitions', () => {
    it('exports VALID_TRANSITIONS as a readonly array', () => {
      expect(Array.isArray(VALID_TRANSITIONS)).toBe(true);
      expect(VALID_TRANSITIONS.length).toBeGreaterThan(0);
      expect(VALID_TRANSITIONS[0]).toHaveProperty('from');
      expect(VALID_TRANSITIONS[0]).toHaveProperty('to');
    });

    it('exports isValidTransition function', () => {
      expect(typeof isValidTransition).toBe('function');
      expect(isValidTransition('concept', 'draft')).toBe(true);
      expect(isValidTransition('concept', 'published')).toBe(false);
    });
  });

  describe('enum arrays', () => {
    it('exports CHARACTER_NATURES with expected values', () => {
      expect(CHARACTER_NATURES).toContain('Human');
      expect(CHARACTER_NATURES).toContain('Force');
      expect(CHARACTER_NATURES).toContain('Concept');
      expect(CHARACTER_NATURES).toContain('Animal');
      expect(CHARACTER_NATURES).toContain('Spirit');
      expect(CHARACTER_NATURES).toContain('Collective');
      expect(CHARACTER_NATURES).toContain('Environment');
      expect(CHARACTER_NATURES).toHaveLength(7);
    });

    it('exports SCENE_TYPES with 8 types', () => {
      expect(SCENE_TYPES).toHaveLength(8);
      expect(SCENE_TYPES).toContain('Action');
      expect(SCENE_TYPES).toContain('Climax');
    });

    it('exports TIMELINE_STRUCTURES with 6 structures', () => {
      expect(TIMELINE_STRUCTURES).toHaveLength(6);
      expect(TIMELINE_STRUCTURES).toContain('Linear');
      expect(TIMELINE_STRUCTURES).toContain('Nonlinear');
    });

    it('exports TRANSITION_TYPES with 8 types', () => {
      expect(TRANSITION_TYPES).toHaveLength(8);
      expect(TRANSITION_TYPES).toContain('Cut');
      expect(TRANSITION_TYPES).toContain('Flashback');
    });

    it('exports CONFLICT_TYPES with 8 types', () => {
      expect(CONFLICT_TYPES).toHaveLength(8);
      expect(CONFLICT_TYPES).toContain('Interpersonal');
      expect(CONFLICT_TYPES).toContain('Cosmic');
    });

    it('exports RESOLUTION_PATTERNS with 7 patterns', () => {
      expect(RESOLUTION_PATTERNS).toHaveLength(7);
      expect(RESOLUTION_PATTERNS).toContain('Transformative');
      expect(RESOLUTION_PATTERNS).toContain('Ambiguous');
    });

    it('exports BEAT_TYPES with 10 types', () => {
      expect(BEAT_TYPES).toHaveLength(10);
      expect(BEAT_TYPES).toContain('Setup');
      expect(BEAT_TYPES).toContain('Denouement');
    });

    it('exports TENSES with 3 values', () => {
      expect(TENSES).toHaveLength(3);
      expect(TENSES).toContain('Past');
      expect(TENSES).toContain('Present');
      expect(TENSES).toContain('Future');
    });

    it('exports POVS with 4 values', () => {
      expect(POVS).toHaveLength(4);
      expect(POVS).toContain('FirstPerson');
      expect(POVS).toContain('ThirdOmniscient');
    });

    it('exports PACINGS with 5 values', () => {
      expect(PACINGS).toHaveLength(5);
      expect(PACINGS).toContain('Slow');
      expect(PACINGS).toContain('Accelerating');
    });

    it('exports GOAL_PRIORITIES with 3 values', () => {
      expect(GOAL_PRIORITIES).toHaveLength(3);
      expect(GOAL_PRIORITIES).toContain('Primary');
      expect(GOAL_PRIORITIES).toContain('Hidden');
    });

    it('exports RULE_CATEGORIES with 5 values', () => {
      expect(RULE_CATEGORIES).toHaveLength(5);
      expect(RULE_CATEGORIES).toContain('Physical');
      expect(RULE_CATEGORIES).toContain('Metaphysical');
    });
  });

  describe('color maps', () => {
    it('exports SCENE_TYPE_COLORS as a record', () => {
      expect(typeof SCENE_TYPE_COLORS).toBe('object');
      expect(SCENE_TYPE_COLORS).toHaveProperty('Action');
    });

    it('exports BEAT_TYPE_COLORS as a record', () => {
      expect(typeof BEAT_TYPE_COLORS).toBe('object');
      expect(BEAT_TYPE_COLORS).toHaveProperty('Setup');
    });

    it('exports EDGE_STYLES as a record', () => {
      expect(typeof EDGE_STYLES).toBe('object');
    });

    it('exports CHARACTER_NATURE_COLORS as a record', () => {
      expect(typeof CHARACTER_NATURE_COLORS).toBe('object');
      expect(CHARACTER_NATURE_COLORS).toHaveProperty('Human');
    });
  });

  describe('validation ranges', () => {
    it('exports VALIDATION with correct range structure', () => {
      expect(VALIDATION.trait).toEqual({ min: 0, max: 100 });
      expect(VALIDATION.relationshipWeight).toEqual({ min: -100, max: 100 });
      expect(VALIDATION.mood).toEqual({ min: 0, max: 100 });
      expect(VALIDATION.temperature).toEqual({ min: 0.0, max: 2.0 });
      expect(VALIDATION.continuityLoss).toEqual({ min: 0.0, max: 1.0 });
      expect(VALIDATION.styleBleed).toEqual({ min: 0.0, max: 1.0 });
      expect(VALIDATION.styleMix).toEqual({ min: 0, max: 100 });
      expect(VALIDATION.maxTokens).toEqual({ min: 1, max: 100_000 });
    });

    it('exports VALIDATION.project limits', () => {
      expect(VALIDATION.project.maxCharacters).toBe(50);
      expect(VALIDATION.project.maxScenes).toBe(100);
      expect(VALIDATION.project.maxSourceFiles).toBe(10);
    });
  });

  describe('type-level compile checks', () => {
    // These tests verify that the type imports compile correctly.
    // If any type is removed from @repo/shared, this file will fail to compile.

    it('StableId matches expected format', () => {
      const id: StableId = 'character:Elena';
      expect(id).toBe('character:Elena');
    });

    it('ActOneNode has required fields', () => {
      const node: ActOneNode<SceneNodeData> = {
        id: 'scene:Opening' as StableId,
        type: 'scene',
        position: { x: 0, y: 0 },
        data: {
          name: 'Opening',
          sceneType: 'Reflection',
          participants: ['Elena'],
          location: 'Studio',
          objective: 'Test',
          estimatedWordCount: 500,
        },
      };
      expect(node.id).toBe('scene:Opening');
    });

    it('ActOneEdge has required fields', () => {
      const edge: ActOneEdge<RelationshipEdgeData> = {
        id: 'edge-1',
        source: 'character:Elena' as StableId,
        target: 'character:Marco' as StableId,
        data: { weight: 50, label: 'friend', dynamic: false },
      };
      expect(edge.source).toBe('character:Elena');
    });

    it('SerializedStory has name and elements', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [],
      };
      expect(story.name).toBe('Test');
    });

    it('SerializedCharacterDef has $type discriminator', () => {
      const char: SerializedCharacterDef = {
        $type: 'CharacterDef',
        name: 'Test',
        personality: [],
        quirks: [],
        goals: [],
        conflicts: [],
        strengths: [],
        flaws: [],
        relationships: [],
        symbols: [],
        notes: [],
      };
      expect(char.$type).toBe('CharacterDef');
    });

    it('LifecycleStage union includes all stages', () => {
      const stages: LifecycleStage[] = [
        'concept',
        'draft',
        'revision',
        'final',
        'published',
      ];
      expect(stages).toHaveLength(5);
    });

    it('CostEstimate has expected shape', () => {
      const estimate: CostEstimate = {
        estimatedCostUsd: 0.01,
        estimatedTokens: 500,
      };
      expect(estimate.estimatedCostUsd).toBe(0.01);
    });

    it('ExportFormat includes expected formats', () => {
      const formats: ExportFormat[] = ['epub', 'docx', 'pdf', 'kindle'];
      expect(formats).toHaveLength(4);
    });

    it('GenerationStreamEvent has type discriminator', () => {
      const event: GenerationStreamEvent = {
        type: 'chunk',
        text: 'Hello',
      };
      expect(event.type).toBe('chunk');
    });

    it('BackendInfo has expected shape', () => {
      const info: BackendInfo = {
        id: 'test',
        name: 'Test Backend',
        type: 'text',
        available: true,
        capabilities: {
          maxContextTokens: 100_000,
          streaming: true,
          concurrentRequests: 5,
        },
      };
      expect(info.type).toBe('text');
    });
  });
});
