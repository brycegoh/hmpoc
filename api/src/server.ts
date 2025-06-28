import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';

import { CONFIG } from './constants';
import { errorHandler } from './middleware/errorHandler';
import matchingRoutes from './routes/matching';
import usersRoutes from './routes/users';
import skillsRoutes from './routes/skills';
import queueService from './clients/queueService';

const app = express();
const PORT = CONFIG.PORT;

// Middleware
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
app.use(cors({
  origin: CONFIG.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.get('/', (req, res) => {
  res.json({
    "hello": "world"
  });
});

// API Routes
app.use('/api/matches', matchingRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/skills', skillsRoutes);

// Error handling middleware
app.use(errorHandler);

const server = createServer(app);

async function startServer() {
  try {
    // Initialize worker service
    await queueService.initialize();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}


// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await queueService.release();
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await queueService.release();
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();



export default app; 