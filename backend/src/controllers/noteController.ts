import { Response, NextFunction } from "express";
import { NoteService } from "../services/noteService";
import { AuthRequest } from "../types";

const noteService = new NoteService();

export class NoteController {
  async getNotes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await noteService.getNotes(req.userId!, {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        search: req.query.search as string,
        notebookId: req.query.notebookId as string,
        tagIds: req.query.tagIds ? (req.query.tagIds as string).split(",") : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getNoteById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await noteService.getNoteById(req.params.id, req.userId!);
      res.json({ data: note });
    } catch (error) {
      next(error);
    }
  }

  async createNote(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await noteService.createNote(req.userId!, req.body);
      res.status(201).json({ data: note });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await noteService.updateNote(req.params.id, req.userId!, req.body);
      res.json({ data: note });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await noteService.deleteNote(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

