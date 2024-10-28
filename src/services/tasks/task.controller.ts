import { Response } from "express";
import { Task } from "./task.model.js";
import { AuthenticatedRequest } from "../../middlewares/auth.js";

export const getAllTasks = async (req: AuthenticatedRequest, res: Response) => {
  const { limit, page } = req.query as unknown as {
    limit: number;
    page: number;
  };

  try {
    const parsedLimit = Number(limit) || 10;
    const parsedPage = Number(page) || 1;

    const tasks = await Task.find({ userId: req.userId })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit)
      .exec();

    const total = await Task.countDocuments({ userId: req.userId });

    res.json({
      total,
      limit: parsedLimit,
      page: parsedPage,
      data: tasks,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
