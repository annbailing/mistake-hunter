import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as reviewController from "../controllers/review.controller";

const router = Router();

router.use(authMiddleware);

router.get("/today", reviewController.getToday);

router.post(
  "/:id/complete",
  [
    body("feedback")
      .isIn(["mastered", "fuzzy", "forgot"])
      .withMessage("反馈类型无效"),
    validate,
  ],
  reviewController.complete
);

router.get("/schedule", reviewController.getSchedule);

export default router;
