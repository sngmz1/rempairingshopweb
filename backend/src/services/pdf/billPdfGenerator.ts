import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { RepairOrder, ShopSettings } from '../../types';

export class BillPdfGenerator {
  public static async generateOrderPdf(
    order: RepairOrder,
    settings: ShopSettings
  ): Promise<{ buffer: Buffer; filePath: string; fileName: string; year: string; month: string }> {
    const receivedDate = new Date(order.receivedAt);
    const year = receivedDate.getFullYear().toString();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[receivedDate.getMonth()];

    const billsBaseDir = path.resolve(__dirname, '../../../bills');
    const targetDir = path.join(billsBaseDir, year, month);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileName = `${order.orderId}.pdf`;
    const filePath = path.join(targetDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A5',
          margin: 30,
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          fs.writeFileSync(filePath, pdfBuffer);
          resolve({
            buffer: pdfBuffer,
            filePath,
            fileName,
            year,
            month,
          });
        });

        doc.on('error', (err) => {
          reject(err);
        });

        // 1. Watermark if cancelled
        if (order.status === 'Cancelled') {
          doc.save();
          doc.fontSize(45).fillColor('#ef4444').opacity(0.18);
          doc.rotate(-30, { origin: [200, 280] });
          doc.text('CANCELLED', 80, 260);
          doc.restore();
        }

        // Header Background Banner
        doc.rect(20, 20, doc.page.width - 40, 75).fill('#1e3a8a');

        // Shop Title
        doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
          .text(settings.shopName.toUpperCase(), 30, 28, { align: 'center' });

        // Contacts & Address
        doc.fontSize(9).font('Helvetica')
          .text(`${settings.contact1Name}: ${settings.contact1Number}  |  ${settings.contact2Name}: ${settings.contact2Number}`, 30, 48, { align: 'center' })
          .text(settings.address, 30, 62, { align: 'center' })
          .text(settings.serviceDescription, 30, 74, { align: 'center', width: doc.page.width - 60 });

        // Bill / Job Card Title Bar
        const isDelivered = order.status === 'Delivered';
        const docTitle = isDelivered ? 'REPAIR INVOICE / RECEIPT' : 'JOB CARD / REPAIR ACKNOWLEDGEMENT';
        doc.rect(20, 102, doc.page.width - 40, 24).fill('#f1f5f9');
        doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
          .text(docTitle, 30, 108, { align: 'left' });
        doc.fontSize(10).fillColor('#2563eb')
          .text(`ORDER: ${order.orderId}`, 30, 108, { align: 'right' });

        let y = 135;

        // Customer & Device Details Box
        doc.rect(20, y, doc.page.width - 40, 105).strokeColor('#cbd5e1').stroke();
        
        // Left Column: Customer
        doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text('CUSTOMER DETAILS', 30, y + 8);
        doc.font('Helvetica').fontSize(9).fillColor('#0f172a')
          .text(`Name: ${order.customerName}`, 30, y + 24)
          .text(`Mobile: ${order.customerMobile}`, 30, y + 38)
          .text(`Received: ${new Date(order.receivedAt).toLocaleString('en-IN')}`, 30, y + 52);

        if (order.expectedDelivery) {
          doc.text(`Exp. Delivery: ${order.expectedDelivery}`, 30, y + 66);
        }

        // Right Column: Device
        const col2X = doc.page.width / 2 + 10;
        doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text('DEVICE DETAILS', col2X, y + 8);
        doc.font('Helvetica').fontSize(9).fillColor('#0f172a')
          .text(`Type: ${order.deviceType || 'Mobile Phone'}`, col2X, y + 24)
          .text(`Brand / Model: ${order.brand} ${order.model}`, col2X, y + 38);

        if (order.imeiOrSerial) {
          doc.text(`IMEI/Serial: ${order.imeiOrSerial}`, col2X, y + 52);
        }
        if (order.accessoriesReceived) {
          doc.text(`Accessories: ${order.accessoriesReceived}`, col2X, y + 66);
        }

        // Complaint box
        y += 115;
        doc.rect(20, y, doc.page.width - 40, 36).fill('#f8fafc').strokeColor('#e2e8f0').stroke();
        doc.fillColor('#dc2626').fontSize(9).font('Helvetica-Bold').text('REPORTED PROBLEM / COMPLAINT:', 28, y + 6);
        doc.fillColor('#0f172a').font('Helvetica').fontSize(9).text(order.complaint, 28, y + 18, { width: doc.page.width - 56 });

        // Parts Used (if any)
        y += 45;
        if (order.partsUsed && order.partsUsed.length > 0) {
          doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('PARTS INSTALLED / USED:', 25, y);
          y += 12;
          order.partsUsed.forEach((part) => {
            doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
              .text(`• ${part.partName} (Qty: ${part.quantity})`, 30, y)
              .text(`₹${part.unitPrice * part.quantity}`, 30, y, { align: 'right' });
            y += 14;
          });
          y += 4;
        }

        // Billing Summary Table
        y = Math.max(y, 310);
        doc.rect(20, y, doc.page.width - 40, 80).fill('#f8fafc').strokeColor('#cbd5e1').stroke();

        const amountColX = doc.page.width - 160;

        doc.fillColor('#475569').fontSize(9).font('Helvetica')
          .text('Estimated Repair Amount:', 30, y + 8)
          .text(`₹${order.estimatedAmount}`, 30, y + 8, { align: 'right' });

        doc.text('Final Repair Amount:', 30, y + 22)
          .text(`₹${order.finalAmount || order.estimatedAmount}`, 30, y + 22, { align: 'right' });

        if (order.discount > 0) {
          doc.text('Discount:', 30, y + 36)
            .text(`- ₹${order.discount}`, 30, y + 36, { align: 'right' });
        }

        doc.text(`Advance Paid (${order.paymentMode || 'Cash'}):`, 30, y + 50)
          .text(`₹${order.advance}`, 30, y + 50, { align: 'right' });

        // Total Balance Highlight
        doc.rect(20, y + 64, doc.page.width - 40, 24).fill(order.balance > 0 ? '#fef3c7' : '#dcfce7');
        doc.fillColor(order.balance > 0 ? '#b45309' : '#15803d').fontSize(10).font('Helvetica-Bold')
          .text(`REMAINING BALANCE TO PAY:`, 30, y + 70)
          .text(`₹${order.balance}`, 30, y + 70, { align: 'right' });

        // Status & Footer Notes
        y += 100;
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold')
          .text(`Status: `, 25, y)
          .fillColor('#2563eb').text(`${order.status.toUpperCase()}`, 65, y);

        if (order.deliveredAt) {
          doc.fillColor('#16a34a').font('Helvetica').fontSize(8.5)
            .text(`Delivered On: ${new Date(order.deliveredAt).toLocaleString('en-IN')}`, 200, y);
        }

        y += 18;
        if (settings.upiId) {
          doc.fillColor('#334155').font('Helvetica').fontSize(8)
            .text(`UPI Payment ID: ${settings.upiId}`, 25, y);
          y += 12;
        }

        doc.fillColor('#64748b').font('Helvetica').fontSize(7.5)
          .text(settings.receiptInformation, 25, y, { width: doc.page.width - 50 })
          .text('Authorized Signature: _______________________', 30, y + 20, { align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
