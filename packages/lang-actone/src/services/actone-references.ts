/**
 * Definition, references, and rename providers for ActOne DSL.
 *
 * Langium provides default implementations for these based on the grammar's
 * cross-reference structure. The defaults handle:
 *  - Go-to-definition: navigating from a reference to its declaration
 *  - Find references: finding all uses of a definition
 *  - Rename: renaming a symbol and all its references
 *
 * This file re-exports the default providers. Custom overrides can be added
 * here when multi-file composition modes require special handling.
 */
export {
  DefaultDefinitionProvider as ActOneDefinitionProvider,
  DefaultReferencesProvider as ActOneReferencesProvider,
  DefaultRenameProvider as ActOneRenameProvider,
} from 'langium/lsp';
