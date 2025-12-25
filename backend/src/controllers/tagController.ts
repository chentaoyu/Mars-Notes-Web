import { Response, NextFunction } from "express";
import { TagService } from "../services/tagService";
import { AuthRequest } from "../types";

const tagService = new TagService();

export class TagController {
  async getTags(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tagService.getTags(req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTagById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tagService.getTagById(req.params.id, req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createTag(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tagService.createTag(req.userId!, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateTag(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tagService.updateTag(req.params.id, req.userId!, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTag(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await tagService.deleteTag(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

