import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { initializeFirebase } from './src/utils/firebase';

// Import routes
import checklistRoutes from './src/routes/checklist.routes';
import notificationRoutes from './src/routes/notification.routes';
import planRoutes from './src/routes/plan.routes';
import scanRoutes from './src/routes/scan.routes';
import userRoutes from './src/routes/user.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Initialize Firebase Admin SDK (once)
let firebaseInitialized = false;
if (!firebaseInitialized) {
  try {
    initializeFirebase();
    firebaseInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

// MongoDB connection with pooling for serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI!;
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB error:', error);
    isConnected = false;
    throw error;
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({ error: 'Database connection failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Symmetry IQ API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      scans: '/api/scans',
      plans: '/api/plans',
      checklist: '/api/checklist',
    },
  });
});

// API Routes
app.use('/api/scans', scanRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user', userRoutes);

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Export for Vercel
export default app;
