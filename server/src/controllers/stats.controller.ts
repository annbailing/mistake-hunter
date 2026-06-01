import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as statsService from "../services/stats.service";

export async function getSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await statsService.getSummary(req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getTrend(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { period, subject_id } = req.query;
    const result = await statsService.getTrend(
      req.user!.id,
      (period as "week" | "month" | "all") || "week",
      subject_id as string
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getErrorTypes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { subject_id } = req.query;
    const result = await statsService.getErrorTypes(req.user!.id, subject_id as string);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getKnowledgeWeakness(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { subject_id } = req.query;
    const result = await statsService.getKnowledgeWeakness(req.user!.id, subject_id as string);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
