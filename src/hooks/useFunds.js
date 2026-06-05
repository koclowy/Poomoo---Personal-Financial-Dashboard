import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useFunds(dashboardId) {
  const [funds, setFunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!dashboardId) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'funds'), where('dashboardId', '==', dashboardId))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setFunds(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsub
  }, [dashboardId])

  return { funds, loading, error }
}
