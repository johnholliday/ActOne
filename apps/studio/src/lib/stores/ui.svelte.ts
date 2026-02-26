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

  /** Whether the bottom panel (diagnostics/output) is visible */
  bottomPanelVisible = $state(true);

  /** Height of the bottom panel in pixels */
  bottomPanelHeight = $state(192);

  /** Width of the sidebar in pixels */
  sidebarWidth = $state(256);

  /** Currently active diagram view (null if editor is showing) */
  activeDiagramView = $state<DiagramView | null>(null);

  /** Whether the editor or diagram canvas has focus */
  activePane = $state<'editor' | 'diagram'>('editor');

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  toggleBottomPanel() {
    this.bottomPanelVisible = !this.bottomPanelVisible;
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

  resizeBottomPanel(height: number) {
    this.bottomPanelHeight = Math.max(100, Math.min(height, 500));
  }
}

export const uiStore = new UiStore();
