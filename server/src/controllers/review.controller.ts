import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as reviewService from "../services/review.service";

export async function getToday(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await reviewService.getToday(req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function complete(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { feedback } = req.body;
    const result = await reviewService.complete(req.user!.id, req.params.id, feedback);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getSchedule(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await reviewService.getSchedule(req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
