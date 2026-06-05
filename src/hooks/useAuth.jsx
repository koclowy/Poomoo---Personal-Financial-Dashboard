import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { checkAndAcceptInvite, getUserDoc } from '../firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const doc = await getUserDoc(firebaseUser.uid)
        if (doc) {
          const inviteDashboardId = await checkAndAcceptInvite(
            firebaseUser.email,
            firebaseUser.uid,
            doc.dashboardId
          )
          setUserDoc({ ...doc, invitedDashboardId: inviteDashboardId })
        }
        setUser(firebaseUser)
      } else {
        setUser(null)
        setUserDoc(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, userDoc, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
