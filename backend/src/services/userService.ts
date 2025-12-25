import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma";
import { NotFoundError, UnauthorizedError, ValidationError } from "../errors/AppError";
import { UpdateUserInput, UpdatePasswordInput, DeleteAccountInput } from "../utils/validations";

export class UserService {
  async updateName(userId: string, data: UpdateUserInput) {
    if (!data.name) {
      throw new ValidationError("昵称不能为空");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      message: "昵称修改成功",
    };
  }

  async updateAvatar(userId: string, image: string) {
    // 简单的URL验证
    try {
      new URL(image);
    } catch {
      throw new ValidationError("无效的图片URL");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { image },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      message: "头像更新成功",
    };
  }

  async deleteAvatar(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { image: null },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      message: "头像已删除",
    };
  }

  async updatePassword(userId: string, data: UpdatePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      throw new NotFoundError("用户不存在");
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("当前密码错误");
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      data: null,
      message: "密码修改成功，请重新登录",
    };
  }

  async deleteAccount(userId: string, data: DeleteAccountInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      throw new NotFoundError("用户不存在");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("密码错误");
    }

    // 删除用户及其所有关联数据（级联删除）
    await prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: "账户已注销",
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    // 这里应该实现文件上传逻辑，暂时返回一个占位符URL
    // 实际项目中应该上传到云存储（如 AWS S3, 阿里云 OSS 等）
    const imageUrl = `/uploads/avatars/${userId}-${Date.now()}-${file.originalname}`;
    
    // 更新用户头像
    const user = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return {
      data: {
        avatar: imageUrl,
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
      message: "头像上传成功",
    };
  }
}

