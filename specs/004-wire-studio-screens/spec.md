# Feature Specification: Wire Studio Screens to Live Functions

**Feature Branch**: `004-wire-studio-screens`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "Ensure that all user stories are fully implemented and follow the designs. Currently, the screens are displayed with placeholder content that is not connected to any actual functions. There is no syntax highlighting in the editor. File > New Project does nothing."

## Clarifications

### Session 2026-02-27

- Q: What scope for the user profile section at the bottom of the sidebar? → A: Implement all 4 items fully: Sign Out works, Profile Settings / Account Settings / Appearance each open a real settings page.
- Q: Are the missing `/export` and `/help` routes in scope? → A: Only `/export` is in scope (wire to existing publishing API); `/help` deferred to a separate feature.
- Q: What loading/progress feedback should async operations show? → A: Inline loading indicators — show a spinner or skeleton placeholder within the area loading content (non-blocking).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a New Project from the Menu (Priority: P1)

A writer opens ActOne Studio and clicks **File > New Project** to start a new story project. The system prompts for a project name, creates the project in the database, initializes a default source file, opens that file in the editor, and navigates to the code editor view. The writer can immediately begin typing ActOne DSL and see their project listed in the sidebar.

**Why this priority**: Project creation is the entry point for all other workflows. Without it, no other screen or feature can receive real data. This is the single most critical gap — users see a "New Project" menu item that does nothing when clicked.

**Independent Test**: Can be fully tested by clicking File > New Project, entering a name, and verifying a project is created with a default file open in the editor. Delivers the foundational ability to start using the application.

**Acceptance Scenarios**:

1. **Given** the user is signed in, **When** they click File > New Project, **Then** a dialog appears asking for a project name.
2. **Given** the new-project dialog is visible, **When** the user enters a name and confirms, **Then** a project is created, a default source file is opened in the editor, and the project name appears in the sidebar header.
3. **Given** the new-project dialog is visible, **When** the user cancels, **Then** no project is created and the dialog closes.
4. **Given** the user is not signed in, **Then** the IDE layout (including the File menu) is not rendered — the auth page is shown instead. *(Note: The `+layout.svelte` auth guard prevents unauthenticated access to the menu bar, so this scenario is handled at the layout level rather than per-menu-item.)*

---

### User Story 2 — See Syntax Highlighting While Editing (Priority: P1)

A writer opens the code editor and types ActOne DSL (story definitions, characters, scenes, etc.). As they type, keywords appear in purple, type names in amber, strings in green, numbers in orange, comments in grey italic, and cross-references in distinct colors — matching the designed color scheme. Syntax highlighting updates automatically as the writer edits.

**Why this priority**: Syntax highlighting is essential for code readability and writer productivity. Without it, the editor displays monochrome text, making the DSL difficult to read and navigate. This is one of the user's explicitly reported issues.

**Independent Test**: Can be fully tested by typing ActOne DSL in the editor and verifying that different token types (keywords, strings, names, numbers, comments) display in distinct colors. Delivers immediate visual feedback that makes the editor usable.

**Acceptance Scenarios**:

1. **Given** the editor is open with ActOne content, **When** the language server initializes, **Then** semantic token colors appear within 2 seconds.
2. **Given** the editor displays highlighted content, **When** the user types new keywords or references, **Then** highlighting updates within 1 second of pausing.
3. **Given** the editor contains all token types (keyword, type, property, variable, string, number, comment), **Then** each type displays in a visually distinct color matching the design palette.

---

### User Story 3 — Wire All Menu Actions to Real Functions (Priority: P2)

A writer uses the application menus and finds that every menu item performs its described action. File > Advance Stage transitions the project lifecycle. File > Take Snapshot captures analytics. File > Export Manuscript opens the export page. Run > Scene Prose triggers AI text generation. View > Diagram options switch to diagram views. No menu item is a dead-end. The Help > User's Guide item is visually disabled with a "Coming Soon" indicator until that feature is implemented separately.

**Why this priority**: Menu items that silently do nothing erode user trust and make the application feel broken. Once projects can be created (P1), the lifecycle and generation menus become the next critical workflow enablers.

**Independent Test**: Can be tested by clicking each menu item in sequence and verifying the expected action occurs (dialog appears, view changes, generation starts, etc.).

**Acceptance Scenarios**:

1. **Given** a project is loaded, **When** the user clicks File > Advance Stage and selects a target stage, **Then** the project's lifecycle stage advances and the UI reflects the new stage.
2. **Given** a project is loaded, **When** the user clicks File > Take Snapshot, **Then** an analytics snapshot is captured and the user receives confirmation.
3. **Given** a project is loaded with at least one scene, **When** the user clicks Run > Scene Prose (or presses Ctrl+G), **Then** the AI prose generation panel opens and begins streaming generated text.
4. **Given** the user clicks View > Story Structure (or presses Ctrl+1), **Then** the view switches to the Story Structure diagram populated with data from the current project.
5. **Given** a project is loaded, **When** the user clicks File > Export Manuscript, **Then** the export page opens with format options and the user can initiate a manuscript export.
6. **Given** the user clicks Help > User's Guide, **Then** the menu item appears disabled with a "Coming Soon" label.

---

### User Story 4 — View Spread Preview with Real Manuscript Content (Priority: P2)

A writer navigates to the Spread Preview screen and sees their manuscript rendered as two-page spreads at print aspect ratio, with proper typography and page numbering. The content comes from their actual project files, not placeholder text.

**Why this priority**: Spread Preview currently shows "Page 1", "Page 2" placeholder text instead of real content. This is a visible gap between the design and the implementation that makes the feature non-functional.

**Independent Test**: Can be tested by writing ActOne DSL content, navigating to Spread Preview, and verifying the authored content appears in the two-page layout.

**Acceptance Scenarios**:

1. **Given** a project with story content, **When** the user navigates to Spread Preview, **Then** the manuscript content renders across two-page spreads with proper formatting.
2. **Given** the spread preview is visible, **When** the user changes page, **Then** the next spread of content is displayed.
3. **Given** the project has no content, **When** the user navigates to Spread Preview, **Then** a message indicates there is no content to preview.

---

### User Story 5 — Browse Visual Assets in the Gallery (Priority: P3)

A writer navigates to the Gallery screen and sees their project's visual assets (AI-generated images, uploaded images) displayed in a filterable, sortable grid. They can search, filter by type, compare assets side-by-side, and manage their visual library.

**Why this priority**: The Gallery UI has filter/search/sort logic built but never loads assets from the project. This makes the screen appear empty even when assets exist. It's lower priority because the core authoring workflow doesn't depend on it.

**Independent Test**: Can be tested by navigating to Gallery with a project that has generated images and verifying assets appear in the grid with working search and filter controls.

**Acceptance Scenarios**:

1. **Given** a project with visual assets, **When** the user navigates to Gallery, **Then** all project assets display in the grid.
2. **Given** assets are displayed, **When** the user types in the search box, **Then** the grid filters to show matching assets.
3. **Given** the project has no assets, **When** the user navigates to Gallery, **Then** an empty state message is shown with guidance on how to generate assets.

---

### User Story 6 — Project Context Flows to All Screens (Priority: P2)

When a project is loaded, every screen in the application displays data from that project. Diagrams show the project's story structure. The Story Bible shows the project's characters and worlds. Statistics show the project's analytics. The sidebar shows the project's files. No screen displays stale or disconnected data.

**Why this priority**: Several screens work with AST data but use a hardcoded project identifier instead of the active project context. This causes data to appear disconnected when switching between projects.

**Independent Test**: Can be tested by loading a project with rich content and navigating to each screen (Story Bible, all 5 diagrams, Statistics, Reading Mode) to verify project-specific data appears.

**Acceptance Scenarios**:

1. **Given** a project is loaded, **When** the user navigates to any diagram view, **Then** the diagram displays data from the active project's parsed AST.
2. **Given** a project is loaded, **When** the user navigates to Story Bible, **Then** tabs show the project's characters, worlds, relationships, and themes.
3. **Given** a project is loaded, **When** the user navigates to Statistics, **Then** metrics reflect the active project's content and history.
4. **Given** no project is loaded, **When** the user navigates to a data-dependent screen, **Then** a clear message indicates no project is loaded, with a prompt to create or open one.

---

### User Story 7 — User Profile Menu with Settings Pages (Priority: P2)

A writer clicks on their profile section at the bottom of the sidebar and a popup menu appears showing four options: Profile Settings, Account Settings, Appearance, and Sign Out. Each option navigates to a dedicated settings page. Sign Out ends the session and returns the user to the sign-in page. Profile Settings allows the user to update their display name and avatar. Account Settings allows email and password changes and shows linked OAuth accounts. Appearance allows the user to adjust theme and font preferences.

**Why this priority**: The user profile area is visible on every screen but is completely inert — clicking it does nothing. Sign Out is a critical missing function (users currently have no way to log out). The settings pages complete the account management flow shown in the designs.

**Independent Test**: Can be tested by clicking the user profile area, verifying the popup appears with all 4 options, clicking each option to verify it opens the correct settings page, and using Sign Out to verify the session ends.

**Acceptance Scenarios**:

1. **Given** the user is signed in, **When** they click the user profile section at the bottom of the sidebar, **Then** a popup menu appears with Profile Settings, Account Settings, Appearance, and Sign Out options.
2. **Given** the popup menu is visible, **When** the user clicks Sign Out, **Then** the session ends and the user is redirected to the sign-in page.
3. **Given** the popup menu is visible, **When** the user clicks Profile Settings, **Then** a settings page opens where the user can update their display name and avatar.
4. **Given** the popup menu is visible, **When** the user clicks Account Settings, **Then** a settings page opens showing email, password change options, and linked OAuth accounts.
5. **Given** the popup menu is visible, **When** the user clicks Appearance, **Then** a settings page opens with theme and font preferences.
6. **Given** the popup menu is visible, **When** the user clicks outside the popup, **Then** the popup closes without navigating.

---

### Edge Cases

- What happens when the user tries to create a project with a duplicate name? Duplicate names are allowed; the system differentiates projects by unique ID.
- What happens when the language server worker fails to start or crashes mid-session? An error banner appears in the editor area with a "Retry" button that attempts to restart the worker.
- What happens when the user navigates to a diagram view before the AST has finished parsing? An inline spinner is shown until parsing completes, then the diagram renders.
- What happens when a network error occurs during project creation? An error message is shown in the creation dialog with a "Retry" option; the dialog remains open so the user doesn't lose their input.
- What happens when the user rapidly switches between menu actions before the previous action completes? The previous action is cancelled (if possible) and the new action takes priority.
- What happens when the user tries to sign out while unsaved changes exist? The user is prompted to save or discard changes before signing out.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST wire the "New Project" menu action to a creation flow that prompts for a project name, creates the project via the existing project creation service, and opens a default source file in the editor.
- **FR-002**: System MUST display semantic syntax highlighting in the code editor for all ActOne DSL token types (keywords, types, properties, variables, strings, numbers, comments, functions, enums) using the designed color palette.
- **FR-003**: System MUST wire the "Advance Stage" menu action to call the project lifecycle service and update the UI to reflect the new stage.
- **FR-004**: System MUST wire the "Take Snapshot" menu action to capture an analytics snapshot via the existing analytics service.
- **FR-005**: System MUST wire the "Scene Prose" menu action (and Ctrl+G shortcut) to open the prose generation panel and initiate AI text generation for the selected scene.
- **FR-006**: System MUST wire all "View > Diagram" menu actions to navigate to the corresponding diagram route and display project data.
- **FR-007**: System MUST render the Spread Preview screen with real manuscript content from the active project instead of placeholder text.
- **FR-008**: System MUST populate the Gallery screen with the active project's visual assets and support search, filter, and sort operations on them.
- **FR-009**: System MUST propagate the active project context (project ID, AST data) to all screens so that diagrams, Story Bible, Statistics, and preview screens display project-specific data.
- **FR-010**: System MUST display an appropriate empty state on data-dependent screens when no project is loaded.
- **FR-011**: System MUST ensure that syntax highlighting refreshes within 1 second of the user pausing after editing, and appears within 2 seconds of the editor loading.
- **FR-012**: System MUST make the sidebar user profile section clickable, opening a popup menu with Profile Settings, Account Settings, Appearance, and Sign Out options matching the designed layout.
- **FR-013**: System MUST implement Sign Out functionality that ends the user session and redirects to the sign-in page.
- **FR-014**: System MUST provide a Profile Settings page where the user can update their display name and avatar.
- **FR-015**: System MUST provide an Account Settings page showing email, password change, and linked OAuth accounts.
- **FR-016**: System MUST provide an Appearance settings page with theme and font preferences.
- **FR-017**: System MUST create an `/export` route that presents manuscript export options and triggers export via the existing publishing service.
- **FR-018**: System MUST disable the Help > User's Guide menu item with a "Coming Soon" indicator (the `/help` route is deferred to a separate feature).
- **FR-019**: System MUST show inline loading indicators (spinner or skeleton placeholder) within any area performing an asynchronous operation, without blocking interaction with the rest of the interface.

### Key Entities

- **Project**: Represents a writer's story project. Contains metadata (name, lifecycle stage, composition mode) and a collection of source files.
- **Source File**: A single `.actone` DSL file within a project. Has a file path, content, and parsed AST.
- **Visual Asset**: An image (generated or uploaded) associated with a project. Has metadata (name, type, dimensions) and a storage reference.
- **Analytics Snapshot**: A point-in-time capture of project metrics (word count, scene count, character count, diagnostic summary).
- **User Profile**: The signed-in user's identity. Contains display name, email, avatar, and linked OAuth accounts. Editable via settings pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new project from the File menu and begin editing within 5 seconds.
- **SC-002**: Syntax highlighting appears in the editor for all token types within 2 seconds of opening a file, with no monochrome text visible for supported DSL constructs.
- **SC-003**: 100% of menu items perform a visible action when clicked (no silent no-ops remain), except Help > User's Guide which is explicitly marked as "Coming Soon".
- **SC-004**: All 13 designed screens display project-specific data when a project is loaded, with zero placeholder or static content.
- **SC-005**: Users can complete the full authoring cycle — create project, write DSL, view diagrams, preview manuscript, generate prose — without encountering non-functional UI elements.
- **SC-006**: Switching between screens preserves the active project context, with all views showing data from the same project.
- **SC-007**: Users can sign out from the sidebar profile menu and are redirected to the sign-in page within 2 seconds.
- **SC-008**: All async operations display an inline loading indicator within 200ms of starting, providing continuous visual feedback until completion.

## Assumptions

- The existing project creation API (`/api/project/create`) and database schema are functional and do not need modification.
- The Langium language server correctly produces semantic tokens for all ActOne DSL token types when the worker connection is properly established.
- The existing diagram transformers correctly convert parsed AST data into node/edge structures for rendering.
- The publishing preview API (`/api/publishing/preview`) can produce formatted manuscript content suitable for Spread Preview rendering.
- The publishing export API (`/api/publishing/export`) is functional and supports manuscript export in at least one format.
- AI text and image generation backends are configured and accessible (the wiring work connects UI to existing services, not implementing new backends).
- The user will sign in before performing project-level operations; anonymous/guest usage is not in scope.
- The Supabase auth client supports `signOut()`, profile metadata updates, and password change operations without additional backend work.

## Out of Scope

- **Help > User's Guide** (`/help` route): Deferred to a separate feature. Menu item will be disabled with "Coming Soon" label.
- **Multi-user collaboration**: Real-time co-editing or shared project access.
- **Project import/export from files**: Importing `.actone` files from local disk or exporting project archives.
- **Custom theme creation**: The Appearance settings page offers preset themes, not a custom theme builder.
