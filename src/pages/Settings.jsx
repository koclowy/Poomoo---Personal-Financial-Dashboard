import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import CollaboratorsPanel from '../components/settings/CollaboratorsPanel'

export default function Settings() {
  const { user, userDoc } = useAuth()
  const dashboardId = userDoc?.dashboardId

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
        <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">← Dashboard</Link>
        <div className="font-bold text-slate-900 text-lg">Settings</div>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-8">
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                {(user?.displayName || user?.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-800">{user?.displayName}</div>
              <div className="text-sm text-slate-500">{user?.email}</div>
              <div className="text-xs text-slate-400 mt-0.5 capitalize">{userDoc?.role || 'member'}</div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Collaborators</h2>
          {dashboardId ? (
            <CollaboratorsPanel
              dashboardId={dashboardId}
              currentUserId={user?.uid}
              isOwner={userDoc?.role === 'owner'}
            />
          ) : (
            <div className="text-slate-400 text-sm">Loading…</div>
          )}
        </section>
      </main>
    </div>
  )
}
