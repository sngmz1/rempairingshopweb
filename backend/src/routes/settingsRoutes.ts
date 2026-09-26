import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database';
import { GoogleSheetsService } from '../services/googleSheets/sheetsService';
import { GoogleDriveService } from '../services/googleDrive/driveService';
import { requireOwner } from '../middleware/security';
import { sanitizeInput } from '../utils/security';

const router = Router();

const updateSettingsSchema = z.object({
  shopName: z.string().min(1).max(100).optional(),
  contact1Name: z.string().min(1).max(50).optional(),
  contact1Number: z.string().min(10).max(15).optional(),
  contact2Name: z.string().max(50).optional(),
  contact2Number: z.string().max(15).optional(),
  address: z.string().max(200).optional(),
  serviceDescription: z.string().max(500).optional(),
  upiId: z.string().max(100).optional(),
  receiptInformation: z.string().max(500).optional(),
  googleSheetId: z.string().max(100).optional(),
  googleDriveFolderId: z.string().max(100).optional(),
  autoSyncGoogleSheets: z.boolean().optional(),
  autoUploadDrive: z.boolean().optional(),
});

// GET settings (publicly accessible to display shop header info)
router.get('/', (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    success: true,
    data: {
      ...settings,
      googleSheetsConfigured: GoogleSheetsService.isConfigured(),
      googleDriveConfigured: GoogleDriveService.isConfigured(),
    },
  });
});

// PUT update settings (Protected: Requires Owner role or Owner PIN)
router.put('/', requireOwner, (req: Request, res: Response) => {
  try {
    const validated = updateSettingsSchema.parse(req.body);

    // Sanitize string inputs to prevent XSS
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(validated)) {
      if (typeof val === 'string') {
        sanitized[key] = sanitizeInput(val);
      } else {
        sanitized[key] = val;
      }
    }

    const updated = db.updateSettings(sanitized);
    res.json({
      success: true,
      message: 'Shop settings updated successfully',
      data: updated,
    });
  } catch (err: any) {
    const message = err.errors ? err.errors[0].message : err.message || 'Invalid settings payload';
    res.status(400).json({ success: false, message });
  }
});

export default router;
