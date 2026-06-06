import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { parseNum, getDateCol, getContributorCols } from '../../utils/fundUtils'

const COLORS = ['#A67B50', '#7A5C3A', '#C9A882', '#4B3728', '#D4A574']

export default function MonthlyContributionChart({ funds }) {
  if (!funds?.length) {
    return <div className="text-slate-400 text-sm text-center py-8">No data</div>
  }

  const allMonths = []
  const seenMonths = new Set()
  const contributorData = {}
  const allContributors = new Set()

  funds.forEach((fund) => {
    const dateCol = getDateCol(fund)
    const contribs = getContributorCols(fund)
    if (!dateCol || contribs.length === 0 || !fund.data) return

    fund.data.forEach((row) => {
      const month = String(row[dateCol] ?? '').trim()
      if (!month || month.toLowerCase() === 'total') return
      if (!seenMonths.has(month)) {
        seenMonths.add(month)
        allMonths.push(month)
      }
      if (!contributorData[month]) contributorData[month] = {}
      contribs.forEach((c) => {
        allContributors.add(c)
        contributorData[month][c] = (contributorData[month][c] || 0) + parseNum(row[c])
      })
    })
  })

  if (allContributors.size === 0) {
    return <div className="text-slate-400 text-sm text-center py-8">No contributor columns detected</div>
  }

  const contributors = [...allContributors]
  const chartData = allMonths.map((m) => {
    const point = { month: m }
    contributors.forEach((c) => { point[c] = contributorData[m]?.[c] || 0 })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `RM${(v / 1000).toFixed(1)}k`} />
        <Tooltip formatter={(v) => [`RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, undefined]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {contributors.map((c, i) => (
          <Bar key={c} dataKey={c} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
