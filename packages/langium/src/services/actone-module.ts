import type {
  Module,
  FileSystemProvider,
  LangiumSharedCoreServices,
} from 'langium';
import type {
  LangiumServices,
  LangiumSharedServices,
  PartialLangiumServices,
} from 'langium/lsp';
import type { Connection } from 'vscode-languageserver';
import {
  createDefaultCoreModule,
  inject,
  EmptyFileSystem,
} from 'langium';
import {
  createDefaultLSPModule,
  createDefaultSharedModule,
} from 'langium/lsp';
import {
  ActOneGeneratedModule,
  ActOneGeneratedSharedModule,
} from '../generated/module.js';
import {
  ActOneValidator,
  registerActOneValidationChecks,
} from './actone-validator.js';
import { ActOneScopeProvider } from './actone-scope.js';
import { ActOneCompletionProvider } from './actone-completion.js';
import { ActOneHoverProvider } from './actone-hover.js';
import { ActOneFormatter } from './actone-formatter.js';
import { ActOneSemanticTokenProvider } from './actone-semantic-tokens.js';
import { ActOneDocumentSymbolProvider } from './actone-symbols.js';
import { ActOneCodeActionProvider } from './actone-code-actions.js';

/**
 * Declaration of custom services — groups the ActOne-specific service additions
 * that are injected alongside the standard Langium services.
 */
export type ActOneAddedServices = {
  validation: {
    ActOneValidator: ActOneValidator;
  };
};

/**
 * Union of Langium services (core + LSP) and ActOne-specific services.
 */
export type ActOneServices = LangiumServices & ActOneAddedServices;

/**
 * Dependency injection module for ActOne language services.
 */
export const ActOneModule: Module<
  ActOneServices,
  PartialLangiumServices & ActOneAddedServices
> = {
  references: {
    ScopeProvider: (services) => new ActOneScopeProvider(services),
  },
  lsp: {
    CompletionProvider: (services) => new ActOneCompletionProvider(services),
    HoverProvider: (services) => new ActOneHoverProvider(services),
    Formatter: () => new ActOneFormatter(),
    SemanticTokenProvider: (services) =>
      new ActOneSemanticTokenProvider(services),
    DocumentSymbolProvider: (services) =>
      new ActOneDocumentSymbolProvider(services),
    CodeActionProvider: () => new ActOneCodeActionProvider(),
  },
  validation: {
    ActOneValidator: (services) => new ActOneValidator(services),
  },
};

/**
 * Create the full set of ActOne language services.
 *
 * @param context.shared - Optionally provide shared services (for reuse across languages)
 * @param context.fileSystemProvider - Custom file system provider (defaults to EmptyFileSystem)
 * @returns Object with `shared` and `ActOne` service containers
 */
export function createActOneServices(context?: {
  shared?: LangiumSharedServices;
  fileSystemProvider?: (services: LangiumSharedCoreServices) => FileSystemProvider;
  connection?: Connection;
}): {
  shared: LangiumSharedServices;
  ActOne: ActOneServices;
} {
  const shared =
    context?.shared ??
    inject(
      createDefaultSharedModule({
        fileSystemProvider: context?.fileSystemProvider ?? EmptyFileSystem.fileSystemProvider,
        connection: context?.connection,
      }),
      ActOneGeneratedSharedModule,
    );

  const ActOne = inject(
    createDefaultCoreModule({ shared }),
    createDefaultLSPModule({ shared }),
    ActOneGeneratedModule,
    ActOneModule,
  );

  shared.ServiceRegistry.register(ActOne);
  registerActOneValidationChecks(ActOne);

  return { shared, ActOne };
}
