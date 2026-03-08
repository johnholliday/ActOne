import { config as svelteConfig } from '@docugenix/sanyam-config/eslint-svelte';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...svelteConfig,
  {
    ignores: ['.svelte-kit/**', 'build/**'],
  },
];
