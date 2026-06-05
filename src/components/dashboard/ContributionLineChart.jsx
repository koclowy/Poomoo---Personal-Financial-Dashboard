import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function parseNum(val) {
  return parseFloat(String(val ?? '').replace(/[^0-9.]/g, '')) || 0
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function ContributionLineChart({ funds }) {
  if (!funds?.length) return <div className="text-slate-400 text-sm text-center py-8">No data</div>

  const allMonths = new Set()
  const contributorTotals = {}

  funds.forEach((fund) => {
    if (!fund.data || !fund.columns) return
    const monthCol = fund.columns[0]
    const numCols = fund.columns.slice(1)

    fund.data.forEach((row) => {
      const month = String(row[monthCol] ?? '')
      if (month) allMonths.add(month)
      numCols.forEach((col) => {
        if (!contributorTotals[col]) contributorTotals[col] = {}
        if (!contributorTotals[col][month]) contributorTotals[col][month] = 0
        contributorTotals[col][month] += parseNum(row[col])
      })
    })
  })

  const months = [...allMonths]
  const contributors = Object.keys(contributorTotals)

  const chartData = months.map((m) => {
    const point = { month: m }
    contributors.forEach((c) => { point[c] = contributorTotals[c][m] || 0 })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `RM${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => [`RM ${v.toLocaleString()}`, undefined]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {contributors.map((c, i) => (
          <Line key={c} type="monotone" dataKey={c} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
