# Changelog

All notable changes to Mauderbox will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2026-02-10

### Added
- **Auto-Update UI Component** - New UI in Server tab for one-click updates
- **Auto-Update System** - Automatic update checking and installation
- **Update Notifications** - Visual alerts when new versions are available
- **Download Progress** - Real-time progress bar during update downloads
- **GitHub Releases Integration** - Automatic release creation via GitHub Actions

### Changed
- **Project Renamed** - Voicebox is now **Mauderbox**
- **Repository Moved** - New repository at https://github.com/daMustermann/mauderbox
- **Complete Privacy** - Separated from upstream, fully independent project
- **Documentation Updated** - New README with comprehensive feature list and ROCm compatibility details

### Fixed
- **TaskManager Initialization** - Fixed `_generation_stats` missing attribute error
- **Generation Completion** - Fixed `actual_duration_seconds` parameter handling
- **Backend Synchronization** - Tauri backend-pkg now properly synced with main backend

### Technical
- Added `tauri-plugin-updater` and `tauri-plugin-process` to dependencies
- Configured signing keys for secure update distribution
- GitHub Actions workflow updated for automated releases
- Added Alert UI component for notifications

## [0.2.2] - 2026-02-10

### Fixed
- Fixed generation completion errors
- Synchronized backend utilities between main and Tauri packages

## [0.2.1] - 2026-02-10

### Fixed
- Initial bug fixes and stability improvements

## [0.2.0] - 2026-02-10

### Added
- Initial release of Mauderbox (formerly Voicebox fork)
- Voice cloning with Qwen3-TTS models (1.7B and 0.6B)
- Voice profile management system
- Audio generation history
- In-app audio recording
- Whisper-based transcription
- Desktop app with Tauri v2
- Full REST API with OpenAPI docs

### Technical
- Built with Tauri (Rust + React)
- FastAPI backend with async Python
- TypeScript frontend with React Query and Zustand
- SQLite database for local persistence
- GPU acceleration (CUDA, ROCm, MPS)

---

## [Unreleased]

### Planned
- Real-time streaming synthesis
- Conversation mode with multiple speakers
- Voice effects (pitch shift, reverb, M3GAN-style)
- Timeline-based audio editor
- Additional voice models (XTTS, Bark)
- Voice design from text descriptions
- Project system for saving sessions
- Plugin architecture

---

[0.1.0]: https://github.com/jamiepine/voicebox/releases/tag/v0.1.0
