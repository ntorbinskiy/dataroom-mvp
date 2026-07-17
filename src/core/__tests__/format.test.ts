import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate } from '@/core/format'

describe('formatBytes', () => {
  it('formats each magnitude', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(2_516_582)).toBe('2.4 MB')
    expect(formatBytes(1_288_490_189)).toBe('1.2 GB')
  })
})

describe('formatDate', () => {
  it('formats as "Jul 16, 2026"', () => {
    expect(formatDate(new Date(2026, 6, 16).getTime())).toBe('Jul 16, 2026')
  })
})
