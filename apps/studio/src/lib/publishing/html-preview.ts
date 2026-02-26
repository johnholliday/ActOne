/**
 * T118: HTML preview generator.
 *
 * Produces styled HTML for the reading mode view.
 */

import type { Manuscript } from './manuscript-assembler.js';

/**
 * Generate styled HTML for manuscript preview.
 */
export function generateHtmlPreview(manuscript: Manuscript): string {
  const chapters = manuscript.chapters
    .map((ch, i) => {
      const paragraphs = ch.paragraphs
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('\n');

      return `
<section class="chapter" id="chapter-${i + 1}">
  <h2>Chapter ${i + 1}</h2>
  <h3>${escapeHtml(ch.title)}</h3>
  ${paragraphs}
</section>`;
    })
    .join('\n');

  const toc = manuscript.chapters
    .map((ch, i) => `<li><a href="#chapter-${i + 1}">${escapeHtml(ch.title)}</a></li>`)
    .join('\n');

  const readingTimeMinutes = Math.ceil(manuscript.wordCount / 250);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(manuscript.frontMatter.titlePage.title)}</title>
  <style>${getPreviewStyles()}</style>
</head>
<body>
  <header class="title-page">
    <h1>${escapeHtml(manuscript.frontMatter.titlePage.title)}</h1>
    <p class="author">${escapeHtml(manuscript.frontMatter.titlePage.author)}</p>
    <p class="meta">${manuscript.wordCount.toLocaleString()} words &middot; ~${readingTimeMinutes} min read</p>
  </header>

  <nav class="toc">
    <h2>Table of Contents</h2>
    <ol>${toc}</ol>
  </nav>

  ${chapters}

  <footer class="back-matter">
    ${manuscript.backMatter.authorBio ? `<section class="author-bio"><h2>About the Author</h2><p>${escapeHtml(manuscript.backMatter.authorBio)}</p></section>` : ''}
    ${manuscript.backMatter.acknowledgments ? `<section class="acknowledgments"><h2>Acknowledgments</h2><p>${escapeHtml(manuscript.backMatter.acknowledgments)}</p></section>` : ''}
  </footer>
</body>
</html>`;
}

function getPreviewStyles(): string {
  return `
body {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 16px;
  line-height: 1.7;
  max-width: 640px;
  margin: 0 auto;
  padding: 2em;
  color: #1a1a1a;
  background: #faf9f6;
}
.title-page { text-align: center; margin: 4em 0; }
.title-page h1 { font-size: 2.5em; margin-bottom: 0.3em; }
.author { font-size: 1.3em; color: #666; }
.meta { font-size: 0.9em; color: #999; margin-top: 1em; }
.toc { margin: 2em 0; padding: 1em; border: 1px solid #e0d8cc; border-radius: 4px; }
.toc h2 { font-size: 1.2em; margin-bottom: 0.5em; }
.toc ol { padding-left: 1.5em; }
.toc li { margin: 0.3em 0; }
.toc a { color: #4a4a4a; text-decoration: none; }
.toc a:hover { text-decoration: underline; }
.chapter { page-break-before: always; margin-top: 3em; }
.chapter h2 { text-align: center; font-size: 1.5em; margin-bottom: 0.3em; }
.chapter h3 { text-align: center; color: #888; font-size: 1.1em; font-weight: normal; margin-bottom: 2em; }
p { text-indent: 1.5em; margin: 0.5em 0; }
.chapter p:first-of-type { text-indent: 0; }
.chapter p:first-of-type::first-letter { font-size: 3em; float: left; line-height: 0.8; padding-right: 0.1em; }
.back-matter { margin-top: 4em; border-top: 1px solid #e0d8cc; padding-top: 2em; }
.back-matter h2 { font-size: 1.3em; }`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
