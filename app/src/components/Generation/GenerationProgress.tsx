import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ChevronDown, ChevronUp, Cpu, Waves, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useServerStore } from '@/stores/serverStore';
import { usePlayerStore } from '@/stores/playerStore';
import type { ActiveGenerationTask, HealthResponse } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

function formatPhase(phase: string): string {
  switch (phase) {
    case 'preparing':
      return 'Vorbereitung';
    case 'generating':
      return 'Generiere Audio';
    case 'saving':
      return 'Finalisiere';
    case 'complete':
      return 'Abgeschlossen';
    default:
      return phase;
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

interface GenerationProgressProps {
  task: ActiveGenerationTask;
  isExpanded: boolean;
}

function GenerationProgressItem({ task, isExpanded }: GenerationProgressProps) {
  const elapsed = task.elapsed_seconds ?? 0;
  const estimated = task.estimated_duration_seconds ?? 0;
  const hasEstimate = estimated > 0;
  const progress = hasEstimate ? Math.min((elapsed / estimated) * 100, 99) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-primary/40 blur-md rounded-full animate-pulse" />
            <div className="h-8 w-8 rounded-lg bg-black/60 border border-primary/30 flex items-center justify-center relative z-10">
               <Activity className={cn("h-4 w-4 text-primary", !hasEstimate && "animate-spin")} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                {formatPhase(task.phase)}
                {hasEstimate && (
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono hidden sm:inline-block">
                        {Math.round(progress)}%
                    </span>
                )}
            </div>
            <div className="text-xs text-muted-foreground font-mono truncate">
              {formatDuration(elapsed)}
              {hasEstimate ? ` / ~${formatDuration(estimated)}` : ' elapsed'}
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
        {hasEstimate ? (
            <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary box-shadow-[0_0_10px_theme(colors.primary.DEFAULT)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
            />
        ) : (
            <motion.div 
                className="absolute inset-y-0 left-0 h-full w-1/3 bg-primary/50 rounded-full box-shadow-[0_0_10px_theme(colors.primary.DEFAULT)]"
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
        )}
      </div>
      
      {isExpanded && (
        <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pt-1"
        >
            <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-white/5 p-2 rounded border border-white/5">
                <div className="flex items-center gap-2 truncate max-w-45">
                    <Waves className="h-3 w-3 shrink-0" />
                    <span className="truncate italic">"{task.text_preview}"</span>
                </div>
                <span className="font-mono opacity-70">{task.text_length} chars</span>
            </div>
        </motion.div>
      )}
    </div>
  );
}

function HardwareInfo({ health, minimized }: { health: HealthResponse | null, minimized: boolean }) {
    if (!health || minimized) return null;
    
    const isGPU = health.gpu_available;
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2"
        >
            <div className={cn(
                "p-2 rounded bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center",
                isGPU ? "border-green-500/30 bg-green-500/5" : "border-orange-500/30 bg-orange-500/5"
            )}>
                 <span className="text-[10px] text-muted-foreground font-mono uppercase">Backend</span>
                 <div className="flex items-center gap-1 mt-1">
                    <Zap className={cn("h-3 w-3", isGPU ? "text-green-500" : "text-orange-500")} />
                    <span className={cn("text-xs font-bold", isGPU ? "text-green-400" : "text-orange-400")}>
                        {isGPU ? 'GPU' : 'CPU'}
                    </span>
                 </div>
            </div>
             <div className="p-2 rounded bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center">
                 <span className="text-[10px] text-muted-foreground font-mono uppercase">VRAM</span>
                 <div className="flex items-center gap-1 mt-1">
                    <Cpu className="h-3 w-3 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                        {health.vram_used_mb ? (health.vram_used_mb / 1024).toFixed(1) : '0'}G
                    </span>
                 </div>
            </div>
        </motion.div>
    )
}

export function GenerationProgress() {
  const [tasks, setTasks] = useState<ActiveGenerationTask[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const isConnected = useServerStore((state) => state.isConnected);
  const audioUrl = usePlayerStore((state) => state.audioUrl);
  const isPlayerVisible = !!audioUrl;

  useEffect(() => {
    if (!isConnected) return;
    let isMounted = true;
    const fetchTasks = async () => {
      try {
        const [activeTasksResponse, healthDataResponse] = await Promise.allSettled([
            apiClient.getActiveTasks(),
            apiClient.getHealth()
        ]);

        if (!isMounted) return;

        if (activeTasksResponse.status === 'fulfilled') {
            const activeTasks = activeTasksResponse.value;
            setTasks(activeTasks.generations);
             // Auto expand on new task
            if(activeTasks.generations.length > 0 && tasks.length === 0) {
                setIsExpanded(true);
            }
        } else {
             console.error('Failed to fetch active tasks:', activeTasksResponse.reason);
        }

        if (healthDataResponse.status === 'fulfilled') {
             setHealth(healthDataResponse.value);
        }
      } catch (error) { console.error(error); }
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 1000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [isConnected]);

  // Adjust bottom position if player is open
  const bottomOffset = isPlayerVisible ? "bottom-28" : "bottom-6";

  return (
    <AnimatePresence>
      {tasks.length > 0 && (
        <motion.div
            className={cn("fixed right-6 z-40 flex flex-col items-end pointer-events-none", bottomOffset)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
            <motion.div 
                className="w-[320px] pointer-events-auto bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5"
                layout
            >
                {/* Header / Toggle */}
                <div 
                    className="flex items-center justify-between p-3 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold tracking-wider uppercase text-foreground/90">Processing ({tasks.length})</span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                </div>

                {/* Content */}
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="bg-background/40"
                        >
                            <div className="p-4 space-y-6">
                                {tasks.map((task) => (
                                    <GenerationProgressItem key={task.task_id} task={task} isExpanded={isExpanded} />
                                ))}
                            </div>
                            
                            <HardwareInfo health={health} minimized={!isExpanded} />
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Mini Progress bar when collapsed */}
                {!isExpanded && (
                     <div className="h-1 w-full bg-primary/20">
                        <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }} 
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                     </div>
                )}

            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
