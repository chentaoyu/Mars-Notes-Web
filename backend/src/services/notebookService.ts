import { prisma } from "../utils/prisma";
import { NotFoundError, ConflictError } from "../errors/AppError";

export class NotebookService {
  async getNotebooks(userId: string) {
    const allNotebooks = await prisma.notebook.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    // 构建树形结构
    const buildTree = (parentId: string | null = null): any[] => {
      return allNotebooks
        .filter((nb: { parentId: string | null }) => nb.parentId === parentId)
        .map((notebook: any) => ({
          ...notebook,
          children: buildTree(notebook.id),
        }));
    };

    const tree = buildTree();

    return {
      data: tree,
      message: "获取笔记本列表成功",
    };
  }

  async getNotebookById(id: string, userId: string) {
    const notebook = await prisma.notebook.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
      },
    });

    if (!notebook) {
      throw new NotFoundError("笔记本不存在");
    }

    return { data: notebook };
  }

  async createNotebook(
    userId: string,
    data: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
      parentId?: string | null;
    }
  ) {
    const { name, description, color, icon, parentId } = data;

    // 如果指定了 parentId，验证父笔记本存在且属于当前用户
    if (parentId) {
      const parentNotebook = await prisma.notebook.findUnique({
        where: { id: parentId },
      });

      if (!parentNotebook || parentNotebook.userId !== userId) {
        throw new NotFoundError("父笔记本不存在或无权限");
      }
    }

    // 检查是否已存在同名笔记本（在同一父级下）
    const existingNotebook = await prisma.notebook.findFirst({
      where: {
        userId,
        name,
        parentId: parentId || null,
      },
    });

    if (existingNotebook) {
      throw new ConflictError("笔记本名称已存在");
    }

    // 获取当前最大的 sortOrder（在同一父级下）
    const maxSortOrder = await prisma.notebook.findFirst({
      where: {
        userId,
        parentId: parentId || null,
      },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    // 创建笔记本
    const notebook = await prisma.notebook.create({
      data: {
        userId,
        name,
        description,
        color,
        icon,
        parentId: parentId || null,
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
      },
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
      },
    });

    return {
      data: notebook,
      message: "笔记本创建成功",
    };
  }

  async updateNotebook(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
    }
  ) {
    const notebook = await prisma.notebook.findFirst({
      where: { id, userId },
    });

    if (!notebook) {
      throw new NotFoundError("笔记本不存在");
    }

    const updated = await prisma.notebook.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
      },
    });

    return {
      data: updated,
      message: "笔记本更新成功",
    };
  }

  async deleteNotebook(id: string, userId: string) {
    const notebook = await prisma.notebook.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            notes: true,
            children: true,
          },
        },
      },
    });

    if (!notebook) {
      throw new NotFoundError("笔记本不存在");
    }

    // 检查是否有笔记或子笔记本
    if (notebook._count.notes > 0 || notebook._count.children > 0) {
      throw new ConflictError("笔记本中还有笔记或子笔记本，无法删除");
    }

    await prisma.notebook.delete({
      where: { id },
    });

    return { data: null, message: "笔记本删除成功" };
  }
}
