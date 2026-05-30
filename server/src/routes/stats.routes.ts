import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import * as statsController from "../controllers/stats.controller";

const router = Router();

router.use(authMiddleware);

router.get("/summary", statsController.getSummary);

router.get("/trend", statsController.getTrend);

router.get("/error-types", statsController.getErrorTypes);

router.get("/knowledge-weakness", statsController.getKnowledgeWeakness);

export default router;
