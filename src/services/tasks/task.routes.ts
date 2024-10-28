import express from "express";
import { getAllTasks } from "./task.controller.js";
import { validate } from "../../middlewares/validate.js";
import { getTasksQuerySchema } from "./task.validation.js";

export const router = express.Router();

router.get("/", validate({ query: getTasksQuerySchema }), getAllTasks);
export { router as taskRoutes };
