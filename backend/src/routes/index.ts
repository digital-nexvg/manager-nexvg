import { Router } from 'express';
import authRoutes from './authRoutes';
import importRoutes from './importRoutes';
import clientRoutes from './clientRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/import', importRoutes);
router.use('/clients', clientRoutes);

export default router;
