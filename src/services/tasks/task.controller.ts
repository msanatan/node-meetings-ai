import { Response } from "express";
import { Task } from "./task.model.js";
import { AuthenticatedRequest } from "../../middlewares/auth.js";

export const getAllTasks = async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt((req.query?.limit as string) || "10", 10);
  const page = parseInt((req.query?.page as string) || "1", 10);

  try {
    const tasks = await Task.find({ userId: req.userId })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const total = await Task.countDocuments({ userId: req.userId });

    res.json({
      total,
      limit,
      page,
      data: tasks,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
