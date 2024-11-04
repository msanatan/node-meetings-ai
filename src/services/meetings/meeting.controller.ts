import { Response } from "express";
import { PipelineStage } from "mongoose";
import { Meeting } from "./meeting.model.js";
import { AuthenticatedRequest } from "../../middlewares/auth.js";
import { Task } from "../tasks/task.model.js";
import logger from "../../logger.js";
import { getCache, setCache } from "../../utils/cache.js";
import { config } from "../../config.js";

export const getAllMeetings = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;

  try {
    const meetings = await Meeting.find({ userId: req.userId })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const total = await Meeting.countDocuments({ userId: req.userId });

    res.json({
      total,
      limit,
      page,
      data: meetings,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const createMeeting = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const meeting = new Meeting({
      ...req.body,
      userId: req.userId,
    });
    await meeting.save();
    res.status(201).json(meeting);
    logger.info({
      message: "Meeting created successfully",
      meetingId: meeting._id,
      userId: req.userId,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const getMeetingById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;

  try {
    const meeting = await Meeting.findOne({ _id: id, userId: req.userId });
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    const tasks = await Task.find({ meetingId: meeting._id });

    res.json({ meeting, tasks });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const updateMeetingTranscript = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;
  const { transcript, endDate } = req.body;

  try {
    const meeting = await Meeting.findOne({ _id: id, userId: req.userId });
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    // Update transcript
    meeting.transcript = transcript;

    const parsedEndDate = new Date(endDate);
    const parsedStartDate = new Date(meeting.date);

    if (parsedEndDate < parsedStartDate) {
      res
        .status(400)
        .json({ message: "End date cannot be before the start date" });
      return;
    }

    const duration = Math.round(
      (parsedEndDate.getTime() - parsedStartDate.getTime()) / 60000
    );

    meeting.endDate = parsedEndDate;
    meeting.duration = duration;

    await meeting.save();

    res.json(meeting);
    logger.info({
      message: "Transcript updated",
      meetingId: id,
      userId: req.userId,
      endDate: meeting.endDate,
      duration: meeting.duration,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const summarizeMeeting = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;

  try {
    const meeting = await Meeting.findOne({ _id: id, userId: req.userId });
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    if (!meeting.transcript) {
      res
        .status(400)
        .json({ message: "Transcript is required to generate summary" });
      return;
    }

    // Mock AI service to generate summary and action items
    const summary = `Summary for meeting "${meeting.title}"`;
    const actionItems = [
      {
        title: "Action Item 1",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Action Item 2",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    ];

    // Update meeting with summary
    meeting.summary = summary;
    await meeting.save();

    // Create tasks based on action items
    const tasks = actionItems.map((item) => ({
      meetingId: meeting._id,
      userId: meeting.userId,
      title: item.title,
      description: `Automatically generated task from summary.`,
      status: "pending",
      dueDate: item.dueDate,
    }));

    await Task.insertMany(tasks);

    res.json({
      summary,
      actionItems,
      createdTasks: tasks,
    });
    logger.info({
      message: "Summarized meeting",
      data: {
        summary,
        actionItems,
        createdTasks: tasks,
      },
      userId: req.userId,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export interface TopParticipant {
  participant: string;
  meetingCount: number;
}

export interface MeetingsByDayOfWeek {
  dayOfWeek: number;
  count: number;
}

export interface MeetingStats {
  generalStats: {
    totalMeetings: number;
    averageParticipants: number;
    totalParticipants: number;
    shortestMeeting: number;
    longestMeeting: number;
    averageDuration: number;
  };
  topParticipants: TopParticipant[];
  meetingsByDayOfWeek: MeetingsByDayOfWeek[];
}

export const getMeetingStats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    const cacheKey = `meetingStats:${userId}`;

    // Check if stats are cached
    const cachedStats = await getCache(cacheKey);
    if (cachedStats) {
      res.json(JSON.parse(cachedStats));
      return;
    }

    const stats: MeetingStats = {
      generalStats: {
        totalMeetings: 0,
        averageParticipants: 0,
        totalParticipants: 0,
        shortestMeeting: 0,
        longestMeeting: 0,
        averageDuration: 0,
      },
      topParticipants: [],
      meetingsByDayOfWeek: [],
    };

    const aggregationPipeline: PipelineStage[] = [
      { $match: { userId: userId } },
      {
        $facet: {
          generalStats: [
            {
              $match: {
                endDate: { $exists: true },
                duration: { $exists: true },
              },
            },
            {
              $project: {
                participantsCount: { $size: "$participants" },
                duration: "$duration",
              },
            },
            {
              $group: {
                _id: null,
                totalMeetings: { $sum: 1 },
                averageParticipants: { $avg: "$participantsCount" },
                totalParticipants: { $sum: "$participantsCount" },
                shortestMeeting: { $min: "$duration" },
                longestMeeting: { $max: "$duration" },
                averageDuration: { $avg: "$duration" },
              },
            },
          ],
          topParticipants: [
            { $unwind: "$participants" },
            {
              $group: {
                _id: "$participants",
                meetingCount: { $sum: 1 },
              },
            },
            { $sort: { meetingCount: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                participant: "$_id",
                meetingCount: 1,
              },
            },
          ],
          meetingsByDayOfWeek: [
            {
              $addFields: {
                dayOfWeek: { $isoDayOfWeek: "$date" },
              },
            },
            {
              $group: {
                _id: "$dayOfWeek",
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                dayOfWeek: "$_id",
                count: 1,
              },
            },
          ],
        },
      },
    ];

    const results = await Meeting.aggregate(aggregationPipeline).exec();

    if (results.length > 0) {
      const generalStatsData = results[0].generalStats[0];
      if (generalStatsData) {
        stats.generalStats = {
          totalMeetings: generalStatsData.totalMeetings || 0,
          averageParticipants: parseFloat(
            generalStatsData.averageParticipants?.toFixed(2) || "0"
          ),
          totalParticipants: generalStatsData.totalParticipants || 0,
          shortestMeeting: generalStatsData.shortestMeeting || 0,
          longestMeeting: generalStatsData.longestMeeting || 0,
          averageDuration: parseFloat(
            generalStatsData.averageDuration?.toFixed(2) || "0"
          ),
        };
      }

      stats.topParticipants = results[0].topParticipants;

      // Ensure all days of the week are represented
      const dayCounts: { [key: number]: number } = {};
      results[0].meetingsByDayOfWeek.forEach((item: any) => {
        dayCounts[item.dayOfWeek] = item.count;
      });

      for (let day = 1; day <= 7; day++) {
        stats.meetingsByDayOfWeek.push({
          dayOfWeek: day,
          count: dayCounts[day] || 0,
        });
      }
    }

    // Cache the result
    await setCache(
      cacheKey,
      JSON.stringify(stats),
      config.MEETING_STATS_CACHE_TTL
    );

    res.json(stats);
    logger.info({
      message: "Retrieved meeting statistics",
      userId: userId,
      stats: stats,
    });
  } catch (err) {
    logger.error({
      message: "Error retrieving meeting statistics",
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};
