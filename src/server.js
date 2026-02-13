import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { startJobs } from './jobs/index.js';

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      env: env.NODE_ENV,
      port: env.PORT
    },
    'PGM backend server started'
  );

  startJobs();
});

function shutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal');
  server.close((error) => {
    if (error) {
      logger.error({ error }, 'Error during server shutdown');
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
