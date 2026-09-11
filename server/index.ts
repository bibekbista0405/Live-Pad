import { config } from './config';
import { createApp } from './app';

async function start() {
  const app = await createApp();

  app.listen(config.port, config.host, () => {
    console.log(`Server running on http://${config.host}:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
