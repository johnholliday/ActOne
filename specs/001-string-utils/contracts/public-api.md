# Public API Contract: @repo/string-utils

**Feature**: 001-string-utils
**Date**: 2026-02-24

## Import Paths

```typescript
// Barrel import (all functions)
import { toCamelCase, slugify, truncate /* ... */ } from "@repo/string-utils";

// Per-module imports (granular)
import { toCamelCase, toPascalCase } from "@repo/string-utils/case";
import { collapseWhitespace, stripChars } from "@repo/string-utils/whitespace";
import { truncate } from "@repo/string-utils/truncate";
import { slugify } from "@repo/string-utils/slug";
```

## Case Conversion — `@repo/string-utils/case`

### `toCamelCase(input: string): string`

Converts any string to camelCase.

- `"my_variable_name"` → `"myVariableName"`
- `"my-component-name"` → `"myComponentName"`
- `"parseHTTPResponse"` → `"parseHttpResponse"`
- `""` → `""`

### `toPascalCase(input: string): string`

Converts any string to PascalCase.

- `"my-component-name"` → `"MyComponentName"`
- `"my_variable_name"` → `"MyVariableName"`
- `""` → `""`

### `toSnakeCase(input: string): string`

Converts any string to snake_case.

- `"myVariableName"` → `"my_variable_name"`
- `"MyComponentName"` → `"my_component_name"`
- `""` → `""`

### `toKebabCase(input: string): string`

Converts any string to kebab-case.

- `"myVariableName"` → `"my-variable-name"`
- `"parseHTTPResponse"` → `"parse-http-response"`
- `""` → `""`

### `toConstantCase(input: string): string`

Converts any string to CONSTANT_CASE.

- `"myVariableName"` → `"MY_VARIABLE_NAME"`
- `"parse-http-response"` → `"PARSE_HTTP_RESPONSE"`
- `""` → `""`

## Whitespace — `@repo/string-utils/whitespace`

### `collapseWhitespace(input: string): string`

Trims leading/trailing whitespace and collapses all internal whitespace sequences (spaces, tabs, newlines) to a single space.

- `"  hello    world  "` → `"hello world"`
- `"hello\t\n  world"` → `"hello world"`
- `"  "` → `""`
- `""` → `""`

### `stripChars(input: string, chars: string): string`

Removes all occurrences of the specified characters from the string.

- `stripChars("hello world!", "!")` → `"hello world"`
- `stripChars("a.b.c", ".")` → `"abc"`
- `stripChars("hello", "")` → `"hello"`

## Truncation — `@repo/string-utils/truncate`

### `truncate(input: string, limit: number, suffix?: string): string`

Truncates a string to fit within `limit` characters (including the suffix). Prefers breaking at word boundaries. Falls back to character-level truncation if a single word exceeds the limit.

- **Default suffix**: `"…"` (single Unicode ellipsis character)
- The suffix length is counted toward the limit

Examples:
- `truncate("The quick brown fox jumps over the lazy dog", 20)` → `"The quick brown fox…"`
- `truncate("short", 20)` → `"short"` (no truncation needed)
- `truncate("hello world", 8, "...")` → `"hello..."`
- `truncate("hello", 2)` → `"h…"` (fallback to character-level)
- `truncate("hello", 1)` → `"…"` (limit ≤ suffix length)

## Slug Generation — `@repo/string-utils/slug`

### `slugify(input: string): string`

Generates a URL-safe slug: lowercase, hyphen-separated, ASCII-only.

Processing steps:
1. Transliterate accented characters and special symbols (`&` → `and`)
2. Apply NFKD normalization for remaining diacritics
3. Convert to lowercase
4. Replace non-alphanumeric characters with hyphens
5. Collapse consecutive hyphens
6. Trim leading/trailing hyphens

Examples:
- `slugify("Hello World! This is a Test")` → `"hello-world-this-is-a-test"`
- `slugify("Héllo & Wörld")` → `"hello-and-world"`
- `slugify("  --multiple---hyphens-- ")` → `"multiple-hyphens"`
- `slugify("")` → `""`
- `slugify("   ")` → `""`
