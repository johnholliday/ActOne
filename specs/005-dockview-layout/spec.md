# Feature Specification: Dockview Layout Manager

**Feature Branch**: `005-dockview-layout`
**Created**: 2026-02-28
**Status**: Draft
**Input**: User description: "Install the Dockview layout manager (www.dockview.dev) and incorporate all views except the sidebar into the docking framework."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Multiple Panels Simultaneously (Priority: P1)

A writer wants to view their editor and a diagram side-by-side so they can see how story structure changes as they edit. Currently, navigating between the editor and any other view (diagrams, story bible, statistics) requires full-page navigation, losing context each time.

With the docking layout, the writer opens the editor in one panel and a story structure diagram in another, arranging them side-by-side. They can edit their script while watching the diagram update in real time.

**Why this priority**: This is the core value proposition of adopting a docking layout manager. Without multi-panel viewing, there is no reason to add a docking framework.

**Independent Test**: Can be fully tested by opening two views (e.g., editor + any diagram) in separate dockable panels and verifying both are visible and functional simultaneously.

**Acceptance Scenarios**:

1. **Given** the user is on the editor view, **When** they open a diagram view, **Then** the diagram appears in a new panel alongside the editor (not replacing it).
2. **Given** two panels are open side-by-side, **When** the user edits content in the editor panel, **Then** the editor remains functional and the other panel remains visible.
3. **Given** the user has multiple panels open, **When** they close one panel, **Then** the remaining panels resize to fill the available space.

---

### User Story 2 - Rearrange Panels via Drag and Drop (Priority: P2)

A writer wants to customize their workspace layout by dragging panels to new positions — placing the outline below the editor, the story bible to the right, and diagnostics at the bottom. The layout should feel as natural as rearranging windows on a desktop.

**Why this priority**: Drag-and-drop rearrangement is the defining interaction of a docking layout manager. Without it, the panels would just be a static grid.

**Independent Test**: Can be tested by dragging a panel's tab from one position to another (e.g., from a right dock to the bottom) and verifying it snaps into the new position.

**Acceptance Scenarios**:

1. **Given** a panel is docked on the right side, **When** the user drags its tab toward the bottom area, **Then** the panel moves to the bottom position.
2. **Given** two panels are in separate groups, **When** the user drags one panel's tab onto the other group's tab bar, **Then** the panels become tabs within the same group.
3. **Given** a panel is being dragged, **When** the user hovers over dock target zones, **Then** visual indicators show where the panel will land.

---

### User Story 3 - Persist and Restore Layout (Priority: P2)

A writer has arranged their workspace with the editor in the center, story bible on the right, and diagnostics at the bottom. When they close and reopen the application, they expect their custom arrangement to be preserved exactly as they left it.

**Why this priority**: Without persistence, users would need to rearrange their workspace every session, making the feature frustrating rather than helpful.

**Independent Test**: Can be tested by arranging panels, refreshing the browser, and verifying the layout is restored identically.

**Acceptance Scenarios**:

1. **Given** the user has arranged panels in a custom layout, **When** they refresh the browser, **Then** the layout is restored to the exact same arrangement.
2. **Given** the user has a saved layout, **When** they open a new panel not in the saved layout, **Then** the new panel appears in a sensible default position without disrupting the existing arrangement.
3. **Given** the user wants to start fresh, **When** they choose to reset the layout, **Then** the workspace returns to the default arrangement.

---

### User Story 4 - Tabbed Panel Groups (Priority: P3)

A writer has several reference views (story bible, statistics, gallery) that they don't need to see simultaneously. They want to group these as tabs within a single panel area, switching between them with a click while keeping the editor visible at all times.

**Why this priority**: Tabbed groups are essential for managing screen real estate when many views are available. Without tabs, the workspace becomes cluttered.

**Independent Test**: Can be tested by opening multiple views into the same panel group and switching between tabs.

**Acceptance Scenarios**:

1. **Given** two views are tabbed in the same group, **When** the user clicks the inactive tab, **Then** the view switches to that tab's content.
2. **Given** a tab group has three tabs, **When** the user closes the middle tab, **Then** the remaining tabs shift and one of them becomes active.
3. **Given** a single tab remains in a group, **When** the user closes that tab, **Then** the panel group is removed and surrounding panels resize to fill the space.

---

### User Story 5 - Resize Panels by Dragging Dividers (Priority: P3)

A writer wants to make the editor panel wider and the outline panel narrower by dragging the divider between them. The resize should be smooth and responsive.

**Why this priority**: Resizable dividers are a basic expectation of any multi-panel layout and complement the drag-and-drop functionality.

**Independent Test**: Can be tested by dragging a divider between two panels and verifying both panels resize accordingly.

**Acceptance Scenarios**:

1. **Given** two panels are side-by-side, **When** the user drags the divider between them, **Then** one panel grows and the other shrinks proportionally.
2. **Given** the user is resizing a panel, **When** they release the mouse, **Then** the panel sizes are preserved in the layout state.

---

### Edge Cases

- What happens when the user's saved layout references a panel type that no longer exists (e.g., after an update removes a view)? The system should gracefully ignore the unknown panel and restore the rest of the layout.
- How does the layout behave when the browser window is very narrow (below 768px)? Panels should respect minimum sizes and may stack or collapse rather than overlap.
- What happens if the user closes all panels? A default panel (the editor) should reopen automatically so the workspace is never completely empty.
- How does the layout handle a panel whose content has no data to display (e.g., diagram with no story loaded)? The panel should render with its existing empty state, same as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a docking layout container that occupies the main content area (everything to the right of the sidebar and below the menu bar).
- **FR-002**: System MUST allow users to open any application view (editor, 5 diagram types, story bible, gallery, reading mode, spread preview, statistics, export, outline, diagnostics — 14 panel types total) as a dockable panel.
- **FR-003**: System MUST support splitting the layout horizontally and vertically so users can view multiple panels simultaneously.
- **FR-004**: System MUST allow users to rearrange panels by dragging their tabs to new positions (left, right, top, bottom, or as a tab within an existing group).
- **FR-005**: System MUST display visual drop-target indicators during drag operations to show where a panel will dock.
- **FR-006**: System MUST support tabbed panel groups where multiple views share the same screen area and the user switches between them via tab clicks.
- **FR-007**: System MUST allow users to close individual panels via a close button on the panel tab.
- **FR-008**: System MUST allow users to resize panels by dragging the dividers between them.
- **FR-009**: System MUST persist the panel layout across browser sessions so the arrangement is restored on next visit.
- **FR-010**: System MUST provide a way to reset the layout to the default arrangement (e.g., via the View menu).
- **FR-011**: System MUST keep the left sidebar and top menu bar outside the docking framework — they remain fixed in their current positions and continue to function as they do today.
- **FR-012**: System MUST preserve all existing view functionality (editor save/auto-save, diagram interactivity, form inputs, keyboard shortcuts, etc.) when views are rendered inside dockable panels.
- **FR-013**: System MUST show a default layout on first use with the editor as the primary (largest) panel.
- **FR-014**: The outline panel and bottom panel (diagnostics/output) MUST be incorporated into the docking framework, replacing their current custom resizing and docking logic.
- **FR-015**: Navigation items in the sidebar and menu bar MUST open the corresponding view as a panel (or focus it if already open) rather than performing full-page route navigation.

### Key Entities

- **Panel**: A single content area rendering one application view. Identified by a unique key (e.g., "editor", "story-structure", "statistics"). Has a title displayed in its tab. Can be opened, closed, moved, and resized.
- **Panel Group**: A collection of one or more panels displayed as tabs. Only one panel in the group is visible at a time. Groups can be split or merged via drag-and-drop.
- **Layout**: The complete arrangement of all panel groups, their positions, sizes, and the panels within them. Can be serialized for persistence and deserialized for restoration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view at least two panels simultaneously (e.g., editor + diagram) without any loss of functionality in either panel.
- **SC-002**: Users can rearrange panels via drag-and-drop in under 3 seconds per operation, with visual feedback throughout the drag.
- **SC-003**: Layout persistence restores the exact panel arrangement after a page refresh with 100% fidelity (same panels, positions, and relative sizes).
- **SC-004**: All 14 panel types render correctly inside dockable panels with no regressions in functionality (save, edit, navigate, interact).
- **SC-005**: The default layout loads in under 1 second on a standard broadband connection, with no visible layout shift or flash of unstyled content.
- **SC-006**: The sidebar and menu bar remain fully functional and visually unchanged after the docking framework is integrated.

## Assumptions

- The docking layout manager provides a core API usable from vanilla TypeScript that can be integrated with the application's component framework without requiring a framework-specific wrapper package.
- The existing navigation (sidebar items, menu bar items) can be adapted to open views as panels rather than performing full-page route changes, without breaking deep-link URLs.
- Panel content (existing view components) can be mounted into docking framework panel containers without major refactoring of the view components themselves.
- The docking framework adds a reasonable amount to the application bundle (under 100KB gzipped).
- The application targets modern desktop browsers (Chrome, Firefox, Safari, Edge); mobile/touch docking interactions are out of scope for this feature.

## Scope Boundaries

### In Scope
- Installing and integrating the docking layout library
- Converting all main content views (editor, 5 diagrams, story bible, gallery, reading mode, spread preview, statistics, export) into dockable panels
- Converting the outline panel and bottom panel (diagnostics/output) into dockable panels
- Drag-and-drop panel rearrangement with visual indicators
- Tabbed panel groups
- Resizable panel dividers
- Layout serialization and persistence to local storage
- Default layout configuration
- Layout reset functionality (via View menu)
- Updating sidebar and menu bar navigation to open panels instead of navigating routes
- Keeping the sidebar and menu bar outside the docking framework

### Out of Scope
- Floating/detached panels (popout windows)
- Mobile or touch-optimized docking interactions
- User-defined layout presets/profiles (save multiple named layouts)
- Theming the docking framework beyond matching the existing dark theme
- Adding new views — only existing views are migrated
- Settings pages (profile, account, appearance) — these remain as full-page routes
