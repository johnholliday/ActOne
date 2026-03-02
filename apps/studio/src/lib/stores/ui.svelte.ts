/** UI state using Svelte 5 runes */

/** Which diagram view is currently active */
export type DiagramView =
  | 'story-structure'
  | 'character-network'
  | 'world-map'
  | 'timeline'
  | 'interaction-sequence';

class UiStore {
  /** Whether the sidebar (project navigator) is visible */
  sidebarVisible = $state(true);

  /** Width of the sidebar in pixels */
  sidebarWidth = $state(256);

  /** Currently active diagram view (null if editor is showing) */
  activeDiagramView = $state<DiagramView | null>(null);

  /** Whether the outline panel is visible in the sidebar area */
  outlineVisible = $state(true);

  /** Width of the outline sidebar in pixels */
  outlineWidth = $state(240);

  /** Whether the status bar at the bottom is visible */
  statusBarVisible = $state(true);

  /** Whether the reading mode overlay is visible */
  readingModeVisible = $state(false);

  /** Whether the editor or diagram canvas has focus */
  activePane = $state<'editor' | 'diagram'>('editor');

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  toggleOutline() {
    this.outlineVisible = !this.outlineVisible;
  }

  toggleStatusBar() {
    this.statusBarVisible = !this.statusBarVisible;
  }

  toggleReadingMode() {
    this.readingModeVisible = !this.readingModeVisible;
  }

  setDiagramView(view: DiagramView | null) {
    this.activeDiagramView = view;
    if (view) {
      this.activePane = 'diagram';
    }
  }

  setActivePane(pane: 'editor' | 'diagram') {
    this.activePane = pane;
  }

  resizeSidebar(width: number) {
    this.sidebarWidth = Math.max(180, Math.min(width, 480));
  }

  resizeOutline(width: number) {
    this.outlineWidth = Math.max(160, Math.min(width, 480));
  }
}

export const uiStore = new UiStore();
