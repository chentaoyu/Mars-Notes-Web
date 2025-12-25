import { prisma } from "../utils/prisma";
import { NotFoundError, ConflictError } from "../errors/AppError";

export class TagService {
  async getTags(userId: string) {
    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { notes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      data: tags,
      message: "获取标签列表成功",
    };
  }

  async getTagById(id: string, userId: string) {
    const tag = await prisma.tag.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundError("标签不存在");
    }

    return { data: tag };
  }

  async createTag(userId: string, data: { name: string; color?: string }) {
    const { name, color } = data;

    try {
      const tag = await prisma.tag.create({
        data: {
          userId,
          name,
          color,
        },
        include: {
          _count: {
            select: { notes: true },
          },
        },
      });

      return {
        data: tag,
        message: "标签创建成功",
      };
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictError("标签名称已存在");
      }
      throw error;
    }
  }

  async updateTag(id: string, userId: string, data: { name?: string; color?: string }) {
    const tag = await prisma.tag.findFirst({
      where: { id, userId },
    });

    if (!tag) {
      throw new NotFoundError("标签不存在");
    }

    const updated = await prisma.tag.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    return {
      data: updated,
      message: "标签更新成功",
    };
  }

  async deleteTag(id: string, userId: string) {
    const tag = await prisma.tag.findFirst({
      where: { id, userId },
    });

    if (!tag) {
      throw new NotFoundError("标签不存在");
    }

    await prisma.tag.delete({
      where: { id },
    });

    return { data: null, message: "标签删除成功" };
  }
}

