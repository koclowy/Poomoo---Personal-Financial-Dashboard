import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { collection, query, where } from 'firebase/firestore'
import { writeXLSX } from '../components/upload/useSheetParser'
import ContributionLineChart from '../components/dashboard/ContributionLineChart'
import ContributorBreakdown from '../components/dashboard/ContributorBreakdown'

function parseNum(val) {
  return parseFloat(String(val ?? '').replace(/[^0-9.]/g, '')) || 0
}

export default function FundDetail() {
  const { id } = useParams()
  const [fund, setFund] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'funds', id), (snap) => {
      if (snap.exists()) setFund({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
    return unsub
  }, [id])

  useEffect(() => {
    if (!id) return
    const q = query(collection(db, 'transactions'), where('fundId', '==', id))
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [id])

  function handleSort(col) {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function getSortedData() {
    if (!fund?.data) return []
    if (!sortCol) return fund.data
    return [...fund.data].sort((a, b) => {
      const av = a[sortCol] ?? ''
      const bv = b[sortCol] ?? ''
      const an = parseNum(av), bn = parseNum(bv)
      if (an !== 0 || bn !== 0) return sortDir === 'asc' ? an - bn : bn - an
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
  }

  function handleDownload() {
    if (!fund) return
    const buffer = writeXLSX(fund.columns, fund.data)
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fund.name}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <svg className="animate-spin w-8 h-8" style={{ color: '#A67B50' }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )

  if (!fund) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">🔍</div>
        <div className="text-slate-600">Fund not found</div>
        <Link to="/dashboard" className="mt-4 inline-block hover:underline" style={{ color: '#A67B50' }}>Back to Dashboard</Link>
      </div>
    </div>
  )

  const sortedData = getSortedData()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
        <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1">
          ← Dashboard
        </Link>
        <div className="font-bold text-slate-900 text-lg flex-1">{fund.name}</div>
        <button
          onClick={handleDownload}
          className="px-4 py-2 text-sm rounded-xl font-medium text-white" style={{ backgroundColor: '#A67B50' }}
        >
          Download .xlsx
        </button>
      </nav>

      <main className="p-6 space-y-6">
        {(!fund.data || fund.data.length === 0) ? (
          <div className="text-center py-16 text-slate-400">This fund has no data yet</div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">All Rows</h2>
                <p className="text-xs text-slate-400 mt-0.5">Click a column header to sort</p>
              </div>
              <div className="overflow-auto max-h-[400px]">
                <table className="text-sm w-full">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-900 text-white">
                      {fund.columns.map((col) => (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="px-4 py-3 text-left font-medium whitespace-nowrap cursor-pointer hover:bg-slate-700 select-none"
                        >
                          {col}
                          {sortCol === col && (
                            <span className="ml-1 opacity-70">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        {fund.columns.map((col) => (
                          <td key={col} className="px-4 py-2.5 whitespace-nowrap">{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Contribution History</h2>
                <div style={{ height: 280 }}>
                  <ContributionLineChart funds={[fund]} />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Contributor Breakdown</h2>
                <div style={{ height: 280 }}>
                  <ContributorBreakdown transactions={transactions} />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
