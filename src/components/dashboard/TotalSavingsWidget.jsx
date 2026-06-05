function parseNum(val) {
  return parseFloat(String(val ?? '').replace(/[^0-9.]/g, '')) || 0
}

function getFundTotal(fund) {
  if (!fund.data || !fund.columns) return 0
  const numCols = fund.columns.slice(1)
  return fund.data.reduce((sum, row) => {
    return sum + numCols.reduce((s, col) => s + parseNum(row[col]), 0)
  }, 0)
}

function getMonthlyTotal(fund, monthIndex) {
  if (!fund.data || fund.data.length === 0) return 0
  const row = fund.data[monthIndex]
  if (!row) return 0
  const numCols = fund.columns.slice(1)
  return numCols.reduce((s, col) => s + parseNum(row[col]), 0)
}

export default function TotalSavingsWidget({ funds }) {
  const total = funds.reduce((sum, f) => sum + getFundTotal(f), 0)

  const thisMonthTotal = funds.reduce((sum, f) => {
    const lastIdx = (f.data?.length ?? 0) - 1
    return sum + getMonthlyTotal(f, lastIdx)
  }, 0)

  const lastMonthTotal = funds.reduce((sum, f) => {
    const lastIdx = (f.data?.length ?? 0) - 2
    return sum + getMonthlyTotal(f, lastIdx)
  }, 0)

  const pctChange = lastMonthTotal > 0
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0

  const positive = pctChange >= 0

  return (
    <div className="h-full flex flex-col justify-between bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-1 -m-1">
      <div>
        <div className="text-sm font-medium opacity-80 mb-1">Total Savings</div>
        <div className="text-3xl font-black tracking-tight">
          RM {total.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs opacity-70 mt-1">{funds.length} fund{funds.length !== 1 ? 's' : ''}</div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/20">
        <div className="text-xs opacity-70 mb-0.5">This month vs last</div>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-bold ${positive ? 'text-green-300' : 'text-red-300'}`}>
            {positive ? '+' : ''}{pctChange.toFixed(1)}%
          </span>
          <span className="text-xs opacity-60">
            RM {thisMonthTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )
}
