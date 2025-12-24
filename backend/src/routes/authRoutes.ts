import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../utils/validations";

const router = Router();
const authController = new AuthController();

router.post("/register", validate(registerSchema), authController.register.bind(authController));
router.post("/login", validate(loginSchema), authController.login.bind(authController));

export default router;

