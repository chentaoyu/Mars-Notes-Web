import { Request } from "express";

// Backend specific types
export interface AuthRequest extends Request {
  userId?: string;
}

