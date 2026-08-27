import React from 'react'

export default function Tooltip({ content, children, side = 'top' }) {
  const positions = {
    top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
    bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
    left: 'right-full top-1/2 mr-1.5 -translate-y-1/2',
    right: 'left-full top-1/2 ml-1.5 -translate-y-1/2'
  }
  // Don't show tooltips on touch-only devices
  if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover)').matches) {
    return children
  }
  if (!content) return children
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow transition-all duration-150 delay-300 group-hover/tip:opacity-100 group-hover/tip:delay-0 dark:bg-slate-700 ${positions[side]}`}
      >
        {content}
      </span>
    </span>
  )
}
