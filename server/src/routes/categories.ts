import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireAuth';
import {
  validateList, validateCreate, validateUpdate, validateId,
  listHandler, getOneHandler, createHandler, updateHandler, deleteHandler,
} from '../controllers/categoryController';

const router = Router();

// Both roles: read
router.get('/',    requireAuth, ...validateList,  listHandler);
router.get('/:id', requireAuth, ...validateId,   getOneHandler);

// inventory_manager only: write
router.post('/',    requireAuth, requireRole('inventory_manager'), ...validateCreate, createHandler);
router.patch('/:id', requireAuth, requireRole('inventory_manager'), ...validateUpdate, updateHandler);
router.delete('/:id', requireAuth, requireRole('inventory_manager'), ...validateId,   deleteHandler);

export default router;
