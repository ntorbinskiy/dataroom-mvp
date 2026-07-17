import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'

// jsdom's Blob/File implementation omits async read methods (text, arrayBuffer,
// stream). Node's built-in Blob/File are spec-compliant and provide them, so
// use those globally in tests instead.
globalThis.Blob = NodeBlob as unknown as typeof Blob
globalThis.File = NodeFile as unknown as typeof File
