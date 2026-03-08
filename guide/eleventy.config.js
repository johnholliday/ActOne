// @ts-check
import { createEleventyConfig } from '@docugenix/sanyam-guide/eleventy';

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  // Apply sanyam-guide base config (navigation plugin, common defaults)
  createEleventyConfig(eleventyConfig);

  // Pass through CSS files unchanged
  eleventyConfig.addPassthroughCopy('src/css');

  // Pass through navigation.json so the studio sidebar can fetch it
  eleventyConfig.addPassthroughCopy({ 'src/_data/navigation.json': 'navigation.json' });

  // Custom filter: get pages in the same section, sorted by order
  eleventyConfig.addFilter('sectionPages', function (collection, section) {
    return collection
      .filter((item) => item.data.section === section)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  // Custom filter: get previous page in section
  eleventyConfig.addFilter('prevInSection', function (collection, section, order) {
    const pages = collection
      .filter((item) => item.data.section === section)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
    const idx = pages.findIndex((p) => p.data.order === order);
    return idx > 0 ? pages[idx - 1] : null;
  });

  // Custom filter: get next page in section
  eleventyConfig.addFilter('nextInSection', function (collection, section, order) {
    const pages = collection
      .filter((item) => item.data.section === section)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
    const idx = pages.findIndex((p) => p.data.order === order);
    return idx >= 0 && idx < pages.length - 1 ? pages[idx + 1] : null;
  });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
    pathPrefix: '/guide/',
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['md', 'njk', 'html'],
  };
}
