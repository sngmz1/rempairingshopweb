import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET global search
router.get('/', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  if (!query) {
    return res.json({ success: true, data: { orders: [], customers: [], parts: [] } });
  }

  const allOrders = db.getOrders();
  const allCustomers = db.getCustomers();
  const allParts = db.getParts();

  const matchingOrders = allOrders.filter(
    (o) =>
      o.orderId.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.customerMobile.includes(query) ||
      o.brand.toLowerCase().includes(query) ||
      o.model.toLowerCase().includes(query) ||
      (o.imeiOrSerial && o.imeiOrSerial.toLowerCase().includes(query))
  );

  const matchingCustomers = allCustomers.filter(
    (c) =>
      c.customerId.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query) ||
      c.mobile.includes(query)
  );

  const matchingParts = allParts.filter(
    (p) =>
      p.itemId.toLowerCase().includes(query) ||
      p.itemName.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.model.toLowerCase().includes(query)
  );

  res.json({
    success: true,
    data: {
      orders: matchingOrders.slice(0, 15),
      customers: matchingCustomers.slice(0, 10),
      parts: matchingParts.slice(0, 10),
    },
  });
});

export default router;
