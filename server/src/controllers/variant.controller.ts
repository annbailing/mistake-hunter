import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as variantService from "../services/variant.service";

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await variantService.getById(req.user!.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function submitAnswer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { my_answer } = req.body;
    const result = await variantService.submitAnswer(req.user!.id, req.params.id, my_answer);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
