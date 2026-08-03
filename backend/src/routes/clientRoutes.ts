import { Router } from 'express';
import { clientController } from '../controllers/clientController';

const router = Router();

router.get('/', clientController.list);
router.post('/', clientController.create);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.remove);

export default router;
