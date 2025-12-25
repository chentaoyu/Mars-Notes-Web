import { prisma } from "../utils/prisma";
import { NotFoundError } from "../errors/AppError";

export interface CreateScenarioDialogData {
  name: string;
  description?: string | null;
  prompt: string;
  enabled?: boolean;
  sortOrder?: number;
}

export interface UpdateScenarioDialogData {
  name?: string;
  description?: string | null;
  prompt?: string;
  enabled?: boolean;
  sortOrder?: number;
}

export class ScenarioDialogService {
  async getScenarioDialogs(userId: string) {
    return await prisma.scenarioDialog.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  async getEnabledScenarioDialogs(userId: string) {
    return await prisma.scenarioDialog.findMany({
      where: {
        userId,
        enabled: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
      },
    });
  }

  async getScenarioDialogById(id: string, userId: string) {
    return await prisma.scenarioDialog.findFirst({
      where: { id, userId },
    });
  }

  async createScenarioDialog(userId: string, data: CreateScenarioDialogData) {
    return await prisma.scenarioDialog.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
        prompt: data.prompt,
        enabled: data.enabled ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateScenarioDialog(id: string, userId: string, data: UpdateScenarioDialogData) {
    const existing = await this.getScenarioDialogById(id, userId);
    if (!existing) {
      throw new NotFoundError("场景对话不存在");
    }

    return await prisma.scenarioDialog.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        description: data.description === undefined ? existing.description : data.description,
        prompt: data.prompt ?? existing.prompt,
        enabled: data.enabled !== undefined ? data.enabled : existing.enabled,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
      },
    });
  }

  async deleteScenarioDialog(id: string, userId: string) {
    const existing = await this.getScenarioDialogById(id, userId);
    if (!existing) {
      throw new NotFoundError("场景对话不存在");
    }

    return await prisma.scenarioDialog.delete({
      where: { id },
    });
  }
}

