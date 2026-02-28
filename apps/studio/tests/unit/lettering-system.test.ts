/**
 * T046: Lettering system tests.
 *
 * Verifies bubble size estimation, SVG rendering for speech bubbles,
 * captions, and sound effects.
 */

import { describe, it, expect } from 'vitest';

import {
  estimateBubbleSize,
  renderBubbleSvg,
  renderCaptionSvg,
  renderSoundEffectSvg,
} from '$lib/graphic-novel/lettering-system.js';
import type { SpeechBubble, CaptionBox, SoundEffect } from '$lib/graphic-novel/lettering-system.js';

describe('estimateBubbleSize', () => {
  it('returns positive dimensions', () => {
    const size = estimateBubbleSize('Hello world', 'standard');

    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });

  it('larger text produces larger bubble', () => {
    const small = estimateBubbleSize('Hi', 'standard');
    const large = estimateBubbleSize(
      'This is a much longer piece of dialogue that takes up significantly more space.',
      'standard',
    );

    // Longer text should produce a taller bubble (more lines)
    expect(large.height).toBeGreaterThan(small.height);
  });

  it('different bubble styles produce different sizes', () => {
    const text = 'Same text for comparison';
    const whisper = estimateBubbleSize(text, 'whisper');
    const shout = estimateBubbleSize(text, 'shout');

    // Shout uses larger char width (12 vs 8) so should be wider
    expect(shout.width).not.toBe(whisper.width);
    expect(shout.width).toBeGreaterThan(whisper.width);
  });

  it('thought style has extra padding', () => {
    const text = 'Thinking';
    const standard = estimateBubbleSize(text, 'standard');
    const thought = estimateBubbleSize(text, 'thought');

    // Thought has padding 24 vs standard 16, so it should be wider
    expect(thought.width).toBeGreaterThan(standard.width);
  });
});

describe('renderBubbleSvg', () => {
  it('returns SVG string', () => {
    const bubble: SpeechBubble = {
      text: 'Hello there!',
      style: 'standard',
      characterName: 'Elena',
      position: { x: 0.5, y: 0.5 },
      tailDirection: 'down',
    };

    const svg = renderBubbleSvg(bubble);

    expect(typeof svg).toBe('string');
    expect(svg.startsWith('<')).toBe(true);
    expect(svg).toContain('svg');
  });

  it('contains the bubble text', () => {
    const bubble: SpeechBubble = {
      text: 'Test dialogue',
      style: 'standard',
      characterName: 'Marco',
      position: { x: 0.3, y: 0.7 },
      tailDirection: 'left',
    };

    const svg = renderBubbleSvg(bubble);

    expect(svg).toContain('Test dialogue');
  });

  it('uses bold style for shout bubbles', () => {
    const bubble: SpeechBubble = {
      text: 'STOP!',
      style: 'shout',
      characterName: 'Elena',
      position: { x: 0.5, y: 0.5 },
      tailDirection: 'down',
    };

    const svg = renderBubbleSvg(bubble);

    expect(svg).toContain('bold');
  });
});

describe('renderCaptionSvg', () => {
  it('returns SVG string', () => {
    const caption: CaptionBox = {
      text: 'Meanwhile, in the harbor...',
      position: { x: 0.1, y: 0.1 },
      width: 0.4,
    };

    const svg = renderCaptionSvg(caption);

    expect(typeof svg).toBe('string');
    expect(svg.startsWith('<')).toBe(true);
    expect(svg).toContain('svg');
  });

  it('contains the caption text', () => {
    const caption: CaptionBox = {
      text: 'Narrator text here',
      position: { x: 0.1, y: 0.1 },
      width: 0.4,
    };

    const svg = renderCaptionSvg(caption);

    expect(svg).toContain('Narrator text here');
  });

  it('uses rect element for caption box', () => {
    const caption: CaptionBox = {
      text: 'Box caption',
      position: { x: 0, y: 0 },
      width: 0.5,
    };

    const svg = renderCaptionSvg(caption);

    expect(svg).toContain('rect');
  });
});

describe('renderSoundEffectSvg', () => {
  it('returns SVG string', () => {
    const sfx: SoundEffect = {
      text: 'BOOM!',
      position: { x: 0.5, y: 0.5 },
      fontSize: 48,
      rotation: -15,
      color: '#ff0000',
    };

    const svg = renderSoundEffectSvg(sfx);

    expect(typeof svg).toBe('string');
    expect(svg.startsWith('<')).toBe(true);
    expect(svg).toContain('text');
  });

  it('contains the sound effect text', () => {
    const sfx: SoundEffect = {
      text: 'CRASH',
      position: { x: 0.5, y: 0.5 },
      fontSize: 36,
      rotation: 0,
      color: '#ff6600',
    };

    const svg = renderSoundEffectSvg(sfx);

    expect(svg).toContain('CRASH');
  });

  it('applies rotation and color', () => {
    const sfx: SoundEffect = {
      text: 'ZAP',
      position: { x: 0.5, y: 0.5 },
      fontSize: 24,
      rotation: 30,
      color: '#00ff00',
    };

    const svg = renderSoundEffectSvg(sfx);

    expect(svg).toContain('rotate(30)');
    expect(svg).toContain('#00ff00');
  });
});
