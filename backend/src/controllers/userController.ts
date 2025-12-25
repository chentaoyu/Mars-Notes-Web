import { Response, NextFunction } from "express";
import { UserService } from "../services/userService";
import { AuthRequest } from "../types";
import multer from "multer";
import path from "path";
import fs from "fs";

const userService = new UserService();

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthRequest).userId!;
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 JPG、PNG、GIF 格式的图片"));
    }
  },
});

export const uploadAvatar = upload.single("file");

export class UserController {
  async updateName(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await userService.updateName(req.userId!, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateAvatar(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { image } = req.body;
      if (!image) {
        res
          .status(422)
          .json({
            data: null,
            error: "头像URL不能为空",
            code: "VALIDATION_ERROR",
          });
        return;
      }
      const result = await userService.updateAvatar(req.userId!, image);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAvatar(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await userService.deleteAvatar(req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatarFile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res
          .status(422)
          .json({ data: null, error: "请选择文件", code: "VALIDATION_ERROR" });
        return;
      }
      const result = await userService.uploadAvatar(req.userId!, file);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await userService.updatePassword(req.userId!, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await userService.deleteAccount(req.userId!, req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
