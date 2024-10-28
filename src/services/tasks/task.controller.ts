import { Response } from "express";
import { Task } from "./task.model.js";
import { AuthenticatedRequest } from "../../middlewares/auth.js";

export const getAllTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = await Task.find({ userId: req.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
