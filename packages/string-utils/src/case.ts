import { splitWords } from './words';

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function toCamelCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return '';
  return words[0] + words.slice(1).map(capitalize).join('');
}

export function toPascalCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return '';
  return words.map(capitalize).join('');
}

export function toSnakeCase(input: string): string {
  const words = splitWords(input);
  return words.join('_');
}

export function toKebabCase(input: string): string {
  const words = splitWords(input);
  return words.join('-');
}

export function toConstantCase(input: string): string {
  const words = splitWords(input);
  return words.join('_').toUpperCase();
}
