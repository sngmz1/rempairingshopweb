import { Request, Response, NextFunction } from 'express';
import { ErrorSection, createErrorResponse } from '../utils/errors';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${req.method} ${req.originalUrl || req.url}:`, err.message || err);

  const statusCode = err.status || err.statusCode || 500;

  // Determine section from request URL
  let section: ErrorSection = 'SYS';
  const url = (req.originalUrl || req.url).toLowerCase();
  if (url.includes('/auth')) section = 'AUTH';
  else if (url.includes('/repair')) section = 'REPAIR';
  else if (url.includes('/stock')) section = 'STOCK';
  else if (url.includes('/sync') || url.includes('/online-bills')) section = 'SYNC';
  else if (url.includes('/settings')) section = 'SETTING';
  else if (url.includes('/customer')) section = 'REPAIR';

  const errorCode = err.errorCode || `${statusCode}`;
  const rawMessage =
    statusCode === 500
      ? 'An unexpected internal server error occurred. Please try again.'
      : err.message || 'Action could not be completed.';

  const responseBody = createErrorResponse(
    err.section || section,
    errorCode,
    rawMessage,
    process.env.NODE_ENV !== 'production' ? err.details : undefined
  );

  res.status(statusCode).json(responseBody);
};

