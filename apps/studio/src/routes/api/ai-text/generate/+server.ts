/**
 * T090: POST /api/ai-text/generate
 *
 * SSE streaming endpoint for AI prose generation.
 * Assembles context, calls backend, streams chunks, records cost.
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { draftVersions } from '@actone/shared/db';
import { backendRegistry } from '$lib/ai/backends/backend-registry.js';
import { assembleContext } from '$lib/ai/context-assembler.js';
import { splitIntoParagraphs } from '$lib/ai/draft-manager.js';
import { astStore } from '$lib/stores/ast.svelte.js';

const generateSchema = z.object({
  projectId: z.string().uuid(),
  sceneName: z.string().min(1),
  backendId: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  pacing: z.string().default('moderate'),
});

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  const { projectId, sceneName, backendId, temperature, pacing } = parsed.data;

  const backend = backendRegistry.get(backendId);
  if (!backend) {
    error(400, `Backend "${backendId}" not found`);
  }

  const availability = await backend.checkAvailability();
  if (!availability.available) {
    error(503, `Backend unavailable: ${availability.error ?? 'unknown reason'}`);
  }

  // Assemble context from current AST
  const ast = astStore.activeAst;
  if (!ast) {
    error(400, 'No active story AST available');
  }

  const context = assembleContext(ast, sceneName, pacing, temperature);

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const generator = backend.generate(context);
        let result = await generator.next();

        while (!result.done) {
          const chunk = result.value;
          send('chunk', {
            type: 'chunk',
            text: chunk.text,
            tokenCount: chunk.tokenCount ?? 0,
          });
          result = await generator.next();
        }

        const completion = result.value;

        // Store draft paragraphs
        const paragraphs = splitIntoParagraphs(completion.fullText);
        for (let i = 0; i < paragraphs.length; i++) {
          const para = paragraphs[i]!;
          await db.insert(draftVersions).values({
            projectId,
            sceneName,
            paragraphIndex: i,
            content: para,
            status: 'pending',
            backend: backendId,
            model: backend.name,
            temperature,
            tokenCount: Math.round(completion.totalTokens / paragraphs.length),
            costUsd: (completion.actualCostUsd ?? 0) / paragraphs.length,
          });
        }

        send('done', {
          type: 'done',
          fullText: completion.fullText,
          totalTokens: completion.totalTokens,
          durationMs: completion.durationMs,
        });

        if (completion.actualCostUsd !== undefined) {
          send('cost', {
            type: 'cost',
            actualCostUsd: completion.actualCostUsd,
          });
        }
      } catch (e) {
        send('error', {
          type: 'error',
          error: e instanceof Error ? e.message : 'Generation failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
};
