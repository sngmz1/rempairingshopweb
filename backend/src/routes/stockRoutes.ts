import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { StockService } from '../services/stock/stockService';
import { createStockItemSchema, stockMovementSchema } from '../validation/schemas';
import { StockItem, Supplier } from '../types';
import { requireOwner } from '../middleware/security';
import { sanitizeInput } from '../utils/security';

const router = Router();

// GET all stock items / parts
router.get('/', (req: Request, res: Response) => {
  const { lowStock, category, search } = req.query;
  let parts = db.getParts();

  if (lowStock === 'true') {
    parts = parts.filter((p) => p.availableQuantity <= p.minimumQuantity);
  }

  if (category && typeof category === 'string' && category !== 'all') {
    parts = parts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    parts = parts.filter(
      (p) =>
        p.itemName.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.itemId.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, data: parts });
});

// POST new stock item (Protected: Owner only)
router.post('/', requireOwner, (req: Request, res: Response) => {
  try {
    const parsed = createStockItemSchema.parse(req.body);
    const existingParts = db.getParts();
    const itemId = `PART-${1000 + existingParts.length + 1}`;

    const newPart: StockItem = {
      itemId,
      itemName: parsed.itemName.trim(),
      category: parsed.category.trim(),
      brand: parsed.brand.trim(),
      model: parsed.model.trim(),
      availableQuantity: parsed.availableQuantity,
      minimumQuantity: parsed.minimumQuantity,
      purchaseCost: parsed.purchaseCost,
      sellingPrice: parsed.sellingPrice,
      supplier: parsed.supplier?.trim(),
      consumptionType: parsed.consumptionType,
      updatedAt: new Date().toISOString(),
    };

    db.savePart(newPart);

    // Initial stock in movement if quantity > 0
    if (parsed.availableQuantity > 0) {
      db.addMovement({
        movementId: `MOV-${Date.now()}`,
        itemId: newPart.itemId,
        itemName: newPart.itemName,
        type: 'IN',
        quantity: parsed.availableQuantity,
        reason: 'Initial stock entry',
        beforeQuantity: 0,
        afterQuantity: parsed.availableQuantity,
        date: new Date().toISOString(),
        user: (req.body.userName as string) || 'Manager',
      });
    }

    res.status(201).json({ success: true, data: newPart });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.errors ? err.errors[0].message : err.message });
  }
});

// PUT update stock item (Protected: Owner only)
router.put('/:itemId', requireOwner, (req: Request, res: Response) => {
  try {
    const existing = db.getPartById(req.params.itemId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    const updated: StockItem = {
      ...existing,
      itemName: req.body.itemName !== undefined ? req.body.itemName.trim() : existing.itemName,
      category: req.body.category !== undefined ? req.body.category.trim() : existing.category,
      brand: req.body.brand !== undefined ? req.body.brand.trim() : existing.brand,
      model: req.body.model !== undefined ? req.body.model.trim() : existing.model,
      minimumQuantity: req.body.minimumQuantity !== undefined ? Number(req.body.minimumQuantity) : existing.minimumQuantity,
      purchaseCost: req.body.purchaseCost !== undefined ? Number(req.body.purchaseCost) : existing.purchaseCost,
      sellingPrice: req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : existing.sellingPrice,
      supplier: req.body.supplier !== undefined ? req.body.supplier.trim() : existing.supplier,
      consumptionType: req.body.consumptionType || existing.consumptionType,
      updatedAt: new Date().toISOString(),
    };

    db.savePart(updated);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST Stock In
router.post('/stock-in', (req: Request, res: Response) => {
  try {
    const parsed = stockMovementSchema.parse(req.body);
    const result = StockService.stockIn({
      itemId: parsed.itemId,
      quantity: parsed.quantity,
      reason: parsed.reason,
      userName: parsed.userName,
    });
    res.json({
      success: true,
      message: `Stock added: +${parsed.quantity}. New available quantity: ${result.part.availableQuantity}`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST Stock Out
router.post('/stock-out', (req: Request, res: Response) => {
  try {
    const parsed = stockMovementSchema.parse(req.body);
    const result = StockService.stockOut({
      itemId: parsed.itemId,
      quantity: parsed.quantity,
      reason: parsed.reason,
      orderId: parsed.orderId,
      userName: parsed.userName,
    });
    res.json({
      success: true,
      message: `Stock reduced: -${parsed.quantity}. Remaining: ${result.part.availableQuantity}`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET stock movements history
router.get('/movements', (req: Request, res: Response) => {
  const { itemId, orderId } = req.query;
  let movements = db.getMovements();

  if (itemId && typeof itemId === 'string') {
    movements = movements.filter((m) => m.itemId === itemId);
  }

  if (orderId && typeof orderId === 'string') {
    movements = movements.filter((m) => m.orderId === orderId);
  }

  res.json({ success: true, data: movements });
});

// GET suppliers
router.get('/suppliers', (req: Request, res: Response) => {
  const suppliers = db.getSuppliers();
  res.json({ success: true, data: suppliers });
});

// POST new supplier (Protected: Owner only)
router.post('/suppliers', requireOwner, (req: Request, res: Response) => {
  try {
    const { name, mobile, notes } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Supplier name and mobile are required' });
    }

    const supplier: Supplier = {
      supplierId: `SUP-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      mobile: mobile.trim(),
      notes: notes?.trim(),
      updatedAt: new Date().toISOString(),
    };

    db.saveSupplier(supplier);
    res.status(201).json({ success: true, data: supplier });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
