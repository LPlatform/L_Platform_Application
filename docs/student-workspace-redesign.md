# Student workspace redesign — 2026-11-11

## Delivered in this repository

- Replaced the single long dashboard with Overview, My Learning, Assessments, Assignments, Results and Progress destinations in a compact student shell.
- Added a desktop-first dark design system, responsive navigation, accessible focus states, a real student profile menu, connection/queue indicators and a larger resizable native window (1440 × 920; minimum 800 × 600).
- Reorganized the AI Readiness Course into module/lesson navigation, controlled-width readable content, objectives, activities, revision/practice sections, source references, previous/next lesson controls and persisted last-opened lesson selection. The existing API course content and page references are retained.
- Lesson completion posts to the existing backend endpoint and aggregate progress refreshes from the backend. Completion percentage is derived from the returned completed-lesson count and the course’s real lesson count.
- Added actual-data screens for assigned programming work, returned submission history and aggregate progress. Removed the assumed `/ 100` score display. The problem/editor split is adjustable with pointer and keyboard controls; offline draft and queue functionality remains connected.
- Improved assessment instructions and attempt UI: question navigator, supported choice/text controls, explicit save state, confirmation before submit and returned pending/release status. Assessment API errors are distinct from a real empty assignment list.
- Added access-token refresh with a single-flight refresh request and return to sign-in when the session expires.

## Verification

Executed from this repository after the changes:

- `pnpm format:check` — PASS.
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS.
- `pnpm test` — PASS, 7 tests across 3 files. Added 3 tests for lesson navigation, progress percentage bounds and question input classification. Existing Rust tests contain 0 test cases.
- `cargo fmt --check` — PASS.
- `cargo test` — PASS, 0 Rust tests.
- `pnpm build` — PASS (TypeScript + Vite production build).
- `pnpm tauri build --bundles nsis` — PASS, x64 NSIS bundle produced.

Installer: `target/release/bundle/nsis/L_Platform Student_0.1.0_x64-setup.exe` (2.26 MiB), SHA-256 `F87DED87C80D4DF0E0DE25AD850FA781F7EE3845CF207DB4A7601BE9A5B2BD15`. The artifact is unsigned and was not installed after this build.

The computer-use inspection observed the existing installed app at its sign-in screen at 800 × 600. No sign-in was performed. Therefore the authenticated redesigned screens were not visually verified at 1920 × 1080, 1536 × 864, 1366 × 768 or 1024 px. The final bundle was compiled successfully, but not launched or end-to-end-smoke-tested.

## Backend contract gaps (left unchanged per milestone scope)

- `GET /api/learning/progress` returns aggregate lesson count only. It cannot identify completed lesson IDs or module completion, so the UI does not claim per-lesson completion indicators or module completion state.
- The assessment list response does not include attempt history, publication/attempt status, question count, or attempt rules. The attempt-start response for an already-open attempt omits questions and saved answers; the UI reports that resume limitation instead of fabricating data.
- No assessment history/detail endpoint returns released scores, per-question results or teacher feedback. The current UI shows the actual result returned at submission and its pending/released status; historical assessment results remain unavailable.
- The course bank is currently empty (0 scored items), so an accurate “no assessments assigned” state is expected until teachers publish assessments.
- Programming code execution remains safely unavailable; submissions are queued/stored pending a secure evaluator. The editor does not add local code execution.
- Offline course content, lesson progress and assessment attempts are not cached. Existing locally saved code drafts and queued programming submissions remain supported.
- `docs/integration/api-contracts.md` records that this repository has no pinned generated OpenAPI client or compatibility suite. Assessment shapes are typed in this app against the existing backend implementation; a versioned generated client remains a platform integration task.

The authenticated app workflow and the requested viewport screenshot checks remain unverified. Do not call the Student Workspace milestone fully complete or production-ready on the basis of compilation alone.
