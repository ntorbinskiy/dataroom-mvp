// @vitest-environment node
import { describe, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { describeRepositoryContract } from '@/core/__tests__/repository-contract'
import { createSupabaseRepository } from '@/data/supabase/supabase-repository'

const url: unknown = import.meta.env.VITE_SUPABASE_URL
const key: unknown = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (typeof url !== 'string' || url === '' || typeof key !== 'string' || key === '') {
  describe.skip('DataroomRepository contract: supabase', () => {
    it('skipped: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to run', () => undefined)
  })
} else {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 })
  const client = createClient(url, key, { auth: { persistSession: false } })
  let signedUp = false

  describeRepositoryContract('supabase', async () => {
    if (!signedUp) {
      const email = `contract-${crypto.randomUUID()}@example.com`
      const { data, error } = await client.auth.signUp({
        email,
        password: `Contract-${crypto.randomUUID()}`,
      })
      if (error !== null) throw new Error(`signUp failed: ${error.message}`)
      if (data.session === null) {
        throw new Error('signUp returned no session: disable email confirmation in Supabase')
      }
      signedUp = true
    }
    const repository = createSupabaseRepository(client)
    for (const room of await repository.listDatarooms()) {
      await repository.deleteDataroom(room.id)
    }
    return repository
  })
}
