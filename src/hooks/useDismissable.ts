import React from "react"
import { useEffect } from 'react'

/**
 * Listen for mousedown outside `ref` and/or the Escape key.
 *
 * @param {React.RefObject} ref              – container ref to test clicks against
 * @param {() => void}      onClose          – called when a dismiss event fires
 * @param {boolean}         [enabled=true]   – toggle mousedown listener on/off
 * @param {boolean}         [escapeEnabled]  – toggle Escape listener on/off (defaults to `enabled`)
 */
export function useDismissable(ref: React.RefObject<HTMLElement | null>, onClose: () => void, enabled: boolean = true, escapeEnabled?: boolean): void {
  useEffect(() => {
    const esc = escapeEnabled !== undefined ? escapeEnabled : enabled
    if (!enabled && !esc) return

    const onDown = (e: MouseEvent) => {
      if (enabled && ref.current && !ref.current.contains(e.target as Node)) onClose()
    }

    const onKey = (e: KeyboardEvent) => {
      if (esc && e.key === 'Escape') onClose()
    }

    if (enabled) document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      if (enabled) document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, onClose, enabled, escapeEnabled])
}
