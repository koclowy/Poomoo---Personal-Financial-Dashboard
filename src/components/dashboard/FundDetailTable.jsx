export default function FundDetailTable({ fund }) {
  if (!fund?.data?.length) {
    return <div className="text-slate-400 text-sm text-center py-8">No data yet</div>
  }

  const { columns, data } = fund
  const lastIdx = data.length - 1

  function formatCell(val) {
    if (typeof val === 'number') {
      return val.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return String(val ?? '')
  }

  return (
    <div className="overflow-auto h-full">
      <table className="text-xs w-full">
        <thead className="sticky top-0">
          <tr className="bg-slate-900 text-white">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={
                i === lastIdx
                  ? 'bg-amber-50 font-medium'
                  : i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }
            >
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 whitespace-nowrap">{formatCell(row[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
