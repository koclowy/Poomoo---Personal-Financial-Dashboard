import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function FundBarChart({ funds }) {
  const navigate = useNavigate()
  const data = funds.map((f) => ({ name: f.name, total: getFundTotal(f), id: f.id }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `RM${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => [`RM ${v.toLocaleString()}`, 'Balance']} />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(d) => navigate(`/fund/${d.id}`)}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
