import { Router } from "express";
import { AIController } from "../controllers/aiController";
import { authenticate } from "../middleware/auth";

const router = Router();
const controller = new AIController();

// AI 配置
router.get("/config", authenticate, controller.getConfig.bind(controller));
router.post("/config", authenticate, controller.updateConfig.bind(controller));
router.put("/config", authenticate, controller.updateConfig.bind(controller));
router.delete("/config", authenticate, controller.deleteConfig.bind(controller));

// 聊天会话
router.get("/sessions", authenticate, controller.getSessions.bind(controller));
router.post("/sessions", authenticate, controller.createSession.bind(controller));
router.get("/sessions/:id", authenticate, controller.getSession.bind(controller));
router.put("/sessions/:id", authenticate, controller.updateSession.bind(controller));
router.delete("/sessions/:id", authenticate, controller.deleteSession.bind(controller));

// 发送消息（流式传输）
router.post("/chat", authenticate, controller.sendMessage.bind(controller));

// Token 统计
router.get("/tokens", authenticate, controller.getTokenStats.bind(controller));

export default router;

