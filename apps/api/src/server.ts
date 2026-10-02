import 'dotenv/config';
import { createServer } from './app';
const server = await createServer();
await server.start();
console.info(`ATARAXIA API listening at ${server.info.uri}`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await server.stop({ timeout: 5000 });
    process.exitCode = 0;
  });
}
