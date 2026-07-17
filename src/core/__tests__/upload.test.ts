import { describe, expect, it } from 'vitest'
import { MAX_FILE_SIZE_BYTES, partitionUploadFiles } from '@/core/upload'

function makeFile(name: string, type: string, sizeBytes: number): File {
  const file = new File([new Uint8Array(1)], name, { type })
  Object.defineProperty(file, 'size', { value: sizeBytes })
  return file
}

describe('partitionUploadFiles', () => {
  it('accepts pdf by mime type', () => {
    const { accepted, rejected } = partitionUploadFiles([makeFile('a.pdf', 'application/pdf', 10)])
    expect(accepted).toHaveLength(1)
    expect(rejected).toHaveLength(0)
  })
  it('accepts .pdf extension even with empty mime', () => {
    const { accepted } = partitionUploadFiles([makeFile('b.PDF', '', 10)])
    expect(accepted).toHaveLength(1)
  })
  it('rejects non-pdf files', () => {
    const { accepted, rejected } = partitionUploadFiles([makeFile('c.png', 'image/png', 10)])
    expect(accepted).toHaveLength(0)
    expect(rejected).toEqual([{ name: 'c.png', reason: 'not-pdf' }])
  })
  it('rejects files over 50 MB', () => {
    const { rejected } = partitionUploadFiles([
      makeFile('big.pdf', 'application/pdf', MAX_FILE_SIZE_BYTES + 1),
    ])
    expect(rejected).toEqual([{ name: 'big.pdf', reason: 'too-large' }])
  })
  it('partitions mixed input preserving order', () => {
    const { accepted, rejected } = partitionUploadFiles([
      makeFile('ok.pdf', 'application/pdf', 10),
      makeFile('nope.txt', 'text/plain', 10),
    ])
    expect(accepted.map((f) => f.name)).toEqual(['ok.pdf'])
    expect(rejected.map((r) => r.name)).toEqual(['nope.txt'])
  })
})
