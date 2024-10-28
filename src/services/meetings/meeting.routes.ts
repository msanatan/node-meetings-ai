import express from "express";
import { Meeting } from "./meeting.model.js";
import { AuthenticatedRequest } from "../../middlewares/auth.js";
import { getAllMeetings, getMeetingStats } from "./meeting.controller.js";

export const router = express.Router();

router.get("/", getAllMeetings);
router.get("/stats", getMeetingStats);

export { router as meetingRoutes };
