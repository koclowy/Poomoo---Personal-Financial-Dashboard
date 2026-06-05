export default function WidgetCard({ title, children, onRemove }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
      <div className="widget-handle flex items-center justify-between px-4 py-2 border-b border-slate-100 cursor-grab active:cursor-grabbing select-none bg-slate-50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" />
          </svg>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  )
}
