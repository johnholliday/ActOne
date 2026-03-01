/**
 * Test helpers for SvelteKit API endpoint testing.
 *
 * Creates fake RequestEvent objects for calling endpoint handlers directly.
 */

import type { RequestEvent } from '@sveltejs/kit';

interface FakeEventOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
  locals?: Record<string, unknown>;
  headers?: Record<string, string>;
}

const defaultUser = {
  id: 'user-001',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
};

const defaultSession = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: defaultUser,
};

/**
 * Creates a fake SvelteKit RequestEvent for testing endpoint handlers.
 */
export function createFakeEvent(options: FakeEventOptions = {}): RequestEvent {
  const {
    method = 'GET',
    body,
    params = {},
    searchParams = {},
    locals,
    headers = {},
  } = options;

  const url = new URL('http://localhost:54530/api/test');
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  const requestInit: RequestInit = { method, headers };
  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
    (requestInit.headers as Record<string, string>)['content-type'] =
      'application/json';
  }

  const request = new Request(url, requestInit);

  return {
    request,
    url,
    params,
    locals: {
      session: defaultSession,
      user: defaultUser,
      ...locals,
    },
    cookies: {
      get: () => undefined,
      getAll: () => [],
      set: () => {},
      delete: () => {},
      serialize: () => '',
    },
    getClientAddress: () => '127.0.0.1',
    platform: undefined,
    route: { id: '/api/test' },
    isDataRequest: false,
    isSubRequest: false,
    fetch: globalThis.fetch,
    setHeaders: () => {},
  } as unknown as RequestEvent;
}

/**
 * Creates a fake event for an authenticated user.
 */
export function createAuthenticatedEvent(
  options: Omit<FakeEventOptions, 'locals'> = {},
): RequestEvent {
  return createFakeEvent({
    ...options,
    locals: { session: defaultSession, user: defaultUser },
  });
}

/**
 * Creates a fake event for an unauthenticated user.
 */
export function createUnauthenticatedEvent(
  options: Omit<FakeEventOptions, 'locals'> = {},
): RequestEvent {
  return createFakeEvent({
    ...options,
    locals: { session: null, user: null },
  });
}

/**
 * Extracts JSON body from a SvelteKit Response.
 */
export async function getJsonBody<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Tests that a handler throws an HttpError with the expected status.
 * SvelteKit's `error()` function throws.
 */
export async function expectHttpError(
  fn: () => Promise<unknown>,
  expectedStatus: number,
): Promise<void> {
  try {
    await fn();
    throw new Error(`Expected HttpError ${expectedStatus} but handler succeeded`);
  } catch (err: unknown) {
    const httpError = err as { status?: number; body?: { message?: string } };
    if (httpError.status !== expectedStatus) {
      throw new Error(
        `Expected HttpError ${expectedStatus} but got ${httpError.status ?? 'unknown error'}: ${JSON.stringify(err)}`,
      );
    }
  }
}

export { defaultUser, defaultSession };
