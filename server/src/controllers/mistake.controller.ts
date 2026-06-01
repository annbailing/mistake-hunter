import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as mistakeService from "../services/mistake.service";

/** 将 multer 上传的文件转为 service 需要的格式 */
function mapUploadedFiles(files: Express.Multer.File[] | undefined) {
  if (!files || files.length === 0) return undefined;
  return (files as Express.Multer.File[]).map((f) => ({
    filePath: `/uploads/${f.filename}`,
  }));
}

/** 归一化 FormData 中可能为单值或数组的字段（处理形如 tagIds 或 tagIds[] 键名） */
function parseArrayField(body: any, fieldName: string): string[] | undefined {
  const value = body[fieldName] || body[`${fieldName}[]`];
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = {
      ...req.body,
      tagIds: parseArrayField(req.body, "tagIds"),
      images: mapUploadedFiles(req.files as any),
    };
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
    const data = {
      ...req.body,
      tagIds: parseArrayField(req.body, "tagIds"),
      keepImageIds: parseArrayField(req.body, "keepImageIds"),
      images: mapUploadedFiles(req.files as any),
    };
    const result = await mistakeService.update(req.user!.id, req.params.id, data);
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
