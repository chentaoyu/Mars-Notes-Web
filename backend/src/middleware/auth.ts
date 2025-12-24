import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AuthRequest } from "../types";
import { UnauthorizedError } from "../errors/AppError";

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.userId = payload.userId;
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid token"));
  }
}
