import { Router, Request, Response } from 'express';
import { GoogleSheetsService } from '../services/googleSheets/sheetsService';
import { GoogleDriveService } from '../services/googleDrive/driveService';
import { db } from '../db/database';
import { requireOwner } from '../middleware/security';
import fs from 'fs';
import path from 'path';

const router = Router();

// Helper to extract Sheet ID from URL or return raw ID
export function extractSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

// GET sync status (Safe overview, no secret keys returned)
router.get('/status', (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    success: true,
    data: {
      sheetsConfigured: GoogleSheetsService.isConfigured(),
      driveConfigured: GoogleDriveService.isConfigured(),
      sheetId: settings.googleSheetId || '',
      driveFolderId: settings.googleDriveFolderId || '',
      autoSync: settings.autoSyncGoogleSheets,
      lastSync: settings.updatedAt,
      hasServiceAccount: !!(
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
        (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))
      ),
    },
  });
});

// POST save Google Sheet ID directly from UI (Protected: Owner required)
router.post('/save-sheet-id', requireOwner, (req: Request, res: Response) => {
  try {
    const { sheetInput } = req.body;
    if (!sheetInput || typeof sheetInput !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid Google Sheet URL or ID' });
    }

    const cleanSheetId = extractSheetId(sheetInput);
    if (!cleanSheetId || cleanSheetId.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid Google Sheet ID or URL' });
    }

    // Save to settings & runtime
    process.env.GOOGLE_SHEET_ID = cleanSheetId;
    db.updateSettings({ googleSheetId: cleanSheetId });

    res.json({
      success: true,
      message: 'Google Sheet connected successfully',
      sheetId: cleanSheetId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to save Google Sheet ID' });
  }
});

// POST save Google Service Account Credentials JSON directly from UI (Protected: Owner required)
router.post('/save-credentials', requireOwner, (req: Request, res: Response) => {
  try {
    const { credentialsJson } = req.body;
    if (!credentialsJson) {
      return res.status(400).json({ success: false, message: 'Credentials JSON is required' });
    }

    let parsed: any;
    try {
      parsed = typeof credentialsJson === 'string' ? JSON.parse(credentialsJson) : credentialsJson;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid JSON format. Please paste valid Service Account JSON.' });
    }

    if (!parsed.client_email || !parsed.private_key) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Service Account JSON. Missing client_email or private_key.',
      });
    }

    // Write to backend/service-account.json
    const credPath = path.resolve(__dirname, '../../service-account.json');
    fs.writeFileSync(credPath, JSON.stringify(parsed, null, 2), { encoding: 'utf-8', mode: 0o600 });

    process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify(parsed);

    // Return safe confirmation: NEVER return private_key!
    res.json({
      success: true,
      message: 'Google Cloud Service Account credentials saved successfully!',
      clientEmail: parsed.client_email,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to save credentials' });
  }
});

// POST push/sync to Google Sheets (Protected: Owner required)
router.post('/sheets/push', requireOwner, async (req: Request, res: Response) => {
  try {
    const result = await GoogleSheetsService.syncToGoogleSheets();
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Unable to sync right now. Please check Sheet ID.',
      });
    }
    res.json({ success: true, message: result.message, timestamp: result.timestamp });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Unable to sync right now. Please try again.',
    });
  }
});

// POST pull/import from Google Sheets (Protected: Owner required)
router.post('/sheets/pull', requireOwner, async (req: Request, res: Response) => {
  try {
    const result = await GoogleSheetsService.pullFromGoogleSheets();
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Unable to sync right now. Please try again.',
      });
    }
    res.json({ success: true, message: result.message, timestamp: result.timestamp });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Unable to sync right now. Please try again.',
    });
  }
});

export default router;
