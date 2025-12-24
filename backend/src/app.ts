import express, { Express } from "express";
import cors from "cors";
import "express-async-errors";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import noteRoutes from "./routes/noteRoutes";
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

  app.use("/api/auth", authRoutes);
  app.use("/api/notes", noteRoutes);

  app.use(errorHandler);

  return app;
}
