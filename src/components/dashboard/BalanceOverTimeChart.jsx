import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { parseNum, getDateCol } from '../../utils/fundUtils'

export default function BalanceOverTimeChart({ fund }) {
  if (!fund?.data?.length) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">No data</div>
  }

  const dateCol = getDateCol(fund)
  const amountCol = fund.columns?.find((c) => /^(amount|total|balance)$/i.test(c.trim()))

  let cumulative = 0
  const data = fund.data
    .filter((row) => {
      const d = String(row[dateCol] ?? '').trim().toLowerCase()
      return d && d !== 'total'
    })
    .map((row) => {
      cumulative += parseNum(amountCol ? row[amountCol] : 0)
      return {
        month: (() => { const s = String(row[dateCol] ?? '').trim(); const m = s.match(/^([A-Za-z]+)/); return m ? m[1].substring(0, 3) : s.substring(0, 3) })(),
        fullMonth: String(row[dateCol] ?? '').trim(),
        balance: cumulative,
      }
    })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E5E7EB" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#E5E7EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#F3F4F6" vertical={false} strokeDasharray="0" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          formatter={(v) => [`RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 0 })}`, 'Balance']}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullMonth ?? ''}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#111827"
          strokeWidth={1.5}
          fill="url(#balGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#111827', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
