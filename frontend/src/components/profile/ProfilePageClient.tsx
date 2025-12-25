import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserSchema,
  updatePasswordSchema,
  deleteAccountSchema,
  type UpdateUserInput,
  type UpdatePasswordInput,
  type DeleteAccountInput,
} from "../../lib/validations";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { Camera, Trash2, Save, Lock, UserX } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getInitials } from "../../lib/utils";

export function ProfilePageClient() {
  const { user, logout, setUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // 头像相关
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 昵称表单
  const {
    register: registerName,
    handleSubmit: handleSubmitName,
    formState: { errors: errorsName },
    reset: resetName,
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
    },
  });

  // 密码表单
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    reset: resetPassword,
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });

  // 注销账户对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    register: registerDelete,
    handleSubmit: handleSubmitDelete,
    formState: { errors: errorsDelete },
  } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
  });

  // 在客户端设置初始值
  useEffect(() => {
    if (user?.image) {
      setAvatarUrl(user.image);
    } else {
      setAvatarUrl(null);
    }
    if (user?.name) {
      resetName({ name: user.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.image, user?.name]);

  // 上传头像
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "上传失败",
        description: "仅支持 JPG、PNG、GIF 格式的图片",
        variant: "destructive",
      });
      return;
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "上传失败",
        description: "图片大小不能超过 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/user/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const result = await uploadResponse.json();
        throw new Error(result.message || "上传失败");
      }

      const uploadResult = await uploadResponse.json();

      // 更新头像URL
      const updateResponse = await fetch("/api/user/avatar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ image: uploadResult.url }),
      });

      if (!updateResponse.ok) {
        const result = await updateResponse.json();
        throw new Error(result.message || "更新头像失败");
      }

      const updateResult = await updateResponse.json();
      setAvatarUrl(updateResult.data?.image || null);
      if (updateResult.data) {
        setUser(updateResult.data);
        localStorage.setItem("user", JSON.stringify(updateResult.data));
      }

      toast({
        title: "头像更新成功",
        description: "您的头像已更新",
      });
    } catch (error: any) {
      toast({
        title: "上传失败",
        description: error.message || "上传头像时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // 删除头像
  const handleDeleteAvatar = async () => {
    try {
      const response = await fetch("/api/user/avatar", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "删除头像失败");
      }

      const result = await response.json();
      setAvatarUrl(null);
      if (result.data) {
        setUser(result.data);
        localStorage.setItem("user", JSON.stringify(result.data));
      }

      toast({
        title: "头像已删除",
        description: "已恢复默认头像",
      });
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message || "删除头像时发生错误",
        variant: "destructive",
      });
    }
  };

  // 修改昵称
  const onSubmitName = async (data: UpdateUserInput) => {
    try {
      const response = await fetch("/api/user/name", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "修改昵称失败");
      }

      const result = await response.json();

      if (result.data?.name) {
        resetName({ name: result.data.name });
      }

      if (result.data) {
        setUser(result.data);
        localStorage.setItem("user", JSON.stringify(result.data));
      }

      toast({
        title: "昵称修改成功",
        description: "您的昵称已更新",
      });
    } catch (error: any) {
      toast({
        title: "修改失败",
        description: error.message || "修改昵称时发生错误",
        variant: "destructive",
      });
    }
  };

  // 修改密码
  const onSubmitPassword = async (data: UpdatePasswordInput) => {
    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "修改密码失败");
      }

      toast({
        title: "密码修改成功",
        description: "请重新登录",
      });

      resetPassword();
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "修改失败",
        description: error.message || "修改密码时发生错误",
        variant: "destructive",
      });
    }
  };

  // 注销账户
  const onSubmitDelete = async (data: DeleteAccountInput) => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "注销账户失败");
      }

      toast({
        title: "账户已注销",
        description: "您的账户已成功注销",
      });

      setTimeout(() => {
        logout();
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "注销失败",
        description: error.message || "注销账户时发生错误",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">我的页面</h1>
          <p className="text-muted-foreground mt-2">管理您的个人信息和账户设置</p>
        </div>

        {/* 头像设置 */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* 头像区域 */}
            <div className="relative group">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-2 ring-border transition-all duration-200">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={user?.name || "用户"} />
                ) : null}
                <AvatarFallback className="text-xl sm:text-2xl font-semibold bg-primary text-primary-foreground">
                  {getInitials(user?.name || "")}
                </AvatarFallback>
              </Avatar>
              {/* 上传按钮覆盖层 */}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              >
                <div className="flex flex-col items-center gap-1 text-white">
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs font-medium">上传</span>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </label>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <div className="flex flex-col items-center gap-1 text-white">
                    <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">上传中</span>
                  </div>
                </div>
              )}
            </div>

            {/* 操作区域 */}
            <div className="flex-1 w-full sm:w-auto">
              <h2 className="text-lg font-semibold mb-3">头像设置</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <label htmlFor="avatar-upload-mobile">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="cursor-pointer hover:bg-primary/90 transition-colors"
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {isUploadingAvatar ? "上传中..." : "选择图片"}
                  </Button>
                  <input
                    id="avatar-upload-mobile"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </label>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAvatar}
                    disabled={isUploadingAvatar}
                    className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除头像
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                支持 JPG、PNG、GIF 格式，最大 2MB。悬停头像可快速上传
              </p>
            </div>
          </div>
        </div>

        {/* 昵称设置 */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">昵称</h2>
          <form onSubmit={handleSubmitName(onSubmitName)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">昵称</Label>
              <Input
                id="name"
                {...registerName("name")}
                placeholder="请输入昵称（1-20个字符）"
                maxLength={20}
              />
              {errorsName.name && (
                <p className="text-sm text-destructive">{errorsName.name.message}</p>
              )}
            </div>
            <Button type="submit" size="sm">
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </form>
        </div>

        {/* 密码设置 */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">修改密码</h2>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input
                id="currentPassword"
                type="password"
                {...registerPassword("currentPassword")}
                placeholder="请输入当前密码"
              />
              {errorsPassword.currentPassword && (
                <p className="text-sm text-destructive">{errorsPassword.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword("newPassword")}
                placeholder="至少8位，包含字母和数字"
              />
              {errorsPassword.newPassword && (
                <p className="text-sm text-destructive">{errorsPassword.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerPassword("confirmPassword")}
                placeholder="请再次输入新密码"
              />
              {errorsPassword.confirmPassword && (
                <p className="text-sm text-destructive">{errorsPassword.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" size="sm">
              <Lock className="h-4 w-4 mr-2" />
              修改密码
            </Button>
          </form>
        </div>

        {/* 账户注销 */}
        <div className="bg-card border rounded-lg p-6 space-y-4 border-destructive/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-destructive">账户注销</h2>
              <p className="text-sm text-muted-foreground mt-1">
                注销账户后，您的所有数据将被永久删除，此操作无法撤销。
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <UserX className="h-4 w-4 mr-2" />
              注销账户
            </Button>
          </div>
        </div>
      </div>

      {/* 注销确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认注销账户</DialogTitle>
            <DialogDescription asChild>
              <div>
                <p>此操作将永久删除您的账户和所有数据，包括：</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>所有笔记</li>
                  <li>所有笔记本</li>
                  <li>所有标签</li>
                  <li>个人设置</li>
                </ul>
                <p className="mt-2 font-semibold text-destructive">此操作无法撤销！</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDelete(onSubmitDelete)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deletePassword">请输入密码确认</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  {...registerDelete("password")}
                  placeholder="请输入您的密码"
                />
                {errorsDelete.password && (
                  <p className="text-sm text-destructive">{errorsDelete.password.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button type="submit" variant="destructive" disabled={isDeleting}>
                {isDeleting ? "注销中..." : "确认注销"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

