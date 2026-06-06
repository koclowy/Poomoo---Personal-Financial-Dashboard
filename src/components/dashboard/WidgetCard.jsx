export default function WidgetCard({ title, subtitle, children, onRemove }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="widget-handle flex items-center justify-between px-5 py-3 border-b border-gray-100 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" />
          </svg>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-900">{title}</span>
            {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none ml-2"
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
