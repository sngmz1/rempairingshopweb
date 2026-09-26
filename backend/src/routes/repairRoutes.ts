import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { RepairService } from '../services/repair/repairService';
import { createRepairSchema, updateRepairStatusSchema, addPaymentSchema, updateBillingSchema, addOrderPartSchema } from '../validation/schemas';
import { sanitizeInput } from '../utils/security';
import { createErrorResponse } from '../utils/errors';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET all repair orders
router.get('/', (req: Request, res: Response) => {
  const { status, search } = req.query;
  let orders = db.getOrders();

  if (status && typeof status === 'string' && status !== 'all') {
    orders = orders.filter((o) => o.status.toLowerCase() === status.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    orders = orders.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerMobile.includes(q) ||
        o.brand.toLowerCase().includes(q) ||
        o.model.toLowerCase().includes(q)
    );
  }

  // Sort descending by receivedAt
  orders.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  res.json({ success: true, data: orders });
});

// GET dashboard statistics
router.get('/dashboard-stats', (req: Request, res: Response) => {
  const orders = db.getOrders();
  const parts = db.getParts();

  const todayStr = new Date().toISOString().split('T')[0];

  const todaysRepairs = orders.filter((o) => o.receivedAt.startsWith(todayStr)).length;
  const repairing = orders.filter((o) => o.status === 'Repairing').length;
  const readyForPickup = orders.filter((o) => o.status === 'Ready').length;
  const pendingPickup = orders.filter((o) => ['Approved', 'Ready', 'Waiting for Part'].includes(o.status)).length;
  const pendingPayment = orders.filter((o) => o.balance > 0 && o.status !== 'Cancelled').length;
  const lowStockCount = parts.filter((p) => p.availableQuantity <= p.minimumQuantity).length;

  res.json({
    success: true,
    data: {
      todaysRepairs,
      repairing,
      readyForPickup,
      pendingPickup,
      pendingPayment,
      lowStockCount,
    },
  });
});

// GET single order
router.get('/:orderId', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json(createErrorResponse('REPAIR', '006', 'Repair order not found: ' + req.params.orderId));
  }
  res.json({ success: true, data: order });
});

// POST new repair
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createRepairSchema.parse(req.body);
    const sanitized = {
      ...parsed,
      customerName: sanitizeInput(parsed.customerName),
      customerMobile: sanitizeInput(parsed.customerMobile),
      brand: sanitizeInput(parsed.brand),
      model: sanitizeInput(parsed.model),
      complaint: sanitizeInput(parsed.complaint),
      notes: parsed.notes ? sanitizeInput(parsed.notes) : undefined,
      expectedDelivery: parsed.expectedDelivery ? sanitizeInput(parsed.expectedDelivery) : undefined,
    };
    const order = await RepairService.createRepairOrder(sanitized);
    res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json(createErrorResponse('REPAIR', '001', err.errors ? err.errors[0].message : err.message));
  }
});

// PATCH status
router.patch('/:orderId/status', async (req: Request, res: Response) => {
  try {
    const parsed = updateRepairStatusSchema.parse(req.body);
    const order = await RepairService.updateStatus(
      req.params.orderId,
      parsed.status,
      parsed.userName,
      parsed.notes
    );
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json(createErrorResponse('REPAIR', '007', err.message));
  }
});

// POST add part to order
router.post('/:orderId/parts', (req: Request, res: Response) => {
  try {
    const parsed = addOrderPartSchema.parse(req.body);
    const order = RepairService.addPartToOrder({
      orderId: req.params.orderId,
      partId: parsed.partId,
      quantity: parsed.quantity,
      unitPrice: parsed.unitPrice,
      userName: parsed.userName,
    });
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json(createErrorResponse('REPAIR', '008', err.message));
  }
});

// POST confirm part used / consumed (Critical Rule 16)
router.post('/:orderId/parts/:partId/consume', (req: Request, res: Response) => {
  try {
    const userName = req.body.userName || 'Employee';
    const order = RepairService.confirmPartUsed({
      orderId: req.params.orderId,
      partId: req.params.partId,
      userName,
    });
    res.json({ success: true, data: order, message: 'Part marked as consumed and deducted from stock' });
  } catch (err: any) {
    res.status(400).json(createErrorResponse('REPAIR', '009', err.message));
  }
});

// POST return consumed part back to inventory (Critical Rule 16)
router.post('/:orderId/parts/:partId/return', (req: Request, res: Response) => {
  try {
    const userName = req.body.userName || 'Employee';
    const reason = req.body.reason;
    const order = RepairService.returnConsumedPart({
      orderId: req.params.orderId,
      partId: req.params.partId,
      userName,
      reason,
    });
    res.json({ success: true, data: order, message: 'Part returned back to inventory' });
  } catch (err: any) {
    res.status(400).json(createErrorResponse('REPAIR', '010', err.message));
  }
});

// POST add payment
router.post('/:orderId/payments', async (req: Request, res: Response) => {
  try {
    const parsed = addPaymentSchema.parse(req.body);
    const order = await RepairService.addPayment({
      orderId: req.params.orderId,
      amount: parsed.amount,
      paymentMode: parsed.paymentMode,
      userName: parsed.userName,
      notes: parsed.notes,
    });
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json(createErrorResponse('REPAIR', '011', err.message));
  }
});

// PATCH billing
router.patch('/:orderId/billing', async (req: Request, res: Response) => {
  try {
    const parsed = updateBillingSchema.parse(req.body);
    const order = await RepairService.updateBilling({
      orderId: req.params.orderId,
      finalAmount: parsed.finalAmount,
      discount: parsed.discount,
      userName: parsed.userName,
    });
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json(createErrorResponse('REPAIR', '012', err.message));
  }
});

// POST trigger PDF generation / Drive sync
router.post('/:orderId/generate-pdf', async (req: Request, res: Response) => {
  try {
    const order = db.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('REPAIR', '006', 'Order not found: ' + req.params.orderId));
    }
    const result = await RepairService.generateAndSyncBillPdf(order);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json(createErrorResponse('REPAIR', '013', 'Failed to generate PDF: ' + err.message));
  }
});

// GET direct PDF download / view for order
router.get('/:orderId/pdf', async (req: Request, res: Response) => {
  try {
    const order = db.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('REPAIR', '006', 'Order not found: ' + req.params.orderId));
    }
    const result = await RepairService.generateAndSyncBillPdf(order);
    if (fs.existsSync(result.filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${order.orderId}.pdf"`);
      return fs.createReadStream(result.filePath).pipe(res);
    }
    res.status(404).send('PDF not found');
  } catch (err: any) {
    res.status(500).send(`Error generating PDF: ${err.message}`);
  }
});

// GET view stored PDF by filename (Strictly validated)
router.get('/pdf-view/:fileName', (req: Request, res: Response) => {
  const rawFileName = req.params.fileName;
  if (!rawFileName || !/^[a-zA-Z0-9_\-\.]+\.pdf$/.test(rawFileName)) {
    return res.status(400).send('Invalid file name parameter');
  }
  const fileName = path.basename(rawFileName);
  const billsBaseDir = path.resolve(__dirname, '../../../bills');

  // Search recursively for file in year/month folders
  const findFile = (dir: string): string | null => {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findFile(full);
        if (found) return found;
      } else if (entry.name === fileName) {
        return full;
      }
    }
    return null;
  };

  const matched = findFile(billsBaseDir);
  if (matched && fs.existsSync(matched)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    return fs.createReadStream(matched).pipe(res);
  }

  res.status(404).send('PDF bill not found');
});

export default router;
