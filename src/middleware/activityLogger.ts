import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

/**
 * Activity Logger Middleware
 * Automatically logs user actions for analytics and time-saving metrics
 */

export interface ActivityMetadata {
  businessName?: string;
  industry?: string;
  month?: string;
  campaignName?: string;
  [key: string]: any;
}

/**
 * Log user activity
 */
export async function logActivity(
  userId: string,
  action: string,
  metadata?: ActivityMetadata,
  duration?: number,
  status: 'success' | 'failed' | 'pending' = 'success'
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null,
        duration,
        status
      }
    });
  } catch (error) {
    // Non-blocking: log error but don't fail the request
    console.error('Failed to log activity:', error);
  }
}

/**
 * Middleware to automatically log API calls
 */
export function activityLoggerMiddleware(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const userId = (req.body.userId || req.query.userId) as string;

    // Store start time in request for later use
    (req as any).activityStartTime = startTime;
    (req as any).activityAction = action;
    (req as any).activityUserId = userId;

    // Continue to next middleware
    next();
  };
}

/**
 * Middleware to log activity after response
 */
export function activityLoggerComplete() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Hook into response finish event
    res.on('finish', async () => {
      const startTime = (req as any).activityStartTime;
      const action = (req as any).activityAction;
      const userId = (req as any).activityUserId;

      if (startTime && action && userId) {
        const duration = Date.now() - startTime;
        const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failed';

        // Extract metadata from request body
        const metadata: ActivityMetadata = {};
        if (req.body.businessName) metadata.businessName = req.body.businessName;
        if (req.body.industry) metadata.industry = req.body.industry;
        if (req.body.month) metadata.month = req.body.month;
        if (req.body.campaignName) metadata.campaignName = req.body.campaignName;

        await logActivity(userId, action, metadata, duration, status);
      }
    });

    next();
  };
}
