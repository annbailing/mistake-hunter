import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as tagController from "../controllers/tag.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", tagController.getAll);

router.post(
  "/",
  [body("name").notEmpty().withMessage("标签名称不能为空"), validate],
  tagController.create
);

router.put("/:id", tagController.update);

router.delete("/:id", tagController.remove);

export default router;
