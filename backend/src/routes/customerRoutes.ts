import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { createErrorResponse } from '../utils/errors';

const router = Router();

// GET all customers with optional search
router.get('/', (req: Request, res: Response) => {
  const { search } = req.query;
  let customers = db.getCustomers();

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    customers = customers.filter(
      (c) =>
        c.customerId.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.alternateNumber && c.alternateNumber.includes(q))
    );
  }

  // Sort by latest created/updated
  customers.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json({ success: true, data: customers });
});

// GET single customer with repair history
router.get('/:customerId', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.customerId);
  if (!customer) {
    return res.status(404).json(createErrorResponse('CUST', '001', 'Customer not found: ' + req.params.customerId));
  }

  const allOrders = db.getOrders();
  const customerOrders = allOrders.filter(
    (o) => o.customerId === customer.customerId || o.customerMobile === customer.mobile
  );

  res.json({
    success: true,
    data: {
      customer,
      repairHistory: customerOrders,
    },
  });
});

export default router;
