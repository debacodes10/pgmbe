import { Router } from 'express';
import projectRoutes from './project.routes.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

router.use('/api/projects', authenticate, projectRoutes);

export default router;
