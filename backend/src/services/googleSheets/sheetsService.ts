import { google } from 'googleapis';
import fs from 'fs';
import { db } from '../../db/database';
import { Customer, RepairOrder, StockItem, StockMovement, Supplier, ShopSettings } from '../../types';
import { OnlineBillSheetService } from '../onlineBills/onlineBillSheetService';

export class GoogleSheetsService {
  private static sheetsClient: any = null;
  private static initialized = false;

  private static getAuthClient() {
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        return new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      }

      if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        return new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      }
    } catch (err: any) {
      console.warn('Google Sheets Auth Init Warning:', err.message);
    }
    return null;
  }

  private static getSheets() {
    if (!this.initialized) {
      const auth = this.getAuthClient();
      if (auth) {
        this.sheetsClient = google.sheets({ version: 'v4', auth });
      }
      this.initialized = true;
    }
    return this.sheetsClient;
  }

  public static isConfigured(): boolean {
    const sheetId = process.env.GOOGLE_SHEET_ID || db.getSettings().googleSheetId;
    const hasAuth = !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)));
    return !!(sheetId && hasAuth);
  }

  /**
   * Ensure standard tabs exist in the target spreadsheet
   */
  public static async ensureSheetsExist(sheetId: string) {
    const sheets = this.getSheets();
    if (!sheets) return;

    try {
      const metadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const existingTitles = (metadata.data.sheets || []).map((s: any) => s.properties.title);

      const requiredSheets = [
        'Customer Bills (1-Row)',
        'Customers',
        'Orders',
        'Payments',
        'Parts',
        'Stock Movements',
        'Suppliers',
        'Settings',
      ];

      const addRequests = requiredSheets
        .filter((title) => !existingTitles.includes(title))
        .map((title) => ({
          addSheet: {
            properties: { title },
          },
        }));

      if (addRequests.length > 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: { requests: addRequests },
        });
      }
    } catch (err: any) {
      console.error('Error ensuring sheets exist:', err.message);
      throw err;
    }
  }

  /**
   * Syncs current local data to Google Sheets
   */
  public static async syncToGoogleSheets(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const sheetId = process.env.GOOGLE_SHEET_ID || db.getSettings().googleSheetId;
    if (!sheetId) {
      return {
        success: false,
        message: 'Google Sheet ID not configured in settings or .env',
        timestamp: new Date().toISOString(),
      };
    }

    const sheets = this.getSheets();
    if (!sheets) {
      return {
        success: false,
        message: 'Google service account credentials not configured. Data is safe locally.',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      await this.ensureSheetsExist(sheetId);

      const customers = db.getCustomers();
      const orders = db.getOrders();
      const parts = db.getParts();
      const movements = db.getMovements();
      const suppliers = db.getSuppliers();
      const settings = db.getSettings();

      // 0. Master Single-Row Customer Bills (Pure Shop Customer Data)
      const onlineRows = OnlineBillSheetService.getAllRows();
      const customerBillRows = [
        [
          'Order ID',
          'Customer Name',
          'Customer Mobile',
          'Device (Brand & Model)',
          'Reported Problem / Fault',
          'Device Pickup/Received Date & Time (Auto)',
          'Device Delivery Date & Time (Auto)',
          'Current Status',
          'Repair Amount (₹)',
          'Advance Paid (₹)',
          'Remaining Balance (₹)',
          'Payment Mode',
          'Payment Status',
          'Parts Replaced / Installed',
          'PDF Bill Link',
          'Technician / Handled By',
        ],
        ...onlineRows.map((r) => [
          r.orderId,
          r.customerName,
          r.customerMobile,
          r.device,
          r.complaint,
          r.pickupReceivedDateTime,
          r.deliveryDateTime,
          r.status,
          r.finalAmount,
          r.advancePaid,
          r.balanceDue,
          r.paymentMode,
          r.paymentStatus,
          r.partsUsed,
          r.billPdfLink,
          r.technician,
        ]),
      ];

      // 1. Customers
      const customerRows = [
        ['Customer ID', 'Name', 'Mobile', 'Email', 'Address', 'Notes', 'Created At', 'Updated At'],
        ...customers.map((c) => [
          c.customerId,
          c.name,
          c.mobile,
          c.email || '',
          c.address || '',
          c.notes || '',
          c.createdAt,
          c.updatedAt,
        ]),
      ];

      // 2. Orders
      const orderRows = [
        [
          'Order ID',
          'Customer ID',
          'Customer Name',
          'Customer Mobile',
          'Device Type',
          'Brand',
          'Model',
          'Complaint',
          'Status',
          'Received At',
          'Expected Delivery',
          'Delivered At',
          'Estimated Amount',
          'Final Amount',
          'Discount',
          'Advance',
          'Balance',
          'Payment Status',
          'Bill Drive File ID',
          'Bill Drive Link',
          'Updated At',
        ],
        ...orders.map((o) => [
          o.orderId,
          o.customerId,
          o.customerName,
          o.customerMobile,
          o.deviceType,
          o.brand,
          o.model,
          o.complaint,
          o.status,
          o.receivedAt,
          o.expectedDelivery || '',
          o.deliveredAt || '',
          o.estimatedAmount,
          o.finalAmount,
          o.discount,
          o.advance,
          o.balance,
          o.paymentStatus,
          o.billDriveFileId || '',
          o.billDriveLink || '',
          o.updatedAt,
        ]),
      ];

      // 3. Payments
      const allPayments: any[] = [];
      orders.forEach((o) => {
        if (o.payments && o.payments.length > 0) {
          o.payments.forEach((p) => {
            allPayments.push([
              p.paymentId,
              p.orderId,
              p.amount,
              p.paymentMode,
              o.paymentStatus,
              p.date,
              p.recordedBy,
              p.updatedAt,
            ]);
          });
        }
      });
      const paymentRows = [
        ['Payment ID', 'Order ID', 'Amount', 'Payment Mode', 'Status', 'Date', 'Recorded By', 'Updated At'],
        ...allPayments,
      ];

      // 4. Parts
      const partRows = [
        [
          'Part ID',
          'Part Name',
          'Category',
          'Brand',
          'Model',
          'Quantity',
          'Minimum Quantity',
          'Purchase Cost',
          'Selling Price',
          'Supplier',
          'Consumption Type',
          'Updated At',
        ],
        ...parts.map((p) => [
          p.itemId,
          p.itemName,
          p.category,
          p.brand,
          p.model,
          p.availableQuantity,
          p.minimumQuantity,
          p.purchaseCost,
          p.sellingPrice,
          p.supplier || '',
          p.consumptionType,
          p.updatedAt,
        ]),
      ];

      // 5. Stock Movements
      const movementRows = [
        ['Movement ID', 'Part ID', 'Order ID', 'Type', 'Quantity', 'Reason', 'Before', 'After', 'Date', 'User'],
        ...movements.map((m) => [
          m.movementId,
          m.itemId,
          m.orderId || '',
          m.type,
          m.quantity,
          m.reason,
          m.beforeQuantity,
          m.afterQuantity,
          m.date,
          m.user,
        ]),
      ];

      // 6. Suppliers
      const supplierRows = [
        ['Supplier ID', 'Name', 'Mobile', 'Notes', 'Updated At'],
        ...suppliers.map((s) => [s.supplierId, s.name, s.mobile, s.notes || '', s.updatedAt]),
      ];

      // 7. Settings
      const settingsRows = [
        ['Field', 'Value'],
        ['Shop Name', settings.shopName],
        ['Contact 1 Name', settings.contact1Name],
        ['Contact 1 Number', settings.contact1Number],
        ['Contact 2 Name', settings.contact2Name],
        ['Contact 2 Number', settings.contact2Number],
        ['Address', settings.address],
        ['Service Description', settings.serviceDescription],
        ['UPI ID', settings.upiId],
        ['Receipt Information', settings.receiptInformation],
        ['Updated At', settings.updatedAt],
      ];

      // Write each sheet
      const updates = [
        { range: "'Customer Bills (1-Row)'!A1", values: customerBillRows },
        { range: 'Customers!A1', values: customerRows },
        { range: 'Orders!A1', values: orderRows },
        { range: 'Payments!A1', values: paymentRows },
        { range: 'Parts!A1', values: partRows },
        { range: 'Stock Movements!A1', values: movementRows },
        { range: 'Suppliers!A1', values: supplierRows },
        { range: 'Settings!A1', values: settingsRows },
      ];

      for (const update of updates) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: update.range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: update.values },
        });
      }

      return {
        success: true,
        message: 'Successfully synchronized data to Google Sheets',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Google Sheets Sync Error:', err);
      return {
        success: false,
        message: `Unable to sync right now: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Pulls data from Google Sheets into local store (safe import)
   */
  public static async pullFromGoogleSheets(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const sheetId = process.env.GOOGLE_SHEET_ID || db.getSettings().googleSheetId;
    if (!sheetId) {
      return {
        success: false,
        message: 'Google Sheet ID not configured',
        timestamp: new Date().toISOString(),
      };
    }

    const sheets = this.getSheets();
    if (!sheets) {
      return {
        success: false,
        message: 'Google credentials not configured',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Read Parts from Sheets to allow bulk inventory updates directly from sheet!
      const partsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Parts!A2:L',
      });

      const partRows = partsRes.data.values || [];
      for (const row of partRows) {
        if (!row[0]) continue;
        const [
          itemId,
          itemName,
          category,
          brand,
          model,
          quantityStr,
          minQtyStr,
          costStr,
          priceStr,
          supplier,
          consumptionType,
          updatedAt,
        ] = row;

        const existing = db.getPartById(itemId);
        // Only update if row is valid
        if (itemId && itemName) {
          db.savePart({
            itemId,
            itemName,
            category: category || 'General',
            brand: brand || '',
            model: model || '',
            availableQuantity: parseInt(quantityStr, 10) || 0,
            minimumQuantity: parseInt(minQtyStr, 10) || 2,
            purchaseCost: parseFloat(costStr) || 0,
            sellingPrice: parseFloat(priceStr) || 0,
            supplier: supplier || '',
            consumptionType: (consumptionType as any) || (existing?.consumptionType ?? 'Consume On Part Used'),
            updatedAt: updatedAt || new Date().toISOString(),
          });
        }
      }

      // Read Settings
      try {
        const settingsRes = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'Settings!A2:B',
        });
        const settingRows = settingsRes.data.values || [];
        const settingsUpdates: Partial<ShopSettings> = {};
        for (const [key, val] of settingRows) {
          if (key === 'Shop Name' && val) settingsUpdates.shopName = val;
          if (key === 'Contact 1 Name' && val) settingsUpdates.contact1Name = val;
          if (key === 'Contact 1 Number' && val) settingsUpdates.contact1Number = val;
          if (key === 'Contact 2 Name' && val) settingsUpdates.contact2Name = val;
          if (key === 'Contact 2 Number' && val) settingsUpdates.contact2Number = val;
          if (key === 'Address' && val) settingsUpdates.address = val;
          if (key === 'Service Description' && val) settingsUpdates.serviceDescription = val;
          if (key === 'UPI ID' && val) settingsUpdates.upiId = val;
          if (key === 'Receipt Information' && val) settingsUpdates.receiptInformation = val;
        }
        if (Object.keys(settingsUpdates).length > 0) {
          db.updateSettings(settingsUpdates);
        }
      } catch (e) {
        // Ignore settings parse error if not set yet
      }

      return {
        success: true,
        message: 'Successfully pulled latest changes from Google Sheets',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Error pulling from Google Sheets:', err);
      return {
        success: false,
        message: `Unable to sync right now: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
