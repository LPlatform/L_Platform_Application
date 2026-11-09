# Desktop release process

Use SemVer and `app-vMAJOR.MINOR.PATCH` tags from `main`. The release validates format/ancestry and refuses an existing GitHub Release. Windows/Linux native jobs run formatting, lint, typecheck, tests and production builds, require actual MSI/NSIS or Debian/AppImage output, generate SHA-256 checksums and upload real artifacts. A publish job runs only after both platforms pass and attaches generated notes. An active `app-v*` tag ruleset blocks update/deletion. `CHANGELOG.md` remains reviewed manually; release automation does not rewrite it.

The future package manifest is the version of record. Signing credentials belong only in a protected release Environment and must not be committed. Tauri updater signing is not configured. Runtime/compiler downloads remain on a separate lifecycle. No installer has been built; configure and test signing and updater behavior before claiming signed releases.
