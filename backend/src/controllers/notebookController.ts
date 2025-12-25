import { Response, NextFunction } from "express";
import { NotebookService } from "../services/notebookService";
import { AuthRequest } from "../types";

const notebookService = new NotebookService();

export class NotebookController {
  async getNotebooks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notebookService.getNotebooks(req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getNotebookById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notebookService.getNotebookById(req.params.id, req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createNotebook(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notebookService.createNotebook(req.userId!, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateNotebook(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notebookService.updateNotebook(req.params.id, req.userId!, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteNotebook(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await notebookService.deleteNotebook(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

