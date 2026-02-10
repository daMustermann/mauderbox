import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Mic, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import type { StoryItemDetail } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { useStoryStore } from '@/stores/storyStore';
import { Card } from '@/components/ui/card';

interface StoryChatItemProps {
  item: StoryItemDetail;
  storyId: string;
  index: number;
  onRemove: () => void;
  currentTimeMs: number;
  isPlaying: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}

export function StoryChatItem({
  item,
  onRemove,
  currentTimeMs,
  isPlaying,
  dragHandleProps,
  isDragging,
}: StoryChatItemProps) {
  const seek = useStoryStore((state) => state.seek);

  // Check if this item is currently playing based on timecode
  const itemStartMs = item.start_time_ms;
  const itemEndMs = item.start_time_ms + item.duration * 1000;
  const isCurrentlyPlaying = isPlaying && currentTimeMs >= itemStartMs && currentTimeMs < itemEndMs;

  const handlePlay = () => {
    // Seek to the start of this item
    seek(itemStartMs);
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
  };

  return (
    <Card
      className={cn(
        'flex items-start gap-3 p-4 transition-all group relative',
        'backdrop-blur-sm bg-black/20', 
        isCurrentlyPlaying 
          ? 'bg-violet-500/10 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
          : 'border-white/5 hover:bg-white/5 hover:border-white/10',
        isDragging && 'opacity-60 shadow-xl z-50',
      )}
    >
      {/* Drag Handle */}
      {dragHandleProps && (
        <button
          type="button"
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/40 hover:text-foreground transition-colors mt-2"
          {...dragHandleProps}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      {/* Voice Icon */}
      <div className="shrink-0 mt-0.5">
        <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
            isCurrentlyPlaying ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "bg-white/5 text-muted-foreground"
        )}>
          <Mic className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("font-medium text-sm", isCurrentlyPlaying ? "text-violet-200" : "text-foreground")}>
              {item.profile_name}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
            {item.language}
          </span>
          <span className="text-xs text-muted-foreground/50 tabular-nums ml-auto font-mono">
            {formatTime(itemStartMs)}
          </span>
        </div>
        <div className="relative group/text">
            <Textarea
            value={item.text}
            className="flex-1 resize-none text-sm text-muted-foreground select-text bg-transparent border-none focus-visible:ring-0 p-0 shadow-none min-h-6"
            readOnly
            onDoubleClick={handlePlay}
            />
            <div className="absolute inset-0 bg-transparent pointer-events-none group-hover/text:bg-white/2 rounded transition-colors" />
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 hover:text-white" aria-label="Actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handlePlay}>
              <Play className="mr-2 h-4 w-4" />
              Play from here
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove from Story
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

// Sortable wrapper component
export function SortableStoryChatItem(props: Omit<StoryChatItemProps, 'dragHandleProps' | 'isDragging'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.generation_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="mb-3">
      <StoryChatItem
        {...props}
        dragHandleProps={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}
