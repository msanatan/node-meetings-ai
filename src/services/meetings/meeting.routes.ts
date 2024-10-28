import express from "express";
import {
  createMeeting,
  getAllMeetings,
  getMeetingById,
  getMeetingStats,
  summarizeMeeting,
  updateMeetingTranscript,
} from "./meeting.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  createMeetingSchema,
  updateTranscriptSchema,
} from "./meeting.validation.js";

export const router = express.Router();

router.get("/", getAllMeetings);
router.post("/", validate({ body: createMeetingSchema }), createMeeting);
router.get("/stats", getMeetingStats);
router.get("/:id", getMeetingById);
router.put(
  "/:id/transcript",
  validate({ body: updateTranscriptSchema }),
  updateMeetingTranscript
);
router.post("/:id/summarize", summarizeMeeting);

export { router as meetingRoutes };
