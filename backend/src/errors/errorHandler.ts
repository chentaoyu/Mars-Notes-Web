import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      data: null,
      error: err.message,
      code: err.code,
    });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({
    data: null,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
