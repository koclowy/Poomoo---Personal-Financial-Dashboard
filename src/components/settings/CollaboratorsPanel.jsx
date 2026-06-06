import { useState, useEffect } from 'react'
import {
  inviteCollaborator, getDashboardCollaborators,
  removeDashboardCollaborator, getPendingInvites,
} from '../../firebase/firestore'
import { useToast } from '../Toast'

export default function CollaboratorsPanel({ dashboardId, currentUserId, isOwner }) {
  const [collaborators, setCollaborators] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const addToast = useToast()

  async function loadData() {
    const [collabs, invites] = await Promise.all([
      getDashboardCollaborators(dashboardId),
      getPendingInvites(dashboardId),
    ])
    setCollaborators(collabs)
    setPendingInvites(invites)
  }

  useEffect(() => { if (dashboardId) loadData() }, [dashboardId])

  async function handleInvite() {
    const email = inviteEmail.trim()
    if (!email) return
    setSending(true)
    try {
      await inviteCollaborator(dashboardId, email)
      setInviteEmail('')
      addToast?.('Invite sent!')
      loadData()
    } catch {
      addToast?.('Failed to send invite', 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleRemove(userId) {
    try {
      await removeDashboardCollaborator(dashboardId, userId)
      addToast?.('Collaborator removed')
      loadData()
    } catch {
      addToast?.('Failed to remove collaborator', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Team Members</h3>
        <div className="space-y-2">
          {collaborators.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: '#A67B50' }}>
                  {(user.name || user.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{user.name || user.email}</div>
                <div className="text-xs text-slate-400 truncate">{user.email}</div>
              </div>
              <div className="text-xs text-slate-400 capitalize">{user.role || 'collaborator'}</div>
              {isOwner && user.id !== currentUserId && (
                <button
                  onClick={() => handleRemove(user.id)}
                  className="text-xs text-red-400 hover:text-red-600 ml-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {collaborators.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-4">No collaborators yet</div>
          )}
        </div>
      </div>

      {isOwner && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Invite by Email</h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder="colleague@email.com"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#A67B50]"
            />
            <button
              onClick={handleInvite}
              disabled={sending || !inviteEmail.trim()}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50" style={{ backgroundColor: '#A67B50' }}
            >
              {sending ? 'Sending…' : 'Invite'}
            </button>
          </div>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Pending Invites</h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="text-amber-500">✉</div>
                <div className="text-sm text-slate-600">{invite.email}</div>
                <div className="ml-auto text-xs text-amber-500">Pending</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
