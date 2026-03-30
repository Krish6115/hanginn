import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Briefcase } from 'lucide-react';
import { getCircle } from '@/lib/mockData';

const MyCircle = () => {
  const navigate = useNavigate();
  const circle = getCircle();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-lg text-foreground">My Circle</h2>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        {circle.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-4xl mb-4">🤝</p>
            <p className="text-muted-foreground font-body">No connections yet. Enter a room to start meeting people!</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {circle.map((person, i) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
              >
                {person.photo ? (
                  <img src={person.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground font-display text-lg">
                    {person.nickname[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-body font-semibold text-foreground">{person.nickname}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{person.hometown}</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{person.profession}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Connected {person.connectedAt} at {person.venue}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCircle;
