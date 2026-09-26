import { Router } from 'express';
import { 
  listDeliveries, 
  getDelivery, 
  createDelivery, 
  updateDelivery, 
  addLine, 
  validateDelivery, 
  completeDelivery 
} from '../controllers/delivery';

const router = Router();

router.get('/', listDeliveries);
router.post('/', createDelivery);
router.get('/:id', getDelivery);
router.put('/:id', updateDelivery);
router.post('/:id/lines', addLine);
router.post('/:id/validate', validateDelivery);
router.post('/:id/complete', completeDelivery);

export default router;
