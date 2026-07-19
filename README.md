# Docket · Data Room MVP

Google Drive-style data room for due diligence documents: multiple data rooms,
nested folders, PDF upload/preview/rename/delete. Everything runs in the browser;
documents persist in IndexedDB.

Live: https://dataroom-mvp-three.vercel.app

## Setup

Requires Node.js 20+.

    make bootstrap   # npm install
    make dev         # dev server on http://localhost:5173
    make test        # vitest (unit + component)
    make typecheck   # tsc --noEmit
    make build       # production build

## Design decisions

- **Flat node map, not a tree.** Folders/files live in one IndexedDB store keyed
  by id with a parentId pointer; the tree is derived. Recursive delete and rename
  stay trivial, and the schema maps 1:1 to how a server-side table would look.
- **Blobs separated from metadata.** PDF binaries sit in their own store, so
  listings never deserialize file contents.
- **IndexedDB over localStorage.** PDFs routinely exceed the ~5 MB localStorage cap.
- **Hexagonal core behind a contract.** All persistence sits behind
  `DataroomRepository` (src/core/repository.port.ts). Two adapters implement it -
  IndexedDB (production) and in-memory (tests) - and both pass the SAME contract
  test suite, so swapping in a real REST backend means writing one adapter and
  running one suite. The UI never imports an adapter; it gets the port via DI.
- **Feature folders.** Each feature folder holds the page's port (`*.port.ts` -
  the view's props contract), a page hook that computes those props, a pure
  view rendering them, and a thin container. They live together in one
  `src/features/<name>/` directory instead of being scattered across layer
  folders. The `.port.ts` suffix marks a substitution boundary (a hexagonal
  port: swap the implementation behind it without touching callers), so
  contracts are easy to spot at a glance. Pure views are tested with stub
  props. Shared UI primitives that no single feature owns stay in
  `src/components/`.
- **TanStack Query over hand-rolled state.** Loading/error/invalidation for every
  async op with minimal custom code, mirroring how the app would talk to a server.
- **Native iframe PDF viewer.** The browser's built-in viewer (zoom, search,
  print) beats a react-pdf reimplementation at zero dependency cost.
- **URL-first navigation.** Rooms, folders, files are deep-linkable; back/refresh
  behave like Drive.

## Edge cases handled

Duplicate names (auto-suffix on create/upload, inline error on rename), non-PDF
and >50 MB uploads rejected with per-file toasts, multi-file upload, recursive
delete with counted confirmation, locked .pdf extension on rename, breadcrumb
collapse on deep nesting, IndexedDB-unavailable screen, loading skeletons and
error states with retry, empty states for rooms/folders.

## Known limitations

No auth, no search, no cross-tab sync, files live only in this browser profile.

## AI usage

See AI_USAGE.md.
