use std::sync::{Arc, Mutex};
use std::process::{Child, Command as ProcessCommand};
use std::fs;
use serde::{Deserialize, Serialize};



#[derive(Debug, Serialize, Deserialize)]
struct Command {
    action: String,
    time: Option<f64>,
}

type AppState = Arc<Mutex<AppData>>;

struct AppData {
    node_server: Option<Child>,
}








#[tauri::command]
async fn keep_window_open() -> Result<(), String> {
    println!("🔒 COMMANDE /keep-window-open REÇUE - Fenêtre maintenue ouverte");
    Ok(())
}

#[tauri::command]
async fn handle_play_command() -> Result<(), String> {
    println!("🎮 COMMANDE /play REÇUE - Envoi au serveur WebRTC");
    
    let client = reqwest::Client::new();
    match client.get("http://localhost:5173/play").send().await {
        Ok(response) => {
            if response.status().is_success() {
                println!("✅ Commande /play envoyée avec succès au serveur WebRTC");
                Ok(())
            } else {
                let err_msg = format!("❌ Erreur HTTP {} lors de l'envoi de /play", response.status());
                println!("{}", err_msg);
                Err(err_msg)
            }
        }
        Err(e) => {
            let err_msg = format!("❌ Impossible d'envoyer /play au serveur WebRTC: {}", e);
            println!("{}", err_msg);
            Err(err_msg)
        }
    }
}


#[tauri::command]
async fn get_command(_state: tauri::State<'_, AppState>) -> Result<Option<Command>, String> {
    // Check WebRTC server for commands
    let client = reqwest::Client::new();
    match client.get("http://localhost:5173/command").send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Option<Command>>().await {
                    Ok(command) => Ok(command),
                    Err(e) => {
                        println!("Failed to parse command response: {}", e);
                        Ok(None)
                    }
                }
            } else {
                Ok(None)
            }
        }
        Err(e) => {
            println!("Failed to connect to command server: {}", e);
            Ok(None)
        }
    }
}

#[tauri::command]
async fn get_video_path(_state: tauri::State<'_, AppState>) -> Result<Option<String>, String> {
    // Get video path from Node.js server
    match reqwest::get("http://localhost:5173/video-path").await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => {
                        if let Some(path) = data.get("path").and_then(|p| p.as_str()) {
                            Ok(Some(path.to_string()))
                        } else {
                            Ok(None)
                        }
                    }
                    Err(e) => {
                        println!("Error parsing video path JSON: {}", e);
                        Ok(None)
                    }
                }
            } else {
                println!("HTTP error getting video path: {}", response.status());
                Ok(None)
            }
        }
        Err(e) => {
            println!("Error fetching video path from Node.js: {}", e);
            Ok(None)
        }
    }
}

async fn monitor_endpoints() {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(50));
    
    loop {
        interval.tick().await;
        
        // Vérifier s'il y a de nouvelles commandes
        let client = reqwest::Client::new();
        if let Ok(response) = client.get("http://localhost:5173/command").send().await {
            if response.status().is_success() {
                if let Ok(command) = response.json::<Option<Command>>().await {
                    if let Some(cmd) = command {
                        match cmd.action.as_str() {
                            "play" => {
                                if let Some(time) = cmd.time {
                                    let minutes = (time / 60.0) as i32;
                                    let remaining_time = time % 60.0;
                                    let whole_seconds = remaining_time as i32;
                                    let decimals = (remaining_time - whole_seconds as f64) * 100.0;
                                    println!("ENDPOINT: /play/{}s ({}:{:02}.{:02})", time, minutes, whole_seconds, decimals as i32);
                                } else {
                                    println!("ENDPOINT: /play");
                                }
                            },
                            "pause" => {
                                println!("ENDPOINT: /pause (SPACEBAR)");
                            },
                            "seek" => {
                                if let Some(time) = cmd.time {
                                    let minutes = (time / 60.0) as i32;
                                    let remaining_time = time % 60.0;
                                    let whole_seconds = remaining_time as i32;
                                    let decimals = (remaining_time - whole_seconds as f64) * 100.0;
                                    println!("ENDPOINT: /seek/{}s ({}:{:02}.{:02})", time, minutes, whole_seconds, decimals as i32);
                                }
                            },
                            _ => {}
                        }
                    }
                }
            }
        }
    }
}

#[tokio::main]
async fn main() {
    // Fast instance check - just remove old lock and continue
    let lock_file = std::env::temp_dir().join("videoplayer.lock");
    if lock_file.exists() {
        println!("Removing old lock file...");
        let _ = fs::remove_file(&lock_file);
    }

    // Create lock file
    if let Err(e) = fs::write(&lock_file, std::process::id().to_string()) {
        println!("Failed to create lock file: {}", e);
    }

    // Quick cleanup of port 5173 (minimal delay)
    println!("Quick port cleanup...");
    let _ = ProcessCommand::new("pkill")
        .args(&["-f", "webrtc-server.js"])  // Kill by process name - much faster
        .output();
    
    // Short wait for port release
    std::thread::sleep(std::time::Duration::from_millis(100));

    // Launch WebRTC server for ultra-low latency
    println!("Starting WebRTC server...");
    
    // Detect if we're in development or bundled mode
    let current_exe = std::env::current_exe().unwrap();
    let webrtc_dir = if current_exe.to_string_lossy().contains(".app/Contents/MacOS") {
        // We're in a bundle, look in Resources/webrtc
        current_exe.parent().unwrap().parent().unwrap().join("Resources").join("webrtc")
    } else {
        // We're in development mode
        std::env::current_dir().unwrap().parent().unwrap().join("webrtc")
    };
    
    println!("Looking for WebRTC server in: {:?}", webrtc_dir);
    
    // Try multiple node paths to find available node executable
    let home_dir = std::env::var("HOME").unwrap_or_default();
    let nvm_pattern = format!("{}/.nvm/versions/node/*/bin/node", home_dir);
    let node_paths = vec![
        "node".to_string(),  // System PATH
        "/usr/local/bin/node".to_string(),  // Homebrew
        "/opt/homebrew/bin/node".to_string(),  // Apple Silicon Homebrew
        nvm_pattern,  // NVM
    ];
    
    let mut node_cmd = None;
    for path in &node_paths {
        if path.contains("*") {
            // Handle NVM glob pattern
            if let Ok(home) = std::env::var("HOME") {
                let nvm_path = format!("{}/.nvm/versions/node", home);
                if let Ok(entries) = std::fs::read_dir(&nvm_path) {
                    for entry in entries.flatten() {
                        let node_exe = entry.path().join("bin/node");
                        if node_exe.exists() {
                            node_cmd = Some(node_exe.to_string_lossy().to_string());
                            break;
                        }
                    }
                }
            }
        } else {
            let test_cmd = ProcessCommand::new(path).arg("--version").output();
            if test_cmd.is_ok() {
                node_cmd = Some(path.to_string());
                break;
            }
        }
        if node_cmd.is_some() { break; }
    }
    
    let node_executable = node_cmd.unwrap_or_else(|| "node".to_string());
    println!("Using node executable: {}", node_executable);
    
    let node_server = match ProcessCommand::new(&node_executable)
        .arg("webrtc-server.js")
        .current_dir(webrtc_dir)
        .spawn() {
        Ok(child) => {
            println!("WebRTC server started (PID: {})", child.id());
            Some(child)
        }
        Err(e) => {
            println!("Failed to start WebRTC server: {}", e);
            println!("Cannot continue without WebRTC server");
            None
        }
    };

    // Minimal wait for server to start
    std::thread::sleep(std::time::Duration::from_millis(100));
    
    // Signal au plugin QML que le serveur WebRTC est prêt
    println!("WEBRTC_SERVER_READY");
    println!("WEBRTC_SERVER_READY");  // Double signal pour être sûr


    

    let app_state: AppState = Arc::new(Mutex::new(AppData {
        node_server,
    }));

    // Flag pour éviter le nettoyage multiple
    let cleanup_started = Arc::new(Mutex::new(false));

    // Démarrer la surveillance des endpoints
    tokio::spawn(async move {
        monitor_endpoints().await;
    });

    tauri::Builder::default()
        .manage(app_state.clone())
        .invoke_handler(tauri::generate_handler![
            get_command,
            get_video_path,
            handle_play_command,
            keep_window_open
        ])
        .setup(|_app| {
            // Setup cleanup on app termination
            Ok(())
        })
        .on_window_event({
            let app_state_clone = app_state.clone();
            let cleanup_flag = cleanup_started.clone();
            move |event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event.event() {
                    println!("Close requested - keeping window open for MuseScore plugin communication");
                    // Ne pas fermer automatiquement - garder ouvert pour les commandes MuseScore
                    return;
                }
                if let tauri::WindowEvent::Destroyed = event.event() {
                    // Vérifier si le nettoyage a déjà commencé
                    let mut started = cleanup_flag.lock().unwrap();
                    if *started {
                        println!("Cleanup already in progress, ignoring duplicate destroy event");
                        return;
                    }
                    *started = true;
                    
                    println!("App closing - fast cleanup...");
                    
                    // Fast Node.js server termination
                    if let Ok(mut app_data) = app_state_clone.lock() {
                        if let Some(child) = app_data.node_server.take() {
                            println!("Stopping WebRTC server (PID: {})", child.id());
                            
                            // FAST KILL: Direct SIGKILL without waiting
                            #[cfg(unix)]
                            {
                                use std::process::Command;
                                let pid = child.id().to_string();
                                let _ = Command::new("kill")
                                    .args(&["-9", &pid])  // Direct SIGKILL
                                    .output();
                                println!("WebRTC server terminated");
                            }
                            
                            // Fallback for non-Unix
                            #[cfg(not(unix))]
                            {
                                let _ = child.kill();
                                println!("WebRTC server terminated");
                            }
                        }
                    }
                    
                    // Quick lock file removal
                    let lock_file = std::env::temp_dir().join("videoplayer.lock");
                    let _ = fs::remove_file(&lock_file);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}