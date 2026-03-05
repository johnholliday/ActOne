# Feature Specification: Multi-Project Workspace

**Feature Branch**: `008-multi-project-workspace`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Allow the user to open multiple projects, which are added to the workspace. There can exist many more projects in the database that the user has access to, which are not 'open' in the workspace. Closing a project removes it from the workspace, but not from the database. There is a separate 'Delete Project...' command that requires double-confirmation (similar to the way Supabase prompts the user to confirm, and then type in the project name exactly as it appears before removing the project and its related objects from the database). The user may have several editor tabs open at the same time. As focus shifts from one .actone file to the other, all dependent views (diagrams, asset gallery, etc.) automatically switch to the corresponding context."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Multiple Projects in Workspace (Priority: P1)

A user working on several related stories (e.g., a trilogy) wants to have all three projects open simultaneously so they can reference characters, world-building, and plot points across them without constantly closing and reopening projects. The user opens the application, sees their most recent project loaded, then uses a menu or command to open additional projects from the project list. Each opened project appears in the sidebar, and its files become available for editing in tabs alongside files from other open projects.

**Why this priority**: This is the foundational capability that enables the entire multi-project workflow. Without the ability to have multiple projects open at once, none of the other stories are possible.

**Independent Test**: Can be fully tested by opening 2-3 projects and verifying each appears in the sidebar with its file tree and that files from any open project can be opened in editor tabs.

**Acceptance Scenarios**:

1. **Given** the user has one project open, **When** they invoke "Open Project..." and select a second project from the list, **Then** both projects appear in the sidebar and files from either project can be opened in editor tabs.
2. **Given** the user has three projects open, **When** they open a file from the third project, **Then** the file opens in a new editor tab alongside tabs from the other two projects.
3. **Given** the user has no projects open (fresh session), **When** they invoke "Open Project...", **Then** a browsable list of all their projects from the database is shown, allowing them to select one or more to open.
4. **Given** the user opens a project that is already open in the workspace, **When** they select it from the project list, **Then** the system focuses that project's section in the sidebar rather than creating a duplicate.

---

### User Story 2 - Automatic Context Switching (Priority: P2)

A user has files from Project A and Project B open in separate editor tabs. As the user clicks between tabs, the diagrams panel, asset gallery, outline, and problems panel all automatically switch to show content relevant to whichever project owns the currently focused file. The user does not need to manually select a "current project" — context follows the editor focus.

**Why this priority**: Without automatic context switching, having multiple projects open would be confusing rather than helpful. This is what makes multi-project editing feel seamless and productive.

**Independent Test**: Can be tested by opening files from two different projects, switching between tabs, and verifying all dependent views update to show the correct project's data.

**Acceptance Scenarios**:

1. **Given** the user has a file from Project A active and the Story Structure diagram visible, **When** they click on a tab containing a file from Project B, **Then** the Story Structure diagram updates to show Project B's structure.
2. **Given** the user switches from a Project A tab to a Project B tab, **When** the switch completes, **Then** the sidebar visually highlights the active project and its file tree, the outline panel shows Project B's elements, and the problems panel shows Project B's diagnostics.
3. **Given** the user has only one project open, **When** they switch between files within that project, **Then** context switching behaves identically to the current single-project behavior (no regressions).
4. **Given** the user switches to a tab from a different project, **When** the AST for that project is still loading, **Then** dependent views show a loading indicator rather than stale data from the previous project.

---

### User Story 3 - Close Project from Workspace (Priority: P3)

A user has finished working on one of their open projects and wants to declutter the workspace. They right-click the project in the sidebar (or use a menu command) and choose "Close Project." The project disappears from the sidebar, and all its open editor tabs are closed. The project remains safely stored in the database and can be reopened at any time.

**Why this priority**: Essential for workspace management. Without the ability to close projects, the workspace would grow unbounded and become cluttered.

**Independent Test**: Can be tested by opening two projects, closing one, verifying its tabs and sidebar entry are removed, and then reopening it to verify data integrity.

**Acceptance Scenarios**:

1. **Given** the user has two projects open and the second project has unsaved changes, **When** they close the second project, **Then** the system prompts them to save or discard changes before closing, then removes the project from the sidebar and closes all its tabs.
2. **Given** the user closes a project, **When** they later reopen it via "Open Project...", **Then** the project appears with all its files intact and no data has been lost.
3. **Given** the user has only one project open, **When** they close it, **Then** the workspace is empty with a welcome/empty state prompting them to open or create a project.
4. **Given** the user closes a project whose file was the active tab, **When** the close completes, **Then** focus shifts to the most recently active tab from another open project, or to the empty state if no projects remain.

---

### User Story 4 - Delete Project with Double Confirmation (Priority: P4)

A user decides they no longer need a project and wants to permanently remove it and all its related data. They invoke the "Delete Project..." command, which presents a confirmation dialog explaining the consequences. After the user confirms, a second prompt asks them to type the exact project name to proceed. Only when the typed name matches exactly does the system permanently delete the project and all its related objects (files, assets, diagram layouts, etc.).

**Why this priority**: Destructive operations need careful safety mechanisms. While less frequently used than opening/closing, the consequences of accidental deletion are severe and irreversible.

**Independent Test**: Can be tested by creating a test project, attempting to delete it (verifying both confirmation steps), and confirming the project and all related data are removed from the database.

**Acceptance Scenarios**:

1. **Given** the user invokes "Delete Project..." on a project, **When** the first confirmation dialog appears, **Then** it clearly states the project name, warns that deletion is permanent, and offers Cancel and Continue buttons.
2. **Given** the user clicks Continue on the first dialog, **When** the second dialog appears, **Then** it displays the exact project name and requires the user to type it character-for-character to enable the Delete button.
3. **Given** the user types the project name incorrectly in the second dialog, **When** they attempt to click Delete, **Then** the Delete button remains disabled.
4. **Given** the user correctly types the project name and clicks Delete, **When** the deletion completes, **Then** the project, all its source files, assets, and related objects are permanently removed from the database, and the project is removed from the workspace.
5. **Given** the user cancels at either confirmation step, **When** they return to the workspace, **Then** the project remains intact and unchanged.

---

### User Story 5 - Browse and Open Projects from Database (Priority: P5)

A user has many projects stored in the database but only a few open in their workspace. They want to browse their full project library, see metadata (title, genre, lifecycle stage, and last modified date), and selectively open projects into the workspace. The project browser should make it easy to find and open any previously created project.

**Why this priority**: Complements the workspace concept by providing access to the full project library. Without this, users would have no way to access projects that aren't currently in the workspace.

**Independent Test**: Can be tested by creating several projects, closing them all, then using the project browser to find and open specific ones.

**Acceptance Scenarios**:

1. **Given** the user invokes "Open Project...", **When** the project browser appears, **Then** it lists all the user's projects from the database with title, genre, lifecycle stage, and last modified date.
2. **Given** the user has 20+ projects, **When** they use the project browser, **Then** they can search/filter by project title to quickly find the one they want.
3. **Given** some projects are already open in the workspace, **When** the user views the project browser, **Then** already-open projects are visually distinguished (e.g., a badge or different styling) so the user knows they are already in the workspace.
4. **Given** the user selects a project from the browser, **When** they confirm the selection, **Then** the project is added to the workspace, appears in the sidebar, and its entry file opens in a new editor tab.

---

### Edge Cases

- What happens when the user tries to delete a project that is currently open in the workspace? The project must be removed from the workspace simultaneously with the database deletion.
- What happens when the user opens a project and then another user (in a future collaborative scenario) deletes it from the database? The system should handle gracefully by notifying the user and removing it from the workspace.
- What happens when the user has unsaved changes across multiple projects and closes the browser window? The system should prompt about unsaved changes for all affected projects, or auto-save as appropriate.
- What happens when two editor tabs from different projects have files with the same name (e.g., both named "story.actone")? The tab label should disambiguate by showing the project name alongside the file name.
- What happens when the user opens enough projects to make the sidebar unwieldy? Each project section should be collapsible, and the sidebar should scroll.
- What happens if the database is unreachable when attempting to open or delete a project? The system should show an appropriate error message and not corrupt local workspace state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support having zero or more projects open in the workspace simultaneously.
- **FR-002**: System MUST persist the set of open workspace projects across sessions (page reloads, browser restarts) so the user returns to the same workspace state.
- **FR-003**: System MUST provide an "Open Project..." command (accessible from the File menu and/or sidebar) that displays a browsable list of all the user's projects from the database.
- **FR-004**: System MUST allow the user to open a project from the browser, adding it to the workspace and loading its files into the sidebar.
- **FR-005**: System MUST prevent the same project from being added to the workspace more than once; attempting to open an already-open project focuses it instead.
- **FR-006**: System MUST provide a "Close Project" command that removes a project from the workspace, closes all its editor tabs, and does not delete anything from the database.
- **FR-007**: System MUST prompt the user to save or discard unsaved changes when closing a project that has dirty files.
- **FR-008**: System MUST allow editor tabs from multiple projects to be open simultaneously in the tab bar.
- **FR-009**: System MUST disambiguate editor tab labels for files with the same name across different projects by displaying the project name.
- **FR-010**: System MUST automatically switch all dependent views (diagrams, asset gallery, outline, problems panel) to the context of whichever project owns the currently focused editor tab.
- **FR-011**: System MUST update the sidebar to visually indicate which project is currently active (owns the focused editor tab).
- **FR-012**: System MUST provide a "Delete Project..." command that permanently removes a project and all its related objects from the database.
- **FR-013**: The "Delete Project..." command MUST require two confirmation steps: (1) a warning dialog with Cancel/Continue, and (2) a dialog requiring the user to type the exact project name to enable the Delete button.
- **FR-014**: System MUST remove a deleted project from the workspace if it was open at the time of deletion.
- **FR-015**: System MUST show an empty/welcome state when no projects are open in the workspace, prompting the user to open or create a project.
- **FR-016**: The project browser ("Open Project..." dialog) MUST show project metadata: title, genre, lifecycle stage, and last modified date.
- **FR-017**: The project browser MUST visually distinguish projects that are already open in the workspace from those that are not.
- **FR-018**: Each project section in the sidebar MUST be independently collapsible.
- **FR-019**: System MUST handle the case where the active project's last tab is closed by shifting focus to the most recently active tab from another open project.

### Key Entities

- **Workspace**: The set of currently open projects in the user's session. Persisted locally (not in the database). Contains references to zero or more projects.
- **Project**: A creative work stored in the database, identified by a unique ID. Has metadata (title, author, genre, lifecycle stage, etc.) and contains one or more source files. Can be "open" (in the workspace) or "closed" (only in the database).
- **Source File**: A `.actone` file belonging to a project. Identified by a unique ID. Can be opened in editor tabs. One file per project is marked as the entry file.
- **Editor Tab**: Represents an open file in the editor area. Now associated with a specific project. Tab labels include project name for disambiguation when needed.
- **Project Context**: The active project whose data drives all dependent views. Determined by which project owns the currently focused editor tab. Includes the project's AST, diagnostics, assets, and diagram state.

## Assumptions

- The existing authentication system ensures users can only see and access their own projects in the database.
- Workspace state (which projects are open) is stored locally per-device, not synchronized across devices.
- The existing auto-save mechanism applies per-file and continues to work regardless of which project the file belongs to.
- The New Project flow (already implemented) continues to work, automatically adding the newly created project to the workspace.
- Diagram layout overrides (stored in localStorage sidecars) are already keyed by project ID and will continue to work correctly with multi-project support.
- The maximum number of simultaneously open projects is bounded by practical browser memory limits rather than an artificial cap.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open, switch between, and close projects in under 2 seconds each, with no perceivable lag in context switching.
- **SC-002**: All dependent views (diagrams, outline, problems, gallery) update to reflect the correct project within 1 second of switching editor tab focus.
- **SC-003**: Users can complete the full "Delete Project..." flow (both confirmation steps) in under 30 seconds, with zero accidental deletions due to the double-confirmation safeguard.
- **SC-004**: Workspace state (set of open projects) survives page reloads with 100% fidelity — no projects lost or unexpectedly added.
- **SC-005**: Editor tabs from different projects are clearly distinguishable, with 100% of users able to identify which project a tab belongs to.
- **SC-006**: Users with 10+ projects in the database can find and open any specific project from the browser in under 10 seconds.
