import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFunds } from '../hooks/useFunds'
import UploadModal from '../components/upload/UploadModal'
import ChatbotPanel from '../components/chatbot/ChatbotPanel'
import { signOutUser } from '../firebase/auth'
import { deleteFund } from '../firebase/firestore'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getFundTotal, parseNum, getDateCol, getContributorCols } from '../utils/fundUtils'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import BalanceOverTimeChart from '../components/dashboard/BalanceOverTimeChart'
import MonthlyDepositsChart from '../components/dashboard/MonthlyDepositsChart'
import DashboardGrid from '../components/dashboard/DashboardGrid'
import WidgetCard from '../components/dashboard/WidgetCard'
import TotalSavingsWidget from '../components/dashboard/TotalSavingsWidget'
import FundBarChart from '../components/dashboard/FundBarChart'
import ContributionLineChart from '../components/dashboard/ContributionLineChart'
import ContributorBreakdown from '../components/dashboard/ContributorBreakdown'
import MonthlyContributionChart from '../components/dashboard/MonthlyContributionChart'
import WidgetPickerPanel from '../components/dashboard/WidgetPickerPanel'
import CollaboratorsPanel from '../components/settings/CollaboratorsPanel'
import { updateFundGoal } from '../firebase/firestore'

const BROWN = '#A67B50'

const DEFAULT_WIDGET_LAYOUT = [
  { i: 'balance-over-time', x: 0,  y: 0, w: 7,  h: 4 },
  { i: 'monthly-deposits',  x: 7,  y: 0, w: 5,  h: 4 },
  { i: 'split',             x: 0,  y: 4, w: 5,  h: 4 },
  { i: 'who-contributed',   x: 5,  y: 4, w: 7,  h: 4 },
  { i: 'transactions',      x: 0,  y: 8, w: 12, h: 6 },
]

// ── Data helpers ────────────────────────────────────────────────

function getMonthlyTotals(fund) {
  if (!fund?.data?.length) return []
  const dateCol = getDateCol(fund)
  const totalCol = fund.columns?.find((c) => /^(amount|total|balance)$/i.test(c.trim()))
  return fund.data
    .filter((row) => {
      const d = String(row[dateCol] ?? '').trim().toLowerCase()
      return d && d !== 'total'
    })
    .map((row) => ({
      month: dateCol ? String(row[dateCol] ?? '').trim() : '',
      amount: totalCol ? parseNum(row[totalCol]) : 0,
    }))
}

function getContributorSplit(fund) {
  if (!fund?.data?.length) return []
  const contribs = getContributorCols(fund)
  if (!contribs.length) return []
  const totals = {}
  contribs.forEach((c) => { totals[c] = 0 })
  fund.data.forEach((row) => { contribs.forEach((c) => { totals[c] += parseNum(row[c]) }) })
  const grand = Object.values(totals).reduce((a, b) => a + b, 0)
  return contribs.map((c) => ({
    name: c,
    value: totals[c],
    pct: grand > 0 ? Math.round((totals[c] / grand) * 100) : 0,
  }))
}

function getFundRows(fund) {
  if (!fund?.data?.length || !fund?.columns?.length) return []
  const dateCol = getDateCol(fund)
  const amountCol = fund.columns.find((c) => /^(amount|total|balance)$/i.test(c.trim()))
  const descCol = fund.columns.find((c) => /^(description|desc|note|notes|memo|type)$/i.test(c.trim()))
  const contribs = getContributorCols(fund)

  return fund.data
    .filter((row) => {
      const d = String(row[dateCol] ?? '').trim().toLowerCase()
      return d && d !== 'total'
    })
    .map((row) => {
      const amount = amountCol ? parseNum(row[amountCol]) : 0
      let byName = ''
      if (contribs.length > 0) {
        for (const c of contribs) {
          if (parseNum(row[c]) > 0) { byName = c; break }
        }
        if (!byName) byName = contribs[0]
      }
      return {
        date: dateCol ? String(row[dateCol] ?? '') : '',
        description: descCol ? String(row[descCol] ?? '') : 'Deposit',
        by: byName,
        amount,
      }
    })
    .reverse()
}

// ── Sub-components ───────────────────────────────────────────────

function StatCard({ label, value, sub, positive }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="text-xs text-gray-400 mb-3">{label}</div>
      <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
      {sub && (
        <div
          className={`text-xs mt-2 font-medium ${positive ? '' : 'text-red-500'}`}
          style={positive ? { color: BROWN } : {}}
        >
          {positive ? '↑' : '↓'} {sub}
        </div>
      )}
    </div>
  )
}

function DotsMenu() {
  return (
    <button className="text-gray-300 hover:text-gray-500 transition-colors">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    </button>
  )
}

function SplitWidget({ split }) {
  if (split.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        No contributor data
      </div>
    )
  }
  return (
    <div className="flex items-center gap-6 h-full py-2">
      <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { name: split[0].name, value: split[0].pct },
                { name: split[1].name, value: split[1].pct },
              ]}
              cx="50%" cy="50%"
              innerRadius={36} outerRadius={54}
              dataKey="value"
              startAngle={90} endAngle={-270}
              strokeWidth={0}
            >
              <Cell fill="#111827" />
              <Cell fill="#D1D5DB" />
            </Pie>
            <Tooltip formatter={(v) => [`${v}%`]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-gray-900 leading-none">{split[0].pct}%</span>
          <span className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">you</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {split.slice(0, 2).map((s, i) => (
          <div key={s.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: i === 0 ? '#111827' : '#D1D5DB' }} />
            <span className="text-sm text-gray-600">{s.name}</span>
            <span className="text-sm font-semibold text-gray-900">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WhoContributedWidget({ allFundSplits }) {
  const hasSplitData = allFundSplits.some((fs) => fs.split.length >= 2)
  if (!hasSplitData) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">No contributor data</div>
  }
  const legendNames = (allFundSplits.find((fs) => fs.split.length >= 2)?.split || []).slice(0, 2)
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="flex items-center gap-4 mb-4">
        {legendNames.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? '#111827' : '#9CA3AF' }} />
            <span className="text-xs text-gray-500">{s.name}</span>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {allFundSplits.map(({ fund: f, split: s }) => {
          if (s.length < 2) return null
          return (
            <div key={f.id} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 truncate">{f.name}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full flex">
                  <div className="h-full" style={{ width: `${s[0].pct}%`, backgroundColor: '#111827' }} />
                  <div className="h-full" style={{ width: `${s[1].pct}%`, backgroundColor: '#9CA3AF' }} />
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-600 w-8 text-right">{s[0].pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TransactionsWidget({ fundRows, fundName }) {
  if (fundRows.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">No data for this fund</div>
  }
  return (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
            <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</th>
            <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">By</th>
            <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
          </tr>
        </thead>
        <tbody>
          {fundRows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
              <td className="py-2.5 pr-4 text-sm text-gray-500 font-mono">{row.date}</td>
              <td className="py-2.5 pr-4 text-sm text-gray-800">{row.description}</td>
              <td className="py-2.5 pr-4">
                {row.by && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                    {row.by}
                  </span>
                )}
              </td>
              <td className={`py-2.5 text-sm text-right font-semibold font-mono ${row.amount >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                {row.amount >= 0 ? '+' : ''}RM {Math.abs(row.amount).toLocaleString('en-MY', { minimumFractionDigits: 0 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────

export default function Dashboard() {
  const { user, userDoc } = useAuth()
  const dashboardId = userDoc?.dashboardId || user?.uid
  const { funds, loading: fundsLoading } = useFunds(dashboardId)
  const [selectedFundId, setSelectedFundId] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [showWidgetPicker, setShowWidgetPicker] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [widgetLayout, setWidgetLayout] = useState(DEFAULT_WIDGET_LAYOUT)
  const [transactions, setTransactions] = useState([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCollabModal, setShowCollabModal] = useState(false)
  const [showGoalEdit, setShowGoalEdit] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const userMenuRef = useRef(null)
  const layoutInitialised = useRef(false)
  const navigate = useNavigate()

  // Default to first fund
  useEffect(() => {
    if (funds.length && !selectedFundId) setSelectedFundId(funds[0].id)
  }, [funds, selectedFundId])

  // Load saved widget layout from localStorage — fires once when dashboardId first resolves
  useEffect(() => {
    if (!dashboardId || layoutInitialised.current) return
    layoutInitialised.current = true
    try {
      const saved = localStorage.getItem(`poomoo-wl-${dashboardId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) setWidgetLayout(parsed)
      }
    } catch {}
  }, [dashboardId])

  // Firestore transactions
  useEffect(() => {
    if (!dashboardId) return
    const q = query(collection(db, 'transactions'), where('dashboardId', '==', dashboardId))
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [dashboardId])

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setShowUserMenu(false)
    await signOutUser()
    navigate('/login')
  }

  async function handleSaveGoal() {
    if (!selectedFund) return
    await updateFundGoal(selectedFund.id, goalInput || null)
    setShowGoalEdit(false)
    setGoalInput('')
  }

  function handleLayoutChange(newLayout) {
    setWidgetLayout(newLayout)
    if (dashboardId) {
      localStorage.setItem(`poomoo-wl-${dashboardId}`, JSON.stringify(newLayout))
    }
  }

  function removeWidget(widgetId) {
    const next = widgetLayout.filter((l) => l.i !== widgetId)
    handleLayoutChange(next)
  }

  async function handleDeleteFund(fundId) {
    setDeleteConfirmId(null)
    await deleteFund(fundId)
    if (selectedFundId === fundId) {
      const remaining = funds.filter((f) => f.id !== fundId)
      setSelectedFundId(remaining[0]?.id || null)
    }
  }

  function addWidget(widgetId) {
    if (widgetLayout.some((l) => l.i === widgetId)) return
    const next = [...widgetLayout, { i: widgetId, x: 0, y: Infinity, w: 6, h: 4, minW: 2, minH: 2 }]
    handleLayoutChange(next)
    setEditMode(true)
  }

  // Derived data
  const selectedFund = funds.find((f) => f.id === selectedFundId) || funds[0] || null
  const balance = selectedFund ? getFundTotal(selectedFund) : 0
  const monthlyTotals = selectedFund ? getMonthlyTotals(selectedFund) : []

  // Match the actual current month — "Jun 2026" format
  const now = new Date()
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const currentMonthStr = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
  const prevMonthStr = now.getMonth() === 0
    ? `Dec ${now.getFullYear() - 1}`
    : `${MONTH_NAMES[now.getMonth() - 1]} ${now.getFullYear()}`

  const thisMonthEntry = monthlyTotals.find((m) =>
    m.month.trim().toLowerCase() === currentMonthStr.toLowerCase()
  )
  const lastMonthEntry = monthlyTotals.find((m) =>
    m.month.trim().toLowerCase() === prevMonthStr.toLowerCase()
  )

  const thisMonth = thisMonthEntry?.amount || 0
  const lastMonth = lastMonthEntry?.amount || 0
  const monthlyChangePct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0
  const split = selectedFund ? getContributorSplit(selectedFund) : []
  const userShare = split[0]?.pct || 0
  const goal = selectedFund?.goal || null
  const goalPct = goal && balance > 0 ? Math.min(Math.round((balance / goal) * 100), 100) : null
  const fundRows = selectedFund ? getFundRows(selectedFund) : []
  const allFundSplits = funds.map((f) => ({ fund: f, split: getContributorSplit(f) }))

  // Widget renderer for edit-mode grid
  function renderWidget(item) {
    const WIDGET_MAP = {
      'balance-over-time':     { title: 'Balance over time',     subtitle: 'cumulative', content: <BalanceOverTimeChart fund={selectedFund} /> },
      'monthly-deposits':      { title: 'Monthly deposits',      subtitle: '2025',       content: <MonthlyDepositsChart fund={selectedFund} /> },
      'split':                 { title: 'Split',                 subtitle: split.length >= 2 ? `you vs ${split[1]?.name}` : '', content: <SplitWidget split={split} /> },
      'who-contributed':       { title: 'Who contributed',       subtitle: 'across all funds', content: <WhoContributedWidget allFundSplits={allFundSplits} /> },
      'transactions':          { title: 'Transactions',          subtitle: selectedFund?.name,  content: <TransactionsWidget fundRows={fundRows} fundName={selectedFund?.name} /> },
      'total-savings':         { title: 'Total savings',         subtitle: '',           content: <TotalSavingsWidget funds={funds} /> },
      'fund-bar-chart':        { title: 'Fund comparison',       subtitle: '',           content: <FundBarChart funds={funds} /> },
      'contribution-line':     { title: 'Contribution history',  subtitle: '',           content: <ContributionLineChart funds={funds} /> },
      'monthly-contribution':  { title: 'Monthly contributions', subtitle: '',           content: <MonthlyContributionChart funds={funds} /> },
      'contributor-pie':       { title: 'Contributor breakdown', subtitle: '',           content: <ContributorBreakdown transactions={transactions} /> },
    }
    const def = WIDGET_MAP[item.i]
    if (!def) return <div key={item.i} className="h-full" />
    return (
      <div key={item.i} className="h-full">
        <WidgetCard title={def.title} subtitle={def.subtitle} editMode={editMode} onRemove={() => removeWidget(item.i)}>
          {def.content}
        </WidgetCard>
      </div>
    )
  }

  if (fundsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F4' }}>
        <svg className="animate-spin w-7 h-7" style={{ color: BROWN }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F7F6F4' }}>

      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 bg-white flex flex-col border-r border-gray-100 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: BROWN }}>P</div>
          <span className="font-semibold text-gray-900 text-sm">poomoo</span>
        </div>

        {/* Funds list */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Funds</span>
            <span className="text-xs text-gray-400">{funds.length}</span>
          </div>

          {funds.length === 0 ? (
            <p className="px-2 py-3 text-xs text-gray-400 text-center">No funds yet</p>
          ) : (
            <div className="space-y-0.5">
              {funds.map((fund) => {
                const isActive = fund.id === selectedFund?.id
                const total = getFundTotal(fund)
                const confirming = deleteConfirmId === fund.id
                return (
                  <div key={fund.id} className="group">
                    <div
                      onClick={() => { setSelectedFundId(fund.id); setDeleteConfirmId(null) }}
                      className={`flex items-center gap-2.5 px-2 py-2.5 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: isActive ? BROWN : '#F3F4F6',
                          color: isActive ? 'white' : '#9CA3AF',
                        }}
                      >
                        {fund.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                          {fund.name}
                        </div>
                        <div className="text-xs text-gray-400">RM {total.toLocaleString('en-MY')}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(confirming ? null : fund.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all rounded flex-shrink-0"
                        title="Delete fund"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {confirming && (
                      <div className="mx-2 mb-1 px-3 py-2 rounded-xl border flex items-center gap-2" style={{ backgroundColor: '#FFF5F5', borderColor: '#FED7D7' }}>
                        <span className="text-xs text-red-600 flex-1 truncate">Delete "{fund.name}"?</span>
                        <button
                          onClick={() => handleDeleteFund(fund.id)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={() => setShowUpload(true)}
            className="mt-3 w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <span className="text-base font-light leading-none">+</span>
            <span>Add fund</span>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 space-y-0.5">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex -space-x-1">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full ring-2 ring-white" />
              ) : (
                <div className="w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center text-xs text-white font-semibold" style={{ backgroundColor: BROWN }}>
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
            </div>
            <button
                onClick={() => setShowCollabModal(true)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                + Collaborators
              </button>
          </div>
          <Link
            to="/settings"
            className="flex items-center gap-2 px-2 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Sticky header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-8 py-4 z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Dashboard</div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedFund?.name || (funds.length === 0 ? 'No funds' : 'Loading…')}
                </h1>
                <span className="text-xs text-gray-400">Updated 2d ago</span>
              </div>
              {selectedFund && (
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">RM {balance.toLocaleString('en-MY')}</span>
                  {goal && (
                    <>
                      <span className="text-gray-300">/</span>
                      <span className="text-sm text-gray-400">goal RM {goal.toLocaleString('en-MY')}</span>
                      <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${goalPct}%`, backgroundColor: BROWN }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{goalPct}%</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-shrink-0">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  editMode
                    ? 'text-white border-transparent'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                style={editMode ? { backgroundColor: BROWN, borderColor: BROWN } : {}}
              >
                {editMode ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Done
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    Edit layout
                  </>
                )}
              </button>
              <button
                onClick={() => { setShowWidgetPicker(true); if (!editMode) setEditMode(true) }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: BROWN }}
              >
                + Widget
              </button>
              <div className="relative ml-1" ref={userMenuRef}>
                <button onClick={() => setShowUserMenu((v) => !v)} className="focus:outline-none">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full cursor-pointer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer" style={{ backgroundColor: BROWN }}>
                      {user?.displayName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute top-10 right-0 z-50 bg-white rounded-lg shadow-lg border border-gray-100 w-52 py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</div>
                      <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 relative">

          {funds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-24">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl" style={{ backgroundColor: '#F0E6D9' }}>📊</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">No funds yet</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">Upload your first Excel spreadsheet to start tracking your savings.</p>
              <button onClick={() => setShowUpload(true)} className="px-5 py-2.5 text-sm text-white rounded-xl font-medium hover:opacity-90 transition-opacity" style={{ backgroundColor: BROWN }}>
                + Upload fund
              </button>
            </div>
          ) : (
            <>
              {/* ── Stat cards (always static) ── */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Balance" value={`RM ${balance.toLocaleString('en-MY')}`} />
                <StatCard
                  label="This month"
                  value={`${thisMonth >= 0 ? '+' : ''}RM ${thisMonth.toLocaleString('en-MY')}`}
                  sub={monthlyChangePct !== 0 ? `${Math.abs(monthlyChangePct).toFixed(0)}%` : null}
                  positive={monthlyChangePct >= 0}
                />
                <StatCard
                  label="Your share"
                  value={`${userShare}%`}
                  sub={split.length >= 2 ? `${split[1]?.name || 'partner'} ${split[1]?.pct}%` : null}
                  positive={true}
                />
                <div className="bg-white rounded-2xl p-5 border border-gray-100 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-gray-400">Goal progress</div>
                    <button
                      onClick={() => { setShowGoalEdit((v) => !v); setGoalInput(goal ? String(goal) : '') }}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                      title={goal ? 'Edit goal' : 'Set goal'}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 leading-none">
                    {goalPct !== null ? `${goalPct}%` : '—'}
                  </div>
                  {goal && (
                    <>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${goalPct}%`, backgroundColor: '#A67B50' }}
                        />
                      </div>
                      <div className="text-xs mt-1.5 font-medium" style={{ color: '#A67B50' }}>
                        RM {balance.toLocaleString('en-MY')} of RM {goal.toLocaleString('en-MY')}
                      </div>
                    </>
                  )}
                  {!goal && (
                    <div className="text-xs mt-2 text-gray-400">No goal set</div>
                  )}
                  {showGoalEdit && (
                    <div className="absolute top-full left-0 mt-2 z-30 bg-white rounded-xl shadow-lg border border-gray-100 p-3 w-56">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        {goal ? 'Update goal' : 'Set a savings goal'}
                      </div>
                      <div className="relative mb-2">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">RM</span>
                        <input
                          type="number"
                          min="0"
                          value={goalInput}
                          onChange={(e) => setGoalInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                          className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#A67B50]"
                          placeholder="10000"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveGoal}
                          className="flex-1 py-1.5 text-xs text-white rounded-lg font-medium"
                          style={{ backgroundColor: '#A67B50' }}
                        >
                          Save
                        </button>
                        {goal && (
                          <button
                            onClick={() => { setGoalInput(''); handleSaveGoal() }}
                            className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-600 border border-red-100 rounded-lg"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          onClick={() => setShowGoalEdit(false)}
                          className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-600 border border-gray-100 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Edit mode hint banner ── */}
              {editMode && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-amber-700 border border-amber-200" style={{ backgroundColor: '#FFFBEB' }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  Drag the ⠿ grip to reorder · drag the corner handle to resize · × to remove · click <strong>Done</strong> when finished
                </div>
              )}

              {/* ── Widget area ── */}
              <DashboardGrid
                layout={widgetLayout}
                onLayoutChange={handleLayoutChange}
                editMode={editMode}
              >
                {widgetLayout.map(renderWidget)}
              </DashboardGrid>
            </>
          )}
        </div>
      </main>

      {/* ── Floating chatbot button ── */}
      <button
        onClick={() => setShowChatbot((v) => !v)}
        className="fixed bottom-6 right-6 w-12 h-12 text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-transform hover:scale-105"
        style={{ backgroundColor: BROWN }}
        title="Open AI assistant"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </button>

      {showUpload && (
        <UploadModal dashboardId={dashboardId} onClose={() => setShowUpload(false)} onSuccess={() => {}} />
      )}
      {showChatbot && (
        <ChatbotPanel funds={funds} dashboardId={dashboardId} currentUser={user} onClose={() => setShowChatbot(false)} />
      )}
      {showWidgetPicker && (
        <WidgetPickerPanel
          existingWidgetIds={widgetLayout.map((w) => w.i)}
          onAdd={(id) => { addWidget(id); setShowWidgetPicker(false) }}
          onClose={() => setShowWidgetPicker(false)}
        />
      )}
      {showCollabModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowCollabModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Collaborators</h2>
              <button
                onClick={() => setShowCollabModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <CollaboratorsPanel
              dashboardId={dashboardId}
              currentUserId={user?.uid}
              isOwner={!userDoc || userDoc?.role === 'owner'}
            />
          </div>
        </div>
      )}
    </div>
  )
}
