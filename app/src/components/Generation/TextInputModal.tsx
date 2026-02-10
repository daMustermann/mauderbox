import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/stores/uiStore';

interface TextInputModalProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  title?: string;
  description?: string;
}

export function TextInputModal({
  value,
  onChange,
  placeholder = 'Text eingeben...',
  maxLength = 5000,
  title = 'Text bearbeiten',
  description = 'Bearbeiten Sie den Text in der vergrößerten Ansicht.',
}: TextInputModalProps) {
  const textModalOpen = useUIStore((state) => state.textModalOpen);
  const setTextModalOpen = useUIStore((state) => state.setTextModalOpen);

  const charPercentage = (value.length / maxLength) * 100;

  return (
    <Dialog open={textModalOpen} onOpenChange={setTextModalOpen}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-card/95 border border-border/70 shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="h-full resize-none text-base bg-muted/40 border border-border/70 focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Zeichen</span>
            <span className={charPercentage > 90 ? 'text-destructive' : 'text-muted-foreground'}>
              {value.length} / {maxLength}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-muted/60">
            <div
              className={
                charPercentage > 90
                  ? 'h-full rounded-full bg-destructive transition-all duration-300'
                  : 'h-full rounded-full bg-linear-to-r from-primary to-accent transition-all duration-300'
              }
              style={{ width: `${charPercentage}%` }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setTextModalOpen(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ExpandableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  modalTitle?: string;
  modalDescription?: string;
}

export function ExpandableTextarea({
  value,
  onChange,
  placeholder,
  maxLength = 5000,
  className,
  modalTitle,
  modalDescription,
}: ExpandableTextareaProps) {
  const setTextModalOpen = useUIStore((state) => state.setTextModalOpen);

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-60 hover:opacity-100"
        onClick={() => setTextModalOpen(true)}
        title="Vergrößern"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <TextInputModal
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        title={modalTitle}
        description={modalDescription}
      />
    </div>
  );
}
