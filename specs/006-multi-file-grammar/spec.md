# Feature Specification: Multi-File Grammar with Automatic Consolidation

**Feature Branch**: `006-multi-file-grammar`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "Extend the grammar to allow components (characters, etc.) to be defined either within or outside of the 'story' structure, allowing the author to create components (characters, scenes,) in separate files (like C#) which are automatically consolidated during processing. There is no need for an explicit 'include' or 'using' statement - the system parses all .actone files found in the project into a single AST that drives all views and processing functions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Define Characters in a Separate File (Priority: P1)

As a fiction writer working on a complex story with many characters, I want to define my characters in a dedicated file (e.g., `characters.actone`) separate from my main story file, so that I can organize my project by concern and navigate large stories more easily.

**Why this priority**: This is the core value proposition — enabling multi-file organization. Characters are the most commonly extracted component because stories often have 5-15 characters with rich definitions that dominate file length. Without this, writers must maintain everything in a single file that can easily exceed 1000 lines.

**Independent Test**: Can be fully tested by creating two `.actone` files in a project — one with the `story` block and one with standalone character definitions — and verifying that all diagrams, views, and processing functions see the characters as if they were defined inside the story.

**Acceptance Scenarios**:

1. **Given** a project with `main.actone` containing `story "My Novel" { ... }` and `characters.actone` containing standalone `character Elena { ... }` definitions (no wrapping `story` block), **When** the system processes the project, **Then** all character definitions from both files appear in the consolidated AST and are available to all views (character network diagram, interaction sequence, etc.).

2. **Given** a project with characters defined in a separate file, **When** a scene in `main.actone` references a character defined in `characters.actone` via `participants: [Elena]`, **Then** the cross-reference resolves correctly with no errors or warnings.

3. **Given** a project with characters in a separate file, **When** the writer opens the project in the studio, **Then** the editor shows no parse errors in either file, and the sidebar file list shows both files as part of the project.

---

### User Story 2 — Organize Any Component Type Across Files (Priority: P1)

As a writer working on a story with a rich world, complex timeline, and many scenes, I want to be able to place any component type (worlds, scenes, plots, timelines, themes, interactions, generate blocks) in any file, so that I can organize my project however makes sense for my creative process.

**Why this priority**: Equal to P1 because limiting multi-file support to only characters would create an inconsistent mental model. Writers should be able to organize freely — for example, `world.actone` for world-building, `act-1-scenes.actone` for Act 1 scenes, `themes.actone` for thematic declarations.

**Independent Test**: Can be fully tested by creating a project with components spread across 3+ files and verifying all cross-references resolve and all diagram views render correctly.

**Acceptance Scenarios**:

1. **Given** a project with world definitions in `world.actone`, scene definitions in `scenes.actone`, and the story block plus generate block in `main.actone`, **When** a scene references a location defined in the world file, **Then** the cross-reference resolves and the world map diagram shows both the world container and its locations correctly.

2. **Given** a project where a `plot` in one file references a `scene` defined in another file via `converges_at`, **When** the system processes the project, **Then** the cross-reference resolves correctly.

3. **Given** a project with an `interaction` in one file referencing `character` definitions from another file via `participants`, **When** the system processes the project, **Then** the interaction sequence diagram shows all participants correctly.

---

### User Story 3 — Seamless Editing Experience Across Files (Priority: P2)

As a writer editing my story across multiple files, I want changes in one file to immediately reflect in all views and in other files' cross-reference validation, so that I get the same real-time feedback as with a single-file project.

**Why this priority**: This is essential for usability but depends on the core multi-file parsing (P1) being in place. Without live cross-file updates, writers would need to manually trigger reprocessing after each edit, which breaks the creative flow.

**Independent Test**: Can be tested by opening a multi-file project, editing a character name in `characters.actone`, and verifying that references in `scenes.actone` immediately show validation feedback (error if the old name is still referenced, or auto-resolution if renamed).

**Acceptance Scenarios**:

1. **Given** a multi-file project open in the studio with all files loaded, **When** the writer modifies a character definition in `characters.actone`, **Then** the diagrams and views update to reflect the change without requiring a manual refresh or project reload.

2. **Given** a multi-file project where `scenes.actone` references `character Elena`, **When** the writer renames `Elena` to `Elena Vasquez` in `characters.actone`, **Then** the reference in `scenes.actone` shows a validation warning or error indicating the unresolved reference.

3. **Given** a multi-file project, **When** the writer adds a new character in `characters.actone` and saves, **Then** the new character is immediately available for cross-reference in all other files' auto-completion suggestions.

---

### User Story 4 — Mixed File Organization (Priority: P2)

As a writer who prefers to keep some smaller stories in a single file but split larger ones across files, I want both organization styles to work seamlessly, so that I can choose the right approach for each project without learning different workflows.

**Why this priority**: Backward compatibility and flexibility. Existing single-file projects must continue to work identically. Writers should not be forced into multi-file organization for simple stories.

**Independent Test**: Can be tested by verifying that an existing single-file `.actone` project continues to parse and render identically after the grammar changes.

**Acceptance Scenarios**:

1. **Given** an existing single-file project where all components are inside `story "Name" { ... }`, **When** the system processes the project, **Then** behavior is identical to the current system with no regressions.

2. **Given** a project with two files — one containing `story "Name" { character A { ... } }` and another containing `character B { ... }` at top level, **When** the system processes the project, **Then** both characters A and B appear in the consolidated AST.

3. **Given** a project with a standalone file containing only `character Elena { ... }` and nothing else, **When** the writer opens just this file (outside of a project context), **Then** the file parses without errors and provides syntax highlighting and basic editor features even though there is no story context.

---

### User Story 5 — Validation Across File Boundaries (Priority: P3)

As a writer working across multiple files, I want clear error messages when cross-references don't resolve, duplicate definitions exist, or required elements are missing, so that I can quickly find and fix problems in my project.

**Why this priority**: Error quality is important for usability but is a refinement on top of the core multi-file functionality (P1/P2). Basic validation must work, but polished error messages can be iterated on.

**Independent Test**: Can be tested by intentionally creating duplicate character definitions across files and verifying that a clear error message identifies both files and the conflict.

**Acceptance Scenarios**:

1. **Given** two files that both define `character Elena { ... }`, **When** the system processes the project, **Then** a validation error indicates which files contain the duplicate definition.

2. **Given** a scene that references `character Ghost` but no character named `Ghost` exists in any project file, **When** the system processes the project, **Then** a validation error in the scene file identifies the unresolved reference.

3. **Given** a project with zero `story` blocks across all files, **When** the system processes the project, **Then** the system treats the project as valid (standalone components mode) and all component-level views and diagrams still function.

---

### Edge Cases

- What happens when a project has multiple `story` blocks across different files? A validation error must be produced identifying the conflicting files, since only one story container is permitted per project.
- What happens when a standalone component file is opened outside of any project? The file should parse without errors for its own content, but cross-references to other files will naturally be unresolved.
- What happens when two files define the same character name? A clear duplicate-definition error must be reported, referencing both files.
- What happens when a file contains both a `story` block and standalone top-level components? Both should be valid — the standalone components are consolidated alongside the story block's contents.
- What happens when files are added to or removed from the project while the studio is open? The system should detect file changes and reprocess the project automatically.
- What happens when the `generate` block appears in multiple files? Since only one is semantically valid per story, a clear validation error must indicate the conflict and the file locations.
- What happens when a character inside a `story` block has the same name as a standalone character? This is a duplicate definition error, regardless of whether one is inside a `story` block and the other is standalone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST accept `.actone` files containing component definitions (characters, worlds, scenes, plots, timelines, themes, interactions, generate blocks) at the top level without a wrapping `story` block.
- **FR-002**: The system MUST accept `.actone` files that contain only a `story` block (current behavior), preserving full backward compatibility.
- **FR-003**: The system MUST accept `.actone` files that contain both a `story` block and standalone top-level component definitions in the same file.
- **FR-004**: The system MUST automatically discover and parse all `.actone` files found in a project, consolidating them into a single logical AST without requiring explicit `include`, `import`, or `using` statements.
- **FR-005**: Cross-references between components MUST resolve across file boundaries — a scene in `file-a.actone` referencing a character defined in `file-b.actone` MUST resolve correctly.
- **FR-006**: The system MUST enforce uniqueness of named definitions across all project files — duplicate names for the same component type (e.g., two `character Elena` definitions) MUST produce a validation error identifying both files.
- **FR-007**: The system MUST limit the project to at most one `story` block across all files. If multiple `story` blocks are found, a validation error MUST be produced.
- **FR-008**: The system MUST limit the project to at most one `generate` block across all files (whether inside or outside a `story` block). Duplicates MUST produce a validation error.
- **FR-009**: All existing views and processing functions (diagrams, export, reading mode) MUST operate on the consolidated AST identically to how they operate on a single-file AST today.
- **FR-010**: When a file in a multi-file project is edited, the consolidated AST MUST be updated and all dependent views MUST refresh automatically.
- **FR-011**: A standalone `.actone` file containing only components (no `story` block) MUST parse without syntax errors and provide syntax highlighting and editor features.
- **FR-012**: Existing single-file `.actone` projects MUST continue to work with zero changes required from the author.
- **FR-013**: The file order within the project MUST NOT affect the consolidated result — component definitions are order-independent and file-order-independent.

### Key Entities

- **Project**: A collection of one or more `.actone` files processed together. Contains at most one story block and one generate block. All files are automatically discovered and consolidated.
- **Story Block**: The top-level narrative container with a name. Optional in multi-file projects where standalone components are used. At most one per project across all files.
- **Standalone Component**: A top-level definition (character, world, scene, plot, timeline, theme, interaction, generate) that exists outside any `story` block. Treated identically to components defined inside a `story` block during consolidation.
- **Consolidated AST**: The merged abstract syntax tree produced by combining all `.actone` files in a project. This single AST drives all views, diagrams, and processing functions.

## Assumptions

- The project boundary is defined by the existing project structure — files belong to a project via the project's file storage, not by filesystem directory convention.
- The existing multi-file infrastructure (`getAstForAllFiles`, `compositionMode`) provides the foundation for this feature.
- Performance for projects with up to 20 `.actone` files is acceptable without special optimization.
- The writer does not need control over the order in which files are processed — all definitions are order-independent and the consolidation result is deterministic regardless of file ordering.
- Syntax highlighting and basic editor features (bracket matching, comment toggling) work per-file and do not require cross-file context. Only cross-references and validation require the consolidated AST.
- A project with zero `story` blocks (only standalone components) is valid and all component-level views still function.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A writer can split an existing single-file story into 3+ files and have all views and diagrams render identically to the original single-file version, with zero manual configuration.
- **SC-002**: Cross-references between components in different files resolve correctly in 100% of cases where the referenced component exists in any project file.
- **SC-003**: Editing a component in one file causes dependent views to update within the same timeframe as single-file edits (no perceptible additional delay).
- **SC-004**: All existing single-file projects continue to work with zero modifications after the grammar extension.
- **SC-005**: Duplicate definition errors clearly identify both file locations, enabling the writer to resolve conflicts in under 30 seconds.
- **SC-006**: A new writer can understand the multi-file organization capability within 2 minutes, requiring no knowledge of import or include mechanisms — files are simply placed in the project and discovered automatically.
