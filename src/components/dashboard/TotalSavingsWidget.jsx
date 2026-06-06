import { getFundTotal, parseNum } from '../../utils/fundUtils'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getAmountForMonth(fund, monthStr) {
  if (!fund?.data?.length || !fund?.columns?.length) return 0
  const dateCol = fund.columns[0]
  const totalCol = fund.columns.find((c) => /^(amount|total|balance)$/i.test(c.trim()))
  const row = fund.data.find((r) =>
    String(r[dateCol] ?? '').trim().toLowerCase() === monthStr.toLowerCase()
  )
  if (!row) return 0
  if (totalCol) return parseNum(row[totalCol])
  return fund.columns.slice(1).reduce((s, col) => s + parseNum(row[col]), 0)
}

export default function TotalSavingsWidget({ funds }) {
  const total = funds.reduce((sum, f) => sum + getFundTotal(f), 0)

  const now = new Date()
  const currentMonthStr = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
  const prevMonthStr = now.getMonth() === 0
    ? `Dec ${now.getFullYear() - 1}`
    : `${MONTH_NAMES[now.getMonth() - 1]} ${now.getFullYear()}`

  const thisMonthTotal = funds.reduce((sum, f) => sum + getAmountForMonth(f, currentMonthStr), 0)
  const lastMonthTotal = funds.reduce((sum, f) => sum + getAmountForMonth(f, prevMonthStr), 0)

  const pctChange = lastMonthTotal > 0
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0
  const positive = pctChange >= 0 && thisMonthTotal > 0

  return (
    <div className="h-full flex flex-col justify-between text-white rounded-xl p-1 -m-1" style={{ background: 'linear-gradient(135deg, #A67B50, #7A5C3A)' }}>
      <div>
        <div className="text-sm font-medium opacity-80 mb-1">Total across all funds</div>
        <div className="text-3xl font-black tracking-tight">
          RM {total.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs opacity-70 mt-1">{funds.length} fund{funds.length !== 1 ? 's' : ''}</div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/20">
        <div className="text-xs opacity-70 mb-0.5">{currentMonthStr} deposits</div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-amber-200">
            +RM {thisMonthTotal.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
          </span>
          {lastMonthTotal > 0 && (
            <span className={`text-xs ${positive ? 'opacity-60' : 'text-red-300'}`}>
              {positive ? '↑' : '↓'} {Math.abs(pctChange).toFixed(0)}% vs last month
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
