import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { parseNum, getDateCol } from '../../utils/fundUtils'

const COLORS = ['#A67B50', '#7A5C3A', '#C9A882', '#4B3728', '#D4A574', '#6B5B47']

export default function ContributionLineChart({ funds }) {
  if (!funds?.length) return <div className="text-slate-400 text-sm text-center py-8">No data</div>

  // For each fund, show its total-column value per month over time
  const allMonths = []
  const seenMonths = new Set()

  funds.forEach((fund) => {
    const dateCol = getDateCol(fund)
    if (!dateCol || !fund.data) return
    fund.data.forEach((row) => {
      const month = String(row[dateCol] ?? '').trim()
      if (month && !seenMonths.has(month)) {
        seenMonths.add(month)
        allMonths.push(month)
      }
    })
  })

  const chartData = allMonths.map((month) => {
    const point = { month }
    funds.forEach((fund) => {
      const dateCol = getDateCol(fund)
      if (!dateCol || !fund.data) return
      const totalCol = fund.columns?.find((c) => /^(amount|total|balance)$/i.test(c.trim()))
        || fund.columns?.[fund.columns.length - 1]
      const row = fund.data.find((r) => String(r[dateCol] ?? '').trim() === month)
      point[fund.name] = row && totalCol ? parseNum(row[totalCol]) : 0
    })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `RM${(v / 1000).toFixed(1)}k`} />
        <Tooltip formatter={(v) => [`RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, undefined]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {funds.map((f, i) => (
          <Line key={f.id} type="monotone" dataKey={f.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
