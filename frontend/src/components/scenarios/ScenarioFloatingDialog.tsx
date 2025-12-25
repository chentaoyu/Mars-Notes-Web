import { useState, useEffect, useRef } from "react";
import { X, Minimize2, Maximize2, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { scenarioDialogApi, aiApi } from "../../services/api";

interface ScenarioDialog {
  id: string;
  name: string;
  description?: string | null;
  prompt: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ScenarioFloatingDialog() {
  const { toast: showToast } = useToast();
  const [scenarios, setScenarios] = useState<ScenarioDialog[]>([]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载启用的场景对话
  const fetchEnabledScenarios = async () => {
    try {
      const result = await scenarioDialogApi.getEnabledScenarioDialogs();
      return result.data || [];
    } catch (error: any) {
      console.error("加载场景对话失败:", error);
      return [];
    }
  };

  // 初始化场景对话
  const initScenarios = async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const enabledScenarios = await fetchEnabledScenarios();
    if (enabledScenarios.length === 0) {
      return;
    }

    setScenarios(enabledScenarios);
    setIsVisible(true);

    // 自动发送第一个场景的提示词
    sendScenarioMessage(enabledScenarios[0]);
  };

  useEffect(() => {
    // 延迟初始化，避免页面加载时立即弹出
    const timer = setTimeout(() => {
      initScenarios();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 发送场景消息
  const sendScenarioMessage = async (scenario: ScenarioDialog) => {
    setLoading(true);
    setMessages([]);

    try {
      // 检查是否已有该场景的会话
      let sessionId: string;
      try {
        const existingSessionsResult = await aiApi.getSessions({ type: "scenario" });
        const existingSessions = existingSessionsResult.data || [];

        // 查找该场景的会话
        const existingSession = existingSessions.find(
          (s: any) => s.scenarioDialogId === scenario.id
        );

        if (existingSession) {
          // 使用现有会话
          sessionId = existingSession.id;
        } else {
          // 创建新会话
          const sessionResult = await aiApi.createSession({
            title: scenario.name,
            scenarioDialogId: scenario.id,
          });
          sessionId = sessionResult.data.id;
        }
      } catch (error) {
        // 如果获取失败，直接创建新会话
        const sessionResult = await aiApi.createSession({
          title: scenario.name,
          scenarioDialogId: scenario.id,
        });
        sessionId = sessionResult.data.id;
      }

      // 使用会话 ID 发送消息
      const stream = await aiApi.sendMessage(sessionId, scenario.prompt);

      // 处理流式响应
      if (!stream) {
        throw new Error("无法获取响应流");
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

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
              if (parsed.type === "content" && parsed.content) {
                assistantMessage += parsed.content;
                setMessages([{ role: "assistant", content: assistantMessage }]);
              } else if (parsed.type === "done") {
                // 流传输完成
                assistantMessage = parsed.message?.content || assistantMessage;
                setMessages([{ role: "assistant", content: assistantMessage }]);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      showToast({
        title: "对话失败",
        description: error.response?.data?.error || error.message || "发送消息时发生错误",
        variant: "destructive",
      });
      setMessages([
        {
          role: "assistant",
          content: "抱歉，我暂时无法回应。请稍后再试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 切换场景
  const switchScenario = (index: number) => {
    if (index === currentScenarioIndex || index < 0 || index >= scenarios.length) {
      return;
    }
    setCurrentScenarioIndex(index);
    sendScenarioMessage(scenarios[index]);
  };

  // 关闭对话框
  const handleClose = () => {
    setIsVisible(false);
  };

  // 切换最小化
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible || scenarios.length === 0) {
    return null;
  }

  const currentScenario = scenarios[currentScenarioIndex];

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 bg-card border rounded-lg shadow-2xl transition-all duration-300 ${
        isMinimized ? "w-64" : "w-96 sm:w-[480px]"
      }`}
      style={{ maxHeight: isMinimized ? "60px" : "600px" }}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MessageSquare className="h-4 w-4 flex-shrink-0" />
          <span className="font-semibold truncate">
            {scenarios.length > 1 ? "场景对话" : currentScenario.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={toggleMinimize}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 场景切换标签 */}
      {!isMinimized && (
        <div className="flex gap-1 p-2 bg-muted/50 border-b overflow-x-auto">
          {scenarios.map((scenario, index) => (
            <button
              key={scenario.id}
              onClick={() => switchScenario(index)}
              className={`px-3 py-1 text-sm rounded transition-colors flex-shrink-0 ${
                index === currentScenarioIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      )}

      {/* 内容区域 */}
      {!isMinimized && (
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "480px" }}>
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">AI 正在思考...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`${message.role === "assistant" ? "text-left" : "text-right"}`}
                >
                  <div
                    className={`inline-block max-w-[85%] p-3 rounded-lg ${
                      message.role === "assistant"
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && messages.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-1 w-1 bg-current rounded-full animate-bounce" />
                  <div
                    className="h-1 w-1 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="h-1 w-1 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
