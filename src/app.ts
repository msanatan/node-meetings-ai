import express from "express";
import { meetingRoutes } from "./services/meetings/meeting.routes.js";
import { taskRoutes } from "./services/tasks/task.routes.js";
import { dashboardRoutes } from "./services/dashboard/dashboard.routes.js";
import { authMiddleware } from "./middlewares/auth.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the MeetingBot API" });
});
app.use("/api/meetings", authMiddleware, meetingRoutes);
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

export default app;
