import { Response, NextFunction } from "express";
import { AIService } from "../services/aiService";
import { AuthRequest } from "../types";

const aiService = new AIService();

export class AIController {
  async getConfig(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const config = await aiService.getAIConfig(userId);
      res.json({ data: config });
    } catch (error: any) {
      console.error("获取 AI 配置失败:", error);
      next(error);
    }
  }

  async updateConfig(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { provider, apiKey, model } = req.body;

      if (!apiKey || !model) {
        res
          .status(400)
          .json({
            data: null,
            error: "缺少必要参数",
            code: "VALIDATION_ERROR",
          });
        return;
      }

      const config = await aiService.upsertAIConfig(userId, {
        provider,
        apiKey,
        model,
      });

      res.json({ data: config });
    } catch (error: any) {
      console.error("更新 AI 配置失败:", error);
      next(error);
    }
  }

  async deleteConfig(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      await aiService.deleteAIConfig(userId);
      res.json({ data: null, message: "配置已删除" });
    } catch (error: any) {
      console.error("删除 AI 配置失败:", error);
      next(error);
    }
  }

  async getSessions(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const type = req.query.type as string | undefined;
      const sessions = await aiService.getSessions(userId, type);
      res.json({ data: sessions });
    } catch (error: any) {
      console.error("获取聊天会话失败:", error);
      next(error);
    }
  }

  async createSession(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { title, scenarioDialogId } = req.body;

      const session = await aiService.createSession(userId, {
        title,
        scenarioDialogId,
      });

      res.status(201).json({ data: session });
    } catch (error: any) {
      console.error("创建聊天会话失败:", error);
      next(error);
    }
  }

  async getSession(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const session = await aiService.getSessionById(id, userId);
      if (!session) {
        res
          .status(404)
          .json({ data: null, error: "会话不存在", code: "NOT_FOUND" });
        return;
      }

      res.json({ data: session });
    } catch (error: any) {
      console.error("获取会话详情失败:", error);
      next(error);
    }
  }

  async updateSession(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { title, model } = req.body;

      const session = await aiService.updateSession(id, userId, {
        title,
        model,
      });
      res.json({ data: session });
    } catch (error: any) {
      console.error("更新会话失败:", error);
      next(error);
    }
  }

  async deleteSession(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      await aiService.deleteSession(id, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error("删除会话失败:", error);
      next(error);
    }
  }

  async sendMessage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { sessionId, message, model } = req.body;

      if (!sessionId || !message) {
        res
          .status(400)
          .json({
            data: null,
            error: "缺少必要参数",
            code: "VALIDATION_ERROR",
          });
        return;
      }

      const stream = await aiService.sendChatMessage(
        userId,
        sessionId,
        message,
        model
      );

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // 禁用 nginx 缓冲

      // 将流式数据转发给客户端
      const reader = stream.getReader();

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            // 确保数据被立即发送
            res.write(value);
            // 强制刷新缓冲区
            if (typeof (res as any).flush === "function") {
              (res as any).flush();
            }
          }
        } catch (error) {
          console.error("流式传输错误:", error);
          if (!res.headersSent) {
            res
              .status(500)
              .json({
                data: null,
                error: "流式传输失败",
                code: "INTERNAL_ERROR",
              });
          } else {
            res.end();
          }
        }
      };

      // 监听客户端断开连接
      req.on("close", () => {
        reader.cancel();
      });

      pump();
    } catch (error: any) {
      console.error("发送消息失败:", error);
      if (error.message === "请先配置 AI 设置") {
        res
          .status(400)
          .json({ data: null, error: error.message, code: "VALIDATION_ERROR" });
        return;
      }
      if (error.message === "会话不存在") {
        res
          .status(404)
          .json({ data: null, error: error.message, code: "NOT_FOUND" });
        return;
      }
      next(error);
    }
  }

  async getTokenStats(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const days = parseInt((req.query.days as string) || "30");

      const stats = await aiService.getTokenStats(userId, days);
      res.json({ data: stats });
    } catch (error: any) {
      console.error("获取 Token 统计失败:", error);
      next(error);
    }
  }
}
