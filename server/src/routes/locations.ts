import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth';
import {
	createLocationHandler,
	getLocationHandler,
	listLocationsHandler,
	updateLocationHandler,
	validateLocationCreate,
	validateLocationId,
	validateLocationList,
	validateLocationUpdate,
} from '../controllers/locationController';

const router = Router();

router.get('/', requireAuth, ...validateLocationList, listLocationsHandler);
router.post('/', requireAuth, requireRole('inventory_manager'), ...validateLocationCreate, createLocationHandler);
router.get('/:id', requireAuth, ...validateLocationId, getLocationHandler);
router.patch('/:id', requireAuth, requireRole('inventory_manager'), ...validateLocationUpdate, updateLocationHandler);

export default router;
