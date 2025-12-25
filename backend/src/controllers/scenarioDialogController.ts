import { Response, NextFunction } from "express";
import { ScenarioDialogService } from "../services/scenarioDialogService";
import { AuthRequest } from "../types";

const scenarioDialogService = new ScenarioDialogService();

export class ScenarioDialogController {
  async getScenarioDialogs(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const scenarioDialogs = await scenarioDialogService.getScenarioDialogs(
        userId
      );
      res.json({ data: scenarioDialogs });
    } catch (error: any) {
      console.error("获取场景对话失败:", error);
      next(error);
    }
  }

  async getEnabledScenarioDialogs(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const scenarioDialogs =
        await scenarioDialogService.getEnabledScenarioDialogs(userId);
      res.json({ data: scenarioDialogs });
    } catch (error: any) {
      console.error("获取启用的场景对话失败:", error);
      next(error);
    }
  }

  async createScenarioDialog(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { name, description, prompt, enabled, sortOrder } = req.body;

      if (!name || !prompt) {
        res
          .status(400)
          .json({
            data: null,
            error: "名称和提示词不能为空",
            code: "VALIDATION_ERROR",
          });
        return;
      }

      const scenarioDialog = await scenarioDialogService.createScenarioDialog(
        userId,
        {
          name,
          description,
          prompt,
          enabled,
          sortOrder,
        }
      );

      res.status(201).json({ data: scenarioDialog });
    } catch (error: any) {
      console.error("创建场景对话失败:", error);
      next(error);
    }
  }

  async updateScenarioDialog(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { name, description, prompt, enabled, sortOrder } = req.body;

      const scenarioDialog = await scenarioDialogService.updateScenarioDialog(
        id,
        userId,
        {
          name,
          description,
          prompt,
          enabled,
          sortOrder,
        }
      );

      res.json({ data: scenarioDialog });
    } catch (error: any) {
      if (error.message === "场景对话不存在") {
        res
          .status(404)
          .json({ data: null, error: error.message, code: "NOT_FOUND" });
        return;
      }
      console.error("更新场景对话失败:", error);
      next(error);
    }
  }

  async deleteScenarioDialog(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      await scenarioDialogService.deleteScenarioDialog(id, userId);

      res.status(204).send();
    } catch (error: any) {
      if (error.message === "场景对话不存在") {
        res
          .status(404)
          .json({ data: null, error: error.message, code: "NOT_FOUND" });
        return;
      }
      console.error("删除场景对话失败:", error);
      next(error);
    }
  }
}
