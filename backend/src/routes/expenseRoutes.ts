import { Router } from 'express';
import { expenseController } from '../controllers/expenseController';

const router = Router();

router.get('/', expenseController.list);
router.post('/', expenseController.create);
router.delete('/:id', expenseController.remove);

export default router;