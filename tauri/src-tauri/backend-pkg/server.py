"""
Entry point for PyInstaller-bundled voicebox server.

This module provides an entry point that works with PyInstaller by using
absolute imports instead of relative imports.
"""

import sys
import logging
import os
from pathlib import Path
import types

# Set up logging FIRST, before any imports that might fail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr,  # Log to stderr so it's captured by Tauri
)
logger = logging.getLogger(__name__)

# Log startup immediately to confirm binary execution
logger.info("=" * 60)
logger.info("voicebox-server starting up...")
logger.info(f"Python version: {sys.version}")
logger.info(f"Executable: {sys.executable}")
logger.info(f"Arguments: {sys.argv}")
logger.info("=" * 60)

def _configure_rocm_environment() -> None:
    """Ensure ROCm DLLs are discoverable in bundled builds."""
    try:
        rocm_dirs = []

        # Directory next to the executable (installed app)
        exe_dir = Path(sys.executable).resolve().parent
        rocm_root = exe_dir / "rocm"
        rocm_dirs.append(rocm_root / "bin")

        # PyInstaller onefile extraction directory
        if getattr(sys, "_MEIPASS", None):
            rocm_dirs.append(Path(sys._MEIPASS) / "rocm" / "bin")

        # Development venv fallback
        venv_root = Path(os.environ.get("VIRTUAL_ENV", ""))
        if venv_root:
            rocm_dirs.append(venv_root / "Lib" / "site-packages" / "_rocm_sdk_libraries_custom" / "bin")
            rocm_dirs.append(venv_root / "Lib" / "site-packages" / "_rocm_sdk_core" / "bin")

        existing_paths = os.environ.get("PATH", "").split(os.pathsep)
        for rocm_dir in rocm_dirs:
            if rocm_dir.exists():
                rocm_path = str(rocm_dir.resolve())
                if rocm_path not in existing_paths:
                    os.environ["PATH"] = rocm_path + os.pathsep + os.environ.get("PATH", "")
                if hasattr(os, "add_dll_directory"):
                    os.add_dll_directory(rocm_path)

        # If running from installed app, provide stub modules that point to rocm_root
        if rocm_root.exists():
            for module_name in ("_rocm_sdk_libraries_custom", "_rocm_sdk_core", "_rocm_sdk_devel"):
                if module_name not in sys.modules:
                    stub_module = types.ModuleType(module_name)
                    stub_module.__file__ = str(rocm_root / "__init__.py")
                    sys.modules[module_name] = stub_module
    except Exception as exc:
        logger.warning(f"Failed to configure ROCm DLL paths: {exc}")


try:
    _configure_rocm_environment()
    logger.info("Importing argparse...")
    import argparse
    logger.info("Importing uvicorn...")
    import uvicorn
    logger.info("Standard library imports successful")

    # Import the FastAPI app from the backend package
    logger.info("Importing backend.config...")
    from backend import config
    logger.info("Importing backend.database...")
    from backend import database
    logger.info("Importing backend.main (this may take a while due to torch/transformers)...")
    from backend.main import app
    logger.info("Backend imports successful")
except Exception as e:
    logger.error(f"Failed to import required modules: {e}", exc_info=True)
    sys.exit(1)

if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser(description="voicebox backend server")
        parser.add_argument(
            "--host",
            type=str,
            default="127.0.0.1",
            help="Host to bind to (use 0.0.0.0 for remote access)",
        )
        parser.add_argument(
            "--port",
            type=int,
            default=17493,
            help="Port to bind to",
        )
        parser.add_argument(
            "--data-dir",
            type=str,
            default=None,
            help="Data directory for database, profiles, and generated audio",
        )
        args = parser.parse_args()
        logger.info(f"Parsed arguments: host={args.host}, port={args.port}, data_dir={args.data_dir}")

        # Set data directory if provided
        if args.data_dir:
            logger.info(f"Setting data directory to: {args.data_dir}")
            config.set_data_dir(args.data_dir)

        # Initialize database after data directory is set
        logger.info("Initializing database...")
        database.init_db()
        logger.info("Database initialized successfully")

        logger.info(f"Starting uvicorn server on {args.host}:{args.port}...")
        uvicorn.run(
            app,
            host=args.host,
            port=args.port,
            log_level="info",
        )
    except Exception as e:
        logger.error(f"Server startup failed: {e}", exc_info=True)
        sys.exit(1)
