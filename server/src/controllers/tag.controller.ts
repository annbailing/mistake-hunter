import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as tagService from "../services/tag.service";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await tagService.getAll(req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, color } = req.body;
    const result = await tagService.create(req.user!.id, { name, color });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, color } = req.body;
    const result = await tagService.update(req.user!.id, req.params.id, { name, color });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await tagService.remove(req.user!.id, req.params.id);
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}
