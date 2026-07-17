import { describe, expect, it } from 'vitest'
import { isNameTaken, resolveUniqueName, splitPdfName, validateName } from '@/core/naming'

describe('validateName', () => {
  it('trims and accepts a normal name', () => {
    expect(validateName('  Legal  ')).toEqual({ ok: true, name: 'Legal' })
  })
  it('rejects empty and whitespace-only names', () => {
    expect(validateName('   ').ok).toBe(false)
    expect(validateName('').ok).toBe(false)
  })
  it('rejects names longer than 255 chars', () => {
    expect(validateName('a'.repeat(256)).ok).toBe(false)
    expect(validateName('a'.repeat(255)).ok).toBe(true)
  })
})

describe('splitPdfName', () => {
  it('splits a .pdf extension case-insensitively', () => {
    expect(splitPdfName('report.pdf')).toEqual({ base: 'report', extension: '.pdf' })
    expect(splitPdfName('REPORT.PDF')).toEqual({ base: 'REPORT', extension: '.PDF' })
  })
  it('returns empty extension for folders/other names', () => {
    expect(splitPdfName('Legal')).toEqual({ base: 'Legal', extension: '' })
    expect(splitPdfName('archive.zip')).toEqual({ base: 'archive.zip', extension: '' })
  })
})

describe('resolveUniqueName', () => {
  it('returns the name unchanged when free', () => {
    expect(resolveUniqueName('report.pdf', ['other.pdf'])).toBe('report.pdf')
  })
  it('suffixes before the .pdf extension', () => {
    expect(resolveUniqueName('report.pdf', ['report.pdf'])).toBe('report (1).pdf')
    expect(resolveUniqueName('report.pdf', ['report.pdf', 'report (1).pdf'])).toBe('report (2).pdf')
  })
  it('suffixes folders at the end', () => {
    expect(resolveUniqueName('Legal', ['Legal'])).toBe('Legal (1)')
  })
  it('compares case-insensitively', () => {
    expect(resolveUniqueName('Report.pdf', ['report.PDF'])).toBe('Report (1).pdf')
  })
})

describe('isNameTaken', () => {
  it('is case-insensitive', () => {
    expect(isNameTaken('legal', ['LEGAL'])).toBe(true)
    expect(isNameTaken('legal', ['finance'])).toBe(false)
  })
})
