import type { TranscriptionResponse } from '@/lib/api/types';

interface TranscriptionHeatmapProps {
  words: NonNullable<TranscriptionResponse['words']>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function TranscriptionHeatmap({ words }: TranscriptionHeatmapProps) {
  if (!words.length) {
    return null;
  }

  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Transkript-Confidence
      </div>
      <div className="flex flex-wrap gap-x-1 gap-y-1">
        {words.map((wordItem, index) => {
          const confidence = clamp(wordItem.confidence, 0, 1);
          const hue = confidence * 120;
          const background = `hsl(${hue} 70% 45% / 0.2)`;
          const color = `hsl(${hue} 70% 35%)`;

          return (
            <span
              key={`${wordItem.word}-${index}`}
              className="rounded px-1 py-0.5"
              style={{ backgroundColor: background, color }}
              title={`${Math.round(confidence * 100)}%`}
            >
              {wordItem.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
