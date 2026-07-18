import { beforeEach, describe, expect, it } from 'vitest'
import { NameConflictError } from '@/core/repository.port'
import type { DataroomRepository } from '@/core/repository.port'
import { isFileNode } from '@/core/types'

function pdf(name: string, content = 'x'): File {
  return new File([content], name, { type: 'application/pdf' })
}

export function describeRepositoryContract(
  adapterName: string,
  makeRepository: () => DataroomRepository | Promise<DataroomRepository>,
): void {
  describe(`DataroomRepository contract: ${adapterName}`, () => {
    let repo: DataroomRepository

    beforeEach(async () => {
      repo = await makeRepository()
    })

    describe('dataroom CRUD', () => {
      it('creates and lists datarooms, newest activity first', async () => {
        const first = await repo.createDataroom('Project Atlas')
        await new Promise((resolve) => setTimeout(resolve, 5))
        await repo.createDataroom('Series C')
        const rooms = await repo.listDatarooms()
        expect(rooms.map((r) => r.name)).toEqual(['Series C', 'Project Atlas'])
        expect(first.id).toBeTruthy()
      })

      it('auto-suffixes duplicate names on create', async () => {
        await repo.createDataroom('Deal')
        const second = await repo.createDataroom('deal')
        expect(second.name).toBe('deal (1)')
      })

      it('renames a dataroom and rejects conflicting names', async () => {
        const a = await repo.createDataroom('Alpha')
        await repo.createDataroom('Beta')
        const renamed = await repo.renameDataroom(a.id, 'Gamma')
        expect(renamed.name).toBe('Gamma')
        await expect(repo.renameDataroom(a.id, 'beta')).rejects.toBeInstanceOf(NameConflictError)
      })

      it('allows renaming a dataroom to its own name with different case', async () => {
        const a = await repo.createDataroom('Alpha')
        const renamed = await repo.renameDataroom(a.id, 'ALPHA')
        expect(renamed.name).toBe('ALPHA')
      })

      it('deletes a dataroom with all its nodes and blobs', async () => {
        const a = await repo.createDataroom('Alpha')
        const folder = await repo.createFolder(a.id, null, 'Docs')
        const [file] = await repo.uploadFiles(a.id, folder.id, [pdf('a.pdf')])
        if (file === undefined) throw new Error('upload failed')
        await repo.deleteDataroom(a.id)
        expect(await repo.getDataroom(a.id)).toBeNull()
        expect(await repo.getNode(folder.id)).toBeNull()
        expect(await repo.getNode(file.id)).toBeNull()
        expect(await repo.getFileBlob(file.blobKey)).toBeNull()
        expect(await repo.listDatarooms()).toEqual([])
      })

      it('reports stats and content counts', async () => {
        const a = await repo.createDataroom('Alpha')
        expect(await repo.getDataroomStats(a.id)).toEqual({ fileCount: 0, totalSize: 0 })
        const folder = await repo.createFolder(a.id, null, 'Docs')
        await repo.uploadFiles(a.id, folder.id, [pdf('a.pdf', 'hello')])
        expect(await repo.getDataroomStats(a.id)).toEqual({ fileCount: 1, totalSize: 5 })
        expect(await repo.countDataroomContents(a.id)).toEqual({ folders: 1, files: 1 })
      })
    })

    describe('folders and listing', () => {
      let roomId: string
      beforeEach(async () => {
        roomId = (await repo.createDataroom('Atlas')).id
      })

      it('creates folders at root and nested', async () => {
        const legal = await repo.createFolder(roomId, null, 'Legal')
        const contracts = await repo.createFolder(roomId, legal.id, 'Contracts')
        expect((await repo.listChildren(roomId, null)).map((n) => n.name)).toEqual(['Legal'])
        expect((await repo.listChildren(roomId, legal.id)).map((n) => n.id)).toEqual([contracts.id])
      })

      it('auto-suffixes duplicate sibling names, scoped per parent', async () => {
        await repo.createFolder(roomId, null, 'Legal')
        const dup = await repo.createFolder(roomId, null, 'legal')
        expect(dup.name).toBe('legal (1)')
        const parent = await repo.createFolder(roomId, null, 'Parent')
        const nested = await repo.createFolder(roomId, parent.id, 'Legal')
        expect(nested.name).toBe('Legal')
      })

      it('sorts folders before files and names numerically', async () => {
        await repo.uploadFiles(roomId, null, [pdf('aaa.pdf')])
        await repo.createFolder(roomId, null, 'b-folder')
        await repo.createFolder(roomId, null, 'item 10')
        await repo.createFolder(roomId, null, 'item 2')
        expect((await repo.listChildren(roomId, null)).map((n) => n.name)).toEqual([
          'b-folder',
          'item 2',
          'item 10',
          'aaa.pdf',
        ])
      })

      it('returns null for a missing node and walks ancestry root-first', async () => {
        expect(await repo.getNode('nope')).toBeNull()
        const a = await repo.createFolder(roomId, null, 'A')
        const b = await repo.createFolder(roomId, a.id, 'B')
        const c = await repo.createFolder(roomId, b.id, 'C')
        expect((await repo.getPath(c.id)).map((n) => n.name)).toEqual(['A', 'B', 'C'])
        expect((await repo.getPath(a.id)).map((n) => n.name)).toEqual(['A'])
      })
    })

    describe('files, rename, recursive delete', () => {
      let roomId: string
      beforeEach(async () => {
        roomId = (await repo.createDataroom('Atlas')).id
      })

      it('stores node metadata and the blob', async () => {
        const [node] = await repo.uploadFiles(roomId, null, [pdf('report.pdf', 'hello')])
        expect(node).toBeDefined()
        if (node === undefined || !isFileNode(node)) throw new Error('expected a file node')
        expect(node.name).toBe('report.pdf')
        expect(node.size).toBe(5)
        expect(node.mimeType).toBe('application/pdf')
        const blob = await repo.getFileBlob(node.blobKey)
        expect(blob).not.toBeNull()
        expect(await blob?.text()).toBe('hello')
        expect(blob?.type).toBe('application/pdf')
      })

      it('auto-suffixes duplicates within the batch and against existing siblings', async () => {
        await repo.uploadFiles(roomId, null, [pdf('report.pdf')])
        const nodes = await repo.uploadFiles(roomId, null, [pdf('report.pdf'), pdf('report.pdf')])
        expect(nodes.map((n) => n.name)).toEqual(['report (1).pdf', 'report (2).pdf'])
      })

      it('renames and rejects sibling conflicts case-insensitively', async () => {
        const a = await repo.createFolder(roomId, null, 'Legal')
        await repo.createFolder(roomId, null, 'Finance')
        const renamed = await repo.renameNode(a.id, 'Ops')
        expect(renamed.name).toBe('Ops')
        await expect(repo.renameNode(a.id, 'finance')).rejects.toBeInstanceOf(NameConflictError)
      })

      it('allows case-only rename of the same node', async () => {
        const a = await repo.createFolder(roomId, null, 'Legal')
        const renamed = await repo.renameNode(a.id, 'LEGAL')
        expect(renamed.name).toBe('LEGAL')
      })

      it('counts descendants only and deletes recursively including blobs', async () => {
        const legal = await repo.createFolder(roomId, null, 'Legal')
        const nda = await repo.createFolder(roomId, legal.id, 'NDAs')
        const files = await repo.uploadFiles(roomId, nda.id, [pdf('a.pdf'), pdf('b.pdf')])
        expect(await repo.countSubtree(legal.id)).toEqual({ folders: 1, files: 2 })

        await repo.deleteNode(legal.id)
        expect(await repo.getNode(legal.id)).toBeNull()
        expect(await repo.getNode(nda.id)).toBeNull()
        for (const file of files) {
          expect(await repo.getNode(file.id)).toBeNull()
          expect(await repo.getFileBlob(file.blobKey)).toBeNull()
        }
        expect(await repo.listChildren(roomId, null)).toEqual([])
      })

      it('deleting a single file removes its blob', async () => {
        const [node] = await repo.uploadFiles(roomId, null, [pdf('a.pdf')])
        if (node === undefined) throw new Error('upload failed')
        await repo.deleteNode(node.id)
        expect(await repo.getFileBlob(node.blobKey)).toBeNull()
      })
    })
  })
}
