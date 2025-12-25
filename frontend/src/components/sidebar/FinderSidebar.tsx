import { useState, useEffect, useRef } from "react";
import { Notebook, Tag, Note } from "@note-book/shared";
import { Button } from "../ui/button";
import { DeleteConfirmDialog } from "../common/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Tag as TagIcon,
  ChevronRight,
  ChevronDown,
  Search,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { NoteSortBy, NoteSortOrder } from "@note-book/shared";
import { SortSelector } from "../notes/SortSelector";
import { AIChat } from "../ai/AIChat";
import { AISettings } from "../ai/AISettings";
import { TokenStats } from "../ai/TokenStats";
import { notebookApi, tagApi, aiApi } from "../../services/api";
import { useToast } from "../../hooks/use-toast";

interface FinderSidebarProps {
  selectedNotebookId?: string | null;
  selectedTagIds?: string[];
  search?: string;
  sortBy?: NoteSortBy;
  sortOrder?: NoteSortOrder;
  notes?: Note[];
  currentNoteId?: string | null;
  onSelectNotebook: (notebookId: string | null) => void;
  onSelectTags: (tagIds: string[]) => void;
  onSelectNote?: (noteId: string) => void;
  onCreateNote?: () => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (sortBy: NoteSortBy, sortOrder: NoteSortOrder) => void;
  onNoteFromAIChat?: (noteId: string) => void;
}

// macOS 风格的标签颜色
const TAG_COLORS = [
  { name: "红色", value: "#FF3B30", label: "Red" },
  { name: "橙色", value: "#FF9500", label: "Orange" },
  { name: "黄色", value: "#FFCC00", label: "Yellow" },
  { name: "绿色", value: "#34C759", label: "Green" },
  { name: "蓝色", value: "#007AFF", label: "Blue" },
  { name: "紫色", value: "#AF52DE", label: "Purple" },
  { name: "灰色", value: "#8E8E93", label: "Gray" },
];

export function FinderSidebar({
  selectedNotebookId,
  selectedTagIds = [],
  search = "",
  sortBy = "updatedAt",
  sortOrder = "desc",
  notes = [],
  currentNoteId = null,
  onSelectNotebook,
  onSelectTags,
  onSelectNote,
  onCreateNote,
  onSearchChange,
  onSortChange,
  onNoteFromAIChat,
}: FinderSidebarProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(
    null
  );
  const [editingName, setEditingName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [hoveredNotebookId, setHoveredNotebookId] = useState<string | null>(
    null
  );
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(
    new Set()
  );
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // 标签相关状态
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);

  // AI Chat 相关状态
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [deleteChatDialogOpen, setDeleteChatDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  const { toast: showToast } = useToast();

  useEffect(() => {
    fetchData();
    fetchChatSessions();
  }, []);

  useEffect(() => {
    if (editingNotebookId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNotebookId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notebooksResult, tagsResult] = await Promise.all([
        notebookApi.getNotebooks(),
        tagApi.getTags(),
      ]);

      if (notebooksResult.data) {
        setNotebooks(notebooksResult.data || []);
      }

      if (tagsResult.data) {
        setTags(tagsResult.data || []);
      }
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async (
    name: string,
    description?: string,
    color?: string,
    icon?: string,
    parentId?: string | null
  ) => {
    try {
      const result = await notebookApi.createNotebook({
        name,
        description,
        color,
        icon,
        parentId: parentId || undefined,
      });
      if (result.data) {
        await fetchData(); // 重新获取数据以更新树形结构
        setCreateDialogOpen(false);
        setCreateParentId(null);
        // 如果创建了子笔记本，展开父笔记本
        if (parentId) {
          setExpandedNotebooks((prev) => new Set(prev).add(parentId));
        }
        showToast({
          title: "创建成功",
          description: "笔记本已创建",
        });
      }
    } catch (error: any) {
      showToast({
        title: "创建失败",
        description: error.response?.data?.error || "创建笔记本失败",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNotebook = async (
    id: string,
    name: string,
    description?: string,
    color?: string,
    icon?: string
  ) => {
    try {
      const result = await notebookApi.updateNotebook(id, {
        name,
        description,
        color,
        icon,
      });
      if (result.data) {
        await fetchData(); // 重新获取数据以更新树形结构
        setEditDialogOpen(false);
        setEditingNotebook(null);
        setEditingNotebookId(null);
        showToast({
          title: "更新成功",
          description: "笔记本已更新",
        });
      }
    } catch (error: any) {
      showToast({
        title: "更新失败",
        description: error.response?.data?.error || "更新笔记本失败",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotebook = (notebookId: string) => {
    setNotebookToDelete(notebookId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!notebookToDelete) return;

    try {
      setIsDeleting(true);
      await notebookApi.deleteNotebook(notebookToDelete);
      await fetchData(); // 重新获取数据以更新树形结构
      if (selectedNotebookId === notebookToDelete) {
        onSelectNotebook(null);
      }
      setDeleteDialogOpen(false);
      setNotebookToDelete(null);
      showToast({
        title: "删除成功",
        description: "笔记本已删除",
      });
    } catch (error: any) {
      showToast({
        title: "删除失败",
        description: error.response?.data?.error || "删除笔记本失败",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // const handleInlineEdit = (notebook: Notebook) => {
  //   setEditingNotebookId(notebook.id);
  //   setEditingName(notebook.name);
  // };

  const handleInlineEditSubmit = async (notebookId: string) => {
    if (!editingName.trim()) {
      setEditingNotebookId(null);
      return;
    }

    const notebook = notebooks.find((nb) => nb.id === notebookId);
    if (notebook && editingName.trim() !== notebook.name) {
      await handleUpdateNotebook(
        notebookId,
        editingName.trim(),
        notebook.description || undefined
      );
    }
    setEditingNotebookId(null);
    setEditingName("");
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectTags(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectTags([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async (name: string, color?: string) => {
    try {
      const result = await tagApi.createTag({ name, color });
      if (result.data) {
        await fetchData();
        setCreateTagDialogOpen(false);
        showToast({
          title: "创建成功",
          description: "标签已创建",
        });
      }
    } catch (error: any) {
      showToast({
        title: "创建失败",
        description: error.response?.data?.error || "创建标签失败",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = (tagId: string) => {
    setTagToDelete(tagId);
    setDeleteTagDialogOpen(true);
  };

  const confirmDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      setIsDeletingTag(true);
      await tagApi.deleteTag(tagToDelete);
      await fetchData();
      // 如果删除的标签在选中列表中，移除它
      if (selectedTagIds.includes(tagToDelete)) {
        onSelectTags(selectedTagIds.filter((id) => id !== tagToDelete));
      }
      setDeleteTagDialogOpen(false);
      setTagToDelete(null);
      showToast({
        title: "删除成功",
        description: "标签已删除",
      });
    } catch (error: any) {
      showToast({
        title: "删除失败",
        description: error.response?.data?.error || "删除标签失败",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTag(false);
    }
  };

  const toggleExpand = (notebookId: string) => {
    setExpandedNotebooks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notebookId)) {
        newSet.delete(notebookId);
      } else {
        newSet.add(notebookId);
      }
      return newSet;
    });
  };

  const fetchChatSessions = async () => {
    try {
      const result = await aiApi.getSessions({ type: "normal" });
      if (result.data) {
        setChatSessions(result.data || []);
      }
    } catch (error) {
      console.error("获取聊天会话失败:", error);
    }
  };

  const handleCreateChatSession = async () => {
    try {
      const result = await aiApi.createSession({
        title: "新对话",
        scenarioDialogId: undefined, // 明确标记为普通 AI Chat 会话
      });
      if (result.data) {
        setSelectedSessionId(result.data.id);
        setShowChatDialog(true);
        await fetchChatSessions();
      }
    } catch (error: any) {
      showToast({
        title: "创建失败",
        description: error.response?.data?.error || "创建聊天会话失败",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChatSession = (sessionId: string) => {
    setChatToDelete(sessionId);
    setDeleteChatDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    try {
      setIsDeletingChat(true);
      await aiApi.deleteSession(chatToDelete);
      await fetchChatSessions();
      if (selectedSessionId === chatToDelete) {
        setSelectedSessionId(null);
        setShowChatDialog(false);
      }
      setDeleteChatDialogOpen(false);
      setChatToDelete(null);
      showToast({
        title: "删除成功",
        description: "对话已删除",
      });
    } catch (error: any) {
      showToast({
        title: "删除失败",
        description: error.response?.data?.error || "删除对话失败",
        variant: "destructive",
      });
    } finally {
      setIsDeletingChat(false);
    }
  };

  // 递归渲染笔记本树
  const renderNotebookTree = (notebooks: Notebook[], level: number = 0) => {
    return notebooks.map((notebook) => {
      const isSelected = selectedNotebookId === notebook.id;
      const isEditing = editingNotebookId === notebook.id;
      const isHovered = hoveredNotebookId === notebook.id;
      const isExpanded = expandedNotebooks.has(notebook.id);
      const hasChildren = notebook.children && notebook.children.length > 0;
      const hasNotes = notebook._count && notebook._count.notes > 0;
      const childrenCount = notebook.children ? notebook.children.length : 0;

      return (
        <div key={notebook.id}>
          <div
            className={cn(
              "group relative px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 cursor-pointer",
              isSelected
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onMouseEnter={() => setHoveredNotebookId(notebook.id)}
            onMouseLeave={() => setHoveredNotebookId(null)}
            onClick={() => !isEditing && onSelectNotebook(notebook.id)}
          >
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleInlineEditSubmit(notebook.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleInlineEditSubmit(notebook.id);
                  } else if (e.key === "Escape") {
                    setEditingNotebookId(null);
                    setEditingName("");
                  }
                }}
                className="flex-1 px-1 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {hasChildren ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(notebook.id);
                    }}
                    className="shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : (
                  <div className="w-4 shrink-0" />
                )}
                <div className="flex items-center gap-1.5 shrink-0">
                  {notebook.icon ? (
                    <span className="text-base">{notebook.icon}</span>
                  ) : isSelected ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                  {notebook.color && (
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: notebook.color }}
                      title="标记"
                    />
                  )}
                </div>
                <span className="flex-1 truncate">{notebook.name}</span>
                {(hasNotes || hasChildren) && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {hasNotes ? notebook._count?.notes : ""}
                    {hasNotes && hasChildren ? "/" : ""}
                    {hasChildren ? childrenCount : ""}
                  </span>
                )}
                {isHovered && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreateParentId(notebook.id);
                        setCreateDialogOpen(true);
                      }}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                      title="创建子笔记本"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNotebook(notebook);
                        setEditDialogOpen(true);
                      }}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                      title="编辑"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotebook(notebook.id);
                      }}
                      className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-0">
              {renderNotebookTree(notebook.children || [], level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800">
      {/* 搜索和排序区域 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-2">
        {onCreateNote && (
          <Button
            onClick={onCreateNote}
            className="w-full h-8 text-sm"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            新建笔记
          </Button>
        )}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="搜索笔记..."
            className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        {onSortChange && (
          <SortSelector
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        )}
      </div>

      {/* 笔记本部分 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              笔记本
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-800"
              onClick={() => setCreateDialogOpen(true)}
              title="新建笔记本"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* 所有笔记 */}
          <button
            onClick={() => onSelectNotebook(null)}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 group cursor-pointer",
              !selectedNotebookId
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            <Folder className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">所有笔记</span>
          </button>

          {/* 笔记本列表 */}
          <div className="mt-1 space-y-0.5">
            {renderNotebookTree(notebooks)}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-2" />

        {/* 标签部分 */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              标签
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-800"
              onClick={() => setCreateTagDialogOpen(true)}
              title="新建标签"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-1">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              const isHovered = hoveredTagId === tag.id;
              return (
                <div
                  key={tag.id}
                  className={cn(
                    "group relative px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 cursor-pointer",
                    isSelected
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                  onMouseEnter={() => setHoveredTagId(tag.id)}
                  onMouseLeave={() => setHoveredTagId(null)}
                  onClick={() => handleToggleTag(tag.id)}
                >
                  <TagIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">#{tag.name}</span>
                  {tag.color && (
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  {tag._count && tag._count.notes > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {tag._count.notes}
                    </span>
                  )}
                  {isHovered && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTag(tag.id);
                      }}
                      className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 shrink-0 cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
            {tags.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                暂无标签
              </p>
            )}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-2" />

        {/* AI Chat 部分 */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              AI 助手
            </h3>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-800"
                onClick={() => setShowStatsDialog(true)}
                title="Token 统计"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-800"
                onClick={() => setShowSettingsDialog(true)}
                title="AI 设置"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-800"
                onClick={handleCreateChatSession}
                title="新建对话"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            {chatSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="group relative px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <button
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setShowChatDialog(true);
                  }}
                  className="flex-1 flex items-center gap-2 text-left cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
                    {session.title}
                  </span>
                  {session._count?.messages > 0 && (
                    <span className="text-xs text-gray-400">
                      {session._count.messages}
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChatSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 cursor-pointer"
                  title="删除"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {chatSessions.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                暂无对话
              </p>
            )}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-2" />

        {/* 笔记列表部分 */}
        {notes.length > 0 && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                笔记 ({notes.length})
              </h3>
            </div>

            <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
              {notes.map((note) => {
                const isSelected = currentNoteId === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => onSelectNote?.(note.id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 group cursor-pointer",
                      isSelected
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate" title={note.title}>
                      {note.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 创建笔记本对话框 */}
      <CreateNotebookDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setCreateParentId(null);
        }}
        parentId={createParentId}
        onSubmit={(name, description, color, icon) =>
          handleCreateNotebook(name, description, color, icon, createParentId)
        }
      />

      {/* 编辑笔记本对话框 */}
      {editingNotebook && (
        <EditNotebookDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingNotebook(null);
          }}
          notebook={editingNotebook}
          onSubmit={(name, description, color, icon) =>
            handleUpdateNotebook(
              editingNotebook.id,
              name,
              description,
              color,
              icon
            )
          }
        />
      )}

      {/* 删除确认对话框 - 笔记本 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="确认删除笔记本"
        description="确定要删除这个笔记本吗？笔记本中还有笔记时将无法删除。"
      />

      {/* 创建标签对话框 */}
      <CreateTagDialog
        open={createTagDialogOpen}
        onOpenChange={setCreateTagDialogOpen}
        onSubmit={handleCreateTag}
      />

      {/* 删除确认对话框 - 标签 */}
      <DeleteConfirmDialog
        open={deleteTagDialogOpen}
        onOpenChange={setDeleteTagDialogOpen}
        onConfirm={confirmDeleteTag}
        isDeleting={isDeletingTag}
        title="确认删除标签"
        description="确定要删除这个标签吗？此操作无法撤销。"
      />

      {/* 删除确认对话框 - AI Chat */}
      <DeleteConfirmDialog
        open={deleteChatDialogOpen}
        onOpenChange={setDeleteChatDialogOpen}
        onConfirm={confirmDeleteChat}
        isDeleting={isDeletingChat}
        title="确认删除对话"
        description="确定要删除这个对话吗？此操作无法撤销。"
      />

      {/* AI Chat 对话框 */}
      {selectedSessionId && (
        <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
          <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b dark:border-gray-700">
              <DialogTitle>AI 助手</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <AIChat
                sessionId={selectedSessionId}
                onTitleUpdate={() => {}}
                onNoteCreated={(noteId) => {
                  setShowChatDialog(false);
                  onNoteFromAIChat?.(noteId);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI 设置对话框 */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <AISettings />
        </DialogContent>
      </Dialog>

      {/* Token 统计对话框 */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-2xl">
          <TokenStats />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 创建笔记本对话框
interface CreateNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
  onSubmit: (
    name: string,
    description?: string,
    color?: string,
    icon?: string
  ) => void;
}

function CreateNotebookDialog({
  open,
  onOpenChange,
  parentId,
  onSubmit,
}: CreateNotebookDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("📓");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(
        name.trim(),
        description.trim() || undefined,
        selectedColor || undefined,
        selectedIcon
      );
      setName("");
      setDescription("");
      setSelectedColor(null);
      setSelectedIcon("📓");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{parentId ? "新建子笔记本" : "新建笔记本"}</DialogTitle>
          <DialogDescription>
            {parentId
              ? "在当前笔记本下创建一个子笔记本"
              : "创建一个新的笔记本来组织你的笔记"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="笔记本名称"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              autoFocus
              maxLength={100}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              描述（可选）
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="笔记本描述"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              maxLength={500}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">图标</label>
            <div className="flex gap-2 flex-wrap">
              {["📓", "📔", "📕", "📗", "📘", "📙", "📚", "📝", "📄", "📑"].map(
                (icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={cn(
                      "w-10 h-10 text-xl rounded-lg border-2 transition-all cursor-pointer",
                      selectedIcon === icon
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    {icon}
                  </button>
                )
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              标记颜色（可选）
            </label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setSelectedColor(
                      selectedColor === color.value ? null : color.value
                    )
                  }
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                    selectedColor === color.value
                      ? "border-gray-900 dark:border-gray-100 scale-110"
                      : "border-gray-300 dark:border-gray-600 hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">创建</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 编辑笔记本对话框
interface EditNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebook: Notebook;
  onSubmit: (
    name: string,
    description?: string,
    color?: string,
    icon?: string
  ) => void;
}

function EditNotebookDialog({
  open,
  onOpenChange,
  notebook,
  onSubmit,
}: EditNotebookDialogProps) {
  const [name, setName] = useState(notebook.name);
  const [description, setDescription] = useState(notebook.description || "");
  const [selectedColor, setSelectedColor] = useState<string | null>(
    notebook.color || null
  );
  const [selectedIcon, setSelectedIcon] = useState(notebook.icon || "📓");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(
        name.trim(),
        description.trim() || undefined,
        selectedColor || undefined,
        selectedIcon
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑笔记本</DialogTitle>
          <DialogDescription>
            修改笔记本的名称、描述、图标和标记
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="笔记本名称"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              autoFocus
              maxLength={100}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              描述（可选）
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="笔记本描述"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              maxLength={500}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">图标</label>
            <div className="flex gap-2 flex-wrap">
              {["📓", "📔", "📕", "📗", "📘", "📙", "📚", "📝", "📄", "📑"].map(
                (icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={cn(
                      "w-10 h-10 text-xl rounded-lg border-2 transition-all cursor-pointer",
                      selectedIcon === icon
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    {icon}
                  </button>
                )
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              标记颜色（可选）
            </label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setSelectedColor(
                      selectedColor === color.value ? null : color.value
                    )
                  }
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                    selectedColor === color.value
                      ? "border-gray-900 dark:border-gray-100 scale-110"
                      : "border-gray-300 dark:border-gray-600 hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 创建标签对话框
interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, color?: string) => void;
}

function CreateTagDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateTagDialogProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(
    TAG_COLORS[0].value
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), selectedColor || undefined);
      setName("");
      setSelectedColor(TAG_COLORS[0].value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建标签</DialogTitle>
          <DialogDescription>创建一个新的标签来分类你的笔记</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="标签名称"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              autoFocus
              maxLength={50}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">颜色</label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                    selectedColor === color.value
                      ? "border-gray-900 dark:border-gray-100 scale-110"
                      : "border-gray-300 dark:border-gray-600 hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">创建</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
