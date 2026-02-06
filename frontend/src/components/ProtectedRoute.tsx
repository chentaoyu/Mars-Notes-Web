import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { ReactNode, useEffect, useCallback } from "react";

// 与 AuthContext 保持一致的 storage key
const STORAGE_VERSION = "v1";
const TOKEN_KEY = `auth:token:${STORAGE_VERSION}`;

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, logout } = useAuth();

  // 使用useCallback确保logout函数引用稳定
  const checkAuthConsistency = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token && user) {
      // 有user但没有token，状态不一致，清除user
      logout();
    }
  }, [user, logout]);

  useEffect(() => {
    // 检查token和user的一致性
    checkAuthConsistency();
  }, [checkAuthConsistency]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
