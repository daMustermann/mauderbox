"""
PyInstaller build script for creating standalone Python server binary.
"""

import PyInstaller.__main__
import os
from pathlib import Path


def build_server():
    """Build Python server as standalone binary."""
    backend_dir = Path(__file__).parent
    venv_site_packages = Path(os.environ.get("VIRTUAL_ENV", backend_dir.parent / ".venv")) / "Lib" / "site-packages"

    # Check for local editable qwen_tts install
    local_qwen_path = Path.home() / 'Projects' / 'voice' / 'Qwen3-TTS'

    # PyInstaller arguments
    args = [
        'server.py',  # Use server.py as entry point instead of main.py
        '--onefile',
        '--name', 'voicebox-server',
    ]

    # Add local qwen_tts path if it exists (for editable installs)
    if local_qwen_path.exists():
        args.extend(['--paths', str(local_qwen_path)])
        print(f"Using local qwen_tts source from: {local_qwen_path}")

    # Add hidden imports
    args.extend([
        '--exclude-module', 'torch',
        '--exclude-module', 'torchaudio',
        '--exclude-module', 'torchvision',
        '--exclude-module', 'transformers',
        '--exclude-module', 'diffusers',
        '--exclude-module', 'accelerate',
        # Include numpy, soundfile, librosa - they're needed and relatively small
        # '--exclude-module', 'numpy',
        # '--exclude-module', 'soundfile',
        # '--exclude-module', 'librosa',
        '--exclude-module', 'scipy',
        '--exclude-module', 'pandas',
        '--exclude-module', 'nvidia',
        '--exclude-module', 'triton',
        # librosa and soundfile need to be included
        # '--exclude-module', 'librosa',
        # '--exclude-module', 'soundfile',
        '--exclude-module', 'numba',
        '--exclude-module', 'llvmlite',
        '--exclude-module', 'qwen_tts',
        '--exclude-module', 'huggingface_hub',
        '--exclude-module', 'tokenizers',
        '--exclude-module', 'safetensors',
        '--exclude-module', 'PIL',
        '--exclude-module', 'fsspec',
        '--exclude-module', 'filelock',
        '--exclude-module', 'sympy',
        '--exclude-module', 'networkx',
        '--exclude-module', 'jinja2',
        '--exclude-module', 'markupsafe',
        '--exclude-module', 'mpmath',
        '--exclude-module', 'psycopg2',
        '--exclude-module', 'psycopg_binary',
        '--exclude-module', 'mysql',
        '--exclude-module', 'pymysql',
        '--exclude-module', 'mariadb',
        '--exclude-module', 'cx_Oracle',
        '--exclude-module', 'win32com',
        '--exclude-module', 'pywin32',
        '--exclude-module', 'wmi',
        '--exclude-module', 'bcrypt',
        '--exclude-module', 'cryptography',
        '--exclude-module', 'cffi',
        '--exclude-module', 'pycparser',
        '--exclude-module', 'tzdata',
        # zoneinfo is needed by pydantic, don't exclude it
        '--exclude-module', 'setuptools',
        '--exclude-module', 'pkg_resources',
        '--exclude-module', 'distutils',
        
        # Add hidden imports
        '--hidden-import', 'backend',
        '--hidden-import', 'backend.main',
        '--hidden-import', 'backend.config',
        '--hidden-import', 'backend.database',
        '--hidden-import', 'backend.models',
        '--hidden-import', 'backend.profiles',
        '--hidden-import', 'backend.history',
        '--hidden-import', 'backend.tts',
        '--hidden-import', 'backend.transcribe',
        '--hidden-import', 'backend.utils.audio',
        '--hidden-import', 'backend.utils.cache',
        '--hidden-import', 'backend.utils.progress',
        '--hidden-import', 'backend.utils.hf_progress',
        '--hidden-import', 'backend.utils.validation',
        # '--hidden-import', 'torch',
        '--hidden-import', 'rocm_sdk',
        '--hidden-import', 'rocm_sdk_core',
        '--hidden-import', 'rocm_sdk_devel',
        '--hidden-import', 'rocm_sdk_libraries_custom',
        '--hidden-import', 'transformers',
        '--hidden-import', 'fastapi',
        '--hidden-import', 'uvicorn',
        '--hidden-import', 'sqlalchemy',
        '--hidden-import', 'librosa',
        '--hidden-import', 'soundfile',
        '--hidden-import', 'qwen_tts',
        '--hidden-import', 'qwen_tts.inference',
        '--hidden-import', 'qwen_tts.inference.qwen3_tts_model',
        '--hidden-import', 'qwen_tts.inference.qwen3_tts_tokenizer',
        '--hidden-import', 'qwen_tts.core',
        '--hidden-import', 'qwen_tts.cli',
        '--copy-metadata', 'qwen-tts',
        '--collect-submodules', 'qwen_tts',
        '--collect-data', 'qwen_tts',
        # Fix for pkg_resources and jaraco namespace packages
        '--hidden-import', 'pkg_resources.extern',
        '--collect-submodules', 'jaraco',
        '--noconfirm',
        '--clean',
    ])


    # Change to backend directory
    os.chdir(backend_dir)
    
    # Run PyInstaller
    PyInstaller.__main__.run(args)
    
    print(f"Binary built in {backend_dir / 'dist' / 'voicebox-server'}")


if __name__ == '__main__':
    build_server()
