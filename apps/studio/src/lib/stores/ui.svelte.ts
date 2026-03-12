/** UI state using Svelte 5 runes */

/** Which diagram view is currently active */
export type DiagramView =
  | 'story-structure'
  | 'character-network'
  | 'world-map'
  | 'timeline'
  | 'interaction-sequence';

class UiStore {
  /** Current theme: dark or light */
  theme = $state<'dark' | 'light'>(
    (typeof localStorage !== 'undefined'
      ? (localStorage.getItem('actone:theme') as 'dark' | 'light')
      : null) ?? 'dark',
  );

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

  /** Whether the AI chat sidebar is visible */
  aiChatVisible = $state(false);

  /** Width of the AI chat sidebar in pixels */
  aiChatWidth = $state(340);

  /** Whether the editor or diagram canvas has focus */
  activePane = $state<'editor' | 'diagram'>('editor');

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('actone:theme', this.theme);
    this.applyTheme();
  }

  setTheme(t: 'dark' | 'light') {
    this.theme = t;
    localStorage.setItem('actone:theme', this.theme);
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

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

  toggleAiChat() {
    this.aiChatVisible = !this.aiChatVisible;
  }

  resizeAiChat(width: number) {
    this.aiChatWidth = Math.max(280, width);
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
