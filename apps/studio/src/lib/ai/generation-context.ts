/**
 * Domain type for ActOne's scene generation context.
 *
 * Extracted from backend-registry.ts during sanyam-ai-provider 0.10.0 migration.
 * Used by context-assembler, prompt-builder, and cost-estimator.
 */

/** Generation context assembled from AST. */
export interface GenerationContext {
  sceneName: string;
  sceneType: string;
  location: string;
  atmosphere: Array<{ name: string; value: number }>;
  objective: string;
  participants: Array<{
    name: string;
    nature: string;
    bio: string;
    voice: string;
    personality: Array<{ name: string; value: number }>;
  }>;
  worldRules: string[];
  precedingSceneSummary?: string;
  themeStatements: string[];
  interactionPattern?: string;
  pacing: string;
  temperature: number;
}
