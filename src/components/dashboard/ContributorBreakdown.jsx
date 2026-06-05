import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function ContributorBreakdown({ transactions }) {
  if (!transactions?.length) {
    return <div className="text-slate-400 text-sm text-center py-8">No transactions yet</div>
  }

  const totals = {}
  transactions.forEach((tx) => {
    const name = tx.contributorName || 'Unknown'
    totals[name] = (totals[name] || 0) + (tx.amount || 0)
  })

  const data = Object.entries(totals).map(([name, value]) => ({ name, value }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="70%"
          dataKey="value"
          label={({ name, value }) => `${name}: RM${value.toLocaleString()}`}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => [`RM ${Number(v).toLocaleString()}`, 'Total']} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
