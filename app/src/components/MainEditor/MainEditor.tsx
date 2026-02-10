import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Upload, Wand2, Play, Mic, Plus, History } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils/cn';
import { useProfiles, useProfile, useImportProfile } from '@/lib/hooks/useProfiles';
import { useUIStore } from '@/stores/uiStore';
import { useGenerationForm } from '@/lib/hooks/useGenerationForm';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { HistoryTable } from '@/components/History/HistoryTable';
import { VOICE_PRESETS } from '@/lib/constants/voicePresets';
import { LANGUAGE_OPTIONS } from '@/lib/constants/languages';
import { GenerationProgress } from '@/components/Generation/GenerationProgress';
import { useGenerationStore } from '@/stores/generationStore';
import { apiClient } from '@/lib/api/client';

export function MainEditor() {
  const { data: profiles } = useProfiles();
  const selectedProfileId = useUIStore((state) => state.selectedProfileId);
  const setSelectedProfileId = useUIStore((state) => state.setSelectedProfileId);
  const setProfileDialogOpen = useUIStore((state) => state.setProfileDialogOpen);
  const { data: selectedProfile } = useProfile(selectedProfileId || '');
  
  const [selectedPreset, setSelectedPreset] = useState('neutral');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importProfile = useImportProfile();
  const { toast } = useToast();
  const isGenerating = useGenerationStore((state) => state.isGenerating);

  const { form, handleSubmit, isPending } = useGenerationForm();

  const handleEnhance = async () => {
    const currentText = form.getValues('text');
    const currentLanguage = form.getValues('language') || 'en';
    
    if (!currentText || currentText.trim().length === 0) {
      toast({
        title: 'No text to enhance',
        description: 'Please enter some text first.',
        variant: 'destructive',
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const result = await apiClient.enhancePrompt({
        text: currentText,
        language: currentLanguage,
        temperature: 0.7,
        max_tokens: 150,
      });

      form.setValue('text', result.enhanced);
      toast({
        title: '✨ Text enhanced!',
        description: 'Your prompt has been improved.',
      });
    } catch (error) {
      console.error('Enhancement failed:', error);
      toast({
        title: 'Enhancement failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleEdit = (gen: any) => {
    form.setValue('text', gen.text);
    if (gen.language) form.setValue('language', gen.language);
    if (gen.instruct) form.setValue('instruct', gen.instruct);
    if (gen.profile_id) setSelectedProfileId(gen.profile_id);
    if (gen.seed !== undefined && gen.seed !== null) form.setValue('seed', gen.seed);
    // Note: modelSize is not stored in history, so we keep the current one
    
    toast({
      title: "Loaded settings",
      description: "Text and settings loaded from history.",
    });
  };

  const onSubmit = form.handleSubmit((data) => {
    handleSubmit(data, selectedProfileId);
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.voicebox.zip')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a valid .voicebox.zip file',
          variant: 'destructive',
        });
        return;
      }
      importProfile.mutate(file);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-8 gap-8">
      {/* Header & Voice Selection */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
            Voicebox
          </h1>
          <p className="text-muted-foreground mt-1">Generate lifelike speech</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select 
            value={selectedProfileId || ''} 
            onValueChange={setSelectedProfileId}
          >
            <SelectTrigger className="w-full md:w-70 h-12 bg-secondary/50 backdrop-blur-sm border-white/10 rounded-xl focus:ring-violet-500/50">
              <div className="flex items-center gap-3">
                {selectedProfile ? (
                  <>
                     <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">
                        {selectedProfile.name[0]}
                     </div>
                     <span className="font-medium truncate">{selectedProfile.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select Voice Model...</span>
                )}
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-75">
              {profiles?.map((profile) => (
                <SelectItem key={profile.id} value={profile.id} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{profile.name}</span>
                    {/* Add tags here if available */}
                  </div>
                </SelectItem>
              ))}
              <div className="p-2 border-t mt-1">
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      setProfileDialogOpen(true);
                    }}
                 >
                    <Plus className="mr-2 h-4 w-4" /> Create New Voice
                 </Button>
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      handleImportClick();
                    }}
                 >
                    <Upload className="mr-2 h-4 w-4" /> Import Voice
                 </Button>
              </div>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-h-0 flex gap-4 overflow-hidden"
      >
        {/* Left: Editor Card */}
        <div className="flex-1 min-w-0 relative group">
          <div className="absolute -inset-0.5 bg-linear-to-r from-violet-600 to-indigo-600 rounded-3xl opacity-20 group-hover:opacity-40 transition duration-500 blur-lg" />
          
          <div className="relative h-full bg-background/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <Form {...form}>
              <form onSubmit={onSubmit} className="flex-1 flex flex-col gap-4">
                
                {/* Text Area */}
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="text-xs text-muted-foreground">Your Text</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleEnhance}
                          disabled={isEnhancing || !field.value}
                          className="h-7 text-xs gap-1.5 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                        >
                          {isEnhancing ? (
                            <>
                              <Sparkles className="h-3.5 w-3.5 animate-spin" />
                              Enhancing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              Enhance
                            </>
                          )}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Type something amazing here..." 
                          className="flex-1 resize-none bg-transparent border-none focus-visible:ring-0 text-lg md:text-xl p-4 leading-relaxed placeholder:text-muted-foreground/30 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bottom Controls */}
                <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                    
                    {/* Settings Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Voice Preset */}
                      <FormField
                        control={form.control}
                        name="instruct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground">Voice Style</FormLabel>
                            <Select 
                              value={selectedPreset} 
                              onValueChange={(value) => {
                                setSelectedPreset(value);
                                const preset = VOICE_PRESETS.find(p => p.id === value);
                                if (preset && value !== 'custom') {
                                  field.onChange(preset.instruct);
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9 bg-secondary/50">
                                  <SelectValue>
                                    {VOICE_PRESETS.find(p => p.id === selectedPreset)?.label || 'Select style'}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {VOICE_PRESETS.map((preset) => (
                                  <SelectItem key={preset.id} value={preset.id}>
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium text-sm">{preset.label}</span>
                                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Model Size */}
                      <FormField
                        control={form.control}
                        name="modelSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground">Model</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || '1.7B'}>
                              <FormControl>
                                <SelectTrigger className="h-9 bg-secondary/50">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1.7B">1.7B (Quality)</SelectItem>
                                <SelectItem value="0.6B">0.6B (Fast)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Language */}
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground">Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9 bg-secondary/50">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-100">
                                {LANGUAGE_OPTIONS.map((lang) => (
                                  <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Custom Instructions (only shown when Custom preset selected) */}
                    {selectedPreset === 'custom' && (
                      <FormField
                        control={form.control}
                        name="instruct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground">Custom Instructions</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field}
                                placeholder="e.g., 'speak slowly and clearly', 'excited and energetic'..."
                                className="resize-none bg-secondary/50 h-16 text-sm"
                                maxLength={500}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Generation Progress */}
                    {isGenerating && (
                      <div className="-mx-2 -mb-2 mt-2">
                        <GenerationProgress />
                      </div>
                    )}

                    {/* Generate Button Row */}
                    <div className="flex items-center gap-4 justify-between pt-2">
                         <span className="text-xs text-muted-foreground hidden md:block">
                            {form.watch('text').length} / 5000 chars
                         </span>
                         <Button 
                            type="submit" 
                            disabled={!selectedProfileId || isPending}
                            className={cn(
                                "h-12 px-8 rounded-xl font-bold text-md transition-all duration-300 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]",
                                isPending ? "bg-secondary text-secondary-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground bg-linear-to-r from-violet-600 to-indigo-600"
                            )}
                         >
                            {isPending ? (
                              <>
                                <Sparkles className="mr-2 h-4 w-4 animate-spin" /> Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-5 w-5" /> Generate Speech
                              </>
                            )}
                         </Button>
                    </div>
                </div>

              </form>
            </Form>
          </div>
        </div>

        {/* Right: Generation History */}
        <div className="w-96 min-w-96 flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Recent Generations</span>
          </div>
          <div className="flex-1 min-h-0 bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-hidden">
            <HistoryTable 
              limit={10} 
              profileFilter={selectedProfileId} 
              hideSearch={true} 
              onEdit={handleEdit}
            />
          </div>
        </div>
      </motion.div>
      
      {/* Hidden File Input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".voicebox.zip"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
