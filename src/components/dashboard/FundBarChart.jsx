import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getFundTotal } from '../../utils/fundUtils'

const COLORS = ['#A67B50', '#7A5C3A', '#C9A882', '#4B3728', '#D4A574', '#6B5B47']

export default function FundBarChart({ funds }) {
  const navigate = useNavigate()
  const data = funds.map((f) => ({ name: f.name, total: getFundTotal(f), id: f.id }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => [`RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, 'Balance']} />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(d) => navigate(`/fund/${d.id}`)}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
