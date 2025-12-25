import express, { Express } from "express";
import cors from "cors";
import "express-async-errors";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import noteRoutes from "./routes/noteRoutes";
import notebookRoutes from "./routes/notebookRoutes";
import tagRoutes from "./routes/tagRoutes";
import userRoutes from "./routes/userRoutes";
import scenarioDialogRoutes from "./routes/scenarioDialogRoutes";
import aiRoutes from "./routes/aiRoutes";
import { errorHandler } from "./errors/errorHandler";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 版本信息路由（不需要认证）
  app.get("/api/version", (_req, res) => {
    res.json({ version: "1.0.0" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/notes", noteRoutes);
  app.use("/api/notebooks", notebookRoutes);
  app.use("/api/tags", tagRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/scenario-dialogs", scenarioDialogRoutes);
  app.use("/api/ai", aiRoutes);

  app.use(errorHandler);

  return app;
}
