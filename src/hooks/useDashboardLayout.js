import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { updateLayout } from '../firebase/firestore'

export function useDashboardLayout(dashboardId, funds) {
  const [layout, setLayout] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!dashboardId) return

    const unsub = onSnapshot(doc(db, 'dashboards', dashboardId), (snap) => {
      if (snap.exists()) {
        const savedLayout = snap.data().layout || []
        if (savedLayout.length > 0) {
          setLayout(savedLayout)
        }
      }
      setLoading(false)
    })
    return unsub
  }, [dashboardId])

  useEffect(() => {
    if (!funds || funds.length === 0) return

    setLayout((prev) => {
      const existingIds = new Set(prev.map((l) => l.i))
      const newItems = []
      const cols = 2

      funds.forEach((fund, idx) => {
        const widgetId = `fund-${fund.id}`
        if (!existingIds.has(widgetId)) {
          const col = idx % cols
          const row = Math.floor(idx / cols) * 4
          newItems.push({ i: widgetId, x: col * 6, y: row, w: 6, h: 4 })
        }
      })

      if (newItems.length === 0) return prev

      const summaryExists = existingIds.has('total-savings')
      const baseItems = summaryExists
        ? prev
        : [{ i: 'total-savings',          x: 0, y: 0,  w: 4,  h: 3 },
           { i: 'fund-bar-chart',          x: 4, y: 0,  w: 8,  h: 3 },
           { i: 'monthly-contribution',    x: 0, y: 3,  w: 12, h: 5 },
           { i: 'contribution-line',       x: 0, y: 8,  w: 6,  h: 4 },
           { i: 'contributor-pie',         x: 6, y: 8,  w: 6,  h: 4 },
           ...prev]

      // Add monthly-contribution to existing layouts that are missing it
      if (summaryExists && !existingIds.has('monthly-contribution')) {
        const maxY = prev.reduce((m, l) => Math.max(m, l.y + l.h), 0)
        newItems.push({ i: 'monthly-contribution', x: 0, y: maxY, w: 12, h: 5 })
      }

      const offset = summaryExists ? 0 : 12
      return [
        ...baseItems,
        ...newItems.map((item) => ({ ...item, y: item.y + offset })),
      ]
    })
  }, [funds])

  const saveLayout = async (newLayout) => {
    setLayout(newLayout)
    if (dashboardId) {
      await updateLayout(dashboardId, newLayout)
    }
  }

  return { layout, setLayout: saveLayout, loading }
}
