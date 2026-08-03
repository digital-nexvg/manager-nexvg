import { Router } from 'express';
import { importController } from '../controllers/importController';

const router = Router();

router.post('/clients', importController.importBackup);

export default router;
