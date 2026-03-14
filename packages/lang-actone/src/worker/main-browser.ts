import { createWorkerLanguageServer } from '@docugenix/sanyam-langium/worker';
import { createActOneServices } from '../services/actone-module.js';
import { registerActOneHandlers } from './worker-handlers.js';
import { InMemoryFileSystemProvider } from './in-memory-fs-provider.js';

const fsProvider = new InMemoryFileSystemProvider();

createWorkerLanguageServer({
  createServices: ({ connection }) => {
    const { shared, ActOne } = createActOneServices({
      connection,
      fileSystemProvider: () => fsProvider,
    });
    return { shared, language: ActOne };
  },
  registerCustomHandlers: (connection, shared, language) => {
    registerActOneHandlers(connection, shared, language, fsProvider);
  },
});
