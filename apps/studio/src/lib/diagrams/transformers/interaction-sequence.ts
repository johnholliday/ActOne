/**
 * T070: Interaction Sequence transformer.
 *
 * Produces character lifelines with exchange arrows
 * and style mix indicators.
 */

import type {
  SerializedStory,
  ActOneNode,
  ActOneEdge,
  LifelineData,
  ExchangeArrowData,
} from '@actone/shared';
import { CHARACTER_NATURE_COLORS, EDGE_STYLES } from '@actone/shared';
import { findInteractions, findCharacterByName } from '$lib/ast/ast-utils.js';
import { stableId, stableEdgeId } from '../operations/stable-refs.js';

export interface InteractionSequenceResult {
  nodes: ActOneNode<LifelineData>[];
  edges: ActOneEdge<ExchangeArrowData>[];
}

export function transformInteractionSequence(story: SerializedStory): InteractionSequenceResult {
  const interactions = findInteractions(story);
  const nodes: ActOneNode<LifelineData>[] = [];
  const edges: ActOneEdge<ExchangeArrowData>[] = [];
  const lifelineSet = new Set<string>();

  // Collect all unique participants across all interactions
  const LIFELINE_SPACING = 200;
  const EXCHANGE_Y_START = 120;
  const EXCHANGE_Y_STEP = 60;

  for (const interaction of interactions) {
    for (const participant of interaction.participants) {
      if (!lifelineSet.has(participant)) {
        lifelineSet.add(participant);
      }
    }
  }

  // Create lifeline nodes
  const participantList = Array.from(lifelineSet);
  for (let i = 0; i < participantList.length; i++) {
    const name = participantList[i]!;
    const character = findCharacterByName(story, name);
    const nature = character?.nature ?? 'Human';
    const color = CHARACTER_NATURE_COLORS[nature as keyof typeof CHARACTER_NATURE_COLORS] ?? '#6366f1';

    nodes.push({
      id: stableId('interaction', name),
      type: 'lifeline',
      position: { x: i * LIFELINE_SPACING + 100, y: 40 },
      data: {
        label: name,
        characterName: name,
        nature,
        color,
      } as LifelineData,
    });
  }

  // Create exchange arrows between participants
  let exchangeIndex = 0;
  for (const interaction of interactions) {
    const participants = interaction.participants;
    if (participants.length < 2) continue;

    // For each pair of adjacent participants, create exchange arrows
    // If there's a pattern defined, use it; otherwise create a simple exchange
    const styleMix = interaction.styleMix;

    for (let i = 0; i < participants.length - 1; i++) {
      const from = participants[i]!;
      const to = participants[i + 1]!;

      edges.push({
        id: stableEdgeId('interaction', from, 'interaction', to, interaction.name),
        source: stableId('interaction', from),
        target: stableId('interaction', to),
        type: 'exchange',
        data: {
          label: interaction.name,
          from,
          to,
          patternStep: interaction.pattern ?? '',
          styleMix,
          color: EDGE_STYLES.exchangeArrow,
        } as ExchangeArrowData,
      });

      exchangeIndex++;
    }

    // If more than 2 participants, also create reverse arrows for dialogue flow
    if (participants.length > 2) {
      const last = participants[participants.length - 1]!;
      const first = participants[0]!;

      edges.push({
        id: stableEdgeId('interaction', last, 'interaction', first, `${interaction.name}-return`),
        source: stableId('interaction', last),
        target: stableId('interaction', first),
        type: 'exchange',
        data: {
          label: `${interaction.name} (return)`,
          from: last,
          to: first,
          patternStep: interaction.pattern ?? '',
          styleMix,
          color: EDGE_STYLES.exchangeArrow,
        } as ExchangeArrowData,
      });
    }
  }

  return { nodes, edges };
}
