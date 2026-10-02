import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fallbackConfig,
  institutionDefaults,
  maximumImportBytes,
  publicConfigSchema,
  resources,
  validateDatabase,
  previewDatabase,
  DataError,
} from '@ataraxia/shared';
export async function createServer() {
  const server = Hapi.server({
    port: Number(process.env.API_PORT ?? 3001),
    host: '127.0.0.1',
    routes: {
      cors: {
        origin: [process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'],
      },
      payload: { maxBytes: maximumImportBytes },
      security: true,
    },
  });
  const config = publicConfigSchema.parse({
    institutionName:
      process.env.INSTITUTION_NAME || fallbackConfig.institutionName,
    fallback: !process.env.EMERGENCY_PHONE,
    emergencyResources: [
      {
        id: 'emergency',
        label: 'Emergencias de tu localidad',
        phone: process.env.EMERGENCY_PHONE ?? '',
        url: '',
      },
      {
        id: 'institution',
        label: `Apoyo de ${process.env.INSTITUTION_NAME || fallbackConfig.institutionName}`,
        phone: process.env.SUPPORT_PHONE ?? institutionDefaults.supportPhone,
        url: process.env.SUPPORT_URL ?? '',
      },
    ],
  });
  server.route([
    {
      method: 'GET',
      path: '/api/health',
      handler: () => ({ status: 'ok', storage: 'browser-localStorage' }),
    },
    { method: 'GET', path: '/api/config', handler: () => config },
    { method: 'GET', path: '/api/resources', handler: () => resources },
    {
      method: 'GET',
      path: '/api/resources/{id}',
      handler: (request, h) =>
        resources.find((resource) => resource.id === request.params.id) ??
        h.response({ message: 'Recurso no encontrado.' }).code(404),
    },
    {
      method: 'GET',
      path: '/api/emergency-resources',
      handler: () => config.emergencyResources,
    },
    {
      method: 'POST',
      path: '/api/import/validate',
      handler: (request, h) => {
        try {
          return {
            valid: true,
            counts: previewDatabase(validateDatabase(request.payload)),
          };
        } catch (error) {
          return h
            .response({
              message:
                error instanceof DataError
                  ? error.message
                  : 'Los datos no son válidos.',
            })
            .code(400);
        }
      },
    },
  ]);
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    if (response instanceof Error && 'isBoom' in response) {
      return h
        .response({
          message:
            response.output.statusCode >= 500
              ? 'El servicio no está disponible. Inténtalo de nuevo.'
              : 'No se pudo completar la solicitud.',
        })
        .code(response.output.statusCode);
    }
    return h.continue;
  });
  server.events.on('response', (request) => {
    const response = request.response;
    const status = response instanceof Error ? 500 : response.statusCode;
    console.info(
      `${request.method.toUpperCase()} ${request.route.path} ${status}`,
    );
  });
  await server.register(Inert);
  const webRoot = fileURLToPath(new URL('../../web/dist/', import.meta.url));
  if (existsSync(path.join(webRoot, 'index.html'))) {
    server.route({
      method: 'GET',
      path: '/{path*}',
      handler: (request, h) => {
        if (request.path.startsWith('/api/'))
          return h.response({ message: 'Ruta no encontrada.' }).code(404);
        const requested = path.resolve(
          webRoot,
          typeof request.params.path === 'string'
            ? request.params.path
            : 'index.html',
        );
        if (
          requested.startsWith(path.resolve(webRoot) + path.sep) &&
          existsSync(requested)
        )
          return h.file(requested, { confine: webRoot });
        return h.file(path.join(webRoot, 'index.html'), { confine: webRoot });
      },
    });
  }
  return server;
}
