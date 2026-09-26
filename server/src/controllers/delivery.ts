import { Request, Response } from 'express';
import { Delivery, DeliveryLine, Warehouse, Contact, User, Product } from '../models';

export const listDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, warehouse_id } = req.query;
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (warehouse_id) whereClause.warehouse_id = warehouse_id;

    const deliveries = await Delivery.findAll({
      where: whereClause,
      include: [
        { model: Warehouse, attributes: ['id', 'name', 'code'] },
        { model: Contact, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'full_name'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(deliveries);
  } catch (error) {
    console.error('List deliveries error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch deliveries' } });
  }
};

export const getDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findByPk(id, {
      include: [
        { model: Warehouse, attributes: ['id', 'name', 'code'] },
        { model: Contact, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'full_name'] },
        { 
          model: DeliveryLine, 
          as: 'lines',
          include: [{ model: Product, attributes: ['id', 'sku', 'name', 'unit_cost'] }]
        }
      ],
    });

    if (!delivery) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
      return;
    }

    res.json(delivery);
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch delivery' } });
  }
};

export const createDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouse_id, contact_id, delivery_address, scheduled_date, notes } = req.body;
    
    // In real app, user is req.user.id
    const responsible_user_id = (req as any).user?.id || 1; 
    
    // Generate simple reference
    const warehouse = await Warehouse.findByPk(warehouse_id);
    if (!warehouse) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid warehouse' } });
      return;
    }
    
    const count = await Delivery.count();
    const reference = `${warehouse.code}-DEL-${String(count + 1).padStart(5, '0')}`;

    const delivery = await Delivery.create({
      reference,
      warehouse_id,
      contact_id,
      delivery_address,
      responsible_user_id,
      status: 'draft',
      scheduled_date,
      notes
    });

    res.status(201).json(delivery);
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create delivery' } });
  }
};

export const updateDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contact_id, delivery_address, scheduled_date, notes } = req.body;
    
    const delivery = await Delivery.findByPk(id);
    if (!delivery) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
      return;
    }
    
    if (delivery.status !== 'draft' && delivery.status !== 'waiting') {
      res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Cannot update delivery in this state' } });
      return;
    }

    await delivery.update({ contact_id, delivery_address, scheduled_date, notes });
    res.json(delivery);
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update delivery' } });
  }
};

export const addLine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { product_id, qty_requested } = req.body;

    const delivery = await Delivery.findByPk(id);
    if (!delivery) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
      return;
    }

    if (delivery.status !== 'draft') {
      res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Can only add lines in draft state' } });
      return;
    }

    const line = await DeliveryLine.create({
      delivery_id: delivery.id,
      product_id,
      qty_requested,
      qty_delivered: 0,
      is_available: true
    });

    res.status(201).json(line);
  } catch (error) {
    console.error('Add line error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to add line' } });
  }
};

export const validateDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findByPk(id);
    
    if (!delivery) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
      return;
    }
    
    if (delivery.status !== 'draft' && delivery.status !== 'waiting') {
      res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Delivery cannot be validated from current state' } });
      return;
    }
    
    // Simplification for tracer bullet: assume available and set to ready
    await delivery.update({ status: 'ready' });
    res.json(delivery);
  } catch (error) {
    console.error('Validate delivery error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to validate delivery' } });
  }
};

export const completeDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findByPk(id);
    
    if (!delivery) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
      return;
    }
    
    if (delivery.status !== 'ready') {
      res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Delivery must be ready before completion' } });
      return;
    }
    
    // Simplification for tracer bullet: mark as done, update completed_at
    await delivery.update({ status: 'done', completed_at: new Date() });
    res.json(delivery);
  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to complete delivery' } });
  }
};
