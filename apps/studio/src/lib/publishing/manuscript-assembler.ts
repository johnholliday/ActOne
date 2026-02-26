/**
 * T114: Manuscript assembler.
 *
 * Collects accepted drafts, organizes into chapters, generates
 * front matter and back matter.
 */

import type { DraftVersion } from '$lib/ai/draft-manager.js';

export interface ManuscriptChapter {
  title: string;
  sceneName: string;
  paragraphs: string[];
}

export interface FrontMatter {
  halfTitle: string;
  titlePage: { title: string; author: string };
  copyright: string;
  dedication?: string;
  tableOfContents: Array<{ title: string; index: number }>;
}

export interface BackMatter {
  authorBio?: string;
  acknowledgments?: string;
  characterIndex?: Array<{ name: string; firstAppearance: number }>;
}

export interface Manuscript {
  frontMatter: FrontMatter;
  chapters: ManuscriptChapter[];
  backMatter: BackMatter;
  wordCount: number;
}

/**
 * Assemble a manuscript from accepted draft versions.
 */
export function assembleManuscript(
  title: string,
  author: string,
  drafts: DraftVersion[],
  sceneOrder: string[],
  options?: {
    dedication?: string;
    authorBio?: string;
    acknowledgments?: string;
  },
): Manuscript {
  // Group accepted drafts by scene
  const acceptedByScene = new Map<string, DraftVersion[]>();
  for (const draft of drafts) {
    if (draft.status !== 'accepted') continue;
    const existing = acceptedByScene.get(draft.sceneName) ?? [];
    existing.push(draft);
    acceptedByScene.set(draft.sceneName, existing);
  }

  // Build chapters in scene order
  const chapters: ManuscriptChapter[] = [];
  let wordCount = 0;

  for (const sceneName of sceneOrder) {
    const sceneDrafts = acceptedByScene.get(sceneName);
    if (!sceneDrafts || sceneDrafts.length === 0) continue;

    // Sort by paragraph index, pick latest version per index
    const latest = new Map<number, DraftVersion>();
    for (const d of sceneDrafts) {
      const existing = latest.get(d.paragraphIndex);
      if (!existing || d.createdAt > existing.createdAt) {
        latest.set(d.paragraphIndex, d);
      }
    }

    const paragraphs = Array.from(latest.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, d]) => d.content);

    wordCount += paragraphs.join(' ').split(/\s+/).length;

    chapters.push({
      title: sceneName,
      sceneName,
      paragraphs,
    });
  }

  // Front matter
  const frontMatter: FrontMatter = {
    halfTitle: title,
    titlePage: { title, author },
    copyright: `Copyright \u00A9 ${new Date().getFullYear()} ${author}. All rights reserved.`,
    dedication: options?.dedication,
    tableOfContents: chapters.map((ch, i) => ({
      title: ch.title,
      index: i + 1,
    })),
  };

  // Back matter
  const backMatter: BackMatter = {
    authorBio: options?.authorBio,
    acknowledgments: options?.acknowledgments,
  };

  return { frontMatter, chapters, backMatter, wordCount };
}
