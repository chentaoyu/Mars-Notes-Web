import { prisma } from "../utils/prisma";
import { CreateNoteInput, UpdateNoteInput } from "../utils/validations";
import { NotFoundError } from "../errors/AppError";

export class NoteService {
  async getNotes(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: "asc" | "desc";
      search?: string;
      notebookId?: string;
      tagIds?: string[];
    }
  ) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "updatedAt";
    const order = query.order || "desc";

    const where: any = { userId };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { content: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.notebookId) {
      where.notebookId = query.notebookId;
    }

    if (query.tagIds && query.tagIds.length > 0) {
      where.noteTags = {
        some: {
          tagId: { in: query.tagIds },
        },
      };
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { [sort]: order },
        take: limit,
        skip,
        select: {
          id: true,
          title: true,
          content: true,
          notebookId: true,
          createdAt: true,
          updatedAt: true,
          notebook: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          noteTags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.note.count({ where }),
    ]);

    const formattedNotes = notes.map((note: (typeof notes)[0]) => {
      const { noteTags, ...rest } = note;
      return {
        ...rest,
        createdAt: rest.createdAt.toISOString(),
        updatedAt: rest.updatedAt.toISOString(),
        tags: noteTags.map((nt: (typeof noteTags)[0]) => ({
          ...nt.tag,
          createdAt: nt.tag.createdAt.toISOString(),
          updatedAt: nt.tag.updatedAt.toISOString(),
        })),
        notebook: rest.notebook
          ? {
              ...rest.notebook,
            }
          : null,
      };
    });

    return {
      data: formattedNotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNoteById(id: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        notebook: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        noteTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundError("笔记不存在");
    }

    const { noteTags, ...rest } = note;
    return {
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      updatedAt: rest.updatedAt.toISOString(),
      tags: noteTags.map((nt: (typeof noteTags)[0]) => ({
        ...nt.tag,
        createdAt: nt.tag.createdAt.toISOString(),
        updatedAt: nt.tag.updatedAt.toISOString(),
      })),
      notebook: rest.notebook
        ? {
            ...rest.notebook,
          }
        : null,
    };
  }

  async createNote(userId: string, input: CreateNoteInput) {
    const note = await prisma.note.create({
      data: {
        title: input.title,
        content: input.content || "",
        userId,
        notebookId: input.notebookId ?? null,
        noteTags: input.tagIds
          ? {
              create: input.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        notebook: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        noteTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const { noteTags, ...rest } = note;
    return {
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      updatedAt: rest.updatedAt.toISOString(),
      tags: noteTags.map((nt: (typeof noteTags)[0]) => ({
        ...nt.tag,
        createdAt: nt.tag.createdAt.toISOString(),
        updatedAt: nt.tag.updatedAt.toISOString(),
      })),
      notebook: rest.notebook
        ? {
            ...rest.notebook,
          }
        : null,
    };
  }

  async updateNote(id: string, userId: string, input: UpdateNoteInput) {
    const existingNote = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      throw new NotFoundError("笔记不存在");
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.notebookId !== undefined && { notebookId: input.notebookId }),
        ...(input.tagIds !== undefined && {
          noteTags: {
            deleteMany: {},
            create: input.tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: {
        notebook: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        noteTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const { noteTags, ...rest } = note;
    return {
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      updatedAt: rest.updatedAt.toISOString(),
      tags: noteTags.map((nt: (typeof noteTags)[0]) => ({
        ...nt.tag,
        createdAt: nt.tag.createdAt.toISOString(),
        updatedAt: nt.tag.updatedAt.toISOString(),
      })),
      notebook: rest.notebook
        ? {
            ...rest.notebook,
          }
        : null,
    };
  }

  async deleteNote(id: string, userId: string) {
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw new NotFoundError("笔记不存在");
    }

    await prisma.note.delete({
      where: { id },
    });
  }
}
