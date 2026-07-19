# AI usage log

This project was built pair-programming with Claude Code. Log of where and how AI was used:

- 2026-07-17: requirements analysis + brainstorming (data model, IndexedDB vs
  localStorage, routing, PDF viewer trade-offs); visual direction via an HTML
  mockup; spec and a detailed implementation plan (all code drafted in the plan).
- 2026-07-17: implementation by fresh AI subagents, one per task (14 of 15
  tasks logged so far; Task 15, deploy, is pending and will be logged when it
  runs), each followed by an independent AI code-review pass. A human steered the
  architecture decisions (hexagonal port + shared contract test suite over both
  adapters, MVVM with per-page view-model contracts and pure views) and approved
  each stage before the next task started.
- Tests: TDD for the core modules and the repository contract suite. Final count:
  64 tests across 11 files - unit tests (naming, formatting, upload validation),
  the shared contract suite run against both adapters (memory + IndexedDB), and
  component/view tests (dialogs, home view, node table keyboard behavior).
- End-to-end verification: browser automation (Playwright) driving every flow in
  the spec (room/folder CRUD, PDF upload/view/rename/delete, duplicate-name
  suffixing, recursive delete, persistence across reload, deep links, keyboard
  navigation, mobile layout), plus manual checks.
- Human review: diffs between tasks were reviewed by a human, who made the final
  call on review findings raised by the AI review pass - for example narrowing a
  test-only Blob shim to an in-place prototype patch instead of replacing the
  global Blob/File constructors, moving the adapter contract tests to Vitest's
  `node` environment once a jsdom `structuredClone` gap was found, and
  centralizing RTL `cleanup()` into a single `afterEach` hook.
- All commits were authored via the project's own commit workflow; no AI
  attribution appears in any commit message.

## Per-task log (Tasks 1-14)

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
- Task 10 - Home page: contract, view-model, pure view, container (ea71f71).
  Review: clean; minors queued for the polish pass (ASCII `...` instead of a
  real ellipsis character, "1 rooms" missing pluralization).
- Task 11 - Folder view: contract, view-model, node components, pure view,
  container (c7c696d). Breadcrumbs, NodeTable, upload button and drag-drop
  overlay. Review: clean; minors queued (table rows not keyboard-activatable,
  truncated node name missing a title attribute, a childCounts N+1 query
  noted as fine at MVP scale).
- Task 12 - File viewer: contract, view-model, pure view, container
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
  flow end to end: room create, nested folders to depth 5, breadcrumb
  collapse, PDF upload/view/download, duplicate-name auto-suffix, non-PDF and
  >50 MB rejection toasts, extension-locked rename, recursive delete with
  exact counts, persistence across reload, deep links, keyboard navigation,
  a 375px mobile layout, and NotFound routing - all passed. One finding was
  fixed inline during verification (missing favicon, commit 5861602).
- Task 14 - README, AI usage log, vercel.json, .claude gitignore (68a150f).
  Wrote the project README (design decisions, setup instructions), kept this
  AI_USAGE.md log current, added `vercel.json` for deployment, and gitignored
  the local `.claude` directory. Review: clean.
- 2026-07-18 - Feature-folder refactor + `.port.ts` naming convention. A code
  discussion (colocation argument: a page's contract, view-model hook, view
  and container are easier to navigate together than spread across layer
  folders) drove the decision to move from `viewmodels/`, `components/views/`,
  `components/nodes/`, `components/upload/` and `pages/` into per-feature
  `src/features/<name>/` directories, and to rename contract files to
  `.port.ts` to mark hexagonal substitution boundaries at a glance. Mechanical
  move with `git mv` to preserve history, plus import rewiring; no exports,
  hooks, components, or behavior were renamed or changed. All 64 tests across
  11 files still pass, typecheck and build are clean.
- 2026-07-19 - Vocabulary unification: ViewModel/vm removed in favor of port
  and props. `HomeViewModel`/`FolderViewModel`/`FileViewerViewModel` renamed to
  `HomeViewProps`/`FolderViewProps`/`FileViewerViewProps`, the `use-*-vm.ts`
  hooks renamed to `use-*-page.ts` with matching `use*Page` function names, and
  views now destructure standard props instead of taking a `{ vm }` wrapper.
  Rename-only, no behavior change. All 64 tests across 11 files still pass,
  typecheck and build are clean.
