import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { LogOut, User, Settings, MessageSquare } from "lucide-react";
import { VersionBadge } from "./VersionBadge";
import { useAuth } from "../../contexts/AuthContext";
import { ScenarioDialogsClient } from "../scenarios/ScenarioDialogsClient";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <Link to="/notes" className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-2xl font-bold">Mars-Notes</h1>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden md:flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user?.name || user?.email || "用户"}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              title="场景对话"
              onClick={() => setScenarioDialogOpen(true)}
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Link to="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                title="我的页面"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              title="退出登录"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <VersionBadge />
          </div>
        </div>
      </header>

      {/* 场景对话管理对话框 */}
      <Dialog open={scenarioDialogOpen} onOpenChange={setScenarioDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b dark:border-gray-700">
            <DialogTitle>场景对话管理</DialogTitle>
            <DialogDescription>创建和管理你的场景对话，可以设置为启用自动弹窗</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <ScenarioDialogsClient isInDialog />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

