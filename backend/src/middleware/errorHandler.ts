import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  const userFriendlyMessage =
    statusCode === 500
      ? 'An unexpected error occurred. Please try again.'
      : err.message || 'Action could not be completed.';

  res.status(statusCode).json({
    success: false,
    message: userFriendlyMessage,
  });
};
