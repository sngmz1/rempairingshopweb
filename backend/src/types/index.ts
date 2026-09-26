export type RepairStatus =
  | 'Received'
  | 'Checking'
  | 'Waiting for Approval'
  | 'Approved'
  | 'Repairing'
  | 'Waiting for Part'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled'
  | 'Unable to Repair';

export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid';

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';

export type StockConsumptionType = 'Consume On Part Used' | 'Consume On Delivery';

export type StockMovementType = 'IN' | 'OUT' | 'RETURN' | 'ADJUSTMENT';

export interface ShopSettings {
  shopName: string;
  contact1Name: string;
  contact1Number: string;
  contact2Name: string;
  contact2Number: string;
  address: string;
  serviceDescription: string;
  upiId: string;
  receiptInformation: string;
  googleSheetId?: string;
  googleDriveFolderId?: string;
  autoSyncGoogleSheets: boolean;
  autoUploadDrive: boolean;
  updatedAt: string;
}

export interface Customer {
  customerId: string;
  name: string;
  mobile: string;
  alternateNumber?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsedPart {
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  consumed: boolean; // True when actually used / consumed from stock
  consumedAt?: string;
  consumedBy?: string;
}

export interface StatusHistoryItem {
  id: string;
  orderId: string;
  oldStatus?: RepairStatus;
  newStatus: RepairStatus;
  changedAt: string;
  changedBy: string;
  notes?: string;
}

export interface PaymentRecord {
  paymentId: string;
  orderId: string;
  amount: number;
  paymentMode: PaymentMode;
  date: string;
  recordedBy: string;
  notes?: string;
  updatedAt: string;
}

export interface RepairOrder {
  orderId: string; // e.g. ORD-2026-00482
  customerId: string;
  customerName: string;
  customerMobile: string;
  deviceType: string; // Mobile, Laptop, Tablet, Smart Watch, Other
  brand: string;
  model: string;
  complaint: string;
  imeiOrSerial?: string;
  deviceCondition?: string;
  accessoriesReceived?: string;
  expectedDelivery?: string;
  technician?: string;
  notes?: string;
  photos?: string[];

  // Status & Timestamps
  status: RepairStatus;
  receivedAt: string;
  deliveredAt?: string;
  updatedAt: string;
  statusHistory: StatusHistoryItem[];

  // Financials
  estimatedAmount: number;
  finalAmount: number;
  discount: number;
  advance: number;
  balance: number;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  payments: PaymentRecord[];

  // Parts Used
  partsUsed: UsedPart[];

  // Google Drive Bill Integration
  billDriveFileId?: string;
  billDriveLink?: string;
  billGeneratedAt?: string;
}

export interface StockItem {
  itemId: string;
  itemName: string;
  category: string; // Display, Battery, Charging Port, Folder/Packaging, Camera, IC, Accessory, Other
  brand: string;
  model: string;
  availableQuantity: number;
  minimumQuantity: number;
  purchaseCost: number;
  sellingPrice: number;
  supplier?: string;
  consumptionType: StockConsumptionType;
  updatedAt: string;
}

export interface StockMovement {
  movementId: string;
  itemId: string;
  itemName: string;
  orderId?: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  beforeQuantity: number;
  afterQuantity: number;
  date: string;
  user: string;
}

export interface Supplier {
  supplierId: string;
  name: string;
  mobile: string;
  notes?: string;
  updatedAt: string;
}

export interface UserSession {
  role: 'employee' | 'owner';
  username: string;
}
