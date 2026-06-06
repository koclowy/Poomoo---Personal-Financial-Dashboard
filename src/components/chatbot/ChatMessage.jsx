export default function ChatMessage({ role, content, type, onConfirm, onCancel }) {
  if (type === 'confirm') {
    return (
      <div className="my-2">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="text-white text-xs font-semibold px-4 py-2" style={{ backgroundColor: '#A67B50' }}>
            Suggested edit
          </div>
          <div className="px-4 py-3 space-y-1 text-sm">
            <div><span className="text-slate-400">Fund:</span> <span className="font-medium">{content.fundName}</span></div>
            <div><span className="text-slate-400">Month:</span> <span className="font-medium">{content.month}</span></div>
            <div><span className="text-slate-400">Column:</span> <span className="font-medium">{content.column}</span></div>
            <div><span className="text-slate-400">New value:</span> <span className="font-bold" style={{ color: '#A67B50' }}>RM {Number(content.value).toLocaleString()}</span></div>
          </div>
          <div className="px-4 pb-3 text-xs text-slate-500 italic">{content.summary}</div>
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={onConfirm}
              className="flex-1 py-2 text-sm text-white rounded-xl font-medium transition-colors" style={{ backgroundColor: '#A67B50' }}
            >
              Confirm
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-1`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'text-white rounded-br-sm'
            : 'bg-slate-100 text-slate-700 rounded-bl-sm'
        }`}
        style={isUser ? { backgroundColor: '#A67B50' } : {}}
      >
        {content}
      </div>
    </div>
  )
}
