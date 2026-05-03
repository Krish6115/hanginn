import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

interface IcebreakerData {
  anchor: string;
  icebreaker: string;
  senderName: string;
}

interface IcebreakerDialogProps {
  icebreakerData: IcebreakerData | null;
  onClose: () => void;
}

export function IcebreakerDialog({ icebreakerData, onClose }: IcebreakerDialogProps) {
  return (
    <AnimatePresence>
      {icebreakerData && (
        <Dialog open={true} onOpenChange={() => onClose()}>
          <DialogContent className="rounded-2xl bg-gradient-to-br from-background to-background/95 border-primary/20 shadow-2xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-4"
            >
              <div className="mx-auto h-16 w-16 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl mb-2">Connection Made</DialogTitle>
                <DialogDescription className="font-body text-base">
                  <span className="font-medium text-foreground">{icebreakerData.senderName}</span> is{' '}
                  {icebreakerData.anchor.toLowerCase()}.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-8 p-6 rounded-xl bg-secondary/50 border border-border/50 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-background text-[10px] uppercase tracking-widest text-muted-foreground font-body">
                  Icebreaker
                </div>
                <p className="font-display text-lg italic text-foreground/90">
                  "{icebreakerData.icebreaker}"
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full mt-8 rounded-xl py-3.5 text-sm font-body bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                Go say hi
              </button>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
