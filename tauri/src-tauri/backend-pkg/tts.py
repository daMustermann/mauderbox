"""
TTS inference module using Qwen3-TTS.
"""

from typing import Optional, List, Tuple, Any
import asyncio
import os
import numpy as np
import io
import soundfile as sf
from pathlib import Path
import platform

from .utils.cache import get_cache_key, get_cached_voice_prompt, cache_voice_prompt
from .utils.audio import normalize_audio
from .utils.progress import get_progress_manager
from .utils.hf_progress import HFProgressTracker, create_hf_progress_callback
from .utils.tasks import get_task_manager
from . import config

# Lazy import torch - this module needs to be importable even without torch
# The binary server will load torch from the system Python installation
try:
    import torch
    
    # Performance optimizations for GPU inference
    # Enable TF32 for faster matmul on Ampere+ GPUs (also works well with ROCm)
    if torch.cuda.is_available():
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        # Enable cudnn benchmark for consistent input sizes
        torch.backends.cudnn.benchmark = True
    
    # Check for Flash Attention availability
    HAS_FLASH_ATTENTION = False
    try:
        import flash_attn
        # Test if flash_attn actually works (not just installed)
        from flash_attn.flash_attn_interface import flash_attn_func
        HAS_FLASH_ATTENTION = True
        print("✓ Flash Attention 2 detected and functional - will use for accelerated inference")
    except (ImportError, ModuleNotFoundError) as e:
        print(f"Flash Attention 2 not available - using SDPA (scaled dot product attention)")
    
except ImportError:
    print("Warning: torch not available - TTS functionality will not work")
    torch = None  # type: ignore
    HAS_FLASH_ATTENTION = False


class TTSModel:
    """Manages Qwen3-TTS model loading and inference."""
    
    def __init__(self, model_size: str = "1.7B"):
        self.model = None
        self.model_size = model_size
        self.device = self._get_device()
        self._current_model_size = None
        self._compiled_generate = None  # Cached compiled function
    
    def _get_device(self) -> str:
        """Get the best available device."""
        forced_device = os.environ.get("VOICEBOX_DEVICE", "").strip().lower()
        if forced_device in {"auto", ""}:
            forced_device = ""
        if forced_device in {"cpu", "cuda", "mps"} or forced_device.startswith("cuda:"):
            return forced_device
        if forced_device in {"rocm", "hip", "gpu", "amd"}:
            return "cuda"

        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            # MPS can have issues, use CPU for stability
            return "cpu"
        return "cpu"

    def _get_torch_dtype(self):
        """Get the best torch dtype for the device."""
        if torch is None:
            return None
            
        if self.device == "cpu":
            return torch.float32
            
        # Use bfloat16 if supported for better performance/memory
        if torch.cuda.is_available() and torch.cuda.is_bf16_supported():
            return torch.bfloat16
            
        return torch.float16
    
    def _get_attn_implementation(self) -> str:
        """Get the best available attention implementation."""
        if self.device == "cpu":
            return "eager"  # Flash Attention doesn't work on CPU
        
        if HAS_FLASH_ATTENTION:
            return "flash_attention_2"
        
        return "sdpa"  # Scaled Dot Product Attention (PyTorch default)
    
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self.model is not None
    
    def _get_model_path(self, model_size: str) -> str:
        """
        Get the model path, downloading from HuggingFace Hub if needed.
        
        Args:
            model_size: Model size (1.7B or 0.6B)
            
        Returns:
            Path to model (either local or HuggingFace Hub ID)
        """
        # HuggingFace Hub model IDs
        hf_model_map = {
            "1.7B": "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
            "0.6B": "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
        }
        
        # Local directory names (for backwards compatibility)
        local_model_map = {
            "1.7B": "Qwen--Qwen3-TTS-12Hz-1.7B-Base",
            "0.6B": "Qwen--Qwen3-TTS-12Hz-0.6B-Base",
        }
        
        if model_size not in hf_model_map:
            raise ValueError(f"Unknown model size: {model_size}")
        
        # Check if model exists locally (backwards compatibility)
        local_path = config.get_models_dir() / local_model_map[model_size]
        if local_path.exists():
            print(f"Found local model at {local_path}")
            return str(local_path)
        
        # Use HuggingFace Hub model ID (will auto-download)
        hf_model_id = hf_model_map[model_size]
        print(f"Will download model from HuggingFace Hub: {hf_model_id}")
        
        return hf_model_id
    
    def load_model(self, model_size: Optional[str] = None):
        """
        Lazy load the TTS model with automatic downloading from HuggingFace Hub.
        
        The model will be automatically downloaded on first use and cached locally.
        This works similar to how Whisper models are loaded.
        
        Args:
            model_size: Model size to load (1.7B or 0.6B)
        """
        if model_size is None:
            model_size = self.model_size
            
        # If already loaded with correct size, return
        if self.model is not None and self._current_model_size == model_size:
            return
        
        # Unload existing model if different size requested
        if self.model is not None and self._current_model_size != model_size:
            self.unload_model()
        
        try:
            from qwen_tts import Qwen3TTSModel
            
            # Get model path (local or HuggingFace Hub ID)
            model_path = self._get_model_path(model_size)
            
            # Set up progress tracking
            progress_manager = get_progress_manager()
            model_name = f"qwen-tts-{model_size}"
            
            # Check if model is being downloaded from HuggingFace Hub
            if model_path.startswith("Qwen/"):
                print(f"Loading TTS model {model_size} on {self.device}...")
                
                # Check if model is already cached to avoid showing download progress for cached loads
                is_cached = False
                try:
                    from huggingface_hub import hf_hub_download
                    # Attempt to check for config.json locally
                    hf_hub_download(
                        repo_id=model_path,
                        filename="config.json",
                        local_files_only=True
                    )
                    is_cached = True
                except Exception:
                    is_cached = False

                if not is_cached:
                    # Start tracking download task only if not cached
                    task_manager = get_task_manager()
                    task_manager.start_download(model_name)
                    
                    # Initialize progress state to show download has started
                    progress_manager.update_progress(
                        model_name=model_name,
                        current=0,
                        total=1,  # Set to 1 initially, will be updated by callback
                        filename="",
                        status="downloading",
                    )
                    
                    # Set up progress callback
                    progress_callback = create_hf_progress_callback(model_name, progress_manager)
                    tracker = HFProgressTracker(progress_callback)
                    
                    # Use progress tracker during download
                    with tracker.patch_download():
                        # Load the model - downloads will happen automatically with progress tracking
                        self.model = Qwen3TTSModel.from_pretrained(
                            model_path,
                            device_map=self.device,
                            torch_dtype=self._get_torch_dtype(),
                            attn_implementation=self._get_attn_implementation(),
                        )
                    
                    # Mark as complete
                    progress_manager.mark_complete(model_name)
                    task_manager.complete_download(model_name)
                else:
                    # Already cached, just load it without progress tracking
                    self.model = Qwen3TTSModel.from_pretrained(
                        model_path,
                        device_map=self.device,
                        torch_dtype=self._get_torch_dtype(),
                        attn_implementation=self._get_attn_implementation(),
                    )

            else:
                # Local model, no download needed
                print(f"Loading TTS model {model_size} on {self.device}...")
                self.model = Qwen3TTSModel.from_pretrained(
                    model_path,
                    device_map=self.device,
                    torch_dtype=self._get_torch_dtype(),
                    attn_implementation=self._get_attn_implementation(),
                )
            
            self._current_model_size = model_size
            self.model_size = model_size
            
            # Try to compile if beneficial
            self._compile_model_if_needed()
            
            print(f"TTS model {model_size} loaded successfully")
            
        except ImportError as e:
            print(f"Error: qwen_tts package not found. Install with: pip install git+https://github.com/QwenLM/Qwen3-TTS.git")
            progress_manager = get_progress_manager()
            task_manager = get_task_manager()
            model_name = f"qwen-tts-{model_size}"
            progress_manager.mark_error(model_name, str(e))
            task_manager.error_download(model_name, str(e))
            raise
        except Exception as e:
            print(f"Error loading TTS model: {e}")
            print(f"Tip: The model will be automatically downloaded from HuggingFace Hub on first use.")
            progress_manager = get_progress_manager()
            task_manager = get_task_manager()
            model_name = f"qwen-tts-{model_size}"
            progress_manager.mark_error(model_name, str(e))
            task_manager.error_download(model_name, str(e))
            raise
        
        # Compile the model if needed
        self._compile_model_if_needed()
    
    async def load_model_async(self, model_size: Optional[str] = None):
        """
        Async version of load_model that runs in thread pool.
        
        This prevents blocking the event loop during model loading.
        """
        if model_size is None:
            model_size = self.model_size
            
        # If already loaded with correct size, return immediately
        if self.model is not None and self._current_model_size == model_size:
            return
        
        # Run the blocking load operation in a thread pool
        await asyncio.to_thread(self.load_model, model_size)
    
    def unload_model(self):
        """Unload the model to free memory."""
        if self.model is not None:
            del self.model
            self.model = None
            self._current_model_size = None
            self._compiled_generate = None
            
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            print("TTS model unloaded")
    
    def _should_compile(self) -> bool:
        """Check if torch.compile is available and beneficial."""
        # torch.compile requires PyTorch 2.0+
        if not hasattr(torch, 'compile'):
            return False
            
        # Disable on Windows - known to cause hangs/issues with current pytorch versions
        if platform.system() == "Windows":
             return False

        # Check for ROCm/HIP or CUDA
        if self.device == "cpu":
            return False
        # Don't compile on MPS (not well supported)
        if self.device == "mps":
            return False
        return True
    
    async def create_voice_prompt(
        self,
        audio_path: str,
        reference_text: str,
        use_cache: bool = True,
    ) -> Tuple[Any, bool]:
        """
        Create voice prompt from reference audio.
        
        Args:
            audio_path: Path to reference audio file
            reference_text: Transcript of reference audio
            use_cache: Whether to use cached prompt if available
            
        Returns:
            Tuple of (voice_prompt_dict, was_cached)
        """
        await self.load_model_async()
        
        # Check cache if enabled
        if use_cache:
            cache_key = get_cache_key(audio_path, reference_text, self.model_size)
            cached_prompt = get_cached_voice_prompt(cache_key)
            if cached_prompt is not None:
                return cached_prompt, True
        
        def _create_prompt_sync():
            """Run synchronous voice prompt creation in thread pool."""
            if self.model is None:
                raise RuntimeError("Model not loaded")
            with torch.inference_mode():
                return self.model.create_voice_clone_prompt(
                    ref_audio=str(audio_path),
                    ref_text=reference_text,
                    x_vector_only_mode=False,
                )
        
        # Run blocking operation in thread pool
        voice_prompt_items = await asyncio.to_thread(_create_prompt_sync)
        
        # Cache if enabled
        if use_cache:
            cache_voice_prompt(cache_key, voice_prompt_items)
        
        return voice_prompt_items, False
    
    async def combine_voice_prompts(
        self,
        audio_paths: List[str],
        reference_texts: List[str],
    ) -> Tuple[np.ndarray, str]:
        """
        Combine multiple reference samples for better quality.
        
        Args:
            audio_paths: List of audio file paths
            reference_texts: List of reference texts
            
        Returns:
            Tuple of (combined_audio, combined_text)
        """
        from .utils.audio import load_audio
        
        combined_audio = []
        
        for audio_path in audio_paths:
            audio, sr = load_audio(audio_path)
            audio = normalize_audio(audio)
            combined_audio.append(audio)
        
        # Concatenate audio
        mixed = np.concatenate(combined_audio)
        mixed = normalize_audio(mixed)
        
        # Combine texts
        combined_text = " ".join(reference_texts)
        
        return mixed, combined_text
    
    async def generate(
        self,
        text: str,
        voice_prompt: dict,
        language: str = "en",
        seed: Optional[int] = None,
        instruct: Optional[str] = None,
    ) -> Tuple[np.ndarray, int]:
        """
        Generate audio from text using voice prompt.

        Args:
            text: Text to synthesize
            voice_prompt: Voice prompt dictionary from create_voice_prompt
            language: Language code (en or zh)
            seed: Random seed for reproducibility
            instruct: Natural language instruction for speech delivery control

        Returns:
            Tuple of (audio_array, sample_rate)
        """
        # Load model (already handles async via to_thread if needed)
        await self.load_model_async()

        def _generate_sync():
            """Run synchronous generation in thread pool."""
            # Set seed if provided
            if seed is not None:
                torch.manual_seed(seed)
                if torch.cuda.is_available():
                    torch.cuda.manual_seed(seed)
            
            if self.model is None:
                raise RuntimeError("Model not loaded")

            # Use inference_mode for better performance (no gradient tracking)
            with torch.inference_mode():
                # Generate audio - this is the blocking operation
                wavs, sample_rate = self.model.generate_voice_clone(
                    text=text,
                    voice_clone_prompt=voice_prompt,
                    instruct=instruct,
                )
            return wavs[0], sample_rate

        # Run blocking inference in thread pool to avoid blocking event loop
        audio, sample_rate = await asyncio.to_thread(_generate_sync)

        return audio, sample_rate
    
    def _compile_model_if_needed(self):
        """Compile the model for faster inference if supported."""
        if not self._should_compile() or self._compiled_generate is not None:
            return
        
        if self.model is None:
            return

        print("Compiling model (this may take a minute the first time)...")
        try:
            # We compile the generate function of the model
            # Note: This is experimental and might fail depending on the model structure
            if hasattr(self.model, "model") and hasattr(self.model.model, "forward"):
                 self.model.model.forward = torch.compile(self.model.model.forward, mode="reduce-overhead") # type: ignore
                 self._compiled_generate = True
                 print("Model compilation scheduled.")
        except Exception as e:
             print(f"Compilation finished/failed: {e}")
             # Mark as compiled to prevent retrying
             self._compiled_generate = False
             
    
    async def generate_from_reference(
        self,
        text: str,
        audio_path: str,
        reference_text: str,
        language: str = "en",
        seed: Optional[int] = None,
    ) -> Tuple[np.ndarray, int]:
        """
        Generate audio directly from reference (convenience method).
        
        Args:
            text: Text to synthesize
            audio_path: Path to reference audio
            reference_text: Transcript of reference audio
            language: Language code
            seed: Random seed
            
        Returns:
            Tuple of (audio_array, sample_rate)
        """
        # Create voice prompt (with caching)
        voice_prompt, _ = await self.create_voice_prompt(audio_path, reference_text)
        
        # Generate
        return await self.generate(text, voice_prompt, language, seed)


# Global model instance
_tts_model: Optional[TTSModel] = None


def get_tts_model() -> TTSModel:
    """Get or create TTS model instance."""
    global _tts_model
    if _tts_model is None:
        _tts_model = TTSModel()
    return _tts_model


def unload_tts_model():
    """Unload TTS model to free memory."""
    global _tts_model
    if _tts_model is not None:
        _tts_model.unload_model()


def audio_to_wav_bytes(audio: np.ndarray, sample_rate: int) -> bytes:
    """Convert audio array to WAV bytes."""
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format="WAV")
    buffer.seek(0)
    return buffer.read()
