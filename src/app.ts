import express from "express";
import connectDB from "./db.js";
import { meetingRoutes } from "./routes/meeting.routes.js";
import { taskRoutes } from "./routes/task.routes.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";
import { authMiddleware } from "./auth.middleware.js";

const app = express();

connectDB;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the MeetingBot API" });
});
app.use("/api/meetings", authMiddleware, meetingRoutes);
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

export default app;
