import express from "express";
import { getDashboardStats } from "./dashboard.controller";

const router = express.Router();

router.get("/", getDashboardStats);

export { router as dashboardRoutes };
