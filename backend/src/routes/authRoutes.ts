import { Router } from 'express';
import { authController, authMiddleware } from '../controllers/authController';

const router = Router();

router.post('/login', authController.login);
router.post('/admin', authController.createAdmin);
router.get('/validate', authMiddleware, authController.validateToken);

export default router;
