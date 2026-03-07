// @ts-check
import { createEleventyConfig } from '@docugenix/sanyam-guide/eleventy';

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  createEleventyConfig(eleventyConfig, {
    pathPrefix: '/guide/',
    customFilters: {
      sectionPages(collection, section) {
        return collection
          .filter((item) => item.data.section === section)
          .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
      },
      prevInSection(collection, section, order) {
        const pages = collection
          .filter((item) => item.data.section === section)
          .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
        const idx = pages.findIndex((p) => p.data.order === order);
        return idx > 0 ? pages[idx - 1] : null;
      },
      nextInSection(collection, section, order) {
        const pages = collection
          .filter((item) => item.data.section === section)
          .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
        const idx = pages.findIndex((p) => p.data.order === order);
        return idx >= 0 && idx < pages.length - 1 ? pages[idx + 1] : null;
      },
    },
    passthrough: ['src/css', { 'src/_data/navigation.json': 'navigation.json' }],
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
