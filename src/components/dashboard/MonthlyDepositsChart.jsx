import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { parseNum, getDateCol } from '../../utils/fundUtils'

const BROWN = '#A67B50'

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
      month: String(row[dateCol] ?? '').trim().substring(0, 1),
      amount: parseNum(amountCol ? row[amountCol] : 0),
    }))

  const max = Math.max(...data.map((d) => d.amount), 1)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%">
        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          formatter={(v) => [`RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 0 })}`, 'Deposit']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
        />
        <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.amount === max ? BROWN : '#E5E7EB'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
