# Data Model: ActOne Studio Test Suite

This feature does not introduce persistent data models. Test suites consume existing data types from `@repo/shared` and produce ephemeral test results.

## Test Data Types

### 1. Test Fixtures

Fixtures are inputs to test functions. They are not stored in a database but created as files or in-memory objects.

**1.1 Grammar Fixtures (`.actone` files)**

| Fixture | Purpose | Content |
|---------|---------|---------|
| `minimal.actone` | Smoke test baseline | 1 character, 1 scene |
| `full-story.actone` | Comprehensive validation | All 8 element types with all properties |
| `invalid-values.actone` | Validator error testing | Out-of-range values, structural violations |
| `multi-file/entry.actone` | Multi-file composition | Entry file referencing elements from other files |
| `multi-file/characters.actone` | Multi-file composition | Character definitions for cross-file scope |
| `multi-file/worlds.actone` | Multi-file composition | World definitions for cross-file scope |
| `large-project/*.actone` | Performance benchmarks | 50 characters, 100 scenes across 10 files |

**1.2 Typed Fixtures (TypeScript factory functions)**

| Factory | Output Type | Parameters |
|---------|-------------|------------|
| `createTestStory()` | `SerializedStory` | `{ characters?, scenes?, worlds?, themes?, plots?, interactions?, timelines? }` |
| `createTestCharacter()` | `SerializedCharacterDef` | `{ name, nature?, bio?, personality?, relationships? }` |
| `createTestScene()` | `SerializedSceneDef` | `{ name, sceneType?, participants?, location?, atmosphere? }` |
| `createTestDrafts()` | `DraftVersion[]` | `{ sceneName, paragraphCount?, status? }` |
| `createTestManuscript()` | `Manuscript` | `{ title, authorName, chapters? }` |

### 2. Mock Shapes

Mock objects simulate external dependencies. They conform to the same interfaces as the real implementations.

**2.1 Database Mock (`db`)**

```
db.select() → chainable
db.insert() → chainable
db.update() → chainable
db.delete() → chainable
```

Each chainable returns a mock that resolves to configurable test data.

**2.2 Supabase Mock (`supabaseAdmin`)**

```
supabaseAdmin.auth.getSession() → { session }
supabaseAdmin.storage.from(bucket).upload() → { data, error }
supabaseAdmin.storage.from(bucket).createSignedUrl() → { data }
```

**2.3 AI Backend Mock**

```
mockTextBackend.generate(context) → AsyncIterable<StreamChunk>
mockTextBackend.estimateCost(context) → CostEstimate
mockTextBackend.checkAvailability() → { available: true }
mockImageBackend.generate(options) → ImageResult
```

## Consumed Types (from `@repo/shared`)

The test suite reads and asserts against these existing types. It does not define new shared types.

| Type | Package | Used In |
|------|---------|---------|
| `SerializedStory` | `@repo/shared/types/ast` | Grammar tests, diagram tests, analytics tests |
| `SerializedCharacterDef` | `@repo/shared/types/ast` | Character-specific tests |
| `SerializedSceneDef` | `@repo/shared/types/ast` | Scene-specific tests |
| `StableId` | `@repo/shared/types/diagram` | Stable ref tests |
| `ActOneNode<T>` | `@repo/shared/types/diagram` | Diagram transformer tests |
| `ActOneEdge<T>` | `@repo/shared/types/diagram` | Diagram transformer tests |
| `LifecycleStage` | `@repo/shared/constants/enums` | Lifecycle tests |
| `DraftVersion` | `apps/studio/lib/ai/draft-manager` | Draft management tests |
| `Manuscript` | `apps/studio/lib/publishing/manuscript-assembler` | Publishing tests |
| `StoryAnalytics` | `apps/studio/lib/project/analytics` | Analytics tests |
