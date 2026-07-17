// @vitest-environment node
import { describeRepositoryContract } from '@/core/__tests__/repository-contract'
import { createMemoryRepository } from '@/data/memory-repository'

describeRepositoryContract('memory', () => createMemoryRepository())
