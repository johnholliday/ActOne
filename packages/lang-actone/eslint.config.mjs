import { config } from '@docugenix/sanyam-config/eslint-base';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ['src/generated/**'],
  },
];
