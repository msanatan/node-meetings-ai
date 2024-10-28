import express from "express";
import connectDB from "./db.js";
import { meetingRoutes } from "./routes/meetings.js";
import { taskRoutes } from "./routes/task.router.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
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
