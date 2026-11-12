# L_Platform Application

Public repository for the student cross-platform desktop application. This repository contains an engineering foundation only. Backend implementation, private tests, credentials, organization configuration and signing keys must never be committed here.

## Stack and supported targets

Planned stack: Tauri 2, React, TypeScript, Rust, Monaco, SQLite, Cargo workspace and pnpm. Initial desktop targets are Windows x64 and Linux x64; macOS is optional and Linux ARM64 is not enabled until dependencies are verified. Runtime/compiler distribution is separate from application releases.

Use short lived branches (`feature/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*`, `security/*`), PRs to `main`, Conventional Commits and squash merges. See [repository audit](docs/repository-audit.md), [GitHub Actions](docs/github-actions.md) and [release process](docs/release-process.md). Do not commit secrets, `.env*` files or signing material.

## Student workspace and assessment update (2026-11-12)

The student workspace includes updated course and assignment views, assessment attempt navigation, answer persistence and submit handling, plus normalized API responses. Empty-body assessment start requests omit JSON headers; requests with answer payloads send JSON. Assessment and upload failures are surfaced to the student instead of being presented as empty data. The backend service is maintained outside this repository, so server-side behavior must be verified against its deployment and API contract.

See [the student workspace redesign report](docs/student-workspace-redesign.md) for UI/API limitations and verification notes. The Windows x64 NSIS installer was built locally at `target/release/bundle/nsis/L_Platform Student_0.1.0_x64-setup.exe` (2,383,755 bytes; SHA-256 `BDDDE89FCC6DA77C0FCC93F6A93995ADD03496FAE55D24F3FAFD4112D83C6C96`). It is unsigned and is ignored by Git; the release workflow publishes installers when an authorized `app-vX.Y.Z` tag is pushed after required checks.

Checks run for this update: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (10 tests), `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace --all-targets` (1 test), `pnpm build`, and `pnpm tauri build --bundles nsis`. All passed. Authenticated live-backend assessment flows were not exercised; see the report for known API limitations.
