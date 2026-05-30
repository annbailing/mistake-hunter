import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as subjectController from "../controllers/subject.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", subjectController.getAll);

router.post(
  "/",
  [body("name").notEmpty().withMessage("科目名称不能为空"), validate],
  subjectController.create
);

router.put("/:id", subjectController.update);

router.delete("/:id", subjectController.remove);

router.get("/:id/chapters", subjectController.getChapters);

router.post(
  "/:id/chapters",
  [body("name").notEmpty().withMessage("章节名称不能为空"), validate],
  subjectController.createChapter
);

export default router;
