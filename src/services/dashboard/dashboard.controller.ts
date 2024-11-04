import mongoose, { Types } from "mongoose";
import { AuthenticatedRequest } from "../../middlewares/auth.js";
import { Meeting } from "../meetings/meeting.model.js";
import { Task } from "../tasks/task.model.js";
import { Response } from "express";
import logger from "../../logger.js";
import { getCache, setCache } from "../../utils/cache.js";
import { config } from "../../config.js";

interface UpcomingMeeting {
  _id: string;
  title: string;
  date: Date;
  participantCount: number;
}

interface OverdueTask {
  _id: string;
  title: string;
  dueDate: Date;
  meetingId: string;
  meetingTitle: string;
}

interface DashboardData {
  totalMeetings: number;
  taskSummary: {
    pending: number;
    "in-progress": number;
    completed: number;
  };
  upcomingMeetings: UpcomingMeeting[];
  overdueTasks: OverdueTask[];
}

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    const cacheKey = `dashboardStats:${userId}`;

    // Check if dashboard stats are cached
    const cachedStats = await getCache(cacheKey);
    if (cachedStats) {
      res.json(JSON.parse(cachedStats));
      return;
    }

    const now = Date.now();

    // Fetch Total Meetings
    const totalMeetingsPromise = Meeting.countDocuments({ userId });

    // Fetch Task Summary
    const taskSummaryPromise = Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Fetch Upcoming Meetings
    const upcomingMeetingsPromise = Meeting.find({
      userId,
      date: { $gte: now },
    })
      .sort({ date: 1 })
      .limit(5)
      .select("_id title date participants")
      .lean()
      .exec();

    // Fetch Overdue Tasks
    const overdueTasksPromise = Task.find({
      userId,
      dueDate: { $lt: now },
      status: { $ne: "completed" },
    })
      .populate("meetingId", "title")
      .select("_id title dueDate meetingId")
      .lean()
      .exec();

    // Execute all promises concurrently
    const [totalMeetings, taskSummary, upcomingMeetings, overdueTasks] =
      await Promise.all([
        totalMeetingsPromise,
        taskSummaryPromise,
        upcomingMeetingsPromise,
        overdueTasksPromise,
      ]);

    // Process Task Summary
    const taskSummaryProcessed = {
      pending: 0,
      "in-progress": 0,
      completed: 0,
    };

    taskSummary.forEach((item: { _id: string; count: number }) => {
      if (item._id in taskSummaryProcessed) {
        taskSummaryProcessed[item._id as keyof typeof taskSummaryProcessed] =
          item.count;
      }
    });

    // Process Upcoming Meetings
    const upcomingMeetingsProcessed: UpcomingMeeting[] = upcomingMeetings.map(
      (meeting: any) => ({
        _id: meeting._id,
        title: meeting.title,
        date: meeting.date,
        participantCount: meeting.participants.length,
      })
    );

    // Process Overdue Tasks
    const overdueTasksProcessed: OverdueTask[] = overdueTasks.map(
      (task: any) => ({
        _id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        meetingId: task.meetingId ? task.meetingId._id.toString() : "",
        meetingTitle: task.meetingId ? task.meetingId.title : "",
      })
    );

    // Assemble Dashboard Data
    const dashboardData: DashboardData = {
      totalMeetings,
      taskSummary: taskSummaryProcessed,
      upcomingMeetings: upcomingMeetingsProcessed,
      overdueTasks: overdueTasksProcessed,
    };

    // Cache the dashboard data
    await setCache(
      cacheKey,
      JSON.stringify(dashboardData),
      config.DASHBOARD_STATS_CACHE_TTL
    );

    res.json(dashboardData);
    logger.info({
      message: "Retrieved dashboard statistics",
      userId,
      dashboardData,
    });
  } catch (err) {
    logger.error({
      message: "Error retrieving dashboard statistics",
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};
