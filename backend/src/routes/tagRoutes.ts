import { Router } from "express";
import { TagController } from "../controllers/tagController";
import { authenticate } from "../middleware/auth";

const router = Router();
const tagController = new TagController();

router.use(authenticate);

router.get("/", tagController.getTags.bind(tagController));
router.get("/:id", tagController.getTagById.bind(tagController));
router.post("/", tagController.createTag.bind(tagController));
router.put("/:id", tagController.updateTag.bind(tagController));
router.delete("/:id", tagController.deleteTag.bind(tagController));

export default router;

