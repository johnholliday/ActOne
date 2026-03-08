/**
 * T070: Interaction Sequence transformer.
 *
 * Produces a standard sequence diagram: character lifelines arranged
 * horizontally across the top, with exchange arrows flowing downward.
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

const LIFELINE_SPACING = 200;
const LIFELINE_WIDTH = 100;
const EXCHANGE_Y_START = 100;
const EXCHANGE_Y_STEP = 50;
const LIFELINE_TOP_Y = 0;

export function transformInteractionSequence(story: SerializedStory): InteractionSequenceResult {
  const interactions = findInteractions(story);
  const nodes: ActOneNode<LifelineData>[] = [];
  const edges: ActOneEdge<ExchangeArrowData>[] = [];
  const lifelineSet = new Set<string>();

  // Collect all unique participants across all interactions
  for (const interaction of interactions) {
    for (const participant of interaction.participants) {
      if (!lifelineSet.has(participant)) {
        lifelineSet.add(participant);
      }
    }
  }

  // Count total exchanges to size lifeline bars
  let totalExchanges = 0;
  for (const interaction of interactions) {
    const n = interaction.participants.length;
    if (n >= 2) {
      totalExchanges += n - 1;
      if (n > 2) totalExchanges += 1; // return arrow
    }
  }

  const lifelineHeight = Math.max(200, EXCHANGE_Y_START + totalExchanges * EXCHANGE_Y_STEP + 60);

  // Build a name → center X lookup for lifelines
  const participantList = Array.from(lifelineSet);
  const participantCenterX = new Map<string, number>();

  for (let i = 0; i < participantList.length; i++) {
    const name = participantList[i]!;
    const x = i * LIFELINE_SPACING + 100;
    participantCenterX.set(name, x + LIFELINE_WIDTH / 2);

    const character = findCharacterByName(story, name);
    const nature = character?.nature ?? 'Human';
    const color = CHARACTER_NATURE_COLORS[nature as keyof typeof CHARACTER_NATURE_COLORS] ?? '#6366f1';

    nodes.push({
      id: stableId('interaction', name),
      type: 'lifeline',
      position: { x, y: LIFELINE_TOP_Y },
      data: {
        label: name,
        characterName: name,
        nature,
        color,
        lifelineHeight,
      },
    });
  }

  // Create exchange arrows at incrementing Y positions
  let exchangeIndex = 0;

  for (const interaction of interactions) {
    const participants = interaction.participants;
    if (participants.length < 2) continue;

    const styleMix = interaction.styleMix;

    for (let i = 0; i < participants.length - 1; i++) {
      const from = participants[i]!;
      const to = participants[i + 1]!;
      const y = EXCHANGE_Y_START + exchangeIndex * EXCHANGE_Y_STEP;

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
          exchangeY: y,
          sourceX: participantCenterX.get(from)!,
          targetX: participantCenterX.get(to)!,
        },
      });

      exchangeIndex++;
    }

    // Return arrow for multi-participant interactions
    if (participants.length > 2) {
      const last = participants[participants.length - 1]!;
      const first = participants[0]!;
      const y = EXCHANGE_Y_START + exchangeIndex * EXCHANGE_Y_STEP;

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
          exchangeY: y,
          sourceX: participantX.get(last)!,
          targetX: participantX.get(first)!,
        },
      });

      exchangeIndex++;
    }
  }

  return { nodes, edges };
}
