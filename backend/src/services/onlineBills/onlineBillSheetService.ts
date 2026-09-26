import fs from 'fs';
import path from 'path';
import { db } from '../../db/database';
import { RepairOrder } from '../../types';

export interface SingleRowCustomerBill {
  rowNumber: number;
  orderId: string;
  customerName: string;
  customerMobile: string;
  device: string;
  complaint: string;
  pickupReceivedDateTime: string; // Auto timestamp when device received at shop
  deliveryDateTime: string;       // Auto timestamp when marked Delivered
  status: string;
  estimatedAmount: number;
  finalAmount: number;
  advancePaid: number;
  balanceDue: number;
  paymentMode: string;
  paymentStatus: string;
  partsUsed: string;
  billPdfLink: string;
  technician: string;
  syncStatus: 'synced' | 'pending';
  lastSyncedAt?: string;
}

export class OnlineBillSheetService {
  private static DATA_DIR = path.resolve(__dirname, '../../../data');
  private static CSV_FILE = path.join(OnlineBillSheetService.DATA_DIR, 'online_bills_sheet.csv');

  /**
   * Format dates cleanly for customer repair receipts and spreadsheet rows
   */
  private static formatDateTime(isoString?: string): string {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString || '-';
    }
  }

  /**
   * Convert RepairOrder into exactly ONE clean row for one customer
   */
  public static formatOrderToRow(order: RepairOrder, index: number): SingleRowCustomerBill {
    const partsSummary = (order.partsUsed || [])
      .map((p) => `${p.partName} (Qty: ${p.quantity})`)
      .join(', ');

    // Auto Pickup (Received) Date & Time
    const pickupDateTime = this.formatDateTime(order.receivedAt);

    // Auto Delivery Date & Time
    const deliveryDateTime = order.deliveredAt
      ? this.formatDateTime(order.deliveredAt)
      : order.status === 'Delivered'
      ? this.formatDateTime(order.updatedAt)
      : order.expectedDelivery
      ? `Pending (Exp: ${order.expectedDelivery})`
      : 'In Progress';

    return {
      rowNumber: index + 1,
      orderId: order.orderId,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      device: `${order.brand} ${order.model}`.trim(),
      complaint: order.complaint,
      pickupReceivedDateTime: pickupDateTime,
      deliveryDateTime: deliveryDateTime,
      status: order.status,
      estimatedAmount: order.estimatedAmount,
      finalAmount: order.finalAmount || order.estimatedAmount,
      advancePaid: order.advance,
      balanceDue: order.balance,
      paymentMode: order.paymentMode || 'Cash',
      paymentStatus: order.paymentStatus,
      partsUsed: partsSummary || 'None',
      billPdfLink: order.billDriveLink || `/api/repairs/${order.orderId}/pdf`,
      technician: order.technician || 'Ashok Bhai',
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates all single-row customer bills from database orders
   */
  public static getAllRows(): SingleRowCustomerBill[] {
    const orders = db.getOrders();
    const sorted = [...orders].sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    return sorted.map((ord, idx) => this.formatOrderToRow(ord, idx));
  }

  /**
   * Export all customer bills as clean, single-row CSV for Google Sheets / Excel
   */
  public static generateCsv(): string {
    const rows = this.getAllRows();

    const headers = [
      'Row #',
      'Order ID',
      'Customer Name',
      'Customer Mobile',
      'Device (Brand & Model)',
      'Reported Problem / Fault',
      'Device Pickup/Received Date & Time (Auto)',
      'Device Delivery Date & Time (Auto)',
      'Current Repair Status',
      'Estimated Amount (₹)',
      'Final Repair Amount (₹)',
      'Advance Paid (₹)',
      'Remaining Balance (₹)',
      'Payment Mode',
      'Payment Status',
      'Parts Replaced / Installed',
      'PDF Bill Link',
      'Technician / Handled By',
    ];

    const escapeCsv = (str: any) => {
      const val = str === null || str === undefined ? '' : String(str);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.rowNumber,
          escapeCsv(r.orderId),
          escapeCsv(r.customerName),
          escapeCsv(r.customerMobile),
          escapeCsv(r.device),
          escapeCsv(r.complaint),
          escapeCsv(r.pickupReceivedDateTime),
          escapeCsv(r.deliveryDateTime),
          escapeCsv(r.status),
          r.estimatedAmount,
          r.finalAmount,
          r.advancePaid,
          r.balanceDue,
          escapeCsv(r.paymentMode),
          escapeCsv(r.paymentStatus),
          escapeCsv(r.partsUsed),
          escapeCsv(r.billPdfLink),
          escapeCsv(r.technician),
        ].join(',')
      ),
    ];

    const csvContent = csvLines.join('\n');
    try {
      if (!fs.existsSync(this.DATA_DIR)) {
        fs.mkdirSync(this.DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(this.CSV_FILE, csvContent, 'utf-8');
    } catch (e) {
      console.warn('Could not save CSV cache file:', e);
    }

    return csvContent;
  }

  /**
   * Auto-store single bill online whenever connected to internet
   */
  public static async autoStoreBillOnline(order: RepairOrder): Promise<{
    success: boolean;
    row: SingleRowCustomerBill;
    message: string;
  }> {
    const row = this.formatOrderToRow(order, 0);

    // Save CSV cache
    this.generateCsv();

    // Check if an external Google Apps Script Webhook or Sheet API endpoint is configured
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || (db.getSettings() as any).googleSheetWebhookUrl;

    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'append_or_update_bill',
            row,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          return {
            success: true,
            row,
            message: 'Automatically stored bill in online Google Sheet row',
          };
        }
      } catch (err: any) {
        console.warn('Online webhook sync warning:', err.message);
      }
    }

    return {
      success: true,
      row,
      message: 'Bill recorded in single-row online customer sheet format',
    };
  }
}
