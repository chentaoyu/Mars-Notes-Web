import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { noteApi } from '../services/api'
import { Note } from '@note-book/shared'
import './Notes.css'

export default function NotesPage() {
  const { user, logout } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const data = await noteApi.getNotes()
      setNotes(data.data)
    } catch (err: any) {
      setError(err.response?.data?.error || '加载笔记失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async () => {
    if (!title.trim()) return

    try {
      setError('')
      const response = await noteApi.createNote({ title, content })
      if (response.data) {
        setNotes([response.data, ...notes])
        setTitle('')
        setContent('')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '创建笔记失败')
    }
  }

  const handleUpdateNote = async () => {
    if (!selectedNote || !title.trim()) return

    try {
      setError('')
      const response = await noteApi.updateNote(selectedNote.id, { title, content })
      if (response.data) {
        setNotes(notes.map((n) => (n.id === selectedNote.id ? response.data! : n)))
        setSelectedNote(null)
        setTitle('')
        setContent('')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '更新笔记失败')
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('确定要删除这篇笔记吗？')) return

    try {
      setError('')
      await noteApi.deleteNote(id)
      setNotes(notes.filter((n) => n.id !== id))
      if (selectedNote?.id === id) {
        setSelectedNote(null)
        setTitle('')
        setContent('')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '删除笔记失败')
    }
  }

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setTitle(note.title)
    setContent(note.content)
  }

  return (
    <div className="notes-container">
      <header className="notes-header">
        <h1>我的笔记</h1>
        <div className="user-info">
          <span>{user?.name || user?.email}</span>
          <button onClick={logout}>退出</button>
        </div>
      </header>

      <div className="notes-content">
        <div className="notes-sidebar">
          <div className="notes-form">
            <input
              type="text"
              placeholder="笔记标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="笔记内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
            />
            {selectedNote ? (
              <div className="form-actions">
                <button onClick={handleUpdateNote}>保存</button>
                <button onClick={() => { setSelectedNote(null); setTitle(''); setContent(''); }}>取消</button>
              </div>
            ) : (
              <button onClick={handleCreateNote}>创建笔记</button>
            )}
          </div>

          {error && <div className="error">{error}</div>}

          <div className="notes-list">
            {loading ? (
              <div>加载中...</div>
            ) : notes.length === 0 ? (
              <div className="empty">还没有笔记</div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                  onClick={() => handleSelectNote(note)}
                >
                  <h3>{note.title}</h3>
                  <p>{note.content ? note.content.substring(0, 100) + '...' : ''}</p>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNote(note.id)
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
  )
}

