<p align="center">
  <img src=".github/assets/icon-dark.webp" alt="Voicebox" width="120" height="120" />
</p>

<h1 align="center">Voicebox</h1>

<p align="center">
  <strong>The open-source voice synthesis studio by Maudersoft.</strong><br/>
  Clone voices. Generate speech. Build voice-powered apps.<br/>
  All running locally on your machine.
</p>

<p align="center">
  <a href="#download">Download</a> •
  <a href="#features">Features</a> •
  <a href="#api">API</a> •
  <a href="#building">Building</a>
</p>

<br/>

<p align="center">
  <img src="landing/public/assets/app-screenshot-1.webp" alt="Voicebox App Screenshot" width="800" />
</p>

<br/>

<p align="center">
  <img src="landing/public/assets/app-screenshot-2.webp" alt="Voicebox Screenshot 2" width="800" />
</p>

<p align="center">
  <img src="landing/public/assets/app-screenshot-3.webp" alt="Voicebox Screenshot 3" width="800" />
</p>

<br/>

## What is Voicebox?

Voicebox is a **local-first voice cloning studio** developed by **Maudersoft** with DAW-like features for professional voice synthesis. Think of it as the **Ollama for voice** — download models, clone voices, and generate speech entirely on your machine.

Unlike cloud services that lock your voice data behind subscriptions, Voicebox gives you:

- **Complete privacy** — models and voice data stay on your machine
- **Professional tools** — multi-track timeline editor, audio trimming, conversation mixing
- **Model flexibility** — currently powered by Qwen3-TTS, with support for XTTS, Bark, and other models coming soon
- **API-first** — use the desktop app or integrate voice synthesis into your own projects
- **Native performance** — built with Tauri (Rust), not Electron

Download a voice model, clone any voice from a few seconds of audio, and compose multi-voice projects with studio-grade editing tools. No Python install required, no cloud dependency, no limits.

---

## Download

Voicebox is available for macOS and Windows.

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | [voicebox_aarch64.app.tar.gz](https://github.com/daMustermann/voicebox/releases/download/v0.1.0/voicebox_aarch64.app.tar.gz) |
| macOS (Intel) | [voicebox_x64.app.tar.gz](https://github.com/daMustermann/voicebox/releases/download/v0.1.0/voicebox_x64.app.tar.gz) |
| Windows (MSI) | [voicebox_0.1.0_x64_en-US.msi](https://github.com/daMustermann/voicebox/releases/download/v0.1.0/voicebox_0.1.0_x64_en-US.msi) |
| Windows (Setup) | [voicebox_0.1.0_x64-setup.exe](https://github.com/daMustermann/voicebox/releases/download/v0.1.0/voicebox_0.1.0_x64-setup.exe) |

> **Linux builds coming soon** — Currently blocked by GitHub runner disk space limitations.

---

## Building the Installer

### Prerequisites

- [Node.js 18+](https://nodejs.org) and npm
- [Rust](https://rustup.rs)
- [Python 3.11+](https://python.org)
- CUDA-capable GPU recommended (CPU inference supported but slower)

### Build Steps

```bash
# Clone the repository
git clone https://github.com/daMustermann/voicebox.git
cd voicebox

# Install JavaScript dependencies
npm install

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

# Build the backend server executable (Windows)
cd backend
python build_binary.py
cd ..

# Build the Tauri app
cd tauri
npm install
npm run tauri build
cd ..
```

The installer will be created in `tauri/src-tauri/target/release/bundle/`.

**Windows:** `.msi` and `-setup.exe` installers  
**macOS:** `.app` bundle and `.dmg` installer  
**Linux:** `.deb`, `.AppImage`, and other formats

---

## Development

```bash
npm install
npm run dev
```

---

## Features

### 🎤 Voice Cloning & Management

**Voice Profile System**
- Create unlimited voice profiles from audio samples
- Import/Export profiles for sharing and backup
- Multi-sample support for higher quality voice cloning
- Search and organize profiles with metadata
- Language-specific voice configuration

### 🔊 Speech Generation

**Qwen3-TTS Integration**
- Two model sizes: 1.7B (high quality) and 0.6B (faster)
- Multiple language support (English, Chinese, and more)
- Prompt enhancement with AI-powered text improvement
- Smart voice prompt caching for instant regeneration
- Direct TTS endpoint for API integration

### 📝 Stories & Timeline Editor

**Multi-Voice Narratives**
- Create projects with multiple voice tracks
- Timeline-based audio arrangement
- Trim, split, and duplicate audio clips
- Move and reorder story segments
- Export complete stories to audio files
- Mix multiple voices in conversations

### 🎵 Audio Channels

**System Audio Routing**
- Create custom audio channels
- Route voices to specific output devices
- Configure per-channel audio settings
- Real-time audio device management (Tauri only)

### 📊 Generation History

**Complete Audit Trail**
- Full history of all TTS generations
- Search and filter by voice, text, or date
- Favorite important generations
- Re-generate with same parameters
- Export individual generations
- Usage statistics and analytics

### 🎙️ Recording & Transcription

**Audio Capture**
- System audio recording (Windows/macOS with Tauri)
- Automatic transcription via Whisper
- Direct audio upload for profile creation

### 🖥️ Model Management

**Local Model Control**
- Download Qwen3-TTS models (1.7B, 0.6B)
- Load/unload models on demand
- Real-time GPU/VRAM monitoring
- Model download progress tracking
- Automatic model caching

### 🔌 Flexible Deployment

**Connection Modes**
- **Local Mode**: Run everything on your machine (embedded server)
- **Remote Mode**: Connect to GPU server on your network
- **Headless Mode**: Pure API server without UI
- Auto-restart and health monitoring

---

## API

Voicebox exposes a full REST API for integration into your own applications.

### Core Endpoints

**Generation & TTS**
```bash
# Direct TTS (returns WAV audio)
curl -X POST http://localhost:17493/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "profile_id": "abc123",
    "language": "en",
    "model_size": "1.7B"
  }' \
  --output voice.wav

# Generate with metadata (returns generation record)
curl -X POST http://localhost:17493/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "profile_id": "abc123",
    "language": "en",
    "model_size": "1.7B"
  }'
```

**Voice Profiles**
```bash
# List all profiles
curl http://localhost:17493/profiles

# Create profile from audio
curl -X POST http://localhost:17493/profiles \
  -F "audio=@voice-sample.wav" \
  -F "name=My Voice" \
  -F "language=en"

# Get specific profile
curl http://localhost:17493/profiles/{profile_id}

# Export profile
curl http://localhost:17493/profiles/{profile_id}/export \
  --output profile.zip

# Import profile
curl -X POST http://localhost:17493/profiles/import \
  -F "file=@profile.zip"
```

**Generation History**
```bash
# List history with pagination
curl "http://localhost:17493/history?limit=50&offset=0"

# Get specific generation
curl http://localhost:17493/history/{generation_id}

# Export audio
curl http://localhost:17493/history/{generation_id}/export-audio \
  --output generated.wav

# Favorite a generation
curl -X POST http://localhost:17493/history/{generation_id}/favorite
```

**Stories**
```bash
# List stories
curl http://localhost:17493/stories

# Create story
curl -X POST http://localhost:17493/stories \
  -H "Content-Type: application/json" \
  -d '{"title": "My Story"}'

# Add item to story
curl -X POST http://localhost:17493/stories/{story_id}/items \
  -H "Content-Type: application/json" \
  -d '{
    "generation_id": "gen123",
    "start_time": 0.0,
    "duration": 5.0
  }'

# Export story audio
curl http://localhost:17493/stories/{story_id}/export-audio \
  --output story.wav
```

**Model Management**
```bash
# Get model status
curl http://localhost:17493/models/status

# Download model
curl -X POST http://localhost:17493/models/download \
  -H "Content-Type: application/json" \
  -d '{"model_name": "1.7B"}'

# Check download progress
curl http://localhost:17493/models/progress/1.7B

# Load model into memory
curl -X POST http://localhost:17493/models/load \
  -H "Content-Type: application/json" \
  -d '{"model_size": "1.7B"}'

# Unload model
curl -X POST http://localhost:17493/models/unload
```

**Prompt Enhancement**
```bash
# Get enhancer status
curl http://localhost:17493/prompt-enhancer/status

# Load prompt enhancer
curl -X POST http://localhost:17493/prompt-enhancer/load

# Enhance text
curl -X POST http://localhost:17493/prompt-enhancer/enhance \
  -H "Content-Type: application/json" \
  -d '{"text": "hello"}'
```

**Audio Channels**
```bash
# List channels
curl http://localhost:17493/channels

# Create channel
curl -X POST http://localhost:17493/channels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Channel",
    "device_id": "device123"
  }'

# Assign voices to channel
curl -X PUT http://localhost:17493/channels/{channel_id}/voices \
  -H "Content-Type: application/json" \
  -d '{"profile_ids": ["profile1", "profile2"]}'
```

**Transcription**
```bash
# Transcribe audio file
curl -X POST http://localhost:17493/transcribe \
  -F "audio=@recording.wav"
```

### API Documentation

Full interactive API documentation is available at `http://localhost:17493/docs` when the server is running.

### Use Cases

- **Game dialogue systems** - Generate dynamic NPC voices
- **Content creation** - Automated podcast/video voiceovers
- **Accessibility tools** - Text-to-speech for screen readers
- **Voice assistants** - Custom voice personalities
- **Language learning** - Multi-language pronunciation
- **Audiobook production** - Consistent narration voice

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop App | Tauri (Rust) - Native performance, small bundle size |
| Frontend | React, TypeScript, TanStack Router, TanStack Query |
| UI Components | Tailwind CSS, shadcn/ui, Framer Motion |
| State Management | Zustand |
| Backend | FastAPI (Python) - Async with auto-generated OpenAPI |
| TTS Model | Qwen3-TTS (1.7B, 0.6B) |
| Prompt Enhancement | Qwen2.5-3B-Instruct |
| Transcription | Whisper (planned) |
| Database | SQLite |
| Audio Processing | soundfile, numpy, librosa |
| Type Safety | Generated TypeScript client from OpenAPI spec |

**Why this stack?**

- **Tauri over Electron** — 10x smaller bundle, native performance, lower memory usage
- **FastAPI** — Modern async Python with automatic API documentation
- **Qwen3-TTS** — State-of-the-art voice cloning from minimal samples
- **Type-safe end-to-end** — OpenAPI-generated TypeScript ensures frontend/backend compatibility
- **Local-first** — All processing on your machine, no cloud dependency

---

## Roadmap

Voicebox by Maudersoft is under active development. Here's what's planned:

### Planned Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Whisper Transcription** | In Progress | Full integration for audio-to-text |
| **Word-level Timestamps** | Planned | Precise word alignment in timeline editor |
| **Audio Effects** | Planned | Reverb, pitch shift, normalization |
| **XTTS Support** | Planned | Alternative TTS model option |
| **Bark Support** | Planned | Multi-speaker voice synthesis |
| **Real-time Streaming** | Planned | Stream audio as it generates |
| **Voice Effects Studio** | Planned | Advanced voice modulation and effects |
| **Linux Builds** | Blocked | GitHub runner disk space limitations |

### Completed Features

✅ Voice profile management with import/export  
✅ Multi-voice story timeline editor  
✅ Generation history with favorites  
✅ Audio channel routing  
✅ Model management (download, load, unload)  
✅ Prompt enhancement with Qwen2.5  
✅ Remote server support  
✅ Full REST API with OpenAPI docs  
✅ System audio device selection (Tauri)  

---

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup and contribution guidelines.

### Quick Start

```bash
# Clone the repo
git clone https://github.com/daMustermann/voicebox.git
cd voicebox

# Install JavaScript dependencies
npm install

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

# Start development server
npm run dev
```

### Development Mode

The `npm run dev` command starts:
- **Frontend dev server** (Vite) with hot reload
- **Backend server** (FastAPI) with auto-reload
- Both running concurrently

### Project Structure

```
voicebox/
├── app/              # Shared React frontend (used by web & tauri)
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # React hooks
│   │   ├── lib/          # Utilities and API client
│   │   ├── stores/       # Zustand state management
│   │   └── types/        # TypeScript types
│   └── package.json
├── tauri/            # Desktop app (Tauri + Rust)
│   ├── src/          # Frontend entry point
│   └── src-tauri/    # Rust backend
│       ├── src/      # Tauri main process
│       └── Cargo.toml
├── web/              # Web-only deployment
├── backend/          # Python FastAPI server
│   ├── main.py       # API routes
│   ├── tts.py        # TTS engine
│   ├── models.py     # Pydantic models
│   ├── database.py   # SQLite database
│   ├── profiles.py   # Voice profile management
│   ├── stories.py    # Story/timeline logic
│   ├── history.py    # Generation history
│   ├── transcribe.py # Whisper integration
│   ├── prompt_enhancer.py  # AI text enhancement
│   └── utils/        # Helper modules
├── landing/          # Marketing website (Next.js)
├── scripts/          # Build & release automation
└── package.json      # Root workspace config
```

**Prerequisites:** 
- [Node.js 18+](https://nodejs.org)
- [Rust](https://rustup.rs) (for Tauri builds)
- [Python 3.11+](https://python.org)
- CUDA-capable GPU recommended (CPU inference supported but slower)

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Keep commits focused and descriptive
- Ensure all tests pass before submitting PR

## Security

Found a security vulnerability? Please report it responsibly. See [SECURITY.md](SECURITY.md) for details.

**Do not** open public issues for security vulnerabilities.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

**Developed by Maudersoft**

---
