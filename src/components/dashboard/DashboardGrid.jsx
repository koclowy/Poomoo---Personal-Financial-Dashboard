import { useState, useEffect, useRef } from 'react'
import ReactGridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export default function DashboardGrid({ layout, onLayoutChange, children, editMode = false }) {
  const containerRef = useRef(null)
  const [width, setWidth] = useState(1200)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef}>
      <ReactGridLayout
        width={width}
        layout={layout}
        cols={12}
        rowHeight={80}
        onLayoutChange={onLayoutChange}
        draggableHandle=".widget-handle"
        isDraggable={editMode}
        isResizable={editMode}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {children}
      </ReactGridLayout>
    </div>
  )
}
