// @vitest-environment node
import { vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { describeRepositoryContract } from '@/core/__tests__/repository-contract'
import { createIndexedDbRepository } from '@/data/indexeddb/indexeddb-repository'

describeRepositoryContract('indexeddb', () => {
  vi.stubGlobal('indexedDB', new IDBFactory())
  return createIndexedDbRepository()
})
