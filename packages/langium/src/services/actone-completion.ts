import { DefaultCompletionProvider } from 'langium/lsp';

/**
 * Context-aware completion provider for the ActOne DSL.
 *
 * Extends Langium's default keyword/cross-reference completion.
 * The default provider already handles keywords and cross-references
 * via the grammar structure and our custom scope provider (ActOneScopeProvider).
 *
 * Custom overrides can be added here as needed for advanced completion logic.
 */
export class ActOneCompletionProvider extends DefaultCompletionProvider {}
