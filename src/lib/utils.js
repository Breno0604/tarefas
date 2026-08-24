/**
 * Checks if the event target is a text input element
 * (input, textarea, select, or contentEditable)
 */
export function isTypingTarget(e) {
  const el = e.target
  return (
    el &&
    (el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' ||
      el.isContentEditable)
  )
}
