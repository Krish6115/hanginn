import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ANCHORS } from '@/lib/types';

interface AnchorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAnchor: string;
  onAnchorSelect: (anchor: string) => void;
  onSubmit: () => void;
  title?: string;
  description?: string;
  submitText?: string;
}

export function AnchorDialog({
  open,
  onOpenChange,
  selectedAnchor,
  onAnchorSelect,
  onSubmit,
  title = "Where are you sitting?",
  description = "Share your anchor so they can find you.",
  submitText = "Share and connect"
}: AnchorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription className="font-body">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2 mt-2">
          {ANCHORS.map((a) => (
            <button
              key={a}
              onClick={() => onAnchorSelect(a)}
              className={`rounded-full px-4 py-2 text-sm font-body transition-colors ${
                selectedAnchor === a
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <button
          onClick={onSubmit}
          disabled={!selectedAnchor}
          className="w-full mt-4 rounded-xl py-3 text-sm font-body bg-primary/90 text-primary-foreground hover:bg-primary transition-colors disabled:opacity-50"
        >
          {submitText}
        </button>
      </DialogContent>
    </Dialog>
  );
}
