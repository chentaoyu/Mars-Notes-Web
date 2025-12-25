// Placeholder component - to be implemented later
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send } from "lucide-react";

interface AIChatProps {
  sessionId: string;
  onTitleUpdate?: (title: string) => void;
  onNoteCreated?: (noteId: string) => void;
}

export function AIChat({ sessionId: _sessionId }: AIChatProps) {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-muted-foreground">AI 聊天功能待实现</p>
      </div>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            disabled
          />
          <Button disabled>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

