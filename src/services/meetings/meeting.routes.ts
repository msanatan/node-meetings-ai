import express from "express";
import {
  createMeeting,
  getAllMeetings,
  getMeetingStats,
} from "./meeting.controller.js";

export const router = express.Router();

router.get("/", getAllMeetings);
router.post("/", createMeeting);
router.get("/stats", getMeetingStats);

export { router as meetingRoutes };
