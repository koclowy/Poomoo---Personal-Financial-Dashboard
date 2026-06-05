import { ResponsiveGridLayout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export default function DashboardGrid({ layout, onLayoutChange, children }) {
  const breakpoints = { lg: 1200, md: 768, sm: 0 }
  const cols = { lg: 12, md: 12, sm: 1 }

  const responsiveLayouts = {
    lg: layout,
    md: layout,
    sm: layout.map((item, i) => ({ ...item, x: 0, y: i * 4, w: 1, h: 4 })),
  }

  return (
    <ResponsiveGridLayout
      layouts={responsiveLayouts}
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={80}
      onLayoutChange={(newLayout) => onLayoutChange?.(newLayout)}
      draggableHandle=".widget-handle"
      margin={[16, 16]}
      containerPadding={[0, 0]}
    >
      {children}
    </ResponsiveGridLayout>
  )
}
