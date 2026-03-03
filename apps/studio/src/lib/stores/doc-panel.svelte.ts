const STORAGE_KEY = 'actone-doc-panel';
const DEFAULT_DOC_PAGE = 'getting-started/01-introduction';
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 280;
const MAX_WIDTH = 800;

interface DocPanelPersisted {
  open: boolean;
  docSlug: string;
  width: number;
}

function createDocPanelState() {
  let open = $state(false);
  let docSlug = $state(DEFAULT_DOC_PAGE);
  let docHtml = $state('');
  let loading = $state(false);
  let error = $state('');
  let width = $state(DEFAULT_WIDTH);

  return {
    get open() {
      return open;
    },
    get docSlug() {
      return docSlug;
    },
    get docHtml() {
      return docHtml;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get width() {
      return width;
    },

    setWidth(value: number) {
      width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, value));
      persist();
    },

    async openDoc(slug: string) {
      if (open && docSlug === slug) return;

      docSlug = slug;
      open = true;
      loading = true;
      error = '';
      persist();

      try {
        const url = `/guide/${slug}/`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load page (${res.status})`);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const article =
          doc.querySelector('article') ??
          doc.querySelector('main') ??
          doc.querySelector('.content');
        docHtml = article ? article.innerHTML : doc.body.innerHTML;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load page';
        docHtml = '';
      } finally {
        loading = false;
      }
    },

    close() {
      open = false;
      persist();
    },

    toggle() {
      if (open) {
        open = false;
      } else {
        open = true;
        if (!docHtml && docSlug) {
          void this.openDoc(docSlug);
        }
      }
      persist();
    },

    urlToSlug(url: string): string {
      return url.replace(/^\/?(guide\/)?/, '').replace(/\/$/, '');
    },

    isActiveDoc(url: string): boolean {
      return open && docSlug === this.urlToSlug(url);
    },

    handleContentClick(e: MouseEvent, contentEl?: HTMLElement) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Hash links: smooth scroll within panel
      if (href.startsWith('#')) {
        e.preventDefault();
        const id = href.slice(1);
        const el = contentEl?.querySelector(`#${CSS.escape(id)}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Internal guide links: fetch and display in panel
      if (
        href.startsWith('/guide/') ||
        href.startsWith('/getting-started/') ||
        href.startsWith('/user-guide/') ||
        href.startsWith('/language-reference/') ||
        href.startsWith('/reference/')
      ) {
        e.preventDefault();
        const slug = this.urlToSlug(href);
        if (slug) void this.openDoc(slug);
        return;
      }

      // Relative links: resolve against current page
      if (!href.startsWith('http') && !href.startsWith('mailto:')) {
        e.preventDefault();
        const currentDir = docSlug.substring(0, docSlug.lastIndexOf('/'));
        const resolved = new URL(href, `http://x/${currentDir}/`).pathname;
        const slug = this.urlToSlug(resolved);
        if (slug) void this.openDoc(slug);
        return;
      }

      // External links: open in new tab
      target.setAttribute('target', '_blank');
      target.setAttribute('rel', 'noopener noreferrer');
    },
  };

  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ open, docSlug, width } satisfies DocPanelPersisted),
      );
    } catch {
      // localStorage unavailable
    }
  }
}

let docPanelState: ReturnType<typeof createDocPanelState> | undefined;

export function getDocPanelState() {
  docPanelState ??= createDocPanelState();
  return docPanelState;
}

export function initDocPanelState() {
  const state = getDocPanelState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as DocPanelPersisted;
      if (typeof saved.width === 'number' && saved.width >= MIN_WIDTH) {
        state.setWidth(saved.width);
      }
      if (typeof saved.docSlug === 'string' && saved.docSlug) {
        // Remember the slug but don't auto-open on page load
      }
    }
  } catch {
    // ignore malformed data
  }
}
