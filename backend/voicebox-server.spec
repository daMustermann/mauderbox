# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_data_files
from PyInstaller.utils.hooks import collect_submodules
from PyInstaller.utils.hooks import copy_metadata

datas = []
hiddenimports = ['backend', 'backend.main', 'backend.config', 'backend.database', 'backend.models', 'backend.profiles', 'backend.history', 'backend.tts', 'backend.transcribe', 'backend.utils.audio', 'backend.utils.cache', 'backend.utils.progress', 'backend.utils.hf_progress', 'backend.utils.validation', 'backend.prompt_enhancer', 'rocm_sdk', 'rocm_sdk_core', 'rocm_sdk_devel', 'rocm_sdk_libraries_custom', 'transformers', 'fastapi', 'uvicorn', 'sqlalchemy', 'librosa', 'soundfile', 'qwen_tts', 'qwen_tts.inference', 'qwen_tts.inference.qwen3_tts_model', 'qwen_tts.inference.qwen3_tts_tokenizer', 'qwen_tts.core', 'qwen_tts.cli', 'pkg_resources.extern', 'pydub', 'imageio_ffmpeg']
datas += collect_data_files('qwen_tts')
datas += copy_metadata('qwen-tts')
hiddenimports += collect_submodules('qwen_tts')
hiddenimports += collect_submodules('jaraco')


a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['torch', 'torchaudio', 'torchvision', 'transformers', 'diffusers', 'accelerate', 'scipy', 'pandas', 'nvidia', 'triton', 'numba', 'llvmlite', 'qwen_tts', 'huggingface_hub', 'tokenizers', 'safetensors', 'PIL', 'fsspec', 'filelock', 'sympy', 'networkx', 'jinja2', 'markupsafe', 'mpmath', 'psycopg2', 'psycopg_binary', 'mysql', 'pymysql', 'mariadb', 'cx_Oracle', 'win32com', 'pywin32', 'wmi', 'bcrypt', 'cryptography', 'cffi', 'pycparser', 'tzdata', 'setuptools', 'pkg_resources', 'distutils'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='voicebox-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
