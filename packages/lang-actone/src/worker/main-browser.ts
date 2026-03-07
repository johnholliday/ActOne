import { createWorkerLanguageServer } from '@docugenix/sanyam-langium/worker';
import { createActOneServices } from '../services/actone-module.js';
import { registerActOneHandlers } from './worker-handlers.js';

createWorkerLanguageServer({
  createServices: ({ connection }) => {
    const { shared, ActOne } = createActOneServices({ connection });
    return { shared, language: ActOne };
  },
  registerCustomHandlers: registerActOneHandlers,
});
