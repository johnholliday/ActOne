/**
 * Langium FileSystemProvider backed by an in-memory cache.
 *
 * Files are loaded into the cache during openProject,
 * then Langium workspace reads/lists them via this provider.
 * This runs inside the web worker context.
 */

import type { FileSystemNode, FileSystemProvider } from 'langium';
import { URI } from 'langium';

export class InMemoryFileSystemProvider implements FileSystemProvider {
  private files = new Map<string, string>();

  /* ── Cache Management ──────────────────────────────────────────── */

  /** Add or update a file in the cache. */
  setFile(uri: string, content: string): void {
    this.files.set(uri, content);
  }

  /** Remove a file from the cache. */
  removeFile(uri: string): void {
    this.files.delete(uri);
  }

  /** Clear all cached files. */
  clear(): void {
    this.files.clear();
  }

  /* ── FileSystemProvider Implementation ─────────────────────────── */

  async stat(uri: URI): Promise<FileSystemNode> {
    return this.statSync(uri);
  }

  statSync(uri: URI): FileSystemNode {
    const key = uri.toString();
    if (this.files.has(key)) {
      return { isFile: true, isDirectory: false, uri };
    }
    const prefix = key.endsWith('/') ? key : key + '/';
    for (const fileUri of this.files.keys()) {
      if (fileUri.startsWith(prefix)) {
        return { isFile: false, isDirectory: true, uri };
      }
    }
    return { isFile: false, isDirectory: false, uri };
  }

  async exists(uri: URI): Promise<boolean> {
    return this.existsSync(uri);
  }

  existsSync(uri: URI): boolean {
    return this.files.has(uri.toString());
  }

  async readBinary(uri: URI): Promise<Uint8Array> {
    return this.readBinarySync(uri);
  }

  readBinarySync(uri: URI): Uint8Array {
    const content = this.readFileSync(uri);
    return new TextEncoder().encode(content);
  }

  async readFile(uri: URI): Promise<string> {
    return this.readFileSync(uri);
  }

  readFileSync(uri: URI): string {
    const content = this.files.get(uri.toString());
    if (content === undefined) {
      throw new Error(`File not found: ${uri.toString()}`);
    }
    return content;
  }

  async readDirectory(uri: URI): Promise<FileSystemNode[]> {
    return this.readDirectorySync(uri);
  }

  readDirectorySync(uri: URI): FileSystemNode[] {
    const prefix = uri.toString().endsWith('/')
      ? uri.toString()
      : uri.toString() + '/';
    const nodes: FileSystemNode[] = [];

    for (const fileUri of this.files.keys()) {
      if (fileUri.startsWith(prefix)) {
        nodes.push({
          isFile: true,
          isDirectory: false,
          uri: URI.parse(fileUri),
        });
      }
    }

    return nodes;
  }
}
