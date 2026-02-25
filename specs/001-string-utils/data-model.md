# Data Model: Shared String Utilities Package

**Feature**: 001-string-utils
**Date**: 2026-02-24

## Overview

This package has no persistent data. All functions are pure transformations: `string → string`. This document describes the internal data flow and the one significant internal structure: word arrays.

## Internal Concepts

### Word Array

The foundational internal representation used by case conversion. Not exposed publicly.

- **What it represents**: An ordered list of lowercase word segments extracted from an input string
- **Example**: `"parseHTTPResponse"` → `["parse", "http", "response"]`
- **Produced by**: `splitWords(input: string): string[]` in `words.ts`
- **Consumed by**: All case conversion functions

### Transliteration Map

A static mapping from special characters to their ASCII equivalents.

- **What it represents**: Lookup table for slug generation — maps accented characters and symbols to plain ASCII
- **Example entries**: `"é"` → `"e"`, `"&"` → `"and"`, `"ß"` → `"ss"`
- **Scope**: Common Latin diacritics + a handful of symbols. Augmented by Unicode NFKD normalization for broader coverage.
- **Produced by**: Static `const` in `slug.ts`
- **Consumed by**: `slugify`

## Data Flow

```
Input string
    │
    ├─→ [case.ts] splitWords → join with separator → apply casing → output
    │
    ├─→ [whitespace.ts] regex replace → output
    │
    ├─→ [truncate.ts] length check → find word boundary → append suffix → output
    │
    └─→ [slug.ts] transliterate → NFKD normalize → lowercase → replace non-alnum → collapse hyphens → output
```

## Relationships to Other Packages

- No dependencies on other `@repo/*` packages
- No shared domain types to register in `packages/shared`
- Consumed by any app or package that needs string manipulation
