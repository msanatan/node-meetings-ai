import express from "express";
import {
  createMeeting,
  getAllMeetings,
  getMeetingById,
  getMeetingStats,
  summarizeMeeting,
  updateMeetingTranscript,
} from "./meeting.controller.js";

export const router = express.Router();

router.get("/", getAllMeetings);
router.post("/", createMeeting);
router.get("/stats", getMeetingStats);
router.get("/:id", getMeetingById);
router.put("/:id/transcript", updateMeetingTranscript);
router.post("/:id/summarize", summarizeMeeting);

export { router as meetingRoutes };
