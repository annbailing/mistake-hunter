import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as authController from "../controllers/auth.controller";
import { avatarUpload } from "../upload";

const router = Router();

router.post(
  "/register",
  [
    body("phone").notEmpty().withMessage("手机号不能为空"),
    body("password").isLength({ min: 6 }).withMessage("密码至少6位"),
    body("nickname").notEmpty().withMessage("昵称不能为空"),
    body("grade_level")
      .isIn(["elementary", "junior", "senior", "university"])
      .withMessage("年级类型无效"),
    validate,
  ],
  authController.register
);

router.post(
  "/login",
  [
    body("phone").notEmpty().withMessage("手机号不能为空"),
    body("password").notEmpty().withMessage("密码不能为空"),
    validate,
  ],
  authController.login
);

router.get("/me", authMiddleware, authController.getMe);

router.put(
  "/profile",
  authMiddleware,
  avatarUpload.single("avatar"),
  [
    body("grade_level")
      .optional()
      .isIn(["elementary", "junior", "senior", "university"])
      .withMessage("年级类型无效"),
    validate,
  ],
  authController.updateProfile
);

export default router;
