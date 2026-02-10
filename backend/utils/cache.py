"""
Voice prompt caching utilities.
"""

import hashlib
from pathlib import Path
from typing import Optional, Any

from .. import config

# Lazy import torch - allow module to load even without torch
try:
    import torch
except ImportError:
    torch = None  # type: ignore


def _get_cache_dir() -> Path:
    """Get cache directory from config."""
    return config.get_cache_dir()


# In-memory cache
_memory_cache: dict[str, Any] = {}


def get_cache_key(audio_path: str, reference_text: str, model_size: str = "") -> str:
    """
    Generate cache key from audio file and reference text.

    Args:
        audio_path: Path to audio file
        reference_text: Reference text
        model_size: Size of the model used (e.g., "1.7B", "0.6B") to prevent mismatched tensor sizes

    Returns:
        Cache key (MD5 hash)
    """
    # Read audio file
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    # Combine audio bytes, text, and model size
    combined = audio_bytes + reference_text.encode("utf-8") + model_size.encode("utf-8")

    # Generate hash
    return hashlib.md5(combined).hexdigest()


def get_cached_voice_prompt(
    cache_key: str,
) -> Optional[Any]:
    """
    Get cached voice prompt if available.

    Args:
        cache_key: Cache key

    Returns:
        Cached voice prompt object or None
    """
    # Check in-memory cache
    if cache_key in _memory_cache:
        return _memory_cache[cache_key]

    # Check disk cache
    cache_file = _get_cache_dir() / f"{cache_key}.prompt"
    if cache_file.exists():
        try:
            prompt = torch.load(cache_file)
            _memory_cache[cache_key] = prompt
            return prompt
        except Exception:
            # Cache file corrupted, delete it
            cache_file.unlink()

    return None


def cache_voice_prompt(
    cache_key: str,
    voice_prompt: Any,
) -> None:
    """
    Cache voice prompt to memory and disk.

    Args:
        cache_key: Cache key
        voice_prompt: Voice prompt object
    """
    # Store in memory
    _memory_cache[cache_key] = voice_prompt

    # Store on disk
    cache_file = _get_cache_dir() / f"{cache_key}.prompt"
    torch.save(voice_prompt, cache_file)
