# Deployment

Desktop distribution is via immutable, versioned GitHub Releases. Signing and Tauri updater publication are not configured. Do not invent signing certificates or claim unsigned packages are signed. Signing material, when provisioned, belongs in protected release secrets accessible only to authorized release jobs. Runtime/compiler distribution is a separate process.
