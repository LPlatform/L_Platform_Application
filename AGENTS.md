# Engineering instructions

## Architecture

Public student desktop application repository. Planned stack: Tauri 2, React, strict TypeScript, Rust, Monaco, SQLite, Cargo workspace and pnpm. Target Windows x64 and Linux x64 initially. Do not put backend source, private tests, API/OCI credentials, database credentials, signing keys or confidential organization configuration here.

## Development and release rules

- Keep this repository independent; use versioned generated OpenAPI clients from the backend contract.
- Separate student runtime/compiler distribution from desktop application releases. Do not auto-update runtimes as part of a desktop release.
- Use short lived `feature/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*` or `security/*` branches; PRs to `main`, Conventional Commits and squash merges. Never force push, rewrite history, bypass checks or commit directly to `main`.
- Require formatting, lint, TypeScript, React tests, Rust fmt/clippy/tests, Tauri validation and target-native production builds as applicable. Missing suites are readiness gaps.
- Keep signing secrets in protected release environments; unsigned artifacts must not be described as signed. Only authorized release workflows may use signing credentials.
- Releases use independent `app-vX.Y.Z` tags after successful checks and publish SHA-256 checksums. Codex must inspect first, preserve user work, never add secrets, and report unrun checks accurately.
