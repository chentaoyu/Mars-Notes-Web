import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { noteApi } from "../services/api";
import { Note } from "@note-book/shared";

export default function NotesPage() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await noteApi.getNotes();
      setNotes(data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "加载笔记失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!title.trim()) return;

    try {
      setError("");
      const response = await noteApi.createNote({ title, content });
      if (response.data) {
        setNotes([response.data, ...notes]);
        setTitle("");
        setContent("");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "创建笔记失败");
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote || !title.trim()) return;

    try {
      setError("");
      const response = await noteApi.updateNote(selectedNote.id, {
        title,
        content,
      });
      if (response.data) {
        setNotes(
          notes.map((n) => (n.id === selectedNote.id ? response.data! : n))
        );
        setSelectedNote(null);
        setTitle("");
        setContent("");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "更新笔记失败");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("确定要删除这篇笔记吗？")) return;

    try {
      setError("");
      await noteApi.deleteNote(id);
      setNotes(notes.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setTitle("");
        setContent("");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "删除笔记失败");
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-300">
        <h1 className="m-0 text-gray-800">我的笔记</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user?.name || user?.email}</span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white border-none rounded cursor-pointer hover:bg-red-700"
          >
            退出
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[400px] flex flex-col border-r border-gray-300 bg-gray-50">
          <div className="p-4 border-b border-gray-300 bg-white">
            <input
              type="text"
              placeholder="笔记标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2 py-2 mb-2 border border-gray-300 rounded text-sm"
            />
            <textarea
              placeholder="笔记内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-2 py-2 mb-2 border border-gray-300 rounded text-sm resize-y min-h-[100px]"
            />
            {selectedNote ? (
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateNote}
                  className="flex-1 px-2 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setSelectedNote(null);
                    setTitle("");
                    setContent("");
                  }}
                  className="flex-1 px-2 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={handleCreateNote}
                className="w-full px-2 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700"
              >
                创建笔记
              </button>
            )}
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-100 text-red-800 mx-4 my-4 rounded">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div>加载中...</div>
            ) : notes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">还没有笔记</div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-white p-4 mb-2 rounded cursor-pointer border-2 transition-all ${
                    selectedNote?.id === note.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-transparent hover:border-blue-600"
                  }`}
                  onClick={() => handleSelectNote(note)}
                >
                  <h3 className="m-0 mb-2 text-gray-800 text-base">
                    {note.title}
                  </h3>
                  <p className="m-0 mb-2 text-gray-600 text-sm">
                    {note.content ? note.content.substring(0, 100) + "..." : ""}
                  </p>
                  <button
                    className="px-2 py-1 bg-red-600 text-white border-none rounded cursor-pointer text-xs hover:bg-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
