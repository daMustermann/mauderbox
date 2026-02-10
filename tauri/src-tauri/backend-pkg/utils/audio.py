"""
Audio processing utilities.
"""

import numpy as np
import soundfile as sf
import librosa
from typing import Tuple, Optional


def normalize_audio(
    audio: np.ndarray,
    target_db: float = -20.0,
    peak_limit: float = 0.85,
) -> np.ndarray:
    """
    Normalize audio to target loudness with peak limiting.
    
    Args:
        audio: Input audio array
        target_db: Target RMS level in dB
        peak_limit: Peak limit (0.0-1.0)
        
    Returns:
        Normalized audio array
    """
    # Convert to float32
    audio = audio.astype(np.float32)
    
    # Calculate current RMS
    rms = np.sqrt(np.mean(audio**2))
    
    # Calculate target RMS
    target_rms = 10**(target_db / 20)
    
    # Apply gain
    if rms > 0:
        gain = target_rms / rms
        audio = audio * gain
    
    # Peak limiting
    audio = np.clip(audio, -peak_limit, peak_limit)
    
    return audio


def _resample_linear(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    if orig_sr == target_sr:
        return audio

    duration = len(audio) / float(orig_sr)
    target_length = max(1, int(round(duration * target_sr)))
    if target_length == len(audio):
        return audio

    x_old = np.linspace(0.0, duration, num=len(audio), endpoint=False, dtype=np.float32)
    x_new = np.linspace(0.0, duration, num=target_length, endpoint=False, dtype=np.float32)
    return np.interp(x_new, x_old, audio).astype(np.float32)


def load_audio(
    path: str,
    sample_rate: int = 24000,
    mono: bool = True,
) -> Tuple[np.ndarray, int]:
    """
    Load audio file with normalization.
    
    Args:
        path: Path to audio file
        sample_rate: Target sample rate
        mono: Convert to mono
        
    Returns:
        Tuple of (audio_array, sample_rate)
    """
    try:
        audio, sr = librosa.load(path, sr=sample_rate, mono=mono)
        return audio, sr
    except Exception as exc:
        try:
            audio, sr = sf.read(path, dtype="float32", always_2d=True)
            if mono:
                audio = audio.mean(axis=1)
            else:
                audio = audio[:, 0]

            if sample_rate and sr != sample_rate:
                audio = _resample_linear(audio.astype(np.float32), sr, sample_rate)
                sr = sample_rate

            return audio, sr
        except Exception as fallback_exc:
            raise RuntimeError(f"Failed to load audio: {exc}") from fallback_exc


def save_audio(
    audio: np.ndarray,
    path: str,
    sample_rate: int = 24000,
) -> None:
    """
    Save audio file.
    
    Args:
        audio: Audio array
        path: Output path
        sample_rate: Sample rate
    """
    sf.write(path, audio, sample_rate)


def trim_audio_to_duration(
    audio: np.ndarray,
    sample_rate: int,
    max_duration: float = 30.0,
) -> np.ndarray:
    """
    Trim audio to a maximum duration.

    Args:
        audio: Audio array
        sample_rate: Sample rate
        max_duration: Maximum duration in seconds

    Returns:
        Trimmed audio array (unchanged if within limit)
    """
    if max_duration <= 0:
        return audio

    max_samples = int(max_duration * sample_rate)
    if len(audio) <= max_samples:
        return audio

    return audio[:max_samples]


def validate_reference_audio_data(
    audio: np.ndarray,
    sample_rate: int,
    min_duration: float = 2.0,
    max_duration: float = 30.0,
    min_rms: float = 0.01,
) -> Tuple[bool, Optional[str]]:
    """
    Validate reference audio array for voice cloning.

    Args:
        audio: Audio array
        sample_rate: Sample rate
        min_duration: Minimum duration in seconds
        max_duration: Maximum duration in seconds
        min_rms: Minimum RMS level

    Returns:
        Tuple of (is_valid, error_message)
    """
    duration = len(audio) / sample_rate

    if duration < min_duration:
        return False, f"Audio too short (minimum {min_duration} seconds)"
    if max_duration is not None and duration > max_duration:
        return False, f"Audio too long (maximum {max_duration} seconds)"

    rms = np.sqrt(np.mean(audio**2))
    if rms < min_rms:
        return False, "Audio is too quiet or silent"

    if np.abs(audio).max() > 0.99:
        return False, "Audio is clipping (reduce input gain)"

    return True, None


def validate_reference_audio(
    audio_path: str,
    min_duration: float = 2.0,
    max_duration: float = 30.0,
    min_rms: float = 0.01,
) -> Tuple[bool, Optional[str]]:
    """
    Validate reference audio for voice cloning.
    
    Args:
        audio_path: Path to audio file
        min_duration: Minimum duration in seconds
        max_duration: Maximum duration in seconds
        min_rms: Minimum RMS level
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        audio, sr = load_audio(audio_path)
        return validate_reference_audio_data(
            audio=audio,
            sample_rate=sr,
            min_duration=min_duration,
            max_duration=max_duration,
            min_rms=min_rms,
        )
    except Exception as e:
        return False, f"Error validating audio: {str(e)}"
