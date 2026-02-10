import { Loader2, XCircle, Activity, Zap, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServerHealth } from '@/lib/hooks/useServer';
import { MODEL_DISPLAY_NAMES } from '@/lib/hooks/useRestoreActiveTasks';
import { useActiveTasksStore } from '@/stores/activeTasksStore';
import { useServerStore } from '@/stores/serverStore';
import { useGenerationStore } from '@/stores/generationStore';
import { ModelProgress } from './ModelProgress';
import { cn } from '@/lib/utils/cn';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import type { ActiveGenerationTask } from '@/lib/api/types';

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

export function ServerStatus() {
  const { data: health, isLoading, error } = useServerHealth();
  const serverUrl = useServerStore((state) => state.serverUrl);
  const activeDownloads = useActiveTasksStore((state) => state.activeDownloads);
  const isGenerating = useGenerationStore((state) => state.isGenerating);
  
  const [generationTasks, setGenerationTasks] = useState<ActiveGenerationTask[]>([]);
  
  // Poll for active generation tasks when generating
  useEffect(() => {
    if (!isGenerating) {
      setGenerationTasks([]);
      return;
    }
    
    const fetchTasks = async () => {
      try {
        const tasks = await apiClient.getActiveTasks();
        setGenerationTasks(tasks.generations);
      } catch (error) {
        console.error('Failed to fetch generation tasks:', error);
      }
    };
    
    fetchTasks();
    const interval = setInterval(fetchTasks, 1000); // Poll every second during generation
    
    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Server URL</div>
          <div className="font-mono text-sm">{serverUrl}</div>
        </div>

        {/* Active generation progress */}
        {generationTasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Active Generation</div>
            {generationTasks.map((task) => {
              const elapsed = task.elapsed_seconds ?? 0;
              const estimated = task.estimated_duration_seconds ?? 0;
              const hasEstimate = estimated > 0;
              const progress = hasEstimate ? Math.min((elapsed / estimated) * 100, 99) : 0;
              
              return (
                <div key={task.task_id} className="p-3 rounded-lg bg-secondary/50 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className={cn("h-4 w-4 text-primary", !hasEstimate && "animate-spin")} />
                      <span className="text-sm font-medium">{formatPhase(task.phase)}</span>
                      {hasEstimate && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {Math.round(progress)}%
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDuration(elapsed)}
                      {hasEstimate && ` / ~${formatDuration(estimated)}`}
                    </span>
                  </div>
                  
                  <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
                    {hasEstimate ? (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    ) : (
                      <div className="absolute inset-y-0 left-0 h-full w-1/3 bg-primary/50 rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground italic truncate">
                    "{task.text_preview}"
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Model download progress */}
        <div className="space-y-2">
          {activeDownloads.map((download) => (
            <ModelProgress
              key={download.model_name}
              modelName={download.model_name}
              displayName={MODEL_DISPLAY_NAMES[download.model_name] ?? download.model_name}
              enabled
            />
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking connection...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">Connection failed: {error.message}</span>
          </div>
        ) : health ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Connected</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={health.model_loaded || health.model_downloaded ? 'default' : 'secondary'}
              >
                {health.model_loaded || health.model_downloaded ? 'Model Ready' : 'No Model'}
              </Badge>
              <Badge variant={health.gpu_available ? 'default' : 'secondary'}>
                <Zap className={cn("h-3 w-3 mr-1", health.gpu_available ? "text-green-500" : "text-orange-500")} />
                {health.gpu_available ? 'GPU' : 'CPU'}
              </Badge>
              {health.vram_used_mb && (
                <Badge variant="outline">
                  <Cpu className="h-3 w-3 mr-1" />
                  VRAM: {(health.vram_used_mb / 1024).toFixed(1)} GB
                </Badge>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
