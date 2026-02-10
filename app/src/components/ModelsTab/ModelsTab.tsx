import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, Cpu, HardDrive, CheckCircle, Activity, Box, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api/client';
import { useModelDownloadToast } from '@/lib/hooks/useModelDownloadToast';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export function ModelsTab() {
  const { data: modelStatus, isLoading } = useQuery({
    queryKey: ['modelStatus'],
    queryFn: () => apiClient.getModelStatus(),
    refetchInterval: 5000,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);

  const downloadMutation = useMutation({
    mutationFn: (modelName: string) => {
      setDownloadingModel(modelName);
      return apiClient.triggerModelDownload(modelName);
    },
    onSuccess: () => {
       setDownloadingModel(null);
       queryClient.invalidateQueries({ queryKey: ['modelStatus'] });
       toast({ title: "Download started" });
    },
    onError: (err) => {
        setDownloadingModel(null);
        toast({ title: "Failed to start download", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
      mutationFn: (modelName: string) => apiClient.deleteModel(modelName),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['modelStatus'] });
          toast({ title: "Model deleted" });
      }
  });

  // Calculate stats
  const installedCount = modelStatus?.models.filter(m => m.downloaded).length || 0;
  const loadedModel = modelStatus?.models.find(m => m.loaded);

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 gap-8">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
              Models & Hardware
            </h1>
            <p className="text-muted-foreground mt-1">Manage local TTS engines and compute resources</p>
          </div>
          
          <div className="flex gap-4">
             <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                 <HardDrive className="h-4 w-4 text-violet-400" />
                 <span className="text-sm font-medium">{installedCount} Installed</span>
             </div>
             {loadedModel && (
                 <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                     <Activity className="h-4 w-4 text-green-400" />
                     <span className="text-sm font-medium text-green-400">Active: {loadedModel.display_name}</span>
                 </div>
             )}
          </div>
       </div>

       <Tabs defaultValue="installed" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full md:w-auto self-start bg-secondary/50 backdrop-blur-lg border-white/5 p-1 rounded-xl mb-6">
             <TabsTrigger value="installed" className="px-6 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white">Installed Models</TabsTrigger>
             <TabsTrigger value="hub" className="px-6 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white">Model Hub</TabsTrigger>
             <TabsTrigger value="hardware" className="px-6 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white">Hardware Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="flex-1 min-h-0 overflow-y-auto">
             <Card className="bg-background/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                   <CardTitle>Local Models</CardTitle>
                   <CardDescription>Models installed on your device</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader>
                         <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead>Model Name</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {modelStatus?.models.filter(m => m.downloaded).map(model => (
                            <TableRow key={model.model_name} className="border-white/5 hover:bg-white/5">
                               <TableCell className="font-medium flex items-center gap-3">
                                  <Box className="h-5 w-5 text-violet-400" />
                                  {model.display_name}
                                  {model.loaded && <Badge className="bg-green-500/20 text-green-400 border-none">Active</Badge>}
                               </TableCell>
                               <TableCell>{model.size_mb ? (model.size_mb / 1024).toFixed(2) + ' GB' : 'Unknown'}</TableCell>
                               <TableCell>
                                  <div className="flex items-center gap-2 text-sm text-green-400">
                                     <CheckCircle className="h-4 w-4" /> Ready
                                  </div>
                               </TableCell>
                               <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                     <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(model.model_name)}>
                                        <Trash2 className="h-4 w-4" />
                                     </Button>
                                  </div>
                               </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="hub" className="flex-1 min-h-0 overflow-y-auto">
             <div className="space-y-8">
                {/* TTS Models */}
                <div>
                   <h3 className="text-lg font-semibold mb-4 text-violet-400">TTS Models</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {modelStatus?.models
                         .filter(m => !m.downloaded && (m.model_name.startsWith('qwen-tts')))
                         .map(model => (
                           <Card key={model.model_name} className="bg-background/40 backdrop-blur-xl border-white/10 flex flex-col">
                              <CardHeader>
                                 <CardTitle className="text-lg">{model.display_name}</CardTitle>
                                 <CardDescription>High quality TTS model</CardDescription>
                              </CardHeader>
                              <CardContent className="flex-1 flex flex-col justify-end gap-4">
                                 <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Size</span>
                                    <span>{model.size_mb ? (model.size_mb / 1024).toFixed(2) + ' GB' : 'Unknown'}</span>
                                 </div>
                                 <Button 
                                    className="w-full bg-violet-600 hover:bg-violet-700" 
                                    disabled={!!downloadingModel} 
                                    onClick={() => downloadMutation.mutate(model.model_name)}
                                 >
                                    {downloadingModel === model.model_name ? (
                                        "Downloading..."
                                    ) : (
                                        <><Download className="h-4 w-4 mr-2" /> Download</>
                                    )}
                                 </Button>
                              </CardContent>
                           </Card>
                      ))}
                   </div>
                </div>

                {/* Transcription Models */}
                <div>
                   <h3 className="text-lg font-semibold mb-4 text-violet-400">Transcription Models</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {modelStatus?.models
                         .filter(m => !m.downloaded && m.model_name.startsWith('whisper'))
                         .map(model => (
                           <Card key={model.model_name} className="bg-background/40 backdrop-blur-xl border-white/10 flex flex-col">
                              <CardHeader>
                                 <CardTitle className="text-lg">{model.display_name}</CardTitle>
                                 <CardDescription>High quality TTS model</CardDescription>
                              </CardHeader>
                              <CardContent className="flex-1 flex flex-col justify-end gap-4">
                                 <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Size</span>
                                    <span>{model.size_mb ? (model.size_mb / 1024).toFixed(2) + ' GB' : 'Unknown'}</span>
                                 </div>
                                 <Button 
                                    className="w-full bg-violet-600 hover:bg-violet-700" 
                                    disabled={!!downloadingModel} 
                                    onClick={() => downloadMutation.mutate(model.model_name)}
                                 >
                                    {downloadingModel === model.model_name ? (
                                        "Downloading..."
                                    ) : (
                                        <><Download className="h-4 w-4 mr-2" /> Download</>
                                    )}
                                 </Button>
                              </CardContent>
                           </Card>
                      ))}
                   </div>
                </div>

                {/* Prompt Enhancement Models */}
                <div>
                   <h3 className="text-lg font-semibold mb-4 text-violet-400">Prompt Enhancement Models</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {modelStatus?.models
                         .filter(m => !m.downloaded && m.model_name === 'prompt-enhancer')
                         .map(model => (
                           <Card key={model.model_name} className="bg-background/40 backdrop-blur-xl border-white/10 flex flex-col">
                              <CardHeader>
                                 <CardTitle className="text-lg">{model.display_name}</CardTitle>
                                 <CardDescription>Enhance prompts for better TTS results</CardDescription>
                              </CardHeader>
                              <CardContent className="flex-1 flex flex-col justify-end gap-4">
                                 <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Size</span>
                                    <span>{model.size_mb ? (model.size_mb / 1024).toFixed(2) + ' GB' : 'Unknown'}</span>
                                 </div>
                                 <Button 
                                    className="w-full bg-violet-600 hover:bg-violet-700" 
                                    disabled={!!downloadingModel} 
                                    onClick={() => downloadMutation.mutate(model.model_name)}
                                 >
                                    {downloadingModel === model.model_name ? (
                                        "Downloading..."
                                    ) : (
                                        <><Download className="h-4 w-4 mr-2" /> Download</>
                                    )}
                                 </Button>
                              </CardContent>
                           </Card>
                      ))}
                   </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="hardware" className="flex-1">
              <Card className="bg-background/40 backdrop-blur-xl border-white/10">
                 <CardHeader>
                    <CardTitle>Hardware Configuration</CardTitle>
                    <CardDescription>Configure compute resources</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Cpu className="h-4 w-4" /> Processor Logic
                            </label>
                            <span className="text-xs text-muted-foreground">Auto-detected</span>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-lg border border-white/5">
                            <div className="flex justify-between mb-2">
                               <span>GPU Acceleration</span>
                               <Badge variant="outline" className="border-green-500/50 text-green-400">Enabled</Badge>
                            </div>
                            <Progress value={0} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">Utilization: 0% (Idle)</p>
                        </div>
                     </div>
                 </CardContent>
              </Card>
          </TabsContent>
       </Tabs>
    </div>
  );
}
