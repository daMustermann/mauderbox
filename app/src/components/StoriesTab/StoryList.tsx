import { Plus, BookOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  useStories,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
} from '@/lib/hooks/useStories';
import { useStoryStore } from '@/stores/storyStore';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function StoryList() {
  const { data: stories, isLoading } = useStories();
  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const setSelectedStoryId = useStoryStore((state) => state.setSelectedStoryId);
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [newStoryName, setNewStoryName] = useState('');
  const [newStoryDescription, setNewStoryDescription] = useState('');
  const { toast } = useToast();

  const handleCreateStory = () => {
    if (!newStoryName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a story name',
        variant: 'destructive',
      });
      return;
    }

    createStory.mutate(
      {
        name: newStoryName.trim(),
        description: newStoryDescription.trim() || undefined,
      },
      {
        onSuccess: (story) => {
          setSelectedStoryId(story.id);
          setCreateDialogOpen(false);
          setNewStoryName('');
          setNewStoryDescription('');
          toast({
            title: 'Story created',
            description: `"${story.name}" has been created`,
          });
        },
        onError: (error) => {
          toast({
            title: 'Failed to create story',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleEditClick = (story: { id: string; name: string; description?: string }) => {
    setEditingStory(story);
    setNewStoryName(story.name);
    setNewStoryDescription(story.description || '');
    setEditDialogOpen(true);
  };

  const handleUpdateStory = () => {
    if (!editingStory || !newStoryName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a story name',
        variant: 'destructive',
      });
      return;
    }

    updateStory.mutate(
      {
        storyId: editingStory.id,
        data: {
          name: newStoryName.trim(),
          description: newStoryDescription.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingStory(null);
          setNewStoryName('');
          setNewStoryDescription('');
        },
        onError: (error) => {
          toast({
            title: 'Failed to update story',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleDeleteClick = (storyId: string) => {
    setDeletingStoryId(storyId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingStoryId) return;

    deleteStory.mutate(deletingStoryId, {
      onSuccess: () => {
        // Clear selection if deleting the currently selected story
        if (selectedStoryId === deletingStoryId) {
          setSelectedStoryId(null);
        }
        setDeleteDialogOpen(false);
        setDeletingStoryId(null);
      },
      onError: (error) => {
        toast({
          title: 'Failed to delete story',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground animate-pulse">Loading stories...</div>
      </div>
    );
  }

  const storyList = stories || [];

  return (
    <div className="flex flex-col h-full min-h-0 bg-black/20 backdrop-blur-xl border-r border-white/5">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div>
           <h2 className="text-lg font-bold bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
            Stories
          </h2>
          <p className="text-xs text-muted-foreground">Manage your scripts</p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          size="icon"
          variant="outline"
          className="h-8 w-8 hover:bg-violet-500/20 hover:text-violet-400 hover:border-violet-500/50"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Story List */}
      <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {storyList.length === 0 ? (
              <div className="text-center py-12 px-5 border border-dashed border-white/10 rounded-xl bg-white/5 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No stories yet</p>
                <p className="text-xs mt-1 text-muted-foreground/60">Create one to start writing</p>
              </div>
            ) : (
              storyList.map((story) => (
                <div
                  key={story.id}
                  onClick={() => setSelectedStoryId(story.id)}
                  className={cn(
                    'group relative p-3 rounded-lg border transition-all cursor-pointer',
                    selectedStoryId === story.id 
                       ? 'bg-violet-500/10 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                       : 'bg-card/30 border-transparent hover:bg-card/50 hover:border-white/10'
                  )}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <h3 className={cn("font-medium text-sm truncate", selectedStoryId === story.id ? "text-violet-100" : "text-foreground")}>
                                {story.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate opacity-70">
                                {story.description || "No description"}
                            </p>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                                >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem onClick={() => handleEditClick(story)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                onClick={() => handleDeleteClick(story.id)}
                                className="text-destructive focus:text-destructive"
                                >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground font-mono">
                         <span className={cn("px-1.5 py-0.5 rounded-full bg-white/5", selectedStoryId === story.id && "bg-violet-500/20 text-violet-300")}>
                             {story.item_count} items
                         </span>
                         <span>{formatDate(story.updated_at)}</span>
                    </div>
                </div>
              ))
            )}
          </div>
      </ScrollArea>

      {/* Create Story Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Story</DialogTitle>
            <DialogDescription>
              Start a new conversation or script.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="story-name">Name</Label>
              <Input
                id="story-name"
                placeholder="Story Title"
                value={newStoryName}
                onChange={(e) => setNewStoryName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateStory();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="story-description">Description</Label>
              <Textarea
                id="story-description"
                placeholder="Brief description..."
                value={newStoryDescription}
                onChange={(e) => setNewStoryDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStory} disabled={createStory.isPending}>
              {createStory.isPending ? 'Creating...' : 'Create Story'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Story Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Story Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-story-name">Name</Label>
              <Input
                id="edit-story-name"
                value={newStoryName}
                onChange={(e) => setNewStoryName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateStory();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-story-description">Description</Label>
              <Textarea
                id="edit-story-description"
                value={newStoryDescription}
                onChange={(e) => setNewStoryDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStory} disabled={updateStory.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Story Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The story and all its generated audio arrangements will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deleteStory.isPending}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deleteStory.isPending ? 'Deleting...' : 'Delete Forever'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
