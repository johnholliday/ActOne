// ── Stable Identity ────────────────────────────────────────────────────

/** Content-addressable ID for diagram-source mapping (e.g., "character:Elena") */
export type StableId = `${string}:${string}`;

// ── Base Node/Edge Types ───────────────────────────────────────────────

export interface ActOneNode<T = Record<string, unknown>> {
  id: StableId;
  type: string;
  position: { x: number; y: number };
  data: T;
  width?: number;
  height?: number;
  parentId?: StableId;
  style?: string;
  className?: string;
}

export interface ActOneEdge<T = Record<string, unknown>> {
  id: string;
  source: StableId;
  target: StableId;
  type?: string;
  label?: string;
  data?: T;
  animated?: boolean;
  style?: string;
  markerEnd?: string;
}

// ── Story Structure View ───────────────────────────────────────────────

export interface SceneNodeData {
  name: string;
  sceneType: string;
  participants: string[];
  location: string;
  objective: string;
  estimatedWordCount: number;
}

export interface BeatEdgeData {
  beatType: string;
  description: string;
  act: number;
}

export interface ChapterGroupData {
  chapterName: string;
  sceneCount: number;
}

// ── Character Network View ─────────────────────────────────────────────

export interface CharacterNodeData {
  name: string;
  nature: string;
  role: string;
  bio: string;
  sceneCount: number;
  topTraits: Array<{ name: string; value: number }>;
}

export interface RelationshipEdgeData {
  weight: number;
  label: string;
  dynamic: boolean;
}

// ── World Map View ─────────────────────────────────────────────────────

export interface WorldContainerData {
  name: string;
  period: string;
}

export interface LocationNodeData {
  name: string;
  description: string;
  atmosphere: Array<{ name: string; value: number }>;
  sceneMarkers: string[];
}

export interface LocationLinkData {
  fromLocation: string;
  toLocation: string;
}

// ── Timeline View ──────────────────────────────────────────────────────

export interface TimelineLayerData {
  name: string;
  description: string;
  period: string;
}

export interface TimelineBlockData {
  sceneName: string;
  sceneType: string;
  estimatedWordCount: number;
  layerName: string;
}

export interface ArcPhaseBandData {
  phase: string;
  startRatio: number;
  endRatio: number;
}

// ── Interaction Sequence View ──────────────────────────────────────────

export interface LifelineData {
  characterName: string;
  nature: string;
  role?: string;
  /** Dynamic bar height based on number of exchanges. */
  lifelineHeight?: number;
}

export interface ExchangeArrowData {
  from: string;
  to: string;
  patternStep: string;
  styleMix: Record<string, number>;
  powerDynamic?: string;
  /** Y position for the exchange arrow in sequence diagram layout. */
  exchangeY?: number;
  /** Source lifeline center X in sequence diagram layout. */
  sourceX?: number;
  /** Target lifeline center X in sequence diagram layout. */
  targetX?: number;
}
