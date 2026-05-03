import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { VolumeX, Flag, Send as SendIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface ChatMessage {
  id: string;
  message: string;
  profile_id: string;
  nickname: string;
  created_at: string;
}

interface ChatTabProps {
  messages: ChatMessage[];
  currentProfileId?: string;
  onSendMessage: (msg: string) => Promise<void>;
}

export function ChatTab({ messages, currentProfileId, onSendMessage }: ChatTabProps) {
  const [chatMuted, setChatMuted] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  
  // Virtualization-light: limit rendered messages to last 50 to prevent DOM bloat
  const renderedMessages = messages.slice(-50);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive, unless user has scrolled up significantly
  useEffect(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    
    if (!isScrolledUp) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!chatInput.trim() || sending) return;
    setSending(true);
    const text = chatInput.trim();
    setChatInput(''); // Optimistic clear
    try {
      await onSendMessage(text);
    } catch (e) {
      // Revert if failed
      setChatInput(text);
    } finally {
      setSending(false);
      // Force scroll to bottom on my own message
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[calc(100vh-220px)]"
    >
      <div className="flex items-center justify-between mb-5 shrink-0">
        <p className="text-[11px] text-muted-foreground/70 font-body font-light italic tracking-wide">
          An open thread for the room. Speak softly.
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setChatMuted(!chatMuted)}
            className={`p-1.5 rounded-full transition-colors ${
              chatMuted ? 'text-bronze' : 'text-muted-foreground/70 hover:text-foreground'
            }`}
          >
            <VolumeX className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded-full text-muted-foreground/70 hover:text-foreground transition-colors">
            <Flag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 mb-4 overflow-y-auto pr-1 overscroll-contain"
      >
        {messages.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="font-display text-base text-foreground/80">The room is quiet.</p>
            <p className="text-xs text-muted-foreground/60 font-body font-light italic">
              Be the first to break the silence.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {messages.length > 50 && (
              <div className="py-2 text-center text-[10px] text-muted-foreground/40 font-body">
                Older messages hidden
              </div>
            )}
            {renderedMessages.map((msg) => {
              const isMe = msg.profile_id === currentProfileId;
              return (
                <div key={msg.id} className="py-3 first:pt-0">
                  <p className="text-sm font-body text-foreground leading-relaxed">
                    <span
                      className={`font-semibold tracking-wide ${
                        isMe ? 'text-bronze' : 'text-foreground'
                      }`}
                    >
                      {isMe ? 'You' : msg.nickname}
                    </span>
                    <span className="text-muted-foreground/50 mx-2">·</span>
                    <span className="text-foreground/90 break-words">{msg.message}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <div ref={chatEndRef} className="h-1" />
      </div>

      <div className="sticky bottom-0 -mx-6 px-6 pt-3 pb-4 bg-gradient-to-t from-background via-background to-background/80 border-t border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Say something to the room..."
            className="bg-secondary/60 border-border/50 flex-1 rounded-full px-5 h-11 font-body text-sm placeholder:text-muted-foreground/50 placeholder:italic focus-visible:ring-bronze/30"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!chatInput.trim() || sending}
            className="h-11 w-11 rounded-full bg-secondary/60 text-muted-foreground hover:text-bronze hover:bg-secondary transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:text-muted-foreground shrink-0"
            aria-label="Send"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
