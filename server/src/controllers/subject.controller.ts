import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as subjectService from "../services/subject.service";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await subjectService.getAll(req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, icon, sort_order } = req.body;
    const result = await subjectService.create(req.user!.id, {
      name,
      icon,
      sortOrder: sort_order,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, icon, sort_order } = req.body;
    const result = await subjectService.update(req.user!.id, req.params.id, {
      name,
      icon,
      sortOrder: sort_order,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await subjectService.remove(req.user!.id, req.params.id);
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function getChapters(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await subjectService.getChapters(req.user!.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createChapter(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, parent_id, level, sort_order } = req.body;
    const result = await subjectService.createChapter(req.user!.id, req.params.id, {
      name,
      parentId: parent_id,
      level,
      sortOrder: sort_order,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
