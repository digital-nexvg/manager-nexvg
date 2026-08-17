import { Router } from 'express';
import { leadController } from '../controllers/leadController';

const router = Router();

router.get('/', leadController.list);
router.post('/', leadController.create);
router.post('/public', leadController.createPublic);
router.put('/:id', leadController.update);
router.delete('/:id', leadController.remove);
router.post('/:id/convert', leadController.convert);

export default router;
