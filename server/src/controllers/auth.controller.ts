import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as authService from "../services/auth.service";
import path from "path";
import fs from "fs";

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
    const { nickname, avatar_url, grade_level, grade } = req.body;
    let avatarUrl = avatar_url;

    if (req.file) {
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const result = await authService.updateProfile(req.user!.id, {
      nickname,
      avatarUrl,
      gradeLevel: grade_level,
      grade,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
