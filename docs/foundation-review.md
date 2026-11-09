# Foundation PR review — Application

Review date: 2026-11-09. Reviewed PR #1's complete diff, all workflow YAML, repo docs/tests and GitHub settings. The PR remains open and unmerged.

## Findings and changes

| Priority | Finding | Disposition |
|---|---|---|
| Critical | Native build and Rust checks returned green jobs while skipping every build/check step in the empty repo. | Added separate readiness jobs; Windows/Linux `build` and matrix `rust` jobs now show `skipped`. Once a pnpm/Cargo project exists, the jobs run real tests/builds and missing config fails. Bootstrap CI is explicitly named `bootstrap-smoke`. |
| Critical | Main protection required workflow display names instead of Actions job check names, leaving PR #1 blocked. | Reconfigured required contexts to actual job names (`bootstrap-smoke`, `analyze`, `dependency-review`, both Rust matrix jobs and both native build matrix jobs). Verification is pending the latest runs. |
| Critical | Release workflow had broad write permissions and no existing-release guard. | Build jobs now read-only; only publish has write. It refuses existing GitHub Releases, validates tag/ancestry, requires actual native installer artifacts, builds Windows/Linux, generates checksums, then publishes after both matrix jobs pass. Release concurrency is serialized. |
| Important | Node and Rust toolchains floated; Linux release install omitted WebKitGTK prerequisite. | Pinned Node 24.22.1 and Rust 1.99.1 in `.nvmrc`/`rust-toolchain.toml`; added Linux package prerequisite. Rust 1.99.1 is the current stable point release verified from the [official Rust release announcement](https://blog.rust-lang.org/releases/latest/). |
| Important | Weekly dependency-readiness workflow duplicated Dependabot without updating anything. | Removed it. Native Dependabot remains weekly; CI and dependency review validate update PRs. |
| Important | CodeQL could combine a language with no source, and smoke-test files could be mistaken for product code. | Added source readiness and dynamically selects JavaScript/TypeScript and/or Rust only from product source directories. No app source means the analysis job is skipped. |
| Improvement | No pnpm cache or concurrency controls. | Added lockfile-keyed pnpm cache in real build jobs and PR cancellation; release/deploy-like tasks are not cancelled mid-run. |

The `app-v*` tag ruleset is active and blocks tag updates/deletion. `main` protection is active with PR, conversation-resolution, linear-history, no force-push/deletion and zero required approvals. All external Actions are SHA-pinned. Local YAML parsing and bootstrap Node tests pass; `actionlint` is unavailable. No React/Tauri app, pnpm lockfile, Cargo workspace or installers exist, so application builds/tests/checks have not run. Earlier green build/Rust jobs were skipped and are not build verification.

## Remaining readiness

GitHub release notes are generated, but `CHANGELOG.md` is maintained manually and no automatic version-bump PR/version source is configured. No installer has been built or signed. Production/release Environments and signing credentials are absent; the owner must create protected Environments, select reviewers/allowed refs, then configure authorized signing credentials. Provider/compiler runtime distribution remains separate.

Latest workflow outcomes for the reviewed head are available on [PR #1](https://github.com/LPlatform/L_Platform_Application/pull/1). Reruns caused by this review commit must be used for final verification; earlier PR successes predate these changes.
