import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileArchive, Heart, MoreHorizontal, Play, Search, Trash2, Edit2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import { BOTTOM_SAFE_AREA_PADDING } from '@/lib/constants/ui';
import {
  useDeleteGeneration,
  useExportGeneration,
  useExportGenerationAudio,
  useHistory,
  useImportGeneration,
  useToggleFavorite,
} from '@/lib/hooks/useHistory';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatDuration } from '@/lib/utils/format';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';

// Animated favorite heart component
const BURST_PARTICLES = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

function AnimatedHeart({ isFavorite, onClick }: { isFavorite: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className="p-1.5 rounded-full hover:bg-muted transition-colors"
      whileTap={{ scale: 0.8 }}
    >
      <motion.div
        animate={isFavorite ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-colors',
            isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'
          )}
        />
      </motion.div>
      {isFavorite && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
        >
          {/* Burst particles on favorite */}
          {BURST_PARTICLES.map((id, i) => (
            <motion.div
              key={id}
              className="absolute w-1 h-1 rounded-full bg-red-400"
              initial={{
                x: 8,
                y: 8,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: 8 + Math.cos((i * 60 * Math.PI) / 180) * 15,
                y: 8 + Math.sin((i * 60 * Math.PI) / 180) * 15,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
          ))}
        </motion.div>
      )}
    </motion.button>
  );
}

// NEW ALTERNATE HISTORY VIEW - FIXED HEIGHT ROWS
interface HistoryTableProps {
  limit?: number;
  profileFilter?: string | null;
  hideSearch?: boolean;
  onEdit?: (generation: any) => void;
}

export function HistoryTable({ limit: propLimit, profileFilter, hideSearch, onEdit }: HistoryTableProps = {}) {
  const [page, _setPage] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const limit = propLimit || 20;
  const { toast } = useToast();

  // Search and favorites filter from UI store
  const historySearch = useUIStore((state) => state.historySearch);
  const setHistorySearch = useUIStore((state) => state.setHistorySearch);
  const showFavoritesOnly = useUIStore((state) => state.showFavoritesOnly);
  const setShowFavoritesOnly = useUIStore((state) => state.setShowFavoritesOnly);

  const { data: historyData, isLoading } = useHistory({
    limit,
    offset: page * limit,
    search: historySearch || undefined,
    favorites_only: showFavoritesOnly,
    profile_id: profileFilter || undefined,
  });

  const deleteGeneration = useDeleteGeneration();
  const exportGeneration = useExportGeneration();
  const exportGenerationAudio = useExportGenerationAudio();
  const importGeneration = useImportGeneration();
  const toggleFavorite = useToggleFavorite();
  const setAudioWithAutoPlay = usePlayerStore((state) => state.setAudioWithAutoPlay);
  const restartCurrentAudio = usePlayerStore((state) => state.restartCurrentAudio);
  const currentAudioId = usePlayerStore((state) => state.audioId);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const audioUrl = usePlayerStore((state) => state.audioUrl);
  const isPlayerVisible = !!audioUrl;

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      setIsScrolled(scrollEl.scrollTop > 0);
    };

    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePlay = (audioId: string, text: string, profileId: string) => {
    // If clicking the same audio, restart it from the beginning
    if (currentAudioId === audioId) {
      restartCurrentAudio();
    } else {
      // Otherwise, load the new audio and auto-play it
      const audioUrl = apiClient.getAudioUrl(audioId);
      setAudioWithAutoPlay(audioUrl, audioId, profileId, text.substring(0, 50));
    }
  };

  const handleDownloadAudio = (generationId: string, text: string) => {
    exportGenerationAudio.mutate(
      { generationId, text },
      {
        onError: (error) => {
          toast({
            title: 'Failed to download audio',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleExportPackage = (generationId: string, text: string) => {
    exportGeneration.mutate(
      { generationId, text },
      {
        onError: (error) => {
          toast({
            title: 'Failed to export generation',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const _handleImportClick = () => {
    file_handleImportClickk.click();
  };

  const _handleFileChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    cons_handleFileChangeet.files?.[0];
    if (file) {
      // Validate file extension
      if (!file.name.endsWith('.voicebox.zip')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a valid .voicebox.zip file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setImportDialogOpen(true);
    }
  };

  const handleImportConfirm = () => {
    if (selectedFile) {
      importGeneration.mutate(selectedFile, {
        onSuccess: (data) => {
          setImportDialogOpen(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          toast({
            title: 'Generation imported',
            description: data.message || 'Generation imported successfully',
          });
        },
        onError: (error) => {
          toast({
            title: 'Failed to import generation',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    }
  };

  if (isLoading) {
    return null;
  }

  const history = historyData?.items || [];
  const total = historyData?.total || 0;
  const _hasMore = history.length === limit && (page + 1) * limit < total;

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {/* Search and filter bar */}
      {!hideSearch && (
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche im Verlauf..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="pl-9 bg-card/60 border-border/70"
          />
        </div>
        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          size="icon"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          aria-label="Nur Favoriten anzeigen"
          className="shrink-0 bg-card/60 border-border/70"
        >
          <Heart className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
        </Button>
      </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-12 px-5 border border-dashed mb-5 border-border/60 rounded-xl bg-card/40 text-muted-foreground flex-1 flex items-center justify-center">
          No voice generations, yet...
        </div>
      ) : (
        <>
          {isScrolled && (
            <div className="absolute top-0 left-0 right-0 h-16 bg-linear-to-b from-background to-transparent z-10 pointer-events-none" />
          )}
          <div
            ref={scrollRef}
            className={cn(
              'flex-1 min-h-0 overflow-y-auto space-y-2 pb-4',
              isPlayerVisible && !hideSearch && BOTTOM_SAFE_AREA_PADDING,
            )}
          >
            <AnimatePresence mode="popLayout">
            {history.map((gen) => {
              const isCurrentlyPlaying = currentAudioId === gen.id && isPlaying;
              
              // Compact mode for sidebar
              if (hideSearch) {
                return (
                  <motion.div
                    key={gen.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      'flex flex-col gap-2 border rounded-lg p-3 bg-card/60 hover:bg-card/80 transition-colors cursor-pointer',
                      isCurrentlyPlaying && 'bg-card/80 border-primary/30 ring-1 ring-primary/10',
                    )}
                    onClick={() => handlePlay(gen.id, gen.text, gen.profile_id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Play className={cn("h-3 w-3 shrink-0", isCurrentlyPlaying && "text-primary")} />
                        <span className="text-xs font-medium truncate">{gen.profile_name}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-1 hover:bg-white/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handlePlay(gen.id, gen.text, gen.profile_id);
                            }}>
                              <Play className="mr-2 h-4 w-4" />
                              Play
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadAudio(gen.id, gen.text);
                            }}>
                              <Download className="mr-2 h-4 w-4" />
                              Export .mp3
                            </DropdownMenuItem>
                            {onEdit && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onEdit(gen);
                              }}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteGeneration.mutate(gen.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {gen.text}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDuration(gen.duration)}</span>
                      <span>•</span>
                      <span>{formatDate(gen.created_at)}</span>
                    </div>
                  </motion.div>
                );
              }
              
              // Full mode for main view
              return (
                <motion.div
                  key={gen.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    'flex items-stretch gap-4 h-26 border rounded-xl p-3 bg-card/60 hover:bg-card/80 transition-colors text-left w-full',
                    isCurrentlyPlaying && 'bg-card/80 border-primary/30 ring-1 ring-primary/10',
                  )}
                  role="button"
                  tabIndex={0}
                  onMouseDown={(e) => {
                    // Don't trigger play if clicking on textarea or if text is selected
                    const target = e.target as HTMLElement;
                    if (target.closest('textarea') || target.closest('button') || window.getSelection()?.toString()) {
                      return;
                    }
                    handlePlay(gen.id, gen.text, gen.profile_id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePlay(gen.id, gen.text, gen.profile_id);
                    }
                  }}
                >
                  {/* Favorite button */}
                  <div className="flex items-center shrink-0 relative">
                    <AnimatedHeart
                      isFavorite={gen.is_favorite ?? false}
                      onClick={() => toggleFavorite.mutate(gen.id)}
                    />
                  </div>

                  {/* Left side - Meta information */}
                  <div className="flex flex-col gap-1.5 w-48 shrink-0 justify-center">
                    <div className="font-medium text-sm truncate" title={gen.profile_name}>
                      {gen.profile_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{gen.language}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(gen.duration)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(gen.created_at)}
                    </div>
                  </div>

                  {/* Right side - Transcript textarea */}
                  <div className="flex-1 min-w-0 flex">
                    <Textarea
                      value={gen.text}
                      readOnly
                      className="flex-1 resize-none text-sm text-muted-foreground select-text"
                    />
                  </div>

                  {/* Far right - Ellipsis actions */}
                  <div className="w-10 shrink-0 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Actions"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleFavorite.mutate(gen.id)}
                          disabled={toggleFavorite.isPending}
                        >
                          <Heart className={cn("mr-2 h-4 w-4", gen.is_favorite && "fill-current text-red-500")} />
                          {gen.is_favorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePlay(gen.id, gen.text, gen.profile_id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Play
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownloadAudio(gen.id, gen.text)}
                          disabled={exportGenerationAudio.isPending}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export Audio
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportPackage(gen.id, gen.text)}
                          disabled={exportGeneration.isPending}
                        >
                          <FileArchive className="mr-2 h-4 w-4" />
                          Export Package
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteGeneration.mutate(gen.id)}
                          disabled={deleteGeneration.isPending}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        </>
      )}

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Generation</DialogTitle>
            <DialogDescription>
              Import the generation from "{selectedFile?.name}". This will add it to your history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportConfirm}
              disabled={importGeneration.isPending || !selectedFile}
            >
              {importGeneration.isPending ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
