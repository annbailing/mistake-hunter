import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as authService from "../services/auth.service";

export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { phone, password, nickname, grade_level } = req.body;
    const result = await authService.register(phone, password, nickname, grade_level);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { phone, password } = req.body;
    const result = await authService.login(phone, password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.getProfile(req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { nickname, grade_level, gradeLevel, grade } = req.body;
    const gradeLevelFinal = gradeLevel || grade_level;
    let avatarUrl = req.body.avatar_url || req.body.avatarUrl;

    if (req.file) {
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const result = await authService.updateProfile(req.user!.id, {
      nickname,
      avatarUrl,
      gradeLevel: gradeLevelFinal,
      grade,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
