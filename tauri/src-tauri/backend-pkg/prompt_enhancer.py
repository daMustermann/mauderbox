"""
Prompt enhancement module using Huihui LFM 1.2B Instruct model.
"""

from typing import Optional
import torch
from pathlib import Path
import asyncio

# Model configuration
MODEL_ID = "huihui-ai/Huihui-LFM2.5-1.2B-Instruct-abliterated"

# Lazy imports to avoid loading transformers if not needed
_model = None
_tokenizer = None
_device = None


def _get_device() -> str:
    """Get the best available device."""
    if torch.cuda.is_available():
        return "cuda"
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        return "cpu"  # MPS can be unstable
    return "cpu"


def _get_torch_dtype() -> torch.dtype:
    """Get optimal dtype for the device."""
    device = _get_device()
    if device == "cpu":
        return torch.float32
    
    # Use bfloat16 if supported for better performance
    if torch.cuda.is_available() and torch.cuda.is_bf16_supported():
        return torch.bfloat16
    
    return torch.float16


def is_model_downloaded(model_id: str = MODEL_ID) -> bool:
    """Check if the model is already downloaded/cached."""
    try:
        from huggingface_hub import constants as hf_constants
        from pathlib import Path
        
        repo_cache = Path(hf_constants.HF_HUB_CACHE) / ("models--" + model_id.replace("/", "--"))
        if not repo_cache.exists():
            return False
        
        # Check if model files exist
        has_model_files = (
            any(repo_cache.rglob("*.bin")) or
            any(repo_cache.rglob("*.safetensors")) or
            any(repo_cache.rglob("*.pt")) or
            any(repo_cache.rglob("*.pth"))
        )
        return has_model_files
    except Exception:
        return False


def load_model(model_id: str = MODEL_ID, progress_callback=None):
    """
    Load the prompt enhancement model with optional progress tracking.
    
    Args:
        model_id: HuggingFace model ID
        progress_callback: Optional callback for download progress (not used, for API compatibility)
    """
    global _model, _tokenizer, _device
    
    if _model is not None:
        return  # Already loaded
    
    from transformers import AutoModelForCausalLM, AutoTokenizer
    
    _device = _get_device()
    dtype = _get_torch_dtype()
    
    print(f"Loading prompt enhancer model: {model_id}")
    print(f"Device: {_device}, dtype: {dtype}")
    
    _tokenizer = AutoTokenizer.from_pretrained(
        model_id,
        trust_remote_code=True,
    )
    
    _model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=dtype,
        device_map="auto",  # Automatically place on GPU
        trust_remote_code=True,
        low_cpu_mem_usage=True,
    )
    
    _model.eval()  # Set to evaluation mode
    
    print(f"Prompt enhancer loaded successfully on {_device}")


async def load_model_async(model_id: str = MODEL_ID, progress_callback=None):
    """Async wrapper for loading the model."""
    loop = asyncio.get_event_loop()
    
    def _load():
        load_model(model_id, progress_callback)
    
    await loop.run_in_executor(None, _load)


def is_loaded() -> bool:
    """Check if model is loaded."""
    return _model is not None


def unload_model():
    """Unload the model to free memory."""
    global _model, _tokenizer, _device
    
    if _model is not None:
        del _model
        del _tokenizer
        _model = None
        _tokenizer = None
        _device = None
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


def enhance_prompt(
    text: str,
    language: str = "en",
    max_new_tokens: int = 150,
    temperature: float = 0.7,
    top_p: float = 0.9,
) -> str:
    """
    Enhance a TTS prompt to be more descriptive and detailed.
    
    Args:
        text: Original text prompt
        language: Target language code or name (e.g. "en", "de", "German")
        max_new_tokens: Maximum number of tokens to generate
        temperature: Sampling temperature (higher = more creative)
        top_p: Nucleus sampling parameter
        
    Returns:
        Enhanced prompt text
    """
    if _model is None or _tokenizer is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")
    
    # Select system prompt based on language
    lang_lower = language.lower()
    
    if lang_lower in ["de", "german", "deutsch"]:
        system_prompt = (
            "Du bist ein kreativer KI-Assistent, der Text-Prompts für die Text-to-Speech-Synthese optimiert. "
            "Deine Aufgabe ist es, den gegebenen Text detaillierter, bildhafter und emotionaler zu formulieren, "
            "ohne die ursprüngliche Aussage zu verändern. Füge beschreibende Adjektive und Kontext hinzu, "
            "um die Szene lebendiger zu machen. Antworte ausschließlich mit dem verbesserten Text in deutscher Sprache."
        )
        instruction = f"{system_prompt}\n\nOriginaler Text: {text}\n\nVerbesserter Text:"
    elif lang_lower in ["fr", "french", "francais"]:
        system_prompt = (
            "Vous êtes un assistant IA créatif qui optimise les invites de texte pour la synthèse vocale. "
            "Votre tâche est de reformuler le texte donné pour le rendre plus détaillé, vivant et émotionnel, "
            "tout en préservant strictement le sens original. Ajoutez des adjectifs descriptifs et du contexte "
            "pour rendre la scène plus vivante. Répondez uniquement avec le texte amélioré en français."
        )
        instruction = f"{system_prompt}\n\nTexte original: {text}\n\nTexte amélioré:"
    elif lang_lower in ["es", "spanish", "espanol"]:
        system_prompt = (
            "Eres un asistente de IA creativo que optimiza las indicaciones de texto para la síntesis de texto a voz. "
            "Tu tarea es reformular el texto dado para que sea más detallado, vívido y emocional, "
            "preservando estrictamente el significado original. Agrega adjetivos descriptivos y contexto "
            "para hacer la escena más viva. Responde únicamente con el texto mejorado en español."
        )
        instruction = f"{system_prompt}\n\nTexto original: {text}\n\nTexto mejorado:"
    else:
        # Default to English
        system_prompt = (
            "You are a creative AI assistant that optimizes text prompts for text-to-speech synthesis. "
            "Your task is to rewrite the given text to be more detailed, vivid, and emotional, "
            "while strictly preserving the original meaning. Add descriptive adjectives and context "
            "to make the scene come alive. Respond only with the enhanced text in English."
        )
        instruction = f"{system_prompt}\n\nOriginal text: {text}\n\nEnhanced text:"
    
    # Tokenize input
    inputs = _tokenizer(
        instruction,
        return_tensors="pt",
        truncation=True,
        max_length=1024,
    ).to(_device)
    
    # Generate enhanced prompt
    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
            pad_token_id=_tokenizer.eos_token_id,
            eos_token_id=_tokenizer.eos_token_id,
            repetition_penalty=1.2,
        )
    
    # Decode output
    enhanced = _tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract only the generated part
    # We check for the specific label used in the instruction
    if "Verbesserter Text:" in instruction and "Verbesserter Text:" in enhanced:
        enhanced = enhanced.split("Verbesserter Text:")[-1].strip()
    elif "Texte amélioré:" in instruction and "Texte amélioré:" in enhanced:
        enhanced = enhanced.split("Texte amélioré:")[-1].strip()
    elif "Texto mejorado:" in instruction and "Texto mejorado:" in enhanced:
        enhanced = enhanced.split("Texto mejorado:")[-1].strip()
    elif "Enhanced text:" in enhanced:
        enhanced = enhanced.split("Enhanced text:")[-1].strip()
    
    # Fallback cleanup if the split didn't work perfectly (sometimes LLMs repeat the instruction)
    for prefix in ["Original text:", "Originaler Text:", "Texte original:", "Texto original:"]:
        if prefix in enhanced:
            # If we see "Original text:", meant we likely captured too much or LLM HALLUCINATED it
            # We should try to take what's AFTER the LAST occurrence of the prompt label if possible
            pass # Complex to handle perfectly, but the split above should catch standard cases. 
            # Let's simple remove the instruction part if it is prepended
            enhanced = enhanced.replace(instruction, "").strip()

    return enhanced if enhanced else text
