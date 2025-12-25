import { Router } from "express";
import { UserController, uploadAvatar } from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateUserSchema, updatePasswordSchema, deleteAccountSchema } from "../utils/validations";

const router = Router();
const userController = new UserController();

router.use(authenticate);

router.put("/name", validate(updateUserSchema), userController.updateName.bind(userController));
router.put("/avatar", userController.updateAvatar.bind(userController));
router.delete("/avatar", userController.deleteAvatar.bind(userController));
router.post("/upload", uploadAvatar, userController.uploadAvatarFile.bind(userController));
router.put("/password", validate(updatePasswordSchema), userController.updatePassword.bind(userController));
router.delete("/delete", validate(deleteAccountSchema), userController.deleteAccount.bind(userController));

export default router;

