import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
    }
  }
}

/**
 * Session ID Middleware: extracts from x-session-id header or creates one
 */
export function sessionIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  let sid = req.headers['x-session-id'] as string;
  if (!sid || typeof sid !== 'string' || sid.trim().length === 0) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  req.sessionId = sid;
  res.setHeader('x-session-id', sid);
  next();
}

/**
 * In-memory Sliding Window Rate Limiter
 */
interface RateBucket {
  count: number;
  resetAt: number;
}
const rateMap = new Map<string, RateBucket>();

export function rateLimitMiddleware(limitPerMinute: number = 60) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.sessionId || req.ip || 'global'}_${req.baseUrl || ''}`;
    const now = Date.now();
    const windowMs = 60 * 1000;

    const bucket = rateMap.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= limitPerMinute) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit of ${limitPerMinute} req/min exceeded. Please try again shortly.`,
        retryAfterMs: bucket.resetAt - now,
      });
      return;
    }

    bucket.count++;
    next();
  };
}

/**
 * Custom Conflict Error for 409 handling
 */
export class ConflictError extends Error {
  constructor(message: string = 'Resource conflict or concurrent modification detected') {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Centralized Error Handling Middleware
 */
export function errorHandlerMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('API Error Encountered:', err);

  // 1. Zod Validation Error (400)
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      details: err.issues.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // 2. 409 Conflict Error
  if (err instanceof ConflictError || err.statusCode === 409 || err.name === 'ConflictError') {
    res.status(409).json({
      error: 'Conflict',
      message: err.message || 'A conflicting edit was detected on this map or node.',
    });
    return;
  }

  // 3. Not Found (404)
  if (err.statusCode === 404 || err.message?.includes('not found')) {
    res.status(404).json({
      error: 'Not Found',
      message: err.message,
    });
    return;
  }

  // 4. Default 500
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
}
