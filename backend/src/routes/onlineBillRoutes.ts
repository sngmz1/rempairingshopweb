import { Router, Request, Response } from 'express';
import { OnlineBillSheetService } from '../services/onlineBills/onlineBillSheetService';
import { db } from '../db/database';
import { requireOwner } from '../middleware/security';

const router = Router();

// GET all customer bills in single-row format
router.get('/', (req: Request, res: Response) => {
  const rows = OnlineBillSheetService.getAllRows();
  res.json({
    success: true,
    data: {
      rows,
      totalCount: rows.length,
      cloudConfigured: !!(
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
        (process.env.GOOGLE_APPLICATION_CREDENTIALS && require('fs').existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))
      ),
      webhookConfigured: !!(process.env.GOOGLE_SHEET_WEBHOOK_URL || (db.getSettings() as any).googleSheetWebhookUrl),
    },
  });
});

// GET CSV file for direct Excel / Google Sheets import
router.get('/csv', (req: Request, res: Response) => {
  const csvData = OnlineBillSheetService.generateCsv();
  const dateStr = new Date().toISOString().split('T')[0];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Jai_Mataji_Repair_Bills_${dateStr}.csv"`
  );
  res.send(csvData);
});

// POST sync all bills online (Owner only)
router.post('/sync-all', requireOwner, async (req: Request, res: Response) => {
  try {
    const orders = db.getOrders();
    for (const order of orders) {
      await OnlineBillSheetService.autoStoreBillOnline(order);
    }

    res.json({
      success: true,
      message: `Successfully synchronized ${orders.length} customer bills online.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to sync bills online: ' + err.message,
    });
  }
});

// POST save webhook / Google Sheet integration URL (Owner only)
router.post('/config-webhook', requireOwner, (req: Request, res: Response) => {
  try {
    const { webhookUrl } = req.body;
    let validUrl = '';
    if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.trim().length > 0) {
      const parsed = new URL(webhookUrl.trim());
      if (parsed.protocol !== 'https:') {
        return res.status(400).json({
          success: false,
          message: 'Webhook URL must use secure HTTPS protocol',
        });
      }
      validUrl = parsed.toString();
    }
    db.updateSettings({
      googleSheetWebhookUrl: validUrl,
    } as any);

    res.json({
      success: true,
      message: 'Google Sheet online sync URL updated successfully.',
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
