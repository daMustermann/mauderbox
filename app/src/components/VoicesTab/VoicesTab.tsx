import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, MoreHorizontal, Plus, Trash2, Mic, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileCard } from '@/components/VoiceProfiles/ProfileCard';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProfileForm } from '@/components/VoiceProfiles/ProfileForm';
import { apiClient } from '@/lib/api/client';
import type { VoiceProfileResponse } from '@/lib/api/types';
import { BOTTOM_SAFE_AREA_PADDING } from '@/lib/constants/ui';
import { useHistory } from '@/lib/hooks/useHistory';
import { useDeleteProfile, useProfileSamples, useProfiles } from '@/lib/hooks/useProfiles';
import { cn } from '@/lib/utils/cn';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';

export function VoicesTab() {
  const { data: profiles, isLoading } = useProfiles();
  const [searchQuery, setSearchQuery] = useState('');
  const setDialogOpen = useUIStore((state) => state.setProfileDialogOpen);
  const audioUrl = usePlayerStore((state) => state.audioUrl);
  const isPlayerVisible = !!audioUrl;

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    if (!searchQuery) return profiles;
    return profiles.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [profiles, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground animate-pulse">Loading voices...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 md:p-6 gap-8 relative">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
              Voice Library
            </h1>
            <p className="text-muted-foreground mt-1">Manage and clone your voices</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                   placeholder="Search voices..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-9 bg-secondary/50 border-white/10 rounded-xl"
                />
             </div>
             <Button onClick={() => setDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-500/20">
                <Plus className="mr-2 h-4 w-4" /> Add Voice
             </Button>
          </div>
       </div>

       {/* Grid Content */}
       <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-24 px-1",
          isPlayerVisible ? BOTTOM_SAFE_AREA_PADDING : ''
       )}>
          {filteredProfiles.map((profile, i) => (
             <motion.div
               key={profile.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               className="p-0.5"
             >
                <ProfileCard profile={profile} />
             </motion.div>
          ))}

          {filteredProfiles.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-24 text-center opacity-50">
                <Mic className="h-16 w-16 mb-4" />
                <h3 className="text-xl font-medium">No voices found</h3>
                <p>Try adjusting your search or add a new voice.</p>
             </div>
          )}
       </div>

       <ProfileForm />
    </div>
  );
}


