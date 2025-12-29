import { useState, useEffect } from 'react';
import { Notebook } from '@shared/types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { DeleteConfirmDialog } from '../common/DeleteConfirmDialog';
import { notebookApi } from '../../services/api';
import { toast } from '../../hooks/use-toast';

interface NotebookListProps {
  selectedNotebookId?: string | null;
  onSelectNotebook: (notebookId: string | null) => void;
}

export function NotebookList({ selectedNotebookId, onSelectNotebook }: NotebookListProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const result = await notebookApi.getNotebooks();
      if (result.data) {
        setNotebooks(result.data || []);
      }
    } catch (error) {
      console.error('获取笔记本列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async (name: string, description?: string) => {
    try {
      const result = await notebookApi.createNotebook({ name, description });
      if (result.data) {
        setNotebooks([...notebooks, result.data]);
        setShowCreateForm(false);
        toast({
          title: "创建成功",
          description: "笔记本已创建",
        });
      }
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.response?.data?.error || "创建笔记本失败",
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
      setNotebooks(notebooks.filter((nb) => nb.id !== notebookToDelete));
      if (selectedNotebookId === notebookToDelete) {
        onSelectNotebook(null);
      }
      setDeleteDialogOpen(false);
      setNotebookToDelete(null);
      toast({
        title: "删除成功",
        description: "笔记本已删除",
      });
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.response?.data?.error || "删除笔记本失败",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold">笔记本</h3>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-xs h-7 sm:h-8"
        >
          {showCreateForm ? '取消' : '新建'}
        </Button>
      </div>

      {showCreateForm && (
        <CreateNotebookForm
          onSubmit={handleCreateNotebook}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="space-y-2">
        <button
          onClick={() => onSelectNotebook(null)}
          className={`w-full text-left px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base cursor-pointer ${
            !selectedNotebookId
              ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">📋 所有笔记</span>
          </div>
        </button>

        {notebooks.map((notebook) => (
          <div
            key={notebook.id}
            className={`group relative px-3 sm:px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              selectedNotebookId === notebook.id
                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => onSelectNotebook(notebook.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base">{notebook.icon || '📓'}</span>
                  <span className="font-medium truncate text-sm sm:text-base">{notebook.name}</span>
                  {notebook._count && (
                    <span className="text-[10px] sm:text-xs text-gray-500 shrink-0">
                      ({notebook._count.notes})
                    </span>
                  )}
                </div>
                {notebook.description && (
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                    {notebook.description}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNotebook(notebook.id);
                }}
                className="sm:opacity-0 sm:group-hover:opacity-100 ml-1 sm:ml-2 text-red-500 hover:text-red-700 text-[10px] sm:text-xs transition-opacity shrink-0 cursor-pointer"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="确认删除笔记本"
        description="确定要删除这个笔记本吗？笔记本中还有笔记时将无法删除。"
      />
    </div>
  );
}

interface CreateNotebookFormProps {
  onSubmit: (name: string, description?: string) => void;
  onCancel: () => void;
}

function CreateNotebookForm({ onSubmit, onCancel }: CreateNotebookFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
    }
  };

  return (
    <Card className="p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="笔记本名称"
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            autoFocus
            maxLength={100}
            required
          />
        </div>
        <div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述（可选）"
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            maxLength={500}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1 text-xs sm:text-sm h-8 sm:h-9">
            创建
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel} className="text-xs sm:text-sm h-8 sm:h-9">
            取消
          </Button>
        </div>
      </form>
    </Card>
  );
}

