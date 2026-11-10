#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            store_auth_session,
            load_auth_session,
            delete_auth_session
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}

#[cfg(target_os = "windows")]
const CREDENTIAL_SERVICE: &str = "com.lplatform.student";
#[cfg(target_os = "windows")]
const CREDENTIAL_USER: &str = "auth-session";

#[tauri::command]
fn store_auth_session(session: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let entry = keyring::Entry::new(CREDENTIAL_SERVICE, CREDENTIAL_USER)
            .map_err(|error| format!("Windows Credential Manager unavailable: {error}"))?;
        entry
            .set_password(&session)
            .map_err(|error| format!("Could not store credentials securely: {error}"))
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = session;
        Err("Secure credential storage is not configured for this platform".to_string())
    }
}

#[tauri::command]
fn load_auth_session() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let entry = keyring::Entry::new(CREDENTIAL_SERVICE, CREDENTIAL_USER)
            .map_err(|error| format!("Windows Credential Manager unavailable: {error}"))?;
        match entry.get_password() {
            Ok(session) => Ok(Some(session)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(format!("Could not read secure credentials: {error}")),
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(None)
    }
}

#[tauri::command]
fn delete_auth_session() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let entry = keyring::Entry::new(CREDENTIAL_SERVICE, CREDENTIAL_USER)
            .map_err(|error| format!("Windows Credential Manager unavailable: {error}"))?;
        match entry.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(format!("Could not remove secure credentials: {error}")),
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(())
    }
}
