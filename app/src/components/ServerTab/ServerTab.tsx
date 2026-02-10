import { ConnectionForm } from '@/components/ServerSettings/ConnectionForm';
import { ServerStatus } from '@/components/ServerSettings/ServerStatus';
import { UpdateStatus } from '@/components/ServerSettings/UpdateStatus';
import { isTauri } from '@/lib/tauri';
import { useServerHealth } from '@/lib/hooks/useServer';
import { useServerStore } from '@/stores/serverStore';
import { Activity, Cpu, HardDrive, Terminal, Power, RefreshCw, FolderOpen, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';

export function ServerTab() {
  const { data: health } = useServerHealth();
  const serverUrl = useServerStore((state) => state.serverUrl);
  
  // Mock data for graphs if real data isn't available
  const gpuUsage = health?.vram_used_mb ? (health.vram_used_mb / 24000) * 100 : 0; // Assuming 24GB VRAM for demo
  
  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-6 gap-6">
       {/* Header */}
       <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
            System Status
          </h1>
          <p className="text-muted-foreground mt-1">Real-time telemetry and logs</p>
       </div>

       {/* Telemetry Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           
           <TelemetryCard 
              title="GPU VRAM"
              value={health?.vram_used_mb ? `${(health.vram_used_mb / 1024).toFixed(1)} GB` : "0 GB"}
              icon={Zap}
              color="text-yellow-400"
              subValue={health?.gpu_available ? "Acceleration Active" : "No GPU Detected"}
           />
           
           <TelemetryCard 
              title="Model Status"
              value={health?.model_loaded ? "Loaded" : "Idle"}
              icon={Activity}
              color={health?.model_loaded ? "text-green-400" : "text-muted-foreground"}
              subValue={health?.model_size || "No model"}
           />

           <TelemetryCard 
              title="CPU Load"
              value="--" 
              icon={Cpu}
              color="text-blue-400"
              subValue="Auto-managed"
           />

            <TelemetryCard 
              title="System RAM"
              value="--" 
              icon={HardDrive}
              color="text-purple-400"
              subValue="Auto-managed"
           />
       </div>

       {/* Main Content: Logs & Controls */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
           
           {/* Logs Console */}
           <Card className="lg:col-span-2 bg-black/40 border-white/10 backdrop-blur-xl flex flex-col min-h-75">
               <CardHeader className="py-3 px-4 border-b border-white/5 flex flex-row items-center justify-between">
                   <div className="flex items-center gap-2">
                       <Terminal className="h-4 w-4 text-muted-foreground" />
                       <span className="font-mono text-sm">Server Logs</span>
                   </div>
                   <div className="flex gap-2">
                       <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/10">INFO</Badge>
                       <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400 bg-yellow-500/10">WARN</Badge>
                   </div>
               </CardHeader>
               <ScrollArea className="flex-1 p-4 font-mono text-xs md:text-sm text-muted-foreground">
                   <div className="space-y-1">
                       <p><span className="text-green-400">[INFO]</span> Server started at {serverUrl}</p>
                       <p><span className="text-green-400">[INFO]</span> Backend initialized successfully</p>
                       {health?.model_loaded && <p><span className="text-blue-400">[LOAD]</span> Model loaded to device: cuda</p>}
                       <p className="opacity-50">Watching for requests...</p>
                   </div>
               </ScrollArea>
           </Card>

           {/* Controls Panel */}
           <div className="space-y-6">
                <Card className="bg-secondary/20 border-white/10">
                    <CardHeader>
                        <CardTitle>Server Control</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/5">
                            <span className="text-sm font-medium">Status</span>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2.5 w-2.5 rounded-full animate-pulse", health ? "bg-green-500" : "bg-red-500")} />
                                <span className={cn("text-sm", health ? "text-green-400" : "text-red-400")}>
                                    {health ? "Online" : "Offline"}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-2">
                             <Button variant="outline" className="justify-start gap-2 hover:bg-white/5" disabled>
                                 <RefreshCw className="h-4 w-4" /> Restart Server
                             </Button>
                             <Button variant="outline" className="justify-start gap-2 hover:bg-destructive/10 text-destructive hover:text-destructive" disabled>
                                 <Power className="h-4 w-4" /> Stop Server
                             </Button>
                             <Button variant="ghost" className="justify-start gap-2 text-muted-foreground">
                                 <FolderOpen className="h-4 w-4" /> Open Logs Folder
                             </Button>
                        </div>
                    </CardContent>
                </Card>

                <ConnectionForm />
           </div>
       </div>
    </div>
  );
}

function TelemetryCard({ title, value, icon: Icon, color, subValue }: any) {
    return (
        <Card className="bg-background/40 backdrop-blur-xl border-white/10 relative overflow-hidden group">
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500", color.replace('text-', 'bg-'))} />
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-2 rounded-lg bg-background/50", color)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {/* Tiny Sparkline Placeholder */}
                    <div className="h-8 w-16 bg-white/5 rounded flex items-end gap-0.5 p-1 overflow-hidden opacity-50">
                          {[40,60,30,80,50,70,90].map((h, i) => (
                              <div key={i} className={cn("flex-1 rounded-t-sm", color.replace('text-', 'bg-'))} style={{ height: `${h}%` }} />
                          ))}
                    </div>
                </div>
                <div>
                   <div className="text-2xl font-bold tracking-tight">{value}</div>
                   <div className="text-xs text-muted-foreground mt-1">{title}</div>
                   {subValue && <div className="text-xs font-medium opacity-70 mt-2">{subValue}</div>}
                </div>
            </CardContent>
        </Card>
    )
}
