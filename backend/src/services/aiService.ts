import { prisma } from "../utils/prisma";
import { ValidationError, NotFoundError } from "../errors/AppError";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export interface AIConfigData {
  provider?: string;
  apiKey: string;
  model: string;
}

export interface CreateSessionData {
  title?: string;
  scenarioDialogId?: string | null;
}

export interface UpdateSessionData {
  title?: string;
  model?: string | null;
}

export class AIService {
  async getAIConfig(userId: string) {
    return await prisma.aIConfig.findUnique({
      where: { userId },
      select: {
        id: true,
        provider: true,
        model: true,
        apiKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async upsertAIConfig(userId: string, data: AIConfigData) {
    return await prisma.aIConfig.upsert({
      where: { userId },
      create: {
        userId,
        provider: data.provider || "deepseek",
        apiKey: data.apiKey,
        model: data.model,
      },
      update: {
        provider: data.provider || "deepseek",
        apiKey: data.apiKey,
        model: data.model,
      },
    });
  }

  async deleteAIConfig(userId: string) {
    return await prisma.aIConfig.delete({
      where: { userId },
    });
  }

  async getSessions(userId: string, type?: string) {
    let where: any = { userId };

    if (type === "normal") {
      where.scenarioDialogId = null;
    } else if (type === "scenario") {
      where.scenarioDialogId = { not: null };
    }

    return await prisma.chatSession.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { messages: true },
        },
        scenarioDialog: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getSessionById(id: string, userId: string) {
    return await prisma.chatSession.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async createSession(userId: string, data: CreateSessionData) {
    return await prisma.chatSession.create({
      data: {
        userId,
        title: data.title || "新对话",
        scenarioDialogId: data.scenarioDialogId || null,
      },
    });
  }

  async updateSession(id: string, userId: string, data: UpdateSessionData) {
    const updateData: any = {};
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.model !== undefined) {
      updateData.model = data.model || null;
    }

    return await prisma.chatSession.update({
      where: {
        id,
        userId,
      },
      data: updateData,
    });
  }

  async deleteSession(id: string, userId: string) {
    return await prisma.chatSession.delete({
      where: {
        id,
        userId,
      },
    });
  }

  async getTokenStats(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usages = await prisma.tokenUsage.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = usages.reduce(
      (acc, usage) => ({
        promptTokens: acc.promptTokens + usage.promptTokens,
        completionTokens: acc.completionTokens + usage.completionTokens,
        totalTokens: acc.totalTokens + usage.totalTokens,
      }),
      { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    );

    const byModel = usages.reduce((acc, usage) => {
      if (!acc[usage.model]) {
        acc[usage.model] = {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          count: 0,
        };
      }
      acc[usage.model].promptTokens += usage.promptTokens;
      acc[usage.model].completionTokens += usage.completionTokens;
      acc[usage.model].totalTokens += usage.totalTokens;
      acc[usage.model].count += 1;
      return acc;
    }, {} as Record<string, { promptTokens: number; completionTokens: number; totalTokens: number; count: number }>);

    const byDay = usages.reduce((acc, usage) => {
      const day = usage.createdAt.toISOString().split("T")[0];
      if (!acc[day]) {
        acc[day] = { totalTokens: 0, count: 0 };
      }
      acc[day].totalTokens += usage.totalTokens;
      acc[day].count += 1;
      return acc;
    }, {} as Record<string, { totalTokens: number; count: number }>);

    return {
      total,
      byModel,
      byDay,
      details: usages,
    };
  }

  async sendChatMessage(
    userId: string,
    sessionId: string,
    message: string,
    model?: string
  ): Promise<ReadableStream> {
    // 获取用户的 AI 配置
    const aiConfig = await this.getAIConfig(userId);
    if (!aiConfig) {
      throw new ValidationError("请先配置 AI 设置");
    }

    // 验证会话是否属于当前用户
    const chatSession = await this.getSessionById(sessionId, userId);
    if (!chatSession) {
      throw new NotFoundError("会话不存在");
    }

    // 确定使用的模型
    const selectedModel = model || (chatSession as any).model || aiConfig.model;

    // 保存用户消息
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        userId,
        role: "user",
        content: message,
        model: selectedModel,
      },
    });

    // 构建消息历史
    const messages = [
      ...chatSession.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // 调用 DeepSeek API（流式传输）
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("DeepSeek API 错误:", error);
      const errorObj = new Error("AI 服务调用失败");
      (errorObj as any).statusCode = 500;
      (errorObj as any).code = "AI_SERVICE_ERROR";
      throw errorObj;
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullContent = "";
    let thinking = "";
    let isThinking = false;
    let totalTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 首先发送用户消息
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "user",
                message: userMessage,
              })}\n\n`
            )
          );

          const reader = response.body?.getReader();
          if (!reader) {
            const error = new Error("无法读取响应流");
            (error as any).statusCode = 500;
            (error as any).code = "STREAM_ERROR";
            throw error;
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices[0]?.delta;

                  if (delta?.content) {
                    const content = delta.content;

                    // 检测思考过程标记
                    if (content.includes("<think>")) {
                      isThinking = true;
                      const thinkStart = content.indexOf("<think>");
                      if (thinkStart > 0) {
                        fullContent += content.slice(0, thinkStart);
                      }
                      thinking += content.slice(thinkStart + 7);
                    } else if (content.includes("</think>")) {
                      isThinking = false;
                      const thinkEnd = content.indexOf("</think>");
                      thinking += content.slice(0, thinkEnd);
                      fullContent += content.slice(thinkEnd + 8);

                      // 发送思考过程
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            type: "thinking",
                            content: thinking,
                          })}\n\n`
                        )
                      );
                    } else if (isThinking) {
                      thinking += content;
                    } else {
                      fullContent += content;
                      // 发送内容流
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            type: "content",
                            content,
                          })}\n\n`
                        )
                      );
                    }
                  }

                  // 获取 token 使用情况
                  if (parsed.usage) {
                    totalTokens = parsed.usage.total_tokens || 0;
                  }
                } catch (e) {
                  console.error("解析 SSE 数据失败:", e);
                }
              }
            }
          }

          // 保存 AI 回复
          const aiMessage = await prisma.chatMessage.create({
            data: {
              sessionId,
              userId,
              role: "assistant",
              content: fullContent || "抱歉，我无法回答。",
              model: selectedModel,
              tokens: totalTokens,
            },
          });

          // 记录 token 使用
          if (totalTokens > 0) {
            await prisma.tokenUsage.create({
              data: {
                userId,
                model: selectedModel,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens,
              },
            });
          }

          // 更新会话
          await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          });

          // 如果是第一条消息，自动生成会话标题
          if (
            chatSession.messages.length === 0 &&
            chatSession.title === "新对话"
          ) {
            const titleMessage =
              message.slice(0, 50) + (message.length > 50 ? "..." : "");
            await prisma.chatSession.update({
              where: { id: sessionId },
              data: { title: titleMessage },
            });
          }

          // 发送完成信号
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                message: aiMessage,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("流式传输错误:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "流式传输失败",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return stream;
  }
}
