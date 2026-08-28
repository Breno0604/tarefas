import { describe, it, expect } from 'vitest'
import { parseDate, localDateKey, formatDay, formatDate, isOverdue } from '../lib/format'

describe('parseDate', () => {
  it('parses date-only strings as local time (not UTC)', () => {
    const d = parseDate('2026-09-01')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8)
    expect(d.getDate()).toBe(1)
    // Uses local noon, so local date never drifts in negative UTC offsets
    expect(d.getHours()).toBe(12)
  })

  it('parses full ISO datetimes unchanged', () => {
    const d = parseDate('2026-09-01T10:00:00.000Z')
    expect(d.toISOString()).toBe('2026-09-01T10:00:00.000Z')
  })

  it('handles invalid input', () => {
    expect(isNaN(parseDate('not-a-date').getTime())).toBe(true)
  })
})

describe('localDateKey', () => {
  it('returns local YYYY-MM-DD for a datetime', () => {
    const iso = new Date(2026, 8, 27, 23, 30).toISOString() // 27/set 23:30 local
    expect(localDateKey(iso)).toBe('2026-09-27')
  })

  it('returns empty string for invalid input', () => {
    expect(localDateKey('bad')).toBe('')
  })
})

describe('formatDay/formatDate', () => {
  it('formats date-only without off-by-one', () => {
    expect(formatDay('2026-09-01')).toBe('01 set')
    expect(formatDate('2026-09-01')).toBe('01 set 2026')
  })

  it('formats full ISO datetime', () => {
    expect(formatDay('2026-09-01T10:00:00.000Z')).toBe('01 set')
  })

  it('returns placeholder for empty/invalid', () => {
    expect(formatDay(null)).toBe('—')
    expect(formatDate('')).toBe('—')
  })
})

describe('isOverdue', () => {
  it('is not overdue for open tasks with future or no due date', () => {
    expect(isOverdue(null, 'todo')).toBe(false)
    expect(isOverdue(new Date(Date.now() + 86400000).toISOString(), 'todo')).toBe(false)
  })

  it('is overdue for open tasks with past due date', () => {
    expect(isOverdue(new Date(Date.now() - 86400000).toISOString(), 'todo')).toBe(true)
  })

  it('is never overdue for done or cancelled tasks', () => {
    const past = new Date(Date.now() - 86400000).toISOString()
    expect(isOverdue(past, 'done')).toBe(false)
    expect(isOverdue(past, 'cancelled')).toBe(false)
  })
})