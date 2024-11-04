import mongoose, { Types } from "mongoose";
import { AuthenticatedRequest } from "../../middlewares/auth.js";
import { Meeting } from "../meetings/meeting.model.js";
import { Task } from "../tasks/task.model.js";
import { Response } from "express";
import logger from "../../logger.js";

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
    const now = Date.now();

    const totalMeetings = await Meeting.countDocuments({ userId });

    const taskSummary = await Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const upcomingMeetings = await Meeting.find({
      userId,
      date: { $gte: now },
    })
      .sort({ date: 1 })
      .limit(5)
      .select("_id title date participants")
      .lean() // We don't need the full document, just the data we need
      .exec();

    const overdueTasks = await Task.find({
      userId,
      dueDate: { $lt: now },
      status: { $ne: "completed" },
    })
      .populate("meetingId", "title")
      .select("_id title dueDate meetingId")
      .lean()
      .exec();

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

    const upcomingMeetingsProcessed: UpcomingMeeting[] = upcomingMeetings.map(
      (meeting: any) => ({
        _id: meeting._id,
        title: meeting.title,
        date: meeting.date,
        participantCount: meeting.participants.length,
      })
    );

    const overdueTasksProcessed: OverdueTask[] = overdueTasks.map(
      (task: any) => ({
        _id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        meetingId: task.meetingId ? task.meetingId._id.toString() : "",
        meetingTitle: task.meetingId ? task.meetingId.title : "",
      })
    );

    const dashboardData: DashboardData = {
      totalMeetings,
      taskSummary: taskSummaryProcessed,
      upcomingMeetings: upcomingMeetingsProcessed,
      overdueTasks: overdueTasksProcessed,
    };

    res.json(dashboardData);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
