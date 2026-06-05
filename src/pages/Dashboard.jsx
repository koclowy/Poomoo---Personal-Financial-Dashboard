import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFunds } from '../hooks/useFunds'
import { useDashboardLayout } from '../hooks/useDashboardLayout'
import DashboardGrid from '../components/dashboard/DashboardGrid'
import WidgetCard from '../components/dashboard/WidgetCard'
import TotalSavingsWidget from '../components/dashboard/TotalSavingsWidget'
import FundBarChart from '../components/dashboard/FundBarChart'
import FundDetailTable from '../components/dashboard/FundDetailTable'
import ContributionLineChart from '../components/dashboard/ContributionLineChart'
import ContributorBreakdown from '../components/dashboard/ContributorBreakdown'
import UploadModal from '../components/upload/UploadModal'
import ChatbotPanel from '../components/chatbot/ChatbotPanel'
import { signOutUser } from '../firebase/auth'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

function SkeletonWidget() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 h-full overflow-hidden animate-pulse">
      <div className="bg-slate-100 h-9 border-b border-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="h-20 bg-slate-100 rounded" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, userDoc } = useAuth()
  const dashboardId = userDoc?.dashboardId
  const { funds, loading: fundsLoading } = useFunds(dashboardId)
  const { layout, setLayout, loading: layoutLoading } = useDashboardLayout(dashboardId, funds)
  const [showUpload, setShowUpload] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [transactions, setTransactions] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!dashboardId) return
    const q = query(collection(db, 'transactions'), where('dashboardId', '==', dashboardId))
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [dashboardId])

  async function handleSignOut() {
    await signOutUser()
    navigate('/login')
  }

  function removeWidget(widgetId) {
    const newLayout = layout.filter((l) => l.i !== widgetId)
    setLayout(newLayout)
  }

  function renderWidget(item) {
    if (item.i === 'total-savings') {
      return (
        <div key={item.i}>
          <WidgetCard title="Total Savings" onRemove={() => removeWidget(item.i)}>
            <TotalSavingsWidget funds={funds} />
          </WidgetCard>
        </div>
      )
    }
    if (item.i === 'fund-bar-chart') {
      return (
        <div key={item.i}>
          <WidgetCard title="Savings by Fund" onRemove={() => removeWidget(item.i)}>
            <FundBarChart funds={funds} />
          </WidgetCard>
        </div>
      )
    }
    if (item.i === 'contribution-line') {
      return (
        <div key={item.i}>
          <WidgetCard title="Contributions Over Time" onRemove={() => removeWidget(item.i)}>
            <ContributionLineChart funds={funds} />
          </WidgetCard>
        </div>
      )
    }
    if (item.i === 'contributor-pie') {
      return (
        <div key={item.i}>
          <WidgetCard title="Contributor Breakdown" onRemove={() => removeWidget(item.i)}>
            <ContributorBreakdown transactions={transactions} />
          </WidgetCard>
        </div>
      )
    }
    if (item.i.startsWith('fund-')) {
      const fundId = item.i.replace('fund-', '')
      const fund = funds.find((f) => f.id === fundId)
      if (!fund) return <div key={item.i} />
      return (
        <div key={item.i}>
          <WidgetCard title={fund.name} onRemove={() => removeWidget(item.i)}>
            <FundDetailTable fund={fund} />
          </WidgetCard>
        </div>
      )
    }
    return <div key={item.i} />
  }

  const isLoading = fundsLoading || layoutLoading

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="font-black text-xl text-slate-900">Poomoo</div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            + Add Fund
          </button>
          <Link to="/settings" className="text-sm text-slate-500 hover:text-slate-700 max-sm:hidden">Settings</Link>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full cursor-pointer" onClick={handleSignOut} title="Click to sign out" />
          ) : (
            <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
          )}
        </div>
      </nav>

      <main className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 200 }}><SkeletonWidget /></div>
            ))}
          </div>
        ) : funds.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No funds yet</h2>
            <p className="text-slate-500 mb-6">Upload your first Excel spreadsheet to get started</p>
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              Upload your first fund
            </button>
          </div>
        ) : (
          <DashboardGrid layout={layout} onLayoutChange={setLayout}>
            {layout.map(renderWidget)}
          </DashboardGrid>
        )}
      </main>

      <button
        onClick={() => setShowChatbot((v) => !v)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl z-30 transition-transform hover:scale-105"
        title="Open AI assistant"
      >
        💬
      </button>

      {showUpload && (
        <UploadModal
          dashboardId={dashboardId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {}}
        />
      )}

      {showChatbot && (
        <ChatbotPanel
          funds={funds}
          dashboardId={dashboardId}
          currentUser={user}
          onClose={() => setShowChatbot(false)}
        />
      )}
    </div>
  )
}
