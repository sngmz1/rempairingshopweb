/**
 * Section Error Indexing System for Jai Mataji Mobile Repairing SaaS
 * 
 * Sections:
 * - AUTH:    [AUTH-xxx] Authentication, PIN verification, Sessions, Role authorization
 * - REPAIR:  [REPAIR-xxx] Customer intake, Job cards, Status updates, Billing, Invoices
 * - STOCK:   [STOCK-xxx] Inventory catalog, Stock In/Out, Thresholds, Movements, Suppliers
 * - SYNC:    [SYNC-xxx] Google Sheets sync, Google Drive uploads, Webhooks, CSV
 * - SETTING: [SETTING-xxx] Shop details, Contacts, Addresses, Receipts
 * - CUST:    [CUST-xxx] Customer search, Repair history, Customer profile
 * - SYS:     [SYS-xxx] Database persistence, Unhandled server errors, Network
 */

export type ErrorSection = 'AUTH' | 'REPAIR' | 'STOCK' | 'SYNC' | 'SETTING' | 'CUST' | 'SYS';

export interface IndexedErrorResponse {
  success: false;
  section: ErrorSection;
  errorCode: string;
  message: string;
  details?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public section: ErrorSection;
  public errorCode: string;

  constructor(section: ErrorSection, errorCode: string, message: string, statusCode: number = 400) {
    const formattedMessage = `[${section}-${errorCode}] ${message}`;
    super(formattedMessage);
    this.name = 'AppError';
    this.section = section;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates a standard JSON error response with section code prefix
 */
export function createErrorResponse(
  section: ErrorSection,
  errorCode: string,
  rawMessage: string,
  details?: any
): IndexedErrorResponse {
  const cleanMessage = rawMessage.startsWith(`[${section}`)
    ? rawMessage
    : `[${section}-${errorCode}] ${rawMessage}`;

  return {
    success: false,
    section,
    errorCode: `${section}-${errorCode}`,
    message: cleanMessage,
    ...(details ? { details } : {}),
  };
}
