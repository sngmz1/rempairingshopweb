import { google } from 'googleapis';
import fs from 'fs';
import { Readable } from 'stream';

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  status: 'uploaded' | 'updated' | 'local_fallback';
  message?: string;
}

export class GoogleDriveService {
  private static driveClient: any = null;
  private static initialized = false;

  private static getAuthClient() {
    try {
      // Check if service account key JSON is provided via environment
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
        return auth;
      }

      // Or check if credentials file path is given
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        const auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
        return auth;
      }
    } catch (err) {
      console.warn('Google Drive auth initialization warning:', (err as Error).message);
    }
    return null;
  }

  private static getDrive() {
    if (!this.initialized) {
      const auth = this.getAuthClient();
      if (auth) {
        this.driveClient = google.drive({ version: 'v3', auth });
      }
      this.initialized = true;
    }
    return this.driveClient;
  }

  public static isConfigured(): boolean {
    return !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)));
  }

  /**
   * Finds or creates a subfolder inside a parent folder
   */
  private static async getOrCreateFolder(drive: any, folderName: string, parentFolderId?: string): Promise<string> {
    try {
      let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id!;
      }

      // Create folder if not found
      const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };
      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const created = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      return created.data.id!;
    } catch (err) {
      console.error(`Error in getOrCreateFolder for ${folderName}:`, err);
      throw err;
    }
  }

  /**
   * Uploads or updates a repair PDF bill to Google Drive
   * Folder structure: Jai Mataji Mobile Repairing -> Bills -> {Year} -> {Month}
   */
  public static async uploadOrUpdateBillPdf(options: {
    pdfBuffer: Buffer;
    fileName: string; // e.g. ORD-2026-00482.pdf
    year: string;
    month: string;
    existingFileId?: string;
    rootFolderOverride?: string;
  }): Promise<DriveUploadResult> {
    const drive = this.getDrive();

    // If Google Drive API is not configured with credentials, fallback to local storage
    if (!drive) {
      return {
        fileId: options.existingFileId || `local-${Date.now()}`,
        webViewLink: `/api/repairs/pdf-view/${encodeURIComponent(options.fileName)}`,
        status: 'local_fallback',
        message: 'Google Drive credentials not set in .env. Bill stored locally in backend/bills/ and viewable directly.',
      };
    }

    try {
      const bufferStream = new Readable();
      bufferStream.push(options.pdfBuffer);
      bufferStream.push(null);

      // If existing file ID is provided, UPDATE it directly to prevent duplicate files
      if (options.existingFileId && !options.existingFileId.startsWith('local-')) {
        try {
          const updateRes = await drive.files.update({
            fileId: options.existingFileId,
            media: {
              mimeType: 'application/pdf',
              body: bufferStream,
            },
            fields: 'id, webViewLink, webContentLink',
          });

          return {
            fileId: updateRes.data.id!,
            webViewLink: updateRes.data.webViewLink || updateRes.data.webContentLink || `https://drive.google.com/file/d/${updateRes.data.id}/view`,
            status: 'updated',
          };
        } catch (updateErr: any) {
          console.warn(`Could not update existing file ${options.existingFileId}, creating new instead:`, updateErr.message);
        }
      }

      // Resolve folder hierarchy: Root -> Bills -> Year -> Month
      const rootFolderName = 'Jai Mataji Mobile Repairing';
      const rootId = options.rootFolderOverride || process.env.GOOGLE_DRIVE_FOLDER_ID || (await this.getOrCreateFolder(drive, rootFolderName));
      const billsFolderId = await this.getOrCreateFolder(drive, 'Bills', rootId);
      const yearFolderId = await this.getOrCreateFolder(drive, options.year, billsFolderId);
      const targetFolderId = await this.getOrCreateFolder(drive, options.month, yearFolderId);

      // Create new file in month folder
      const createRes = await drive.files.create({
        requestBody: {
          name: options.fileName,
          parents: [targetFolderId],
          mimeType: 'application/pdf',
        },
        media: {
          mimeType: 'application/pdf',
          body: bufferStream,
        },
        fields: 'id, webViewLink, webContentLink',
      });

      const fileId = createRes.data.id!;

      // Make viewable
      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permErr) {
        // Non-fatal if organization restricts public sharing
      }

      return {
        fileId: fileId,
        webViewLink: createRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        status: 'uploaded',
      };
    } catch (err: any) {
      console.error('Failed to upload PDF to Google Drive:', err);
      return {
        fileId: options.existingFileId || `local-${Date.now()}`,
        webViewLink: `/api/repairs/pdf-view/${encodeURIComponent(options.fileName)}`,
        status: 'local_fallback',
        message: `Google Drive upload error: ${err.message}. Bill saved locally.`,
      };
    }
  }
}
