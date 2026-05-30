import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as mistakeService from "../services/mistake.service";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const result = await mistakeService.create(req.user!.id, data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getList(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { subject_id, error_type, tag_id, keyword, date_from, date_to, page, limit } = req.query;
    const result = await mistakeService.getList(req.user!.id, {
      subjectId: subject_id as string,
      errorType: error_type as any,
      tagId: tag_id as string,
      keyword: keyword as string,
      dateFrom: date_from as string,
      dateTo: date_to as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await mistakeService.getById(req.user!.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await mistakeService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await mistakeService.remove(req.user!.id, req.params.id);
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function batchRemove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const result = await mistakeService.batchRemove(req.user!.id, ids);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function analyze(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await mistakeService.analyzeError(req.user!.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function generateVariants(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await mistakeService.generateVariants(req.user!.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function markMastered(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await mistakeService.markMastered(req.user!.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
