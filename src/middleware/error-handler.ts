import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', err.message || err);
  
  // Clean stack trace format 
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack.split('\n').slice(0, 3).join('\n'));
  }

  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
