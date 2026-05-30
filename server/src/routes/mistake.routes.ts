import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as mistakeController from "../controllers/mistake.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  [
    body("subjectId").notEmpty().withMessage("科目ID不能为空"),
    body("title").notEmpty().withMessage("标题不能为空"),
    body("content").notEmpty().withMessage("内容不能为空"),
    body("errorType")
      .optional()
      .isIn(["concept", "compute", "read", "forget", "method"])
      .withMessage("错因类型无效"),
    validate,
  ],
  mistakeController.create
);

router.get("/", mistakeController.getList);

router.get("/:id", mistakeController.getById);

router.put("/:id", mistakeController.update);

router.delete("/:id", mistakeController.remove);

router.post(
  "/batch-delete",
  [body("ids").isArray({ min: 1 }).withMessage("请提供要删除的ID列表"), validate],
  mistakeController.batchRemove
);

router.post("/:id/analyze", mistakeController.analyze);

router.post("/:id/variants", mistakeController.generateVariants);

router.post("/:id/mark-mastered", mistakeController.markMastered);

export default router;
