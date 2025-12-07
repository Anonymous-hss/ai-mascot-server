import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * Activity Controller - Handles activity log queries and statistics
 */

/**
 * Get user activity logs
 */
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const logs = await prisma.activityLog.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Parse metadata
    const parsedLogs = logs.map((log: any) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }));

    res.json({ success: true, data: parsedLogs });
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get activity statistics for dashboard
 */
export const getActivityStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get total activities
    const totalActivities = await prisma.activityLog.count({
      where: { userId: userId as string }
    });

    // Get activities by action type
    const activitiesByAction = await prisma.activityLog.groupBy({
      by: ['action'],
      where: { userId: userId as string },
      _count: { action: true }
    });

    // Get total time saved (sum of all durations)
    const totalDurationResult = await prisma.activityLog.aggregate({
      where: { 
        userId: userId as string,
        duration: { not: null }
      },
      _sum: { duration: true }
    });

    const totalTimeSavedMs = totalDurationResult._sum.duration || 0;
    const totalTimeSavedMinutes = Math.round(totalTimeSavedMs / 60000);
    const totalTimeSavedHours = (totalTimeSavedMs / 3600000).toFixed(1);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivities = await prisma.activityLog.count({
      where: {
        userId: userId as string,
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Get activity timeline (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timelineActivities = await prisma.activityLog.findMany({
      where: {
        userId: userId as string,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true,
        action: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const timeline: Record<string, number> = {};
    timelineActivities.forEach((activity: any) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      timeline[date] = (timeline[date] || 0) + 1;
    });

    // Success rate
    const successCount = await prisma.activityLog.count({
      where: {
        userId: userId as string,
        status: 'success'
      }
    });

    const successRate = totalActivities > 0 
      ? ((successCount / totalActivities) * 100).toFixed(1)
      : '0';

    res.json({
      success: true,
      data: {
        totalActivities,
        activitiesByAction: activitiesByAction.map((item: any) => ({
          action: item.action,
          count: item._count.action
        })),
        timeSaved: {
          milliseconds: totalTimeSavedMs,
          minutes: totalTimeSavedMinutes,
          hours: totalTimeSavedHours,
          formatted: `${totalTimeSavedHours} hours`
        },
        recentActivities,
        timeline,
        successRate: `${successRate}%`
      }
    });
  } catch (error: any) {
    console.error('Get activity stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get activity summary for a specific time period
 */
export const getActivitySummary = async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const activities = await prisma.activityLog.findMany({
      where: {
        userId: userId as string,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary
    const summary = {
      totalActions: activities.length,
      successfulActions: activities.filter((a: any) => a.status === 'success').length,
      failedActions: activities.filter((a: any) => a.status === 'failed').length,
      averageDuration: activities.filter((a: any) => a.duration).length > 0
        ? Math.round(activities.reduce((sum: number, a: any) => sum + (a.duration || 0), 0) / activities.filter((a: any) => a.duration).length)
        : 0,
      actionBreakdown: {} as Record<string, number>
    };

    // Count actions by type
    activities.forEach((activity: any) => {
      summary.actionBreakdown[activity.action] = (summary.actionBreakdown[activity.action] || 0) + 1;
    });

    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Get activity summary error:', error);
    res.status(500).json({ error: error.message });
  }
};
