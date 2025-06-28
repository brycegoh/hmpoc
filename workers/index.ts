import dotenv from 'dotenv';
dotenv.config();

import { run, WorkerPreset } from 'graphile-worker';

const preset: GraphileConfig.Preset = {
  extends: [WorkerPreset],
  worker: {
    connectionString: process.env.DATABASE_URL,
    concurrentJobs: 10,
    fileExtensions: [".js", ".mjs", ".ts", ".mts"],
    taskDirectory: "./tasks",
    preparedStatements: false,
  },
};

console.log('🔧 Workers service starting...');

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

async function startWorker() {
  try {
    console.log('✅ Environment variables validated');
    console.log('🚀 Starting graphile-worker...');

    // Run the worker with configuration
    const runner = await run({preset});

    console.log('🎯 Worker is running and ready to process jobs!');

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`📴 ${signal} received, shutting down gracefully...`);
      await runner.stop();
      console.log('✅ Worker stopped successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

startWorker(); 