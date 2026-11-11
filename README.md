# L_Platform Application

Public repository for the student cross-platform desktop application. This repository contains an engineering foundation only. Backend implementation, private tests, credentials, organization configuration and signing keys must never be committed here.

## Stack and supported targets

Planned stack: Tauri 2, React, TypeScript, Rust, Monaco, SQLite, Cargo workspace and pnpm. Initial desktop targets are Windows x64 and Linux x64; macOS is optional and Linux ARM64 is not enabled until dependencies are verified. Runtime/compiler distribution is separate from application releases.

Use short lived branches (`feature/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*`, `security/*`), PRs to `main`, Conventional Commits and squash merges. See [repository audit](docs/repository-audit.md), [GitHub Actions](docs/github-actions.md) and [release process](docs/release-process.md). Do not commit secrets, `.env*` files or signing material.

## Student workspace redesign update (2026-11-11)

See [the student workspace redesign report](docs/student-workspace-redesign.md) for current UI changes, API limitations, actual checks, installer SHA-256, unsigned status and runtime verification limits. All existing modifications were preserved; no commits or pushes were made. The native build passed, but authenticated screens and the requested viewport checks remain unverified because no sign-in was performed.
