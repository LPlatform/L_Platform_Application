# GitHub Actions

CI covers the repository foundation. Separate jobs prepare Rust validation and target-native desktop builds on Windows and Linux. Security and weekly dependency workflows cover CodeQL, npm/Cargo/Actions/Docker ecosystems where configured. Release tags use `app-vX.Y.Z`; target runners produce artifacts and SHA-256 checksums. macOS remains optional; Linux ARM64 is not enabled without dependency verification.

At audit time no pnpm manifest/lockfile, React/Tauri app, Cargo workspace or signing credentials existed. Native packaging and installer smoke tests cannot be claimed operational until those inputs exist. Windows builds must run on Windows and Linux builds on Linux. Configure protected signing secrets only for authorized release workflows. GitHub plan settings are required to enable Dependabot alerts, secret scanning and push protection.
