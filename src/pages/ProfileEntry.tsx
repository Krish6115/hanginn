import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AGE_BANDS, INTENTS, RoomType } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';

type Step = 'details' | 'intent';

const ProfileEntry = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venue') || '';
  const navigate = useNavigate();
  const { upsertProfile, currentProfile, saveSessionState } = useHanginnStore();
  const intents = INTENTS[roomType as RoomType] || [];

  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState({
    nickname: currentProfile?.nickname || '',
    ageBand: currentProfile?.age_band || '',
    intent: '',
    vibe: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // If profile already exists in localStorage / store, jump straight to intent
  useEffect(() => {
    if (currentProfile?.nickname && currentProfile?.age_band) {
      setStep('intent');
      setForm((f) => ({
        ...f,
        nickname: currentProfile.nickname,
        ageBand: currentProfile.age_band,
      }));
    }
  }, [currentProfile]);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleDetailsNext = () => {
    if (form.nickname && form.ageBand) setStep('intent');
  };

  const handleSubmit = async () => {
    if (!form.intent || submitting) return;
    setSubmitting(true);
    try {
      await upsertProfile('', {
        nickname: form.nickname,
        age_band: form.ageBand,
      });
      saveSessionState({ roomType: roomType!, venueId, step: 'room', intent: form.intent, vibe: form.vibe });
      navigate(`/rooms/${roomType}/live?venue=${venueId}&intent=${encodeURIComponent(form.intent)}&vibe=${encodeURIComponent(form.vibe)}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-lg text-foreground">Step in</h2>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div>
            <p className="font-display text-base text-foreground leading-relaxed">
              Just enough to help you feel comfortable here.
            </p>
            <p className="text-sm text-muted-foreground mt-1 font-body font-light">
              Your details stay private.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'details' && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Nickname</Label>
                  <Input
                    placeholder="What should people call you?"
                    value={form.nickname}
                    onChange={(e) => update('nickname', e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Age band</Label>
                  <div className="flex flex-wrap gap-2">
                    {AGE_BANDS.map((band) => (
                      <button
                        key={band}
                        onClick={() => update('ageBand', band)}
                        className={`rounded-full px-4 py-1.5 text-sm font-body transition-all duration-300 ${
                          form.ageBand === band
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {band}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleDetailsNext}
                  disabled={!form.nickname || !form.ageBand}
                  className={`w-full rounded-2xl py-4 text-sm font-body font-medium tracking-wide transition-all duration-500 ${
                    form.nickname && form.ageBand
                      ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
                      : 'bg-secondary text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 'intent' && (
              <motion.div key="intent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="space-y-3">
                  <div>
                    <p className="font-display text-base text-foreground">Right now, I'm here to...</p>
                    <p className="text-xs text-muted-foreground mt-1 font-body font-light">
                      We bring people together based on common intent.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {intents.map((intent) => (
                      <button
                        key={intent}
                        onClick={() => update('intent', intent)}
                        className={`rounded-full px-5 py-2 text-sm font-body transition-all duration-300 ${
                          form.intent === intent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {intent}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Add your vibe (optional)</Label>
                  <Input
                    placeholder="A short note about your energy right now"
                    value={form.vibe}
                    onChange={(e) => update('vibe', e.target.value.slice(0, 60))}
                    maxLength={60}
                    className="bg-secondary border-border"
                  />
                  <p className="text-[10px] text-muted-foreground/60 mt-1 text-right font-body">{form.vibe.length}/60</p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground/60 font-body font-light text-center">
                    This space is shaped by the people inside it.
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={!form.intent || submitting}
                    className={`w-full rounded-2xl py-4 text-sm font-body font-medium tracking-wide transition-all duration-500 ${
                      form.intent && !submitting
                        ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
                        : 'bg-secondary text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {submitting ? 'Entering...' : 'Step inside'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfileEntry;
