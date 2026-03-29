use tauri::Manager;
use std::process::{Command, Child};
use std::sync::Mutex;

struct SidecarState(Mutex<Option<Child>>);

#[tauri::command]
fn get_sidecar_port() -> u16 {
    3100
}

fn start_sidecar() -> Option<Child> {
    if cfg!(debug_assertions) {
        println!("[tauri] dev mode — sidecar managed externally");
        return None;
    }
    let child = Command::new("bun")
        .arg("run")
        .arg("sidecar/index.js")
        .spawn()
        .ok();
    if child.is_some() {
        println!("[tauri] sidecar started");
    }
    child
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let child = start_sidecar();
            app.manage(SidecarState(Mutex::new(child)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_sidecar_port])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let state = window.state::<SidecarState>();
                if let Ok(mut child) = state.0.lock() {
                    if let Some(ref mut c) = *child {
                        let _ = c.kill();
                        println!("[tauri] sidecar stopped");
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running castlight");
}
