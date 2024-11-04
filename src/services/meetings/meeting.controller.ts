import { Response } from "express";
import { Meeting } from "./meeting.model.js";
import { AuthenticatedRequest } from "../../middlewares/auth.js";
import { Task } from "../tasks/task.model.js";
import logger from "../../logger.js";

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
  const { transcript } = req.body;

  try {
    const meeting = await Meeting.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { transcript },
      { new: true }
    );

    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    res.json(meeting);
    logger.info({
      message: "Transcript updated",
      meetingId: id,
      userId: req.userId,
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

export const getMeetingStats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // TODO: get statistics from the database
    const stats = {
      generalStats: {
        totalMeetings: 100,
        averageParticipants: 4.75,
        totalParticipants: 475,
        shortestMeeting: 15,
        longestMeeting: 120,
        averageDuration: 45.3,
      },
      topParticipants: [
        { participant: "John Doe", meetingCount: 20 },
        { participant: "Jane Smith", meetingCount: 18 },
        { participant: "Bob Johnson", meetingCount: 15 },
        { participant: "Alice Brown", meetingCount: 12 },
        { participant: "Charlie Davis", meetingCount: 10 },
      ],
      meetingsByDayOfWeek: [
        { dayOfWeek: 1, count: 10 },
        { dayOfWeek: 2, count: 22 },
        { dayOfWeek: 3, count: 25 },
        { dayOfWeek: 4, count: 20 },
        { dayOfWeek: 5, count: 18 },
        { dayOfWeek: 6, count: 5 },
        { dayOfWeek: 7, count: 0 },
      ],
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
