import { useMatchRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Maximize2, MessageSquare, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { LANGUAGE_OPTIONS } from '@/lib/constants/languages';
import { useGenerationForm } from '@/lib/hooks/useGenerationForm';
import { useProfile, useProfiles } from '@/lib/hooks/useProfiles';
import { useAddStoryItem } from '@/lib/hooks/useStoryItems';
import { useStory } from '@/lib/hooks/useStories';
import { cn } from '@/lib/utils/cn';
import { useStoryStore } from '@/stores/storyStore';
import { useUIStore } from '@/stores/uiStore';
import { TextInputModal } from './TextInputModal';
import { Badge } from '@/components/ui/badge';

const INSTRUCT_PRESETS = [
  { label: "Slow", text: "Speak slowly and clearly." },
  { label: "Warm", text: "Speak in a warm and friendly tone." },
  { label: "Professional", text: "Speak in a professional tone." },
  { label: "Whisper", text: "Whisper." },
];

interface FloatingGenerateBoxProps {
  isPlayerOpen?: boolean;
  showVoiceSelector?: boolean;
}

export function FloatingGenerateBox({
  isPlayerOpen = false,
  showVoiceSelector = false,
}: FloatingGenerateBoxProps) {
  const selectedProfileId = useUIStore((state) => state.selectedProfileId);
  const setSelectedProfileId = useUIStore((state) => state.setSelectedProfileId);
  const setTextModalOpen = useUIStore((state) => state.setTextModalOpen);
  const { data: selectedProfile } = useProfile(selectedProfileId || '');
  const { data: profiles } = useProfiles();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInstructMode, setIsInstructMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const matchRoute = useMatchRoute();
  const isStoriesRoute = matchRoute({ to: '/stories' });
  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const trackEditorHeight = useStoryStore((state) => state.trackEditorHeight);
  const { data: currentStory } = useStory(selectedStoryId);
  const addStoryItem = useAddStoryItem();
  const { toast } = useToast();

  // Calculate if track editor is visible (on stories route with items)
  const hasTrackEditor = isStoriesRoute && currentStory && currentStory.items.length > 0;

  const { form, handleSubmit, isPending } = useGenerationForm({
    onSuccess: async (generationId) => {
      setIsExpanded(false);
      // If on stories route and a story is selected, add generation to story
      if (isStoriesRoute && selectedStoryId && generationId) {
        try {
          await addStoryItem.mutateAsync({
            storyId: selectedStoryId,
            data: { generation_id: generationId },
          });
          toast({
            title: 'Added to story',
            description: `Generation added to "${currentStory?.name || 'story'}"`,
          });
        } catch (error) {
          toast({
            title: 'Failed to add to story',
            description:
              error instanceof Error ? error.message : 'Could not add generation to story',
            variant: 'destructive',
          });
        }
      }
    },
  });

  // Click away handler to collapse the box
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;

      // Don't collapse if clicking inside the container
      if (containerRef.current?.contains(target)) {
        return;
      }

      // Don't collapse if clicking on a Select dropdown (which renders in a portal)
      if (
        target.closest('[role="listbox"]') ||
        target.closest('[data-radix-popper-content-wrapper]')
      ) {
        return;
      }

      setIsExpanded(false);
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, isPlayerOpen]);

  // Set first voice as default if none selected
  useEffect(() => {
    if (!selectedProfileId && profiles && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [selectedProfileId, profiles, setSelectedProfileId]);

  // Auto-resize textarea based on content (only when expanded)
  useEffect(() => {
    if (!isExpanded) {
      // Reset textarea height after collapse animation completes
      const timeoutId = setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = '32px';
          textarea.style.overflowY = 'hidden';
        }
      }, 200); // Wait for animation to complete
      return () => clearTimeout(timeoutId);
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const minHeight = isPlayerOpen ? 72 : 100; // Expanded minimum
      const maxHeight = isPlayerOpen ? 200 : 300; // Max height in pixels
      const targetHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
      textarea.style.height = `${targetHeight}px`;

      // Show scrollbar if content exceeds max height
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    };

    // Small delay to let framer animation complete
    const timeoutId = setTimeout(() => {
      adjustHeight();
    }, 200);

    // Adjust on mount and when value changes
    adjustHeight();

    // Watch for input changes
    textarea.addEventListener('input', adjustHeight);

    return () => {
      clearTimeout(timeoutId);
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [isExpanded]);

  async function onSubmit(data: Parameters<typeof handleSubmit>[0]) {
    await handleSubmit(data, selectedProfileId);
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'fixed right-auto',
        isStoriesRoute
          ? // Position aligned with story list: after sidebar + padding, width 360px
            'left-32 w-90'
          : 'left-32 w-96', // Align with left column when not on stories
      )}
      style={{
        // On stories route: offset by track editor height when visible
        // On other routes: offset by audio player height when visible
        bottom: hasTrackEditor
          ? `${trackEditorHeight + 24}px`
          : isPlayerOpen
            ? '3.5rem' // Reduced vertical offset to sit tighter to player
            : '1.5rem',
      }}
    >
      <motion.div
        className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-4xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] overflow-hidden p-4 ring-1 ring-white/5"
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex gap-2">
              <motion.div
                className="flex-1 flex flex-col gap-2"
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* INSTRUCTION INPUT */}
                <AnimatePresence>
                  {isInstructMode && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
                      exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <FormField
                        control={form.control}
                        name="instruct"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-accent font-medium block">
                                Delivery instructions:
                                </span>
                                <div className="flex gap-1">
                                    {INSTRUCT_PRESETS.map((preset) => (
                                     <Badge
                                        key={preset.label}
                                        variant="outline"
                                        className="text-[10px] px-1 h-5 cursor-pointer hover:bg-accent hover:text-white transition-colors"
                                        onClick={() => {
                                            const current = field.value || "";
                                            const newText = current ? `${current} ${preset.text}` : preset.text;
                                            field.onChange(newText);
                                        }}
                                        >
                                        {preset.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="e.g. Speak slowly, Whisper, Excited tone..."
                                className="resize-none bg-accent/5 border-accent/10 focus:bg-accent/10 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 outline-none ring-0 rounded-xl text-sm placeholder:text-muted-foreground/50 w-full min-h-16"
                                disabled={!selectedProfileId}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* MAIN TEXT INPUT */}
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <motion.div
                            animate={{
                              height: isExpanded ? 'auto' : '32px',
                            }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <Textarea
                              {...field}
                              ref={(node: HTMLTextAreaElement | null) => {
                                // Store ref for auto-resize
                                textareaRef.current = node;
                                // Forward ref to react-hook-form
                                if (typeof field.ref === 'function') {
                                  field.ref(node);
                                }
                              }}
                              placeholder={
                                isStoriesRoute && currentStory
                                  ? `Generate speech for "${currentStory.name}"...`
                                  : selectedProfile
                                    ? `Generate speech using ${selectedProfile.name}...`
                                    : 'Select a voice profile above...'
                              }
                              className="resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 outline-none ring-0 rounded-2xl text-sm placeholder:text-muted-foreground/60 w-full pr-10"
                              style={{
                                minHeight: isExpanded ? '100px' : '32px',
                                maxHeight: '300px',
                              }}
                              disabled={!selectedProfileId}
                              onClick={() => setIsExpanded(true)}
                              onFocus={() => setIsExpanded(true)}
                            />
                          </motion.div>
                          
                          {/* Expand Button for Modal */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-60 hover:opacity-100"
                            onClick={() => setTextModalOpen(true)}
                            title="Text vergrößern"
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                          
                          {/* Text Input Modal for long texts */}
                          <TextInputModal
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Text zum Generieren eingeben..."
                            maxLength={5000}
                            title="Text eingeben"
                            description="Geben Sie hier längere Texte ein. Max. 5000 Zeichen."
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <div className="relative shrink-0">
                <motion.div
                  animate={isPending ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                  transition={{ duration: 0.8, repeat: isPending ? Infinity : 0 }}
                  className="rounded-full"
                >
                  <Button
                    type="submit"
                    disabled={isPending || !selectedProfileId}
                    className={cn(
                      'h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all',
                      isPending && 'bg-primary/80'
                    )}
                    size="icon"
                  >
                    {isPending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        whileHover={{ rotate: 15 }}
                        whileTap={{ scale: 0.9, rotate: -15 }}
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
                
                {/* Subtle glow when generating instead of expanding ring */}
                {isPending && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20 blur-md z-[-1]"
                    initial={{ opacity: 0.5, scale: 0.8 }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-0 right-[calc(100%+0.5rem)]"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsInstructMode(!isInstructMode)}
                        className={`h-10 w-10 rounded-full bg-card border border-border hover:bg-background/50 transition-all duration-200 ${
                          isInstructMode ? 'text-accent' : ''
                        }`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className=" mt-3"
              >
                <div className="flex items-center gap-2">
                  {showVoiceSelector && (
                    <div className="flex-1">
                      <Select
                        value={selectedProfileId || ''}
                        onValueChange={(value) => setSelectedProfileId(value || null)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-card border-border rounded-full hover:bg-background/50 transition-all w-full">
                          <SelectValue placeholder="Select a voice..." />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles?.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id} className="text-xs">
                              {profile.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-0">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs bg-card border-border rounded-full hover:bg-background/50 transition-all">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LANGUAGE_OPTIONS.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value} className="text-xs">
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modelSize"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-0">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs bg-card border-border rounded-full hover:bg-background/50 transition-all">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1.7B" className="text-xs text-muted-foreground">
                              Qwen3-TTS 1.7B
                            </SelectItem>
                            <SelectItem value="0.6B" className="text-xs text-muted-foreground">
                              Qwen3-TTS 0.6B
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </motion.div>
    </motion.div>
  );
}
