import { Router } from 'express';
import authRoutes from './authRoutes';
import importRoutes from './importRoutes';
import clientRoutes from './clientRoutes';
import leadRoutes from './leadRoutes';
import expenseRoutes from './expenseRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/import', importRoutes);
router.use('/clients', clientRoutes);
router.use('/leads', leadRoutes);
router.use('/expenses', expenseRoutes);

export default router;
