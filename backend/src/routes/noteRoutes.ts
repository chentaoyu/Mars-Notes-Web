import { Router } from "express";
import { NoteController } from "../controllers/noteController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createNoteSchema, updateNoteSchema } from "../utils/validations";

const router = Router();
const noteController = new NoteController();

router.use(authenticate);

router.get("/", noteController.getNotes.bind(noteController));
router.get("/:id", noteController.getNoteById.bind(noteController));
router.post("/", validate(createNoteSchema), noteController.createNote.bind(noteController));
router.put("/:id", validate(updateNoteSchema), noteController.updateNote.bind(noteController));
router.delete("/:id", noteController.deleteNote.bind(noteController));

export default router;

