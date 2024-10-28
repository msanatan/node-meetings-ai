import express from "express";
import { getAllTasks } from "./task.controller.js";

export const router = express.Router();

router.get("/", getAllTasks);
export { router as taskRoutes };
