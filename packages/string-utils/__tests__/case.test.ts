import { describe, expect, it } from 'vitest';
import { toCamelCase, toConstantCase, toKebabCase, toPascalCase, toSnakeCase } from '../src/case';

describe('toCamelCase', () => {
  it('converts snake_case', () => {
    expect(toCamelCase('my_variable_name')).toBe('myVariableName');
  });

  it('converts kebab-case', () => {
    expect(toCamelCase('my-component-name')).toBe('myComponentName');
  });

  it('converts PascalCase with acronyms', () => {
    expect(toCamelCase('parseHTTPResponse')).toBe('parseHttpResponse');
  });

  it('returns empty for empty string', () => {
    expect(toCamelCase('')).toBe('');
  });

  it('returns empty for whitespace-only', () => {
    expect(toCamelCase('   ')).toBe('');
  });

  it('handles single lowercase word', () => {
    expect(toCamelCase('alllowercase')).toBe('alllowercase');
  });

  it('handles mixed delimiters', () => {
    expect(toCamelCase('some_mixed-caseString')).toBe('someMixedCaseString');
  });
});

describe('toPascalCase', () => {
  it('converts kebab-case', () => {
    expect(toPascalCase('my-component-name')).toBe('MyComponentName');
  });

  it('converts snake_case', () => {
    expect(toPascalCase('my_variable_name')).toBe('MyVariableName');
  });

  it('returns empty for empty string', () => {
    expect(toPascalCase('')).toBe('');
  });

  it('capitalizes single lowercase word', () => {
    expect(toPascalCase('alllowercase')).toBe('Alllowercase');
  });
});

describe('toSnakeCase', () => {
  it('converts camelCase', () => {
    expect(toSnakeCase('myVariableName')).toBe('my_variable_name');
  });

  it('converts PascalCase', () => {
    expect(toSnakeCase('MyComponentName')).toBe('my_component_name');
  });

  it('returns empty for empty string', () => {
    expect(toSnakeCase('')).toBe('');
  });
});

describe('toKebabCase', () => {
  it('converts camelCase', () => {
    expect(toKebabCase('myVariableName')).toBe('my-variable-name');
  });

  it('handles acronyms', () => {
    expect(toKebabCase('parseHTTPResponse')).toBe('parse-http-response');
  });

  it('returns empty for empty string', () => {
    expect(toKebabCase('')).toBe('');
  });
});

describe('toConstantCase', () => {
  it('converts camelCase', () => {
    expect(toConstantCase('myVariableName')).toBe('MY_VARIABLE_NAME');
  });

  it('converts kebab-case', () => {
    expect(toConstantCase('parse-http-response')).toBe('PARSE_HTTP_RESPONSE');
  });

  it('returns empty for empty string', () => {
    expect(toConstantCase('')).toBe('');
  });
});
