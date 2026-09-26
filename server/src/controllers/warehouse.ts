import { Request, Response, NextFunction } from 'express';
import { Warehouse } from '../models';

export const createWarehouse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, address } = req.body;
    
    // Check if code already exists
    const existing = await Warehouse.findOne({ where: { code } });
    if (existing) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Warehouse code already in use.' },
      });
    }
    
    const warehouse = await Warehouse.create({ name, code, address });
    return res.status(201).json(warehouse);
  } catch (err) {
    next(err);
  }
};

export const getWarehouses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouses = await Warehouse.findAll({
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json(warehouses);
  } catch (err) {
    next(err);
  }
};

export const getWarehouseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Warehouse not found.' },
      });
    }
    
    return res.status(200).json(warehouse);
  } catch (err) {
    next(err);
  }
};

export const updateWarehouse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, code, address, is_active } = req.body;
    
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Warehouse not found.' },
      });
    }
    
    // Check if new code conflicts with another warehouse
    if (code && code !== warehouse.code) {
      const existing = await Warehouse.findOne({ where: { code } });
      if (existing) {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Warehouse code already in use.' },
        });
      }
    }
    
    await warehouse.update({
      name: name !== undefined ? name : warehouse.name,
      code: code !== undefined ? code : warehouse.code,
      address: address !== undefined ? address : warehouse.address,
      is_active: is_active !== undefined ? is_active : warehouse.is_active,
    });
    
    return res.status(200).json(warehouse);
  } catch (err) {
    next(err);
  }
};
