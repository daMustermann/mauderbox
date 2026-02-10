use std::env;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use chrono::Local;

fn get_log_path() -> PathBuf {
    let mut temp = env::temp_dir();
    temp.push("voicebox-launch.log");
    temp
}

fn log(msg: &str) {
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(get_log_path()) {
        let _ = writeln!(file, "[{}] {}", Local::now().format("%Y-%m-%d %H:%M:%S"), msg);
    }
}

fn main() {
    let _ = std::fs::remove_file(get_log_path()); // Start fresh on new run
    log("Launcher: Starting Voicebox Server wrapper...");

    // 1. Locate the executable and base directories
    let exe_path = env::current_exe().unwrap_or_else(|e| {
        log(&format!("Error getting exe path: {}", e));
        PathBuf::from(".")
    });
    let exe_dir = exe_path.parent().unwrap_or(Path::new("."));
    
    // Log environment for debugging
    log(&format!("Launcher: Executable at {:?}", exe_path));
    log(&format!("Launcher: Executable Dir at {:?}", exe_dir));

    // 2. Locate the 'backend' directory
    let possible_paths = vec![
        exe_dir.join("resources").join("backend"),      // Windows installed
        exe_dir.join("backend"),                        // Dev/Flat
        exe_dir.parent().unwrap_or(exe_dir).join("resources").join("backend"), 
        exe_dir.parent().unwrap_or(exe_dir).join("backend"),
    ];

    let mut backend_path: Option<PathBuf> = None;
    for p in &possible_paths {
        if p.exists() {
            log(&format!("Launcher: Found backend at {:?}", p));
            backend_path = Some(p.clone());
            break;
        } else {
            log(&format!("Launcher: Checked {:?} (not found)", p));
        }
    }

    if backend_path.is_none() {
        log("Error: 'backend' directory not found in any expected location.");
        std::process::exit(1);
    }

    let backend_dir = backend_path.unwrap();
    
    // We need to run `python -m backend.main`.
    // This requires the cwd to be the PARENT of the `backend` folder.
    let root_dir = backend_dir.parent().unwrap();
    log(&format!("Launcher: Setting CWD to {:?}", root_dir));

    let args: Vec<String> = env::args().skip(1).collect();
    let python_cmd = "python"; // Assume global python

    // 3. Pre-flight dependency check & Auto-install
    log("Launcher: Performing pre-flight dependency check...");
    
    let check_script = "
import sys
try:
    import fastapi, uvicorn, sqlalchemy, alembic, python_multipart, numpy
except ImportError:
    sys.exit(1)
";
    let check_cmd = Command::new(python_cmd)
        .arg("-c")
        .arg(check_script)
        .output();

    if let Ok(output) = check_cmd {
        if !output.status.success() {
            log("Launcher: Missing dependencies. Prompting user...");
            
            // Show Native Dialog via PowerShell
            let ps_script = "
Add-Type -AssemblyName System.Windows.Forms
$result = [System.Windows.Forms.MessageBox]::Show('Voicebox requires Python dependencies (FastAPI, SQLAlchemy, etc.) that are missing in your global environment.\n\nDo you want to install them now using pip?\n(This will try to protect your existing PyTorch installation)', 'Missing Dependencies', 'YesNo', 'Question')
Write-Output $result
";
            let ps_output = Command::new("powershell")
                .args(&["-NoProfile", "-Command", ps_script])
                .output();
            
            match ps_output {
                Ok(out) => {
                    let result = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    log(&format!("Launcher: User response: {}", result));

                    if result == "Yes" {
                        log("Launcher: Starting dependency installation...");
                        
                        let req_path = backend_dir.join("requirements.txt");
                        if req_path.exists() {
                            let safe_req_path = backend_dir.join("requirements_install.txt");
                            
                            // Filter out torch lines to prevent overwrites
                            let mut made_safe_file = false;
                            if let Ok(content) = std::fs::read_to_string(&req_path) {
                                let filtered_lines: Vec<&str> = content.lines()
                                    .filter(|l| !l.trim().starts_with("torch"))
                                    .collect();
                                let filtered_content = filtered_lines.join("\n");
                                if std::fs::write(&safe_req_path, filtered_content).is_ok() {
                                    made_safe_file = true;
                                }
                            }
                            
                            let install_target = if made_safe_file { safe_req_path.clone() } else { req_path };

                            log("Launcher: Creating installation batch file...");
                            let bat_path = backend_dir.join("install_deps.bat");
                            let batch_content = format!(
                                "@echo off\r\n\
                                 title Voicebox Dependency Installer\r\n\
                                 echo Installing missing Python dependencies...\r\n\
                                 echo Target: {}\r\n\
                                 pip install -r \"{}\"\r\n\
                                 if %errorlevel% neq 0 (\r\n\
                                    echo.\r\n\
                                    echo Installation FAILED. Please check the error messages above.\r\n\
                                    pause\r\n\
                                    exit /b %errorlevel%\r\n\
                                 )\r\n\
                                 echo.\r\n\
                                 echo Installation successful!\r\n\
                                 timeout /t 5\r\n",
                                install_target.display(),
                                install_target.display()
                            );
                            
                            if let Err(e) = std::fs::write(&bat_path, batch_content) {
                                log(&format!("Launcher: Failed to write batch file: {}", e));
                            } else {
                                log("Launcher: Running batch file...");
                                let _ = Command::new("cmd")
                                    .args(&["/C", "start", "/wait", "cmd", "/c", &bat_path.display().to_string()])
                                    .status();
                                
                                let _ = std::fs::remove_file(bat_path);
                            }
                                
                            if made_safe_file {
                                let _ = std::fs::remove_file(safe_req_path);
                            }
                        } else {
                            log("Launcher: Warning: requirements.txt not found.");
                        }
                    } else {
                        log("Launcher: User declined installation. Backend will likely fail.");
                    }
                }
                Err(e) => {
                    log(&format!("Launcher: Failed to show dialog: {}", e));
                }
            }
        } else {
            log("Launcher: Dependencies look OK.");
        }
    } else {
        log("Launcher: Failed to run python check script. Is python installed?");
    }

    // 4. Execute Server
    log(&format!("Launcher: Running '{} -m backend.main' with args: {:?}", python_cmd, args));
    
    let mut cmd = Command::new(python_cmd);
    cmd.arg("-m")
       .arg("backend.main")
       .args(&args)
       .current_dir(root_dir)
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());

    match cmd.spawn() {
        Ok(mut child) => {
            log("Launcher: Python process spawned. Monitoring output...");
            
            let stdout = child.stdout.take().expect("Failed to capture stdout");
            let stderr = child.stderr.take().expect("Failed to capture stderr");

            std::thread::spawn(move || {
                use std::io::{BufRead, BufReader};
                let reader = BufReader::new(stdout);
                for line in reader.lines() {
                    if let Ok(l) = line {
                        log(&format!("STDOUT: {}", l));
                        println!("{}", l);
                    }
                }
            });

            std::thread::spawn(move || {
                use std::io::{BufRead, BufReader};
                let reader = BufReader::new(stderr);
                for line in reader.lines() {
                    if let Ok(l) = line {
                        log(&format!("STDERR: {}", l));
                        eprintln!("{}", l);
                    }
                }
            });

            let status = child.wait().expect("Failed to wait on child process");
            log(&format!("Launcher: Process exited with code {:?}", status.code()));
            std::process::exit(status.code().unwrap_or(1));
        }
        Err(e) => {
            log(&format!("Launcher: Failed to spawn python process: {}", e));
            log("Make sure 'python' is in your system PATH.");
            std::process::exit(1);
        }
    }
}
