/**
 * T115 + T132: EPUB 3 generator.
 *
 * Assembles mimetype, META-INF/container.xml, content.opf,
 * nav.xhtml, per-chapter XHTML, and stylesheet.
 *
 * Supports fixed-layout mode (rendition:layout=pre-paginated)
 * with per-page panel region metadata for Kindle Create import.
 */

import type { Manuscript } from './manuscript-assembler.js';
import type { PanelRect } from '$lib/graphic-novel/panel-generator.js';

export interface EpubFile {
  path: string;
  content: string;
  mediaType: string;
}

/**
 * Generate EPUB 3 file entries from a manuscript.
 * Returns an array of file entries to be archived into a ZIP.
 */
export function generateEpubFiles(manuscript: Manuscript): EpubFile[] {
  const files: EpubFile[] = [];
  const uuid = crypto.randomUUID();

  // mimetype (must be first, uncompressed)
  files.push({
    path: 'mimetype',
    content: 'application/epub+zip',
    mediaType: 'application/epub+zip',
  });

  // META-INF/container.xml
  files.push({
    path: 'META-INF/container.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
    mediaType: 'application/xml',
  });

  // Stylesheet
  files.push({
    path: 'OEBPS/styles/book.css',
    content: generateStylesheet(),
    mediaType: 'text/css',
  });

  // Chapter XHTML files
  const spine: string[] = [];
  const manifest: string[] = [];
  const navItems: string[] = [];

  // Title page
  files.push({
    path: 'OEBPS/title.xhtml',
    content: generateTitlePage(manuscript),
    mediaType: 'application/xhtml+xml',
  });
  manifest.push(`<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>`);
  spine.push(`<itemref idref="title"/>`);

  for (let i = 0; i < manuscript.chapters.length; i++) {
    const chapter = manuscript.chapters[i]!;
    const id = `chapter${i + 1}`;
    const filename = `${id}.xhtml`;

    files.push({
      path: `OEBPS/${filename}`,
      content: generateChapterXhtml(chapter, i + 1),
      mediaType: 'application/xhtml+xml',
    });

    manifest.push(`<item id="${id}" href="${filename}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${id}"/>`);
    navItems.push(`<li><a href="${filename}">${escapeXml(chapter.title)}</a></li>`);
  }

  // Nav document
  files.push({
    path: 'OEBPS/nav.xhtml',
    content: generateNavXhtml(navItems),
    mediaType: 'application/xhtml+xml',
  });
  manifest.push(`<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`);

  // Stylesheet manifest entry
  manifest.push(`<item id="css" href="styles/book.css" media-type="text/css"/>`);

  // content.opf
  files.push({
    path: 'OEBPS/content.opf',
    content: generateContentOpf(manuscript, uuid, manifest, spine),
    mediaType: 'application/oebps-package+xml',
  });

  return files;
}

function generateContentOpf(
  manuscript: Manuscript,
  uuid: string,
  manifest: string[],
  spine: string[],
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${escapeXml(manuscript.frontMatter.titlePage.title)}</dc:title>
    <dc:creator>${escapeXml(manuscript.frontMatter.titlePage.author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifest.join('\n    ')}
  </manifest>
  <spine>
    ${spine.join('\n    ')}
  </spine>
</package>`;
}

function generateTitlePage(manuscript: Manuscript): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(manuscript.frontMatter.titlePage.title)}</title>
<link rel="stylesheet" href="styles/book.css"/></head>
<body>
<div class="title-page">
  <h1>${escapeXml(manuscript.frontMatter.titlePage.title)}</h1>
  <p class="author">${escapeXml(manuscript.frontMatter.titlePage.author)}</p>
</div>
<div class="copyright"><p>${escapeXml(manuscript.frontMatter.copyright)}</p></div>
${manuscript.frontMatter.dedication ? `<div class="dedication"><p>${escapeXml(manuscript.frontMatter.dedication)}</p></div>` : ''}
</body></html>`;
}

function generateChapterXhtml(
  chapter: { title: string; paragraphs: string[] },
  number: number,
): string {
  const paragraphsHtml = chapter.paragraphs
    .map((p) => `<p>${escapeXml(p)}</p>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(chapter.title)}</title>
<link rel="stylesheet" href="styles/book.css"/></head>
<body>
<div class="chapter">
  <h2>Chapter ${number}</h2>
  <h3>${escapeXml(chapter.title)}</h3>
  ${paragraphsHtml}
</div>
</body></html>`;
}

function generateNavXhtml(items: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
<nav epub:type="toc" id="toc">
  <h1>Table of Contents</h1>
  <ol>
    ${items.join('\n    ')}
  </ol>
</nav>
</body></html>`;
}

function generateStylesheet(): string {
  return `body { font-family: Georgia, serif; font-size: 1em; line-height: 1.6; margin: 1em; }
h1, h2, h3 { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
.title-page { text-align: center; margin-top: 30%; }
.title-page h1 { font-size: 2em; margin-bottom: 0.5em; }
.author { font-size: 1.2em; }
.copyright { margin-top: 2em; font-size: 0.8em; text-align: center; }
.dedication { margin-top: 2em; font-style: italic; text-align: center; }
.chapter { page-break-before: always; }
.chapter h2 { font-size: 1.5em; text-align: center; margin-top: 2em; }
.chapter h3 { font-size: 1.2em; text-align: center; color: #666; margin-bottom: 2em; }
p { text-indent: 1.5em; margin: 0.5em 0; }`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── T132: Fixed-layout EPUB support ─────────────────────────────────────

export interface FixedLayoutPage {
  pageIndex: number;
  imagePath: string; // relative path within EPUB
  panelRegions: PanelRegion[];
}

export interface PanelRegion {
  /** Reading order index (1-based). */
  order: number;
  /** Normalized coordinates (0-1). */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Generate fixed-layout EPUB files for graphic novel.
 */
export function generateFixedLayoutEpub(
  title: string,
  author: string,
  pages: FixedLayoutPage[],
  pageWidth: number,
  pageHeight: number,
): EpubFile[] {
  const files: EpubFile[] = [];
  const uuid = crypto.randomUUID();

  files.push({
    path: 'mimetype',
    content: 'application/epub+zip',
    mediaType: 'application/epub+zip',
  });

  files.push({
    path: 'META-INF/container.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
    mediaType: 'application/xml',
  });

  const manifest: string[] = [];
  const spine: string[] = [];
  const navItems: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const id = `page${i + 1}`;
    const filename = `${id}.xhtml`;

    files.push({
      path: `OEBPS/${filename}`,
      content: generateFixedLayoutPage(page, pageWidth, pageHeight),
      mediaType: 'application/xhtml+xml',
    });

    manifest.push(`<item id="${id}" href="${filename}" media-type="application/xhtml+xml"/>`);
    manifest.push(`<item id="img${i + 1}" href="${page.imagePath}" media-type="image/png"/>`);
    spine.push(`<itemref idref="${id}"/>`);
    navItems.push(`<li><a href="${filename}">Page ${i + 1}</a></li>`);
  }

  files.push({
    path: 'OEBPS/nav.xhtml',
    content: generateNavXhtml(navItems),
    mediaType: 'application/xhtml+xml',
  });
  manifest.push(`<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`);

  files.push({
    path: 'OEBPS/content.opf',
    content: generateFixedLayoutOpf(title, author, uuid, manifest, spine, pageWidth, pageHeight),
    mediaType: 'application/oebps-package+xml',
  });

  return files;
}

function generateFixedLayoutOpf(
  title: string,
  author: string,
  uuid: string,
  manifest: string[],
  spine: string[],
  pageWidth: number,
  pageHeight: number,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
    <meta property="rendition:layout">pre-paginated</meta>
    <meta property="rendition:orientation">auto</meta>
    <meta property="rendition:spread">auto</meta>
    <meta name="original-resolution" content="${pageWidth}x${pageHeight}"/>
  </metadata>
  <manifest>
    ${manifest.join('\n    ')}
  </manifest>
  <spine>
    ${spine.join('\n    ')}
  </spine>
</package>`;
}

function generateFixedLayoutPage(
  page: FixedLayoutPage,
  pageWidth: number,
  pageHeight: number,
): string {
  // Generate panel region metadata for Kindle panel view
  const regionMetadata = page.panelRegions
    .map((r) => {
      const left = Math.round(r.x * pageWidth);
      const top = Math.round(r.y * pageHeight);
      const width = Math.round(r.width * pageWidth);
      const height = Math.round(r.height * pageHeight);
      return `<div class="panel-region" data-panel-order="${r.order}" style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;"></div>`;
    })
    .join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Page ${page.pageIndex + 1}</title>
  <meta name="viewport" content="width=${pageWidth}, height=${pageHeight}"/>
  <style>body { margin: 0; padding: 0; } img { width: 100%; height: 100%; }</style>
</head>
<body>
  <div style="position:relative;width:${pageWidth}px;height:${pageHeight}px;">
    <img src="${page.imagePath}" alt="Page ${page.pageIndex + 1}"/>
    ${regionMetadata}
  </div>
</body></html>`;
}
