<p align="center">
  <img src=".github/assets/icon-dark.webp" alt="Mauderbox" width="120" height="120" />
</p>

<h1 align="center">Mauderbox</h1>

<p align="center">
  <strong>Local-First Voice Cloning & AI Text-to-Speech Studio</strong><br/>
  Professional voice synthesis. Zero cloud dependency. Full GPU acceleration.<br/>
  Powered by Qwen3-TTS | Built by Maudersoft
</p>

<p align="center">
  <a href="https://github.com/daMustermann/mauderbox/releases">📥 Download</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-api">🔌 API</a> •
  <a href="#-system-requirements">💻 Requirements</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/daMustermann/mauderbox?style=flat-square" alt="Release" />
  <img src="https://img.shields.io/github/downloads/daMustermann/mauderbox/total?style=flat-square" alt="Downloads" />
  <img src="https://img.shields.io/github/license/daMustermann/mauderbox?style=flat-square" alt="License" />
</p>

---

## 🎯 What is Mauderbox?

**Mauderbox** is a professional voice cloning and text-to-speech application that runs **100% locally** on your machine. No cloud. No subscriptions. No limits.

Think of it as **"Ollama for voice"** - download AI models, clone any voice from audio samples, and generate natural-sounding speech in seconds.

### Why Mauderbox?

- 🔒 **Complete Privacy** - All processing happens locally, your voice data never leaves your machine
- ⚡ **GPU Accelerated** - Native support for NVIDIA CUDA and AMD ROCm
- 🎨 **Professional Tools** - Voice profile management, audio editing, generation history
- 🔌 **API-First** - Full REST API for integration into your projects
- 📦 **Zero Config** - Download, install, and start generating - no Python setup required
- 🆓 **Free & Open Source** - MIT License

---

## ✨ Features

### 🎤 Voice Cloning
- **One-Shot Cloning** - Clone voices from just a few seconds of audio
- **Multi-Sample Support** - Combine multiple samples for improved quality
- **Voice Profiles** - Organize and manage unlimited voice profiles
- **In-App Recording** - Record samples directly or upload audio files
- **Auto-Transcription** - Powered by Whisper for accurate text alignment

### 🗣️ Text-to-Speech Generation
- **Natural Speech** - High-quality synthesis with Qwen3-TTS (1.7B & 0.6B models)
- **Multiple Voices** - Generate speech with any cloned voice profile
- **Batch Generation** - Process multiple texts at once
- **Generation History** - Track, search, and replay all generations
- **Audio Export** - Save as WAV files with one click

### 🔧 Advanced Features
- **Voice Prompt Caching** - Lightning-fast regeneration with cached prompts
- **Instruct Mode** - Fine-grained control over tone, pace, and emotion
- **Real-Time Preview** - Instant audio playback in the app
- **Smart Model Loading** - Automatic VRAM management and lazy loading
- **Update System** - Automatic updates with one-click installation

### 🖥️ Desktop Application
- **Native Performance** - Built with Tauri (Rust), not Electron
- **Embedded Server** - Python backend runs automatically
- **Remote Mode** - Connect to a server on your network
- **Dark Theme** - Beautiful, modern interface
- **Cross-Platform** - Windows, macOS (Intel & Apple Silicon), Linux

### 🔌 REST API
- **Full API Access** - Everything the UI can do, the API can do
- **OpenAPI Docs** - Interactive documentation at `/docs`
- **Type-Safe Client** - Auto-generated TypeScript types
- **WebSocket Support** - Real-time progress updates

---

## 🚀 Quick Start

### Installation

1. **Download** the latest installer for your platform:
   - [Windows (x64) Installer](https://github.com/daMustermann/mauderbox/releases/latest)
   - macOS and Linux coming soon

2. **Install** and launch Mauderbox

3. **Download a model** (first launch):
   - Navigate to the **Server** tab
   - Click "Download Model"
   - Choose **Qwen3-TTS-1.7B** (recommended) or **0.6B** (faster, less VRAM)

4. **Create a voice profile**:
   - Go to the **Voices** tab
   - Click "New Profile"
   - Record or upload audio samples (3-10 seconds recommended)
   - Add transcription text
   - Save the profile

5. **Generate speech**:
   - Enter your text in the main editor
   - Select your voice profile
   - Click "Generate"
   - Play or download the audio

That's it! 🎉

---

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10/11 (64-bit), macOS 11+, or Linux
- **RAM**: 8 GB
- **Storage**: 10 GB free space
- **Processor**: Modern multi-core CPU

### Recommended for Best Performance
- **GPU**: NVIDIA GPU (6GB+ VRAM) or AMD GPU with ROCm support
- **RAM**: 16 GB+
- **Storage**: SSD with 20 GB+ free space

### GPU Acceleration Support

#### ✅ NVIDIA (CUDA)
- Automatic detection and configuration
- Supports RTX 20/30/40 series, GTX 16 series, and newer
- Recommended: 8GB+ VRAM for 1.7B model, 4GB+ for 0.6B model

#### ✅ AMD (ROCm)
- **Full compatibility** with AMD GPUs
- Supported on Windows and Linux
- Recommended: RX 6000/7000 series with 8GB+ VRAM
- ROCm runtime included in Windows builds

##### 🚀 Flash Attention 2 (Optional Performance Boost)
For even faster inference on AMD/NVIDIA GPUs, install Flash Attention 2:

```bash
pip install flash-attn --no-build-isolation
```

**Benefits:**
- 2-3x faster attention computation
- Reduced memory usage
- Automatic detection and fallback to SDPA if unavailable

**Note:** Flash Attention 2 requires PyTorch and CUDA/ROCm toolkit for compilation. If installation fails or the module is not available, Mauderbox will automatically fall back to PyTorch's optimized SDPA (Scaled Dot Product Attention), which is still very fast. Flash Attention is not included in the default installation to avoid build issues.

#### ⚠️ Apple Silicon (MPS)
- Limited support (CPU fallback for stability)
- Future updates will improve MPS performance

#### 💻 CPU-Only Mode
- Works on any system without a GPU
- Generation time: ~2-5x slower than GPU
- Suitable for testing and light usage

---

## 🔌 API

Mauderbox includes a full REST API for integration into your own projects.

### Starting the Server

```bash
# Desktop app starts automatically on port 17493
# Or run standalone:
python -m backend.main
```

### API Documentation

Once running, access interactive docs at:
```
http://localhost:17493/docs
```

### Quick Example

```python
import requests

# Generate speech
response = requests.post("http://localhost:17493/generate", json={
    "text": "Hello, this is a test of Mauderbox!",
    "profile_id": "your-profile-id",
})

audio_url = response.json()["audio_url"]
```

### TypeScript Client

Auto-generated client available in `app/src/lib/api/`

```typescript
import { DefaultService } from '@/lib/api';

const result = await DefaultService.generateSpeech({
  text: "Hello world",
  profile_id: "profile-id"
});
```

---

## 🛠️ Building from Source

### Prerequisites

- **Bun** (for frontend): `npm install -g bun`
- **Rust** (for Tauri): [rustup.rs](https://rustup.rs)
- **Python 3.11+**: [python.org](https://python.org)
- **Node.js 18+**: [nodejs.org](https://nodejs.org)

### Build Steps

```bash
# Clone repository
git clone https://github.com/daMustermann/mauderbox.git
cd mauderbox

# Install dependencies
bun install

# Build Python server
cd backend
pip install -r requirements.txt
python build_binary.py
cd ..

# Build desktop app
cd tauri
bun run tauri build
```

Installers will be in `tauri/src-tauri/target/release/bundle/`

---

## 📚 Documentation

- [Auto-Update Setup](AUTOUPDATER_SETUP.md) - Configure automatic updates
- [GitHub Secrets Guide](GITHUB_SECRETS_ANLEITUNG.md) - Set up release signing
- [API Documentation](http://localhost:17493/docs) - Interactive API reference
- [Changelog](CHANGELOG.md) - Version history and updates

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- **Qwen3-TTS** - State-of-the-art voice synthesis model
- **Tauri** - Cross-platform desktop framework
- **FastAPI** - Modern Python web framework
- **Whisper** - Speech recognition and transcription

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/daMustermann/mauderbox/issues)
- **Discussions**: [GitHub Discussions](https://github.com/daMustermann/mauderbox/discussions)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/daMustermann">Maudersoft</a>
</p>
