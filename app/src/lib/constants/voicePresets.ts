/**
 * Voice delivery presets for Qwen3-TTS
 * These presets provide common voice styles and emotions
 */

export interface VoicePreset {
  id: string;
  label: string;
  instruct: string;
  description: string;
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'neutral',
    label: 'Neutral',
    instruct: '',
    description: 'Natural, balanced voice',
  },
  {
    id: 'excited',
    label: 'Excited',
    instruct: 'speak with excitement and high energy, enthusiastic tone',
    description: 'Energetic and enthusiastic',
  },
  {
    id: 'calm',
    label: 'Calm',
    instruct: 'speak slowly and calmly, relaxed and peaceful tone',
    description: 'Slow, relaxed, peaceful',
  },
  {
    id: 'professional',
    label: 'Professional',
    instruct: 'speak clearly and professionally, confident and authoritative',
    description: 'Clear, confident, authoritative',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    instruct: 'speak in a warm and friendly manner, cheerful and approachable',
    description: 'Warm, cheerful, approachable',
  },
  {
    id: 'serious',
    label: 'Serious',
    instruct: 'speak in a serious and formal tone, grave and important',
    description: 'Formal, grave, important',
  },
  {
    id: 'whisper',
    label: 'Whisper',
    instruct: 'speak very softly in a whisper, quiet and intimate',
    description: 'Soft, quiet, intimate',
  },
  {
    id: 'dramatic',
    label: 'Dramatic',
    instruct: 'speak dramatically with emphasis, theatrical and expressive',
    description: 'Theatrical, expressive',
  },
  {
    id: 'monotone',
    label: 'Monotone',
    instruct: 'speak in a flat monotone voice, minimal emotion',
    description: 'Flat, minimal emotion',
  },
  {
    id: 'fast',
    label: 'Fast',
    instruct: 'speak quickly and energetically, rapid pace',
    description: 'Quick, rapid pace',
  },
  {
    id: 'slow',
    label: 'Slow',
    instruct: 'speak very slowly and deliberately, measured pace',
    description: 'Deliberate, measured pace',
  },
  {
    id: 'custom',
    label: 'Custom',
    instruct: '',
    description: 'Write your own instructions',
  },
];
