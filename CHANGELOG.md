# Changelog

## 0.3.0 — 2026-11-13

- HackerRank-style redesign: top navigation, challenge board with search and filters (status, type, difficulty, assignment).
- Coding workspace: problem/editor split, **Run code** for Python against sample tests and custom input (runs offline with Pyodide, 5s time limit), Ctrl+Enter to run.
- AI Explorers course regrouped into 4 modules with progress ring, badges and a step-by-step lesson player.

## 0.2.2 — 2026-11-13

- macOS universal .dmg (Apple Silicon + Intel), ad-hoc signed.
- Sign-in works on macOS/Linux (session kept in memory).

## 0.2.1 — 2026-11-13

- Installers connect to the live API (https://l-platform-backend.vercel.app) by default.

## 0.2.0 — 2026-11-12

- New simple, flat UI for the student app (light theme, one accent colour, simpler navigation).
- New **AI Explorers** course for Class 4–5 with lesson cards, a sorting activity and an MCQ quiz per lesson; lessons unlock after passing.
- Code editor replaced with CodeMirror 6: Python autocomplete (builtins, keywords, snippets, module members, local names), Java/C++ highlighting.
- Release workflow fixed: publishes installers to GitHub Releases on `app-v*` tags or manual run from `main`.
- App reads `VITE_API_URL` from the workspace `.env`.

## 0.1.0

- Initial student workspace: sign-in, assignments, assessments, offline drafts.
