import { Request } from "express";
import { User } from "@note-book/shared";

// Backend specific types
export interface AuthRequest extends Request {
  userId?: string;
  user?: User;
}

