import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Download, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { useHistory } from '@/lib/hooks/useHistory';
import { useExportStoryAudio, useStory } from '@/lib/hooks/useStories';
import { useAddStoryItem, useRemoveStoryItem, useReorderStoryItems } from '@/lib/hooks/useStoryItems';
import { useStoryPlayback } from '@/lib/hooks/useStoryPlayback';
import { useStoryStore } from '@/stores/storyStore';
import { SortableStoryChatItem } from './StoryChatItem';

export function StoryContent() {
  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const { data: story, isLoading } = useStory(selectedStoryId);
  const removeItem = useRemoveStoryItem();
  const reorderItems = useReorderStoryItems();
  const exportAudio = useExportStoryAudio();
  const addStoryItem = useAddStoryItem();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Add generation popover state
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: historyData } = useHistory();

  // Filter generations not in story and matching search
  const availableGenerations = useMemo(() => {
    if (!historyData?.items || !story) return [];
    const storyGenerationIds = new Set(story.items.map((i) => i.generation_id));
    const query = searchQuery.toLowerCase();
    return historyData.items.filter(
      (gen) =>
        !storyGenerationIds.has(gen.id) &&
        (gen.text.toLowerCase().includes(query) ||
          gen.profile_name.toLowerCase().includes(query)),
    );
  }, [historyData, story, searchQuery]);

  // Get track editor height from store for dynamic padding
  const trackEditorHeight = useStoryStore((state) => state.trackEditorHeight);

  // Track editor is shown when story has items
  const hasBottomBar = story && story.items.length > 0;

  // Calculate dynamic bottom padding: track editor + gap
  const bottomPadding = hasBottomBar ? trackEditorHeight + 24 : 0;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Playback state (for auto-scroll and item highlighting)
  const isPlaying = useStoryStore((state) => state.isPlaying);
  const currentTimeMs = useStoryStore((state) => state.currentTimeMs);
  const playbackStoryId = useStoryStore((state) => state.playbackStoryId);

  // Refs for auto-scrolling to playing item
  const itemRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastScrolledItemRef = useRef<string | null>(null);

  // Use playback hook
  useStoryPlayback(story?.items);

  // Sort items by start_time_ms
  const sortedItems = useMemo(() => {
    if (!story?.items) return [];
    return [...story.items].sort((a, b) => a.start_time_ms - b.start_time_ms);
  }, [story?.items]);

  // Find the currently playing item based on timecode
  const currentlyPlayingItemId = useMemo(() => {
    if (!isPlaying || playbackStoryId !== story?.id || !sortedItems.length) {
      return null;
    }
    const playingItem = sortedItems.find((item) => {
      const itemStart = item.start_time_ms;
      const itemEnd = item.start_time_ms + item.duration * 1000;
      return currentTimeMs >= itemStart && currentTimeMs < itemEnd;
    });
    return playingItem?.generation_id ?? null;
  }, [isPlaying, playbackStoryId, story?.id, sortedItems, currentTimeMs]);

  // Auto-scroll to the currently playing item
  useEffect(() => {
    if (!currentlyPlayingItemId || currentlyPlayingItemId === lastScrolledItemRef.current) {
      return;
    }

    const element = itemRefsMap.current.get(currentlyPlayingItemId);
    if (element && scrollRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      lastScrolledItemRef.current = currentlyPlayingItemId;
    }
  }, [currentlyPlayingItemId]);

  // Reset last scrolled item when playback stops
  useEffect(() => {
    if (!isPlaying) {
      lastScrolledItemRef.current = null;
    }
  }, [isPlaying]);

  const handleRemoveItem = (itemId: string) => {
    if (!story) return;

    removeItem.mutate(
      {
        storyId: story.id,
        itemId,
      },
      {
        onError: (error) => {
          toast({
            title: 'Failed to remove item',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!story || !over || active.id === over.id) return;

    const oldIndex = sortedItems.findIndex((item) => item.generation_id === active.id);
    const newIndex = sortedItems.findIndex((item) => item.generation_id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Calculate the new order
    const newOrder = arrayMove(sortedItems, oldIndex, newIndex);
    const generationIds = newOrder.map((item) => item.generation_id);

    // Send reorder request to backend
    reorderItems.mutate(
      {
        storyId: story.id,
        data: { generation_ids: generationIds },
      },
      {
        onError: (error) => {
          toast({
            title: 'Failed to reorder items',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleExportAudio = () => {
    if (!story) return;

    exportAudio.mutate(
      {
        storyId: story.id,
        storyName: story.name,
      },
      {
        onError: (error) => {
          toast({
            title: 'Failed to export audio',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleAddGeneration = (generationId: string) => {
    if (!story) return;

    addStoryItem.mutate(
      {
        storyId: story.id,
        data: { generation_id: generationId },
      },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          setSearchQuery('');
        },
        onError: (error) => {
          toast({
            title: 'Failed to add generation',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  if (!selectedStoryId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center rounded-xl border border-border/60 bg-card/40 px-6 py-5">
          <p className="text-lg font-medium mb-2">Select a story</p>
          <p className="text-sm">Choose a story from the list to view its content</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading story...</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center rounded-xl border border-border/60 bg-card/40 px-6 py-5">
          <p className="text-lg font-medium mb-2">Story not found</p>
          <p className="text-sm">The selected story could not be loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
             {story.name}
          </h2>
          {story.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{story.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-violet-500/20 hover:text-violet-300">
                <Plus className="mr-2 h-4 w-4" />
                Add Segment
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-black/90 border border-white/10 backdrop-blur-xl shadow-2xl" align="end">
              <div className="p-3 border-b border-white/10">
                <Input
                  placeholder="Search previous generations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="bg-white/5 border-white/10 text-sm focus-visible:ring-violet-500/50"
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {availableGenerations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    {searchQuery
                      ? 'No matching generations found'
                      : 'No available generations'}
                  </div>
                ) : (
                  availableGenerations.map((gen) => (
                    <button
                      key={gen.id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-violet-500/20 rounded-md transition-colors group"
                      onClick={() => handleAddGeneration(gen.id)}
                    >
                      <div className="font-medium text-xs text-violet-200 group-hover:text-white mb-0.5">{gen.profile_name}</div>
                      <div className="text-[10px] text-muted-foreground truncate group-hover:text-violet-200/70">
                        {gen.text.length > 50 ? `${gen.text.substring(0, 50)}...` : gen.text}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          {story.items.length > 0 && (
            <Button
              variant="default" 
              size="sm"
              onClick={handleExportAudio}
              disabled={exportAudio.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white shadow shadow-violet-500/20"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 pb-4"
        style={{ paddingBottom: bottomPadding > 0 ? `${bottomPadding}px` : undefined }}
      >
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5 border border-dashed border-white/10 rounded-xl bg-white/5 text-muted-foreground mt-4">
               <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Plus className="h-5 w-5 opacity-40" />
               </div>
            <p className="text-sm font-medium">Timeline is empty</p>
            <p className="text-xs mt-2 max-w-50 text-center opacity-60">Generate speech below or add from history to build your timeline.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedItems.map((item) => item.generation_id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 pt-2">
                {sortedItems.map((item, index) => (
                  <div
                    key={item.id}
                    ref={(el) => {
                      if (el) {
                        itemRefsMap.current.set(item.generation_id, el);
                      } else {
                        itemRefsMap.current.delete(item.generation_id);
                      }
                    }}
                  >
                    <SortableStoryChatItem
                      item={item}
                      storyId={story.id}
                      index={index}
                      onRemove={() => handleRemoveItem(item.id)}
                      currentTimeMs={currentTimeMs}
                      isPlaying={isPlaying && playbackStoryId === story.id}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
