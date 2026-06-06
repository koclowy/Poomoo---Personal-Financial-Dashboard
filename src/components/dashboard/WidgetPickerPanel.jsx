const BROWN = '#A67B50'

const CATALOG = [
  { id: 'balance-over-time',     title: 'Balance over time',      desc: 'Cumulative savings line chart',         icon: '📈' },
  { id: 'monthly-deposits',      title: 'Monthly deposits',       desc: 'Bar chart of monthly contributions',    icon: '📊' },
  { id: 'split',                 title: 'Split',                  desc: 'Your share vs partner (donut)',         icon: '🍩' },
  { id: 'who-contributed',       title: 'Who contributed',        desc: 'Per-fund contribution breakdown',       icon: '👥' },
  { id: 'transactions',          title: 'Transactions',           desc: 'Scrollable transaction log',            icon: '🧾' },
  { id: 'total-savings',         title: 'Total savings',          desc: 'Summary card across all funds',         icon: '💰' },
  { id: 'fund-bar-chart',        title: 'Fund comparison',        desc: 'Bar chart comparing fund balances',     icon: '🏦' },
  { id: 'contribution-line',     title: 'Contribution history',   desc: 'Line chart across all funds over time', icon: '📉' },
  { id: 'monthly-contribution',  title: 'Monthly contributions',  desc: 'Stacked bars by contributor',           icon: '📋' },
  { id: 'contributor-pie',       title: 'Contributor pie',        desc: 'Pie chart of all contributors',         icon: '🥧' },
]

export default function WidgetPickerPanel({ existingWidgetIds = [], onAdd, onClose }) {
  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-100 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="font-semibold text-gray-900">Add widget</div>
          <div className="text-xs text-gray-400 mt-0.5">Click to add to your layout</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
      </div>

      {/* Widget list */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {CATALOG.map((widget) => {
          const added = existingWidgetIds.includes(widget.id)
          return (
            <div
              key={widget.id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: '#F8F1EA' }}
              >
                {widget.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{widget.title}</div>
                <div className="text-xs text-gray-400 truncate">{widget.desc}</div>
              </div>
              {added ? (
                <span className="text-xs text-gray-400 flex-shrink-0">Added</span>
              ) : (
                <button
                  onClick={() => onAdd(widget.id)}
                  className="text-xs font-medium text-white px-2.5 py-1 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: BROWN }}
                >
                  + Add
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
