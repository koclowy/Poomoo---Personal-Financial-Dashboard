import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { parseNum, getDateCol } from '../../utils/fundUtils'

const BROWN = '#A67B50'
const BROWN_LIGHT = '#D4B896'
const GRAY = '#E5E7EB'

// "Jan 2026" → "Jan", "January 2026" → "Jan", "Jan" → "Jan"
function toShortMonth(str) {
  const s = String(str ?? '').trim()
  if (/^[A-Za-z]{3}/.test(s)) return s.substring(0, 3)
  const match = s.match(/^([A-Za-z]+)/)
  if (match) return match[1].substring(0, 3)
  return s.substring(0, 3)
}

export default function MonthlyDepositsChart({ fund }) {
  if (!fund?.data?.length) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">No data</div>
  }

  const dateCol = getDateCol(fund)
  const amountCol = fund.columns?.find((c) => /^(amount|total|balance)$/i.test(c.trim()))

  const data = fund.data
    .filter((row) => {
      const d = String(row[dateCol] ?? '').trim().toLowerCase()
      return d && d !== 'total'
    })
    .map((row) => ({
      month: toShortMonth(row[dateCol]),
      fullMonth: String(row[dateCol] ?? '').trim(),
      amount: parseNum(amountCol ? row[amountCol] : 0),
    }))

  const max = Math.max(...data.map((d) => d.amount), 1)

  function barColor(amount) {
    if (amount === 0) return GRAY
    if (amount === max) return BROWN
    return BROWN_LIGHT
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%">
        <XAxis
          dataKey="month"
          tick={{ fontSize: 9, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          formatter={(v) => [`RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 0 })}`, 'Deposit']}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullMonth ?? ''}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
        />
        <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={barColor(entry.amount)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
