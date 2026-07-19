# Docket · Data Room MVP

Google Drive-style data room for due diligence documents: multiple data rooms,
nested folders, PDF upload/preview/rename/delete. Two storage modes: cloud mode
persists to Supabase Postgres with private blob storage behind sign-in, local
mode persists to IndexedDB in the browser with zero setup.

Live: https://dataroom-mvp-three.vercel.app

## Setup

Requires Node.js 20+.

    make bootstrap   # npm install
    make dev         # dev server on http://localhost:5173
    make test        # vitest (unit + component)
    make typecheck   # tsc --noEmit
    make build       # production build

By default the app runs in local mode: no account, everything stays in this
browser's IndexedDB.

### Cloud mode setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Under Authentication -> Sign In / Providers -> Email, disable email
   confirmation (contract tests and quick manual signup rely on sessions
   being issued immediately).
4. Copy `.env.example` to `.env.local` and fill in both values from your
   Supabase project settings:

       cp .env.example .env.local

5. For production, set the same two variables in the Vercel project's
   environment variables.

## Design decisions

- **Flat node map, not a tree.** Folders/files live in one IndexedDB store keyed
  by id with a parentId pointer; the tree is derived. Recursive delete and rename
  stay trivial, and the schema maps 1:1 to how a server-side table would look.
- **Blobs separated from metadata.** PDF binaries sit in their own store, so
  listings never deserialize file contents.
- **IndexedDB over localStorage.** PDFs routinely exceed the ~5 MB localStorage cap.
- **Hexagonal core behind a contract.** All persistence sits behind
  `DataroomRepository` (src/core/repository.port.ts). Three adapters implement it -
  IndexedDB (local mode), Supabase (cloud mode) and in-memory (tests) - and all
  pass the SAME contract test suite, so swapping in a real REST backend means
  writing one adapter and running one suite. The UI never imports an adapter;
  it gets the port via DI.
- **Supabase adapter is user-agnostic by construction.** Row-level security
  plus an `owner_id default auth.uid()` column on every table mean the adapter
  never has to know or filter by the current user; Postgres does that
  isolation for it. Auth itself lives in the app shell (`src/app/auth-context.tsx`),
  not in the data port, so the same repository contract works identically
  whether a user is signed in or not.
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
error states with retry, empty states for rooms/folders. Name search across
the whole data room with highlighted matches and result paths.

## Known limitations

Local mode has no accounts and files live only in this browser profile.
Cloud mode has per-user isolation via RLS. Neither mode has content search
(file names only) or multi-tab live sync.

## AI usage

See AI_USAGE.md.
