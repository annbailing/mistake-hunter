import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as variantController from "../controllers/variant.controller";

const router = Router();

router.use(authMiddleware);

router.get("/:id", variantController.getById);

router.post(
  "/:id/answer",
  [body("my_answer").notEmpty().withMessage("答案不能为空"), validate],
  variantController.submitAnswer
);

export default router;
