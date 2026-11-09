# Desktop release process

Use SemVer and `app-vMAJOR.MINOR.PATCH` tags from approved `main` changes only after full CI. Release builds run on native Windows and Linux runners, smoke-test installers where possible, generate SHA-256 checksums and attach OS/architecture notes to an immutable GitHub Release. Do not overwrite tags or describe unsigned artifacts as signed.

The future package manifest is the version of record. Signing credentials belong only in a protected release Environment and must not be committed. Tauri updater signing is not configured. Runtime/compiler downloads remain on a separate lifecycle. Roll back by distributing the previous immutable release; no artifacts exist yet.
