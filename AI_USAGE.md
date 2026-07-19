# AI usage

This project was built pair-programming with Claude Code, which the assignment
explicitly permits. This document discloses how AI was used and, just as
importantly, which decisions were made by me. Short version: I made the calls,
AI carried them out under review, and everything was verified by tests and by
driving the running app.

## Decisions I made

- **Architecture.** A hexagonal port (`src/core/repository.port.ts`, interface
  `DataroomRepository`) with two adapters: IndexedDB for production and
  in-memory for tests. Both must pass one shared contract test suite, so
  substitutability is enforced by tests rather than promised by convention.
  The UI receives the port via DI and never imports a concrete adapter.
- **Presentation split.** Each feature folder colocates the page's props
  contract (`*.port.ts`), a page hook that computes those props, a pure view
  and a thin container. Two deliberate iterations got it here: moving from
  layer folders to feature colocation (after a design discussion about
  navigability), and removing MVVM vocabulary in favor of plain React terms,
  port + props, once I noticed the project spoke two dialects at once.
- **Storage.** IndexedDB over localStorage (PDF blobs exceed the ~5MB cap);
  blobs live in a separate store from metadata so listings never touch
  binaries.
- **PDF viewing.** The browser's native viewer in an iframe instead of a
  react-pdf reimplementation: zero dependencies, better zoom/search/print.
- **UX rules.** One button per action per screen: the top bar carries identity
  only, creation lives in the content grid, and empty states teach the
  drag-and-drop affordance instead of duplicating toolbar buttons. Counted
  delete confirmations, extension-locked renames, keyboard-operable rows.
- **Visual direction.** Due-diligence world: manila folder motif, stamp-style
  empty states, banker green, serif display over mono metadata. Chosen from an
  HTML mockup before any UI code was written.
- **Scope.** Search and auth deferred so the core CRUD flows could be polished
  end to end.
- **Review verdicts.** Every finding raised by the AI review passes got a human
  decision. Examples: narrowing a test-only Blob shim to an in-place prototype
  patch instead of replacing global constructors, moving adapter contract tests
  to Vitest's node environment after root-causing a jsdom structuredClone gap,
  centralizing RTL cleanup into one afterEach, normalizing stored blob MIME
  types to close an HTML-renamed-to-pdf iframe vector.

## What AI did

- Drafted the spec and a step-by-step implementation plan (down to code level)
  from the decisions above.
- Implemented the plan task by task in fresh sessions, one task at a time,
  each followed by an independent AI code-review pass whose findings I
  adjudicated.
- Wrote tests TDD-first where the plan required it, and helped diagnose
  environment issues (jsdom vs fake-indexeddb interop and similar).
- All commits went through the project's commit workflow; no AI attribution
  appears in any commit message.

## How it was verified

- 64 tests across 11 files: unit tests (naming, formatting, upload
  validation), the shared contract suite run against BOTH adapters, and
  component/view tests (dialogs, stub-props view rendering, table keyboard
  behavior).
- A full Playwright end-to-end pass against the running app covering every
  spec flow: room/folder CRUD, PDF upload/view/download, duplicate-name
  suffixing, non-PDF and oversize rejection, extension-locked rename,
  recursive delete with exact counts, persistence across reload, deep links,
  keyboard navigation, narrow-viewport layout, NotFound routing.
- Typecheck and production build green throughout; a final whole-branch review
  reached READY before submission.

## Appendix: detailed task log

- Task 1 - Scaffold, Makefile, git init (59a4923). Vite + React + TypeScript +
  Vitest scaffold, jsdom test environment. Review: clean; minor note (no
  `engines` field in package.json) left as a non-blocker.
- Task 2 - Design tokens, fonts, shadcn/ui kit (51c898d). Tailwind design
  tokens, IBM Plex / Source Serif fonts, 11 shadcn components added via
  `make ui-add`. Review: clean; `next-themes` pulled in transitively by the
  sonner component, confirmed as a legitimate dependency.
- Task 3 - Domain types + naming module, TDD (46af9ca). `core/types.ts`,
  `core/naming.ts` (duplicate-name auto-suffix resolution). Review: clean;
  minor gap noted (no multi-dot filename test), not blocking.
- Task 4 - format + upload validation helpers, TDD (94b6df2). Byte/date
  formatting, PDF-type and 50 MB size validation. Review: clean.
- Task 5 - Repository contract, in-memory adapter, shared contract suite, TDD
  (97649da, fix d348ed2). `DataroomRepository` port, `MemoryRepository`, an
  exported (not auto-run) contract test suite. Review: 1 fix round - jsdom's
  Blob/File lack `.text()`; the first pass swapped the global `Blob`/`File`
  constructors for Node's `node:buffer` versions, the review flagged that as
  too broad a change, and it was replaced with an in-place, feature-detected
  `Blob.prototype.text` patch that leaves jsdom's Blob/File identity intact.
- Task 6 - IndexedDB adapter passing the same contract suite, TDD (759dd05).
  `idb`-based adapter running the identical suite from Task 5. Review: 1
  unblock round - root-caused a failing blob round-trip to jsdom's
  `structuredClone` not recognizing jsdom's own Blob/File as clonable; fixed
  by running both adapter contract test files under Vitest's `node`
  environment (`// @vitest-environment node`) instead of jsdom, which also
  made the Task 5 Blob.prototype.text patch unnecessary, so it was removed
  from `src/test/setup.ts`.
- Task 7 - DI (RepositoryProvider) + domain hooks over the port (4a82628).
  `RepositoryContext`, `useDatarooms`, `useNodes` built on TanStack Query.
  Review: clean; spec-level minor notes only (delete invalidates the whole
  query cache rather than a narrower key).
- Task 8 - App shell, routing, feedback components, test utils (21bf74c).
  TopBar, EmptyState/ErrorState/TableSkeleton, routed page shells,
  `renderWithProviders` test helper. Review: clean.
- Task 9 - Shared dialogs: NameDialog + DeleteConfirmDialog, TDD (8590a92, fix
  5bdc53e). Review: 1 fix round - centralized React Testing Library `cleanup()`
  into a single `afterEach` in `src/test/setup.ts` (previously called ad hoc
  inside `renderWithProviders`), and replaced the deprecated `React.FormEvent`
  with `React.SubmitEvent<HTMLFormElement>` in NameDialog's submit handler.
- Task 10 - Home page: props contract, page hook, pure view, container
  (ea71f71). Review: clean; minors queued for the polish pass (ASCII `...`
  instead of a real ellipsis character, "1 rooms" missing pluralization).
- Task 11 - Folder view: props contract, page hook, node components, pure
  view, container (c7c696d). Breadcrumbs, NodeTable, upload button and
  drag-drop overlay. Review: clean; minors queued (table rows not
  keyboard-activatable, truncated node name missing a title attribute, a
  childCounts N+1 query noted as fine at MVP scale).
- Task 12 - File viewer: props contract, page hook, pure view, container
  (958c4c6). iframe-based PDF viewer, object-URL lifecycle. Review: clean;
  minor queued (`createObjectURL` inside `useMemo`, a StrictMode dev-only
  leak).
- Task 13 - Polish pass + end-to-end verification (fix 60125f6, fix 5861602).
  Applied every minor queued from Tasks 10-12: a `formatCount` pluralization
  helper, real ellipsis characters, keyboard row activation (Enter/Space) with
  a focus-visible style on NodeTable, a `title` attribute on truncated names,
  and moved the file-viewer object-URL allocation from `useMemo` to
  `useEffect` + `useState` so it revokes correctly under StrictMode. Then ran
  a full Playwright pass against the running dev server driving every spec
  flow end to end. One finding was fixed inline during verification (missing
  favicon, commit 5861602).
- Task 14 - README, AI usage log, vercel.json, .claude gitignore (68a150f).
  Review: clean.
- 2026-07-18 - Feature-folder refactor + `.port.ts` naming convention
  (d78c394). A design discussion (colocation argument: a page's contract,
  hook, view and container are easier to navigate together than spread across
  layer folders) drove the move into per-feature `src/features/<name>/`
  directories, with contract files renamed to `.port.ts` to mark hexagonal
  substitution boundaries at a glance. Mechanical move with `git mv`; no
  behavior change; all checks green.
- 2026-07-19 - Vocabulary unification (dc2242f): ViewModel/vm removed in favor
  of port and props. Contracts renamed to `*ViewProps`, hooks to
  `use-*-page.ts` / `use*Page`, views destructure standard props. Rename-only,
  no behavior change; all checks green.
- 2026-07-19 - UX dedup (fafdedc) and narrow-viewport fix (4e00ef0): one
  button per action per screen (empty states teach drag-and-drop instead of
  duplicating toolbar buttons), and the viewer header wraps cleanly below
  ~360px.
- Task 15 - Deploy: pending; will be logged when it runs.
