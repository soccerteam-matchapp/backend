import { Router } from "express";
import { asyncHandler, requireAuth } from "../middlewares/auth";
import { create, list, apply } from "../controllers/match.controller";

const router = Router();

router.use(requireAuth);

// 매칭 요청 생성 (팀장만 가능)
router.post("/", asyncHandler(create));

router.get("/list", asyncHandler(list));

router.post("/apply", asyncHandler(apply));

export default router;
