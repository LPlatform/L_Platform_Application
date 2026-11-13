# L Platform — Student App

Windows desktop app for students (Tauri 2 + React + TypeScript). Students sign in, take the **AI Explorers** course, solve coding assignments, take tests and see results.

## Features

- **HackerRank-style challenges** — a board of all assignment questions with search and filters (status, type, difficulty, assignment). The coding workspace has the problem on the left, the editor on the right and a console with **Run code** (Python, against sample tests or custom input) and **Submit**. Python runs offline inside the app with [Pyodide](https://pyodide.org) (WebAssembly), with a 5-second time limit; Java/C++ are reviewed by the teacher.

- **AI Explorers course (Class 4–5)** — 7 short lessons: What is AI, How AI learns, Input → Think → Output, AI around us, What is an LLM, Using AI safely, Good prompts. Each lesson = picture-style cards → a sorting activity → a 4-question MCQ quiz. Score 3/4 to unlock the next lesson. Works offline.
- **Code editor with suggestions** — CodeMirror 6 with VS Code-style autocomplete for Python (builtins with hints, keywords, snippets like `def`/`for`/`if`, `math.`/`random.` members, and names you defined), plus Java and C++ highlighting. `Ctrl+S` saves a draft.
- **Assignments** — MCQ, written and coding questions posted by teachers. Offline drafts and a submission queue that syncs when back online.
- **Tests & results** — assessments assigned by teachers, with released grades.

## Run locally

Requirements: Node 24, pnpm, Rust (stable), and the [Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
pnpm install
pnpm tauri dev      # desktop window
pnpm dev            # browser only, http://localhost:1420
```

The app reads `VITE_API_URL` from the single workspace `.env` one folder up (`../.env`). Default: `http://localhost:3001` (the backend repo).

## Checks

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
cargo fmt --all -- --check && cargo clippy --workspace --all-targets -- -D warnings && cargo test --workspace
```

## Releases (GitHub)

Installers (`.msi`, `-setup.exe`, Linux `.deb`/`.AppImage`) are published to **GitHub → Releases** by `.github/workflows/release.yml`.

1. Bump the version in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.
2. Merge to `main`.
3. Either push a tag `git tag app-v0.2.0 && git push origin app-v0.2.0`, or open **Actions → Desktop Release → Run workflow** on `main`.

Set the repository variable **`VITE_API_URL`** (Settings → Secrets and variables → Actions → Variables) to the production API URL so installers talk to the hosted backend. Installers are currently **unsigned** (Windows SmartScreen will warn) until code signing is added for the Microsoft Store.

## Security

This is a public repository: no secrets, signing keys or backend code live here. The student token is kept in Windows Credential Manager. All data access is checked by the backend (role checks + PostgreSQL row-level security).
