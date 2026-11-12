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

#[cfg(target_os = "windows")]
fn store_session_in_keyring(service: &str, user: &str, session: &str) -> Result<(), String> {
    let entry = keyring::Entry::new(service, user)
        .map_err(|error| format!("Windows Credential Manager unavailable: {error}"))?;
    entry
        .set_password(session)
        .map_err(|error| format!("Could not store credentials securely: {error}"))
}

#[cfg(target_os = "windows")]
fn load_session_from_keyring(service: &str, user: &str) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(service, user)
        .map_err(|error| format!("Windows Credential Manager unavailable: {error}"))?;
    match entry.get_password() {
        Ok(session) => Ok(Some(session)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(format!("Could not read secure credentials: {error}")),
    }
}

#[cfg(target_os = "windows")]
fn delete_session_from_keyring(service: &str, user: &str) -> Result<(), String> {
    let entry = keyring::Entry::new(service, user)
        .map_err(|error| format!("Windows Credential Manager unavailable: {error}"))?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(format!("Could not remove secure credentials: {error}")),
    }
}

#[tauri::command]
fn store_auth_session(session: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        store_session_in_keyring(CREDENTIAL_SERVICE, CREDENTIAL_USER, &session)
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
        load_session_from_keyring(CREDENTIAL_SERVICE, CREDENTIAL_USER)
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
        delete_session_from_keyring(CREDENTIAL_SERVICE, CREDENTIAL_USER)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn non_windows_store_returns_explicit_error_and_windows_roundtrips_isolated_key() {
        #[cfg(target_os = "windows")]
        {
            assert_eq!(CREDENTIAL_SERVICE, "com.lplatform.student");
            assert_eq!(CREDENTIAL_USER, "auth-session");
            let test_service = "com.lplatform.student.unit-test";
            let test_user = "test-session-entry";
            let _ = delete_session_from_keyring(test_service, test_user);
            assert_eq!(
                load_session_from_keyring(test_service, test_user).unwrap(),
                None
            );
            store_session_in_keyring(test_service, test_user, "{\"ok\":true}").unwrap();
            assert_eq!(
                load_session_from_keyring(test_service, test_user).unwrap(),
                Some("{\"ok\":true}".to_string())
            );
            delete_session_from_keyring(test_service, test_user).unwrap();
            assert_eq!(
                load_session_from_keyring(test_service, test_user).unwrap(),
                None
            );
        }

        #[cfg(not(target_os = "windows"))]
        {
            assert!(store_auth_session("{}".to_string()).is_err());
            assert_eq!(load_auth_session().unwrap(), None);
            assert!(delete_auth_session().is_ok());
        }
    }
}
