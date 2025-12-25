// Placeholder component - to be implemented later
import { BarChart3 } from "lucide-react";

export function TokenStats() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold">Token 使用统计</h3>
      </div>
      <p className="text-sm text-muted-foreground">Token 统计功能待实现</p>
    </div>
  );
}

