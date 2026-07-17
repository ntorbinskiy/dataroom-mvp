import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Dataroom, DataroomNode } from '@/core/types'

export interface DataroomDBSchema extends DBSchema {
  datarooms: { key: string; value: Dataroom }
  nodes: {
    key: string
    value: DataroomNode
    indexes: { byDataroom: string }
  }
  blobs: { key: string; value: Blob }
}

export type DataroomDB = IDBPDatabase<DataroomDBSchema>

export function openDataroomDb(): Promise<DataroomDB> {
  return openDB<DataroomDBSchema>('dataroom-db', 1, {
    upgrade(db) {
      db.createObjectStore('datarooms', { keyPath: 'id' })
      const nodes = db.createObjectStore('nodes', { keyPath: 'id' })
      nodes.createIndex('byDataroom', 'dataroomId')
      db.createObjectStore('blobs')
    },
  })
}
