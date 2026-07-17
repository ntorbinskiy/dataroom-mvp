import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

// jsdom 26.1.0's Blob/File implementation omits Blob.prototype.text(), used by
// the repository contract tests to read back stored file blobs. Patch it in
// place (feature-detected) instead of replacing the Blob/File constructors,
// so jsdom's own File/Blob identity stays intact for future DOM-facing tests
// (e.g. userEvent.upload() on <input type="file">, which relies on jsdom's
// per-realm brand checks).
if (typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = function (this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
      reader.readAsText(this)
    })
  }
}
