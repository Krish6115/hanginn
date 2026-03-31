import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROOMS, RoomType } from '@/lib/types';
import { RoomCard } from '@/components/RoomCard';
import { Shield, Eye, EyeOff } from 'lucide-react';

const trustItems = [
  { icon: Shield, text: 'Verified access only' },
  { icon: EyeOff, text: 'Presence without digital footprint' },
  { icon: Eye, text: 'Choose when you\'re visible' },
];

const footerLinks = ['About', 'How it works', 'Safety', 'Terms', 'Blog'];

const Index = () => {
  const navigate = useNavigate();

  const handleSelect = (roomType: RoomType) => {
    navigate(`/rooms/${roomType}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full bg-[hsl(var(--bronze)/0.06)] blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="font-display text-xl tracking-wide text-foreground"
        >
          hanginn
        </motion.span>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          onClick={() => navigate('/circle')}
          className="font-body text-sm font-light text-muted-foreground hover:text-foreground transition-colors duration-500"
        >
          Sign In
        </motion.button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col px-6 pb-12">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-12 mb-16"
        >
          <h1 className="font-display text-[2rem] leading-[1.15] text-foreground tracking-tight">
            Private access to{' '}
            <span className="italic">real-world</span> spaces.
          </h1>
          <p className="mt-4 font-body text-sm font-light leading-relaxed text-muted-foreground max-w-xs">
            A simpler way to connect, right where you are.
          </p>
        </motion.section>

        {/* Room Selection */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mb-20"
        >
          <h2 className="font-display text-lg text-foreground mb-5">
            Where should we take you?
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
            {ROOMS.map((room, i) => (
              <RoomCard key={room.type} room={room} index={i} onClick={() => handleSelect(room.type)} />
            ))}
          </div>
        </motion.section>

        {/* Trust Section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mb-20"
        >
          <h2 className="font-display text-lg text-foreground mb-6">
            Connect when it feels right.
          </h2>
          <ul className="space-y-5">
            {trustItems.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-card">
                  <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="font-body text-sm font-light text-secondary-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
        className="relative z-10 border-t border-border px-6 py-6"
      >
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map((link) => (
            <span key={link} className="font-body text-xs font-light text-muted-foreground/60 cursor-pointer hover:text-muted-foreground transition-colors duration-500">
              {link}
            </span>
          ))}
        </div>
      </motion.footer>
    </div>
  );
};

export default Index;
