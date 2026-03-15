import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps Express async route handlers to automatically catch errors 
 * and pass them to the global Express error handler via next(err).
 * 
 * Eliminates the need for try/catch blocks in every single route.
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
