import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../errors/AppError";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}
