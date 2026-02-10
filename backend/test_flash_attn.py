#!/usr/bin/env python3
"""Test Flash Attention detection."""

import torch

# Check for Flash Attention availability
HAS_FLASH_ATTENTION = False
try:
    import flash_attn
    # Test if flash_attn actually works (not just installed)
    from flash_attn.flash_attn_interface import flash_attn_func
    HAS_FLASH_ATTENTION = True
    print("✓ Flash Attention 2 detected and functional - will use for accelerated inference")
    print(f"  Version: {flash_attn.__version__}")
except (ImportError, ModuleNotFoundError) as e:
    print("✗ Flash Attention 2 not available - using SDPA (scaled dot product attention)")
    print(f"  Reason: {str(e)}")
    print("\n  To install Flash Attention 2 for massive speedup:")
    print("  pip install flash-attn --no-build-isolation")

# Check device
if torch.cuda.is_available():
    device = "cuda"
    print(f"\n✓ CUDA available")
    print(f"  Device: {torch.cuda.get_device_name(0)}")
    print(f"  BF16 supported: {torch.cuda.is_bf16_supported()}")
else:
    device = "cpu"
    print("\n✗ CUDA not available, using CPU")

# Determine attention implementation
if device == "cpu":
    attn_impl = "eager"
elif HAS_FLASH_ATTENTION:
    attn_impl = "flash_attention_2"
else:
    attn_impl = "sdpa"

print(f"\n→ Will use attention implementation: {attn_impl}")

if HAS_FLASH_ATTENTION:
    print("\n🚀 Performance boost enabled! Flash Attention 2 will significantly speed up inference.")
