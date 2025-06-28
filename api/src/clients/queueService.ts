import { makeWorkerUtils, WorkerUtils } from "graphile-worker";

class QueueService {
  private static instance: QueueService;
  private workerUtils: WorkerUtils | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.workerUtils) {
      return;
    }

    try {
      // Use DATABASE_URL from environment, same as graphile.config.ts
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required for worker initialization');
      }

      this.workerUtils = await makeWorkerUtils({
        connectionString,
        schema: "graphile_worker", // Match the schema from graphile.config.ts
      });

      // Run migrations to ensure worker tables exist
      await this.workerUtils.migrate();

      this.isInitialized = true;
      console.log('✅ Worker service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize worker service:', error);
      throw error;
    }
  }

  public async addJob(taskIdentifier: string, payload?: any, options?: any): Promise<void> {
    if (!this.workerUtils) {
      throw new Error('Worker service not initialized. Call initialize() first.');
    }

    try {
      await this.workerUtils.addJob(taskIdentifier, payload, options);
      console.log(`📝 Job added: ${taskIdentifier}`);
    } catch (error) {
      console.error(`❌ Failed to add job ${taskIdentifier}:`, error);
      throw error;
    }
  }

  public async getWorkerUtils(): Promise<WorkerUtils> {
    if (!this.workerUtils) {
      throw new Error('Worker service not initialized. Call initialize() first.');
    }
    return this.workerUtils;
  }

  public async release(): Promise<void> {
    if (this.workerUtils) {
      await this.workerUtils.release();
      this.workerUtils = null;
      this.isInitialized = false;
      console.log('🔒 Worker service released');
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.workerUtils !== null;
  }
}

// Export singleton instance
const queueService = QueueService.getInstance();
export default queueService; 