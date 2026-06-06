import { useState, useEffect, useRef } from 'react'
import ReactGridLayout from 'react-grid-layout'

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
    <div ref={containerRef} className={editMode ? 'react-grid-layout--editing' : ''}>
      <ReactGridLayout
        width={width}
        layout={layout}
        cols={12}
        rowHeight={80}
        onLayoutChange={onLayoutChange}
        draggableHandle={editMode ? '.widget-handle' : '.widget-handle-disabled'}
        isDraggable={editMode}
        isResizable={editMode}
        resizeHandles={['se']}
        compactType={null}
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {children}
      </ReactGridLayout>
    </div>
  )
}
