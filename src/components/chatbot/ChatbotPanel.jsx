import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'
import { askGemini } from './useChatbot'
import { updateFundData, logTransaction } from '../../firebase/firestore'
import { useToast } from '../Toast'

const WELCOME = `Hi! I'm your Poomoo assistant. You can tell me things like:
• "Add RM 500 to my retirement fund for July"
• "Set Siti's emergency fund contribution for June to RM 200"
• "How much have I saved in total this year?"`

let _idCounter = 0
function nextId() { return ++_idCounter }

export default function ChatbotPanel({ funds, dashboardId, currentUser, onClose }) {
  const [messages, setMessages] = useState([{ id: nextId(), role: 'bot', content: WELCOME, type: 'text' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingEdit, setPendingEdit] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [history, setHistory] = useState([])
  const bottomRef = useRef()
  const addToast = useToast()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function addMessage(msg) {
    const id = nextId()
    setMessages((prev) => [...prev, { id, ...msg }])
    return id
  }

  function updateMessage(id, updates) {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, ...updates } : m))
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    addMessage({ role: 'user', content: text, type: 'text' })
    setLoading(true)

    if (!funds || funds.length === 0) {
      setLoading(false)
      addMessage({ role: 'bot', content: 'Please upload at least one fund first.', type: 'text' })
      return
    }

    const { result, rawText } = await askGemini(funds, text, currentUser, history)
    setLoading(false)

    setHistory((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'model', text: rawText },
    ])

    if (result.action === 'update_cell') {
      const confirmId = addMessage({ role: 'bot', content: result, type: 'confirm' })
      setPendingEdit({ ...result, confirmMsgId: confirmId })
    } else if (result.action === 'clarify') {
      addMessage({ role: 'bot', content: result.question, type: 'text' })
    } else {
      addMessage({ role: 'bot', content: result.reply || "I'm not sure about that.", type: 'text' })
    }
  }

  async function handleConfirm() {
    if (!pendingEdit) return
    const { fundId, fundName, month, column, value, confirmMsgId } = pendingEdit
    const fund = funds.find((f) => f.id === fundId)
    if (!fund) {
      updateMessage(confirmMsgId, { type: 'text', content: 'Could not find that fund. Please try again.' })
      setPendingEdit(null)
      return
    }

    setConfirmingId(confirmMsgId)
    setLoading(true)
    setPendingEdit(null)

    try {
      const monthCol = fund.columns[0]
      const amountCol = fund.columns.find((c) => /^(amount|total|balance)$/i.test(c.trim()))
      const contributorCols = fund.columns.filter((c) => {
        const lower = c.toLowerCase()
        return c !== monthCol && !['amount', 'total', 'balance', 'date', 'month'].includes(lower)
      })

      const updatedData = fund.data.map((row) => {
        if (String(row[monthCol]) === String(month)) {
          const updatedRow = { ...row, [column]: value }
          if (contributorCols.length > 0 && amountCol) {
            updatedRow[amountCol] = contributorCols.reduce((sum, col) => {
              return sum + (parseFloat(String(updatedRow[col]).replace(/[^0-9.]/g, '')) || 0)
            }, 0)
          }
          return updatedRow
        }
        return row
      })

      await updateFundData(fundId, updatedData)

      await logTransaction(
        fundId,
        dashboardId,
        currentUser.uid,
        currentUser.displayName,
        value,
        month,
        `AI edit: set ${column} to ${value}`
      )

      updateMessage(confirmMsgId, {
        type: 'success',
        content: `Done! Updated ${fundName} — ${column} for ${month} is now RM ${Number(value).toLocaleString()}.`,
      })
      addToast?.('Edit applied — fund updated')
    } catch (err) {
      updateMessage(confirmMsgId, { type: 'text', content: 'Something went wrong applying the edit. Please try again.' })
      addToast?.('Update failed — please try again', 'error')
    } finally {
      setLoading(false)
      setConfirmingId(null)
    }
  }

  function handleCancel() {
    if (!pendingEdit) return
    const { confirmMsgId } = pendingEdit
    updateMessage(confirmMsgId, { type: 'text', content: 'Edit cancelled.' })
    setPendingEdit(null)
  }

  function handleClearChat() {
    setMessages([{ id: nextId(), role: 'bot', content: WELCOME, type: 'text' }])
    setHistory([])
    setPendingEdit(null)
    setConfirmingId(null)
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 max-sm:w-full bg-white shadow-2xl border-l border-slate-100 z-40 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <div className="font-bold text-slate-900">Poomoo AI</div>
          <div className="text-xs text-slate-400">Powered by Gemini</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Clear
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            {...msg}
            onConfirm={msg.type === 'confirm' ? handleConfirm : undefined}
            onCancel={msg.type === 'confirm' ? handleCancel : undefined}
            confirmDisabled={confirmingId === msg.id || loading}
          />
        ))}
        {loading && (
          <div className="flex justify-start my-1">
            <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-4 border-t border-slate-100">
        {(!funds || funds.length === 0) && (
          <div className="text-xs text-slate-400 text-center mb-2">Upload at least one fund first</div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading || !funds?.length}
            placeholder="Type a message…"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#A67B50] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || !funds?.length}
            className="px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#A67B50' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
