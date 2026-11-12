# Changelog

## 0.2.0 — 2026-11-12

- New simple, flat UI for the student app (light theme, one accent colour, simpler navigation).
- New **AI Explorers** course for Class 4–5 with lesson cards, a sorting activity and an MCQ quiz per lesson; lessons unlock after passing.
- Code editor replaced with CodeMirror 6: Python autocomplete (builtins, keywords, snippets, module members, local names), Java/C++ highlighting.
- Release workflow fixed: publishes installers to GitHub Releases on `app-v*` tags or manual run from `main`.
- App reads `VITE_API_URL` from the workspace `.env`.

## 0.1.0

- Initial student workspace: sign-in, assignments, assessments, offline drafts.
