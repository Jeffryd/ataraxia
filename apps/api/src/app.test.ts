// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Hapi from '@hapi/hapi';
import { emptyDatabase } from '@ataraxia/shared';
import { createServer } from './app';
describe('stateless API', () => {
  let server: Hapi.Server;
  beforeEach(async () => {
    server = await createServer();
  });
  afterEach(async () => {
    await server.stop();
  });
  it.each([
    '/api/health',
    '/api/config',
    '/api/resources',
    '/api/resources/sleep',
    '/api/emergency-resources',
  ])('serves %s', async (url) => {
    const response = await server.inject(url);
    expect(response.statusCode).toBe(200);
  });
  it('rejects unknown resources', async () => {
    expect((await server.inject('/api/resources/missing')).statusCode).toBe(
      404,
    );
  });
  it('validates an import without persistence', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/import/validate',
      payload: emptyDatabase(),
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toMatchObject({
      valid: true,
      counts: { assessments: 0 },
    });
    expect(
      (
        await server.inject({
          method: 'POST',
          url: '/api/import/validate',
          payload: { schemaVersion: 2 },
        })
      ).statusCode,
    ).toBe(400);
  });
  it('restricts CORS to the configured origin', async () => {
    const allowed = await server.inject({
      url: '/api/config',
      headers: { origin: 'http://localhost:5173' },
    });
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    const denied = await server.inject({
      url: '/api/config',
      headers: { origin: 'https://untrusted.example' },
    });
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
