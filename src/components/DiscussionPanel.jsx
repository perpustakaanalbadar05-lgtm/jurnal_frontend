import { useState, useEffect, useRef } from 'react'
import { discussionService } from '../services/discussionService'
import { useAuth } from '../hooks/useAuth'
import { formatDateTime } from '../utils/helpers'
import { Spinner } from './Loader'
import toast from 'react-hot-toast'

export default function DiscussionPanel({ paperId }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const fetchMessages = async () => {
    try {
      const data = await discussionService.list(paperId)
      setMessages(data)
    } catch {
      toast.error('Gagal memuat diskusi internal')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 5 seconds for elegant real-time updates
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [paperId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const msg = await discussionService.send(paperId, newMessage.trim())
      setMessages((prev) => [...prev, msg])
      setNewMessage('')
    } catch {
      toast.error('Gagal mengirim pesan')
    } finally {
      setSending(false)
    }
  }

  const getBubbleStyles = (msgUser) => {
    const isMe = msgUser.id === user?.id
    const base = "max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm border text-sm leading-relaxed"
    
    if (isMe) {
      return `${base} bg-primary text-white border-primary self-end`
    }

    if (msgUser.role === 'admin' || msgUser.role === 'super_admin') {
      return `${base} bg-blue-50 text-blue-950 border-blue-100 self-start`
    }

    if (msgUser.role === 'reviewer') {
      return `${base} bg-purple-50 text-purple-950 border-purple-100 self-start`
    }

    return `${base} bg-emerald-50 text-emerald-950 border-emerald-100 self-start`
  }

  const getRoleLabel = (role) => {
    if (role === 'super_admin') return 'Super Admin 👑'
    if (role === 'admin') return 'Admin 💼'
    if (role === 'reviewer') return 'Reviewer 🔍'
    return 'Dosen/Author 📝'
  }

  return (
    <div className="flex flex-col h-[400px] bg-slate-50 border border-gray-100 rounded-2xl overflow-hidden mt-6 shadow-inner">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h3 className="font-bold text-gray-800 text-sm">Kolom Diskusi / Obrolan Internal</h3>
        </div>
        <button 
          onClick={fetchMessages} 
          className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-0">
        {loading && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-xs font-semibold">Belum ada obrolan untuk paper ini.</p>
            <p className="text-[11px] text-gray-400 mt-1">Mulai obrolan untuk berdiskusi secara langsung.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === user?.id
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="text-[11px] font-semibold text-gray-400 px-1">
                  {isMe ? 'Anda' : `${msg.user.name} (${getRoleLabel(msg.user.role)})`}
                </div>
                <div className={getBubbleStyles(msg.user)}>
                  <p className="whitespace-pre-wrap break-all">{msg.message}</p>
                </div>
                <div className="text-[10px] text-gray-400 px-1">
                  {formatDateTime(msg.created_at)}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white border-t border-gray-100 p-3 flex gap-2 shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Tulis pesan diskusi di sini..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-400 text-gray-800"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 shadow-md shadow-primary/10 disabled:opacity-50 disabled:shadow-none shrink-0"
        >
          {sending ? <Spinner size="sm" /> : 'Kirim 🚀'}
        </button>
      </form>
    </div>
  )
}
