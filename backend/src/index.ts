import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

import repairRoutes from './routes/repairRoutes';
import customerRoutes from './routes/customerRoutes';
import stockRoutes from './routes/stockRoutes';
import settingsRoutes from './routes/settingsRoutes';
import searchRoutes from './routes/searchRoutes';
import syncRoutes from './routes/syncRoutes';
import authRoutes from './routes/authRoutes';
import onlineBillRoutes from './routes/onlineBillRoutes';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders, generalApiLimiter, authenticateToken } from './middleware/security';

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security Headers
app.use(securityHeaders);

// 2. Strict CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server or same-origin) or matching allowedOrigins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Access denied for this origin.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-owner-pin'],
  })
);

// 3. Request Body Parsing with Strict Limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Global API Rate Limiting & Token Authentication
app.use('/api', generalApiLimiter);
app.use('/api', authenticateToken);

// 5. Serve generated bills locally (fallback storage)
const billsPath = path.resolve(__dirname, '../../bills');
app.use('/bills', express.static(billsPath, {
  dotfiles: 'ignore',
  etag: true,
  maxAge: '1d',
}));

// 6. Application API Routes
app.use('/api/repairs', repairRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/online-bills', onlineBillRoutes);

// Health check (Safe status probe)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    shop: 'Jai Mataji Mobile Repairing',
    timestamp: new Date().toISOString(),
  });
});

// 7. Serve frontend static build in production (Unified 1-Service Deployment)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/bills')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 8. Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Jai Mataji Mobile Repairing SaaS Backend`);
  console.log(`🔒 Security: CORS locked, Rate Limiting & Auth active`);
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
