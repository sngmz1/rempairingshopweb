import { z } from 'zod';

export const repairStatusEnum = z.enum([
  'Received',
  'Checking',
  'Waiting for Approval',
  'Approved',
  'Repairing',
  'Waiting for Part',
  'Ready',
  'Delivered',
  'Cancelled',
  'Unable to Repair',
]);

export const paymentModeEnum = z.enum([
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Other',
]);

export const stockConsumptionTypeEnum = z.enum([
  'Consume On Part Used',
  'Consume On Delivery',
]);

export const createRepairSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerMobile: z.string().min(10, 'Valid 10-digit mobile number required').max(15),
  deviceType: z.string().default('Mobile'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  complaint: z.string().min(1, 'Customer complaint is required'),
  estimatedAmount: z.number().min(0, 'Estimated amount cannot be negative').default(0),
  advance: z.number().min(0, 'Advance amount cannot be negative').default(0),
  paymentMode: paymentModeEnum.optional(),
  imeiOrSerial: z.string().optional(),
  deviceCondition: z.string().optional(),
  accessoriesReceived: z.string().optional(),
  expectedDelivery: z.string().optional(),
  technician: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  userName: z.string().default('Employee'),
});

export const updateRepairStatusSchema = z.object({
  status: repairStatusEnum,
  notes: z.string().optional(),
  userName: z.string().default('Employee'),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMode: paymentModeEnum,
  notes: z.string().optional(),
  userName: z.string().default('Employee'),
});

export const updateBillingSchema = z.object({
  finalAmount: z.number().min(0, 'Final amount cannot be negative'),
  discount: z.number().min(0, 'Discount cannot be negative').default(0),
  notes: z.string().optional(),
  userName: z.string().default('Employee'),
});

export const createStockItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  availableQuantity: z.number().min(0, 'Available quantity cannot be negative'),
  minimumQuantity: z.number().min(0, 'Minimum quantity cannot be negative').default(2),
  purchaseCost: z.number().min(0, 'Purchase cost cannot be negative').default(0),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative').default(0),
  supplier: z.string().optional(),
  consumptionType: stockConsumptionTypeEnum.default('Consume On Part Used'),
});

export const stockMovementSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason is required'),
  orderId: z.string().optional(),
  userName: z.string().default('Staff'),
});

export const addOrderPartSchema = z.object({
  partId: z.string().min(1, 'Part ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
  unitPrice: z.number().min(0).optional(),
  userName: z.string().default('Employee'),
});
