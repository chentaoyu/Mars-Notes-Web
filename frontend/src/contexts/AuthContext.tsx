import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User } from "@shared/types";
import { authApi, setLogoutCallback } from "../services/api";

// localStorage 版本控制，便于数据迁移
const STORAGE_VERSION = "v1";
const STORAGE_KEYS = {
  token: `auth:token:${STORAGE_VERSION}`,
  user: `auth:user:${STORAGE_VERSION}`,
} as const;

// 安全的 localStorage 操作（处理隐私模式等异常）
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 静默失败（隐私模式或存储已满）
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // 静默失败
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = safeGetItem(STORAGE_KEYS.user);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Invalid stored user data, clear it
        safeRemoveItem(STORAGE_KEYS.user);
        safeRemoveItem(STORAGE_KEYS.token);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response.data) {
      safeSetItem(STORAGE_KEYS.token, response.data.token);
      safeSetItem(STORAGE_KEYS.user, JSON.stringify(response.data.user));
      setUser(response.data.user);
    } else {
      throw new Error(response.error || "登录失败");
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const response = await authApi.register({ email, password, name });
    if (response.data) {
      safeSetItem(STORAGE_KEYS.token, response.data.token);
      safeSetItem(STORAGE_KEYS.user, JSON.stringify(response.data.user));
      setUser(response.data.user);
    } else {
      throw new Error(response.error || "注册失败");
    }
  }, []);

  const logout = useCallback(() => {
    safeRemoveItem(STORAGE_KEYS.token);
    safeRemoveItem(STORAGE_KEYS.user);
    setUser(null);
  }, []);

  // 设置全局logout回调，供API拦截器使用
  useEffect(() => {
    setLogoutCallback(logout);
    return () => {
      setLogoutCallback(() => {});
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
