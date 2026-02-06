import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { tagApi, notebookApi, aiApi } from "../services/api";
import { Tag, Notebook } from "@shared/types";

// 通用 SWR 配置
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 5000, // 5秒内重复请求自动去重
};

// 不可变数据配置（不自动重新验证）
const immutableConfig: SWRConfiguration = {
  ...defaultConfig,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

/**
 * 获取标签列表的 SWR Hook
 * 多个组件使用时自动去重请求
 */
export function useTags(config?: SWRConfiguration): SWRResponse<Tag[]> {
  return useSWR<Tag[]>(
    "/api/tags",
    async () => {
      const response = await tagApi.getTags();
      return response.data || [];
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * 获取笔记本列表的 SWR Hook
 */
export function useNotebooks(config?: SWRConfiguration): SWRResponse<Notebook[]> {
  return useSWR<Notebook[]>(
    "/api/notebooks",
    async () => {
      const response = await notebookApi.getNotebooks();
      return response.data || [];
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * 获取 AI 配置的 SWR Hook
 */
export function useAIConfig(config?: SWRConfiguration): SWRResponse<unknown> {
  return useSWR(
    "/api/ai/config",
    async () => {
      const response = await aiApi.getConfig();
      return response.data;
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * 获取 AI 聊天会话列表的 SWR Hook
 */
export function useAIChatSessions(type?: string, config?: SWRConfiguration): SWRResponse<unknown[]> {
  return useSWR(
    type ? `/api/ai/sessions?type=${type}` : "/api/ai/sessions",
    async () => {
      const response = await aiApi.getSessions(type ? { type } : undefined);
      return response.data || [];
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * 获取 Token 统计的 SWR Hook
 */
export function useTokenStats(
  params?: { startDate?: string; endDate?: string },
  config?: SWRConfiguration
): SWRResponse<unknown> {
  const key = params
    ? `/api/ai/tokens?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "/api/ai/tokens";

  return useSWR(
    key,
    async () => {
      const response = await aiApi.getTokenStats(params);
      return response.data;
    },
    { ...defaultConfig, ...config }
  );
}

// 导出 immutableConfig 供需要的地方使用
export { immutableConfig };
