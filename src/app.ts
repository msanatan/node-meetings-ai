import express from "express";
import mongoose from "mongoose";
import { meetingRoutes } from "./routes/meetings.js";
import { taskRoutes } from "./routes/task.router.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { authMiddleware } from "./auth.middleware.js";

const app = express();

await mongoose
  .connect("mongodb://localhost:27017/meetingbot")
  .then((conn) => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the MeetingBot API" });
});

app.use("/api/meetings", authMiddleware, meetingRoutes);
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

export default app;
