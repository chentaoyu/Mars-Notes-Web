// Placeholder component - to be implemented later
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Save } from "lucide-react";

export function AISettings() {
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">AI 设置</h3>
        <p className="text-sm text-muted-foreground mb-4">AI 配置功能待实现</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="请输入 API Key"
          disabled
        />
      </div>
      <Button disabled>
        <Save className="h-4 w-4 mr-2" />
        保存
      </Button>
    </div>
  );
}

