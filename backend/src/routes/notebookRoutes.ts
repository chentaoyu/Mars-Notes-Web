import { Router } from "express";
import { NotebookController } from "../controllers/notebookController";
import { authenticate } from "../middleware/auth";

const router = Router();
const notebookController = new NotebookController();

router.use(authenticate);

router.get("/", notebookController.getNotebooks.bind(notebookController));
router.get("/:id", notebookController.getNotebookById.bind(notebookController));
router.post("/", notebookController.createNotebook.bind(notebookController));
router.put("/:id", notebookController.updateNotebook.bind(notebookController));
router.delete("/:id", notebookController.deleteNotebook.bind(notebookController));

export default router;

