import { db } from '../../db/database';
import { Customer, RepairOrder, RepairStatus, PaymentMode, UsedPart } from '../../types';
import { StockService } from '../stock/stockService';
import { BillPdfGenerator } from '../pdf/billPdfGenerator';
import { GoogleDriveService } from '../googleDrive/driveService';
import { GoogleSheetsService } from '../googleSheets/sheetsService';
import { OnlineBillSheetService } from '../onlineBills/onlineBillSheetService';

export class RepairService {
  /**
   * Helper to recalculate balances and payment status accurately
   */
  public static recalculateBilling(order: RepairOrder): void {
    const totalPayments = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
    order.advance = totalPayments;

    const baseAmount = order.finalAmount > 0 ? order.finalAmount : order.estimatedAmount;
    const netAmount = Math.max(0, baseAmount - (order.discount || 0));
    order.balance = Math.max(0, netAmount - totalPayments);

    if (totalPayments >= netAmount && netAmount > 0) {
      order.paymentStatus = 'Paid';
    } else if (totalPayments > 0) {
      order.paymentStatus = 'Partially Paid';
    } else {
      order.paymentStatus = 'Unpaid';
    }
    order.updatedAt = new Date().toISOString();
  }

  /**
   * Create New Repair Order
   */
  public static async createRepairOrder(data: {
    customerName: string;
    customerMobile: string;
    deviceType?: string;
    brand: string;
    model: string;
    complaint: string;
    estimatedAmount?: number;
    advance?: number;
    paymentMode?: PaymentMode;
    imeiOrSerial?: string;
    deviceCondition?: string;
    accessoriesReceived?: string;
    expectedDelivery?: string;
    technician?: string;
    notes?: string;
    photos?: string[];
    userName?: string;
  }): Promise<RepairOrder> {
    const now = new Date().toISOString();
    const userName = data.userName || 'Employee';

    // 1. Ensure Customer exists or create one
    let customer = db.getCustomerByMobile(data.customerMobile);
    if (!customer) {
      customer = {
        customerId: `CUST-${Date.now().toString().slice(-6)}`,
        name: data.customerName.trim(),
        mobile: data.customerMobile.trim(),
        createdAt: now,
        updatedAt: now,
      };
      db.saveCustomer(customer);
    } else {
      // Update name if changed
      if (data.customerName && customer.name !== data.customerName) {
        customer.name = data.customerName;
        customer.updatedAt = now;
        db.saveCustomer(customer);
      }
    }

    // 2. Generate unique Order ID (e.g. ORD-2026-00482)
    const orderId = db.getNextOrderId();
    const est = data.estimatedAmount || 0;
    const adv = data.advance || 0;

    const initialPayments = adv > 0
      ? [
          {
            paymentId: `PAY-${Date.now()}`,
            orderId,
            amount: adv,
            paymentMode: data.paymentMode || 'Cash',
            date: now,
            recordedBy: userName,
            notes: 'Advance at repair receipt',
            updatedAt: now,
          },
        ]
      : [];

    const order: RepairOrder = {
      orderId,
      customerId: customer.customerId,
      customerName: customer.name,
      customerMobile: customer.mobile,
      deviceType: data.deviceType || 'Mobile Phone',
      brand: data.brand.trim(),
      model: data.model.trim(),
      complaint: data.complaint.trim(),
      imeiOrSerial: data.imeiOrSerial?.trim(),
      deviceCondition: data.deviceCondition?.trim(),
      accessoriesReceived: data.accessoriesReceived?.trim(),
      expectedDelivery: data.expectedDelivery?.trim(),
      technician: data.technician?.trim(),
      notes: data.notes?.trim(),
      photos: data.photos || [],
      status: 'Received',
      receivedAt: now,
      updatedAt: now,
      statusHistory: [
        {
          id: `ST-${Date.now()}`,
          orderId,
          newStatus: 'Received',
          changedAt: now,
          changedBy: userName,
          notes: 'Repair order received at counter',
        },
      ],
      estimatedAmount: est,
      finalAmount: est,
      discount: 0,
      advance: adv,
      balance: Math.max(0, est - adv),
      paymentStatus: adv >= est && est > 0 ? 'Paid' : adv > 0 ? 'Partially Paid' : 'Unpaid',
      paymentMode: data.paymentMode || 'Cash',
      payments: initialPayments,
      partsUsed: [],
    };

    this.recalculateBilling(order);
    db.saveOrder(order);

    // 3. Generate initial Bill/Job Card PDF and upload to Drive if configured
    try {
      await this.generateAndSyncBillPdf(order);
    } catch (pdfErr) {
      console.warn('Initial PDF generation warning:', pdfErr);
    }

    // 4. Background sync to Google Sheets if auto-sync enabled
    const settings = db.getSettings();
    if (settings.autoSyncGoogleSheets && GoogleSheetsService.isConfigured()) {
      GoogleSheetsService.syncToGoogleSheets().catch((err) =>
        console.warn('Auto sync to sheets error:', err.message)
      );
    }

    // 5. Auto store single-row customer bill online
    OnlineBillSheetService.autoStoreBillOnline(order).catch((err) =>
      console.warn('Auto store bill online warning:', err.message)
    );

    return order;
  }

  /**
   * Update Repair Status
   */
  public static async updateStatus(
    orderId: string,
    newStatus: RepairStatus,
    userName: string = 'Employee',
    notes?: string
  ): Promise<RepairOrder> {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error(`Repair order not found: ${orderId}`);
    }

    if (order.status === newStatus) {
      return order; // No change
    }

    const oldStatus = order.status;
    const now = new Date().toISOString();

    order.status = newStatus;
    order.updatedAt = now;
    order.statusHistory.push({
      id: `ST-${Date.now()}`,
      orderId,
      oldStatus,
      newStatus,
      changedAt: now,
      changedBy: userName,
      notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
    });

    // If marked Delivered:
    if (newStatus === 'Delivered') {
      order.deliveredAt = now;
      // Section 17: Consume On Delivery items (e.g. repair folder box)
      try {
        StockService.consumeOnDeliveryItems(order.orderId, userName);
      } catch (err: any) {
        console.warn('Delivery items consumption warning:', err.message);
      }
    }

    // If Cancelled: return any consumed parts back to stock safely
    if (newStatus === 'Cancelled') {
      for (const part of order.partsUsed) {
        if (part.consumed) {
          try {
            StockService.returnRepairPart({
              orderId,
              partId: part.partId,
              quantity: part.quantity,
              reason: `Repair order ${orderId} was cancelled`,
              userName,
            });
            part.consumed = false;
          } catch (err: any) {
            console.warn(`Error returning part ${part.partId}:`, err.message);
          }
        }
      }
    }

    db.saveOrder(order);

    // Update PDF on Drive (with CANCELLED watermark if cancelled, or Delivered date)
    try {
      await this.generateAndSyncBillPdf(order);
    } catch (err) {
      console.warn('PDF update warning:', err);
    }

    // Auto sync to sheets
    const settings = db.getSettings();
    if (settings.autoSyncGoogleSheets && GoogleSheetsService.isConfigured()) {
      GoogleSheetsService.syncToGoogleSheets().catch(() => {});
    }

    // Auto store single-row customer bill online
    OnlineBillSheetService.autoStoreBillOnline(order).catch(() => {});

    return order;
  }

  /**
   * Add a part to a repair order
   */
  public static addPartToOrder(params: {
    orderId: string;
    partId: string;
    quantity: number;
    unitPrice?: number;
    userName: string;
  }): RepairOrder {
    const order = db.getOrderById(params.orderId);
    if (!order) {
      throw new Error(`Repair order not found: ${params.orderId}`);
    }

    const stockItem = db.getPartById(params.partId);
    if (!stockItem) {
      throw new Error(`Part not found: ${params.partId}`);
    }

    const unitPrice = params.unitPrice !== undefined ? params.unitPrice : stockItem.sellingPrice;

    // Check if already in order
    const existingIndex = order.partsUsed.findIndex((p) => p.partId === params.partId);
    if (existingIndex >= 0) {
      order.partsUsed[existingIndex].quantity += params.quantity;
      order.partsUsed[existingIndex].unitPrice = unitPrice;
    } else {
      order.partsUsed.push({
        partId: stockItem.itemId,
        partName: stockItem.itemName,
        quantity: params.quantity,
        unitPrice,
        consumed: false, // CRITICAL RULE 16: Stock is NOT decreased yet!
      });
    }

    // Optionally update final amount with part price if appropriate
    order.updatedAt = new Date().toISOString();
    this.recalculateBilling(order);
    db.saveOrder(order);

    return order;
  }

  /**
   * Critical Rule 16: Confirms Part Used / Consumed -> Decreases Stock!
   */
  public static confirmPartUsed(params: {
    orderId: string;
    partId: string;
    userName: string;
  }): RepairOrder {
    const order = db.getOrderById(params.orderId);
    if (!order) {
      throw new Error(`Repair order not found: ${params.orderId}`);
    }

    const part = order.partsUsed.find((p) => p.partId === params.partId);
    if (!part) {
      throw new Error(`Part ${params.partId} not attached to order`);
    }

    if (part.consumed) {
      return order; // Already consumed
    }

    // Call StockService to decrease stock
    StockService.consumeRepairPart({
      orderId: order.orderId,
      partId: part.partId,
      quantity: part.quantity,
      userName: params.userName,
    });

    part.consumed = true;
    part.consumedAt = new Date().toISOString();
    part.consumedBy = params.userName;
    order.updatedAt = new Date().toISOString();

    db.saveOrder(order);

    return order;
  }

  /**
   * Critical Rule 16: Return consumed part back to inventory
   */
  public static returnConsumedPart(params: {
    orderId: string;
    partId: string;
    userName: string;
    reason?: string;
  }): RepairOrder {
    const order = db.getOrderById(params.orderId);
    if (!order) {
      throw new Error(`Repair order not found: ${params.orderId}`);
    }

    const part = order.partsUsed.find((p) => p.partId === params.partId);
    if (!part) {
      throw new Error(`Part ${params.partId} not attached to order`);
    }

    if (!part.consumed) {
      // Just remove from list if not consumed yet
      order.partsUsed = order.partsUsed.filter((p) => p.partId !== params.partId);
      db.saveOrder(order);
      return order;
    }

    // Restore stock
    StockService.returnRepairPart({
      orderId: order.orderId,
      partId: part.partId,
      quantity: part.quantity,
      reason: params.reason || `Returned unused from order ${order.orderId}`,
      userName: params.userName,
    });

    part.consumed = false;
    order.partsUsed = order.partsUsed.filter((p) => p.partId !== params.partId);
    order.updatedAt = new Date().toISOString();

    this.recalculateBilling(order);
    db.saveOrder(order);

    return order;
  }

  /**
   * Add a payment to a repair order
   */
  public static async addPayment(params: {
    orderId: string;
    amount: number;
    paymentMode: PaymentMode;
    userName: string;
    notes?: string;
  }): Promise<RepairOrder> {
    const order = db.getOrderById(params.orderId);
    if (!order) {
      throw new Error(`Repair order not found: ${params.orderId}`);
    }

    if (params.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    const now = new Date().toISOString();
    const payment = {
      paymentId: `PAY-${Date.now()}`,
      orderId: order.orderId,
      amount: params.amount,
      paymentMode: params.paymentMode,
      date: now,
      recordedBy: params.userName,
      notes: params.notes,
      updatedAt: now,
    };

    order.payments = order.payments || [];
    order.payments.push(payment);
    order.paymentMode = params.paymentMode;

    this.recalculateBilling(order);
    db.saveOrder(order);

    // Update PDF and Drive
    try {
      await this.generateAndSyncBillPdf(order);
    } catch (err) {
      console.warn('PDF update on payment warning:', err);
    }

    OnlineBillSheetService.autoStoreBillOnline(order).catch(() => {});

    return order;
  }

  /**
   * Update billing amount and discount
   */
  public static async updateBilling(params: {
    orderId: string;
    finalAmount: number;
    discount?: number;
    userName: string;
  }): Promise<RepairOrder> {
    const order = db.getOrderById(params.orderId);
    if (!order) {
      throw new Error(`Repair order not found: ${params.orderId}`);
    }

    order.finalAmount = Math.max(0, params.finalAmount);
    order.discount = Math.max(0, params.discount || 0);

    this.recalculateBilling(order);
    db.saveOrder(order);

    // Update PDF and Drive
    try {
      await this.generateAndSyncBillPdf(order);
    } catch (err) {
      console.warn('PDF update warning:', err);
    }

    OnlineBillSheetService.autoStoreBillOnline(order).catch(() => {});

    return order;
  }

  /**
   * Generates PDF and uploads to Google Drive, updating order record
   */
  public static async generateAndSyncBillPdf(order: RepairOrder): Promise<{
    filePath: string;
    fileId: string;
    link: string;
  }> {
    const settings = db.getSettings();
    const pdfData = await BillPdfGenerator.generateOrderPdf(order, settings);

    // Upload / update on Google Drive
    const uploadResult = await GoogleDriveService.uploadOrUpdateBillPdf({
      pdfBuffer: pdfData.buffer,
      fileName: pdfData.fileName,
      year: pdfData.year,
      month: pdfData.month,
      existingFileId: order.billDriveFileId,
      rootFolderOverride: settings.googleDriveFolderId,
    });

    order.billDriveFileId = uploadResult.fileId;
    order.billDriveLink = uploadResult.webViewLink;
    order.billGeneratedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    db.saveOrder(order);

    return {
      filePath: pdfData.filePath,
      fileId: uploadResult.fileId,
      link: uploadResult.webViewLink,
    };
  }
}
