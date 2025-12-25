import { Router } from "express";
import { ScenarioDialogController } from "../controllers/scenarioDialogController";
import { authenticate } from "../middleware/auth";

const router = Router();
const controller = new ScenarioDialogController();

router.get("/", authenticate, controller.getScenarioDialogs.bind(controller));
router.get("/enabled", authenticate, controller.getEnabledScenarioDialogs.bind(controller));
router.post("/", authenticate, controller.createScenarioDialog.bind(controller));
router.patch("/:id", authenticate, controller.updateScenarioDialog.bind(controller));
router.delete("/:id", authenticate, controller.deleteScenarioDialog.bind(controller));

export default router;

