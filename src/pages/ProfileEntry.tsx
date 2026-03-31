import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AGE_BANDS, INTENTS, RoomType } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';

const TransitDetails = ({ details, onChange }: {
  details: { destination: string; flightTime: string; travelWindow: string; ticket: string };
  onChange: (d: any) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    className="space-y-3 overflow-hidden"
  >
    <p className="text-xs text-muted-foreground font-body">Share travel details (optional)</p>
    <Input
      placeholder="Destination"
      value={details.destination}
      onChange={(e) => onChange({ ...details, destination: e.target.value })}
      className="bg-secondary border-border"
    />
    <div className="flex gap-2">
      <Input
        placeholder="Flight time"
        value={details.flightTime}
        onChange={(e) => onChange({ ...details, flightTime: e.target.value })}
        className="bg-secondary border-border flex-1"
      />
      <Input
        placeholder="Window"
        value={details.travelWindow}
        onChange={(e) => onChange({ ...details, travelWindow: e.target.value })}
        className="bg-secondary border-border flex-1"
      />
    </div>
    <Input
      placeholder="Ticket or booking ref (optional)"
      value={details.ticket}
      onChange={(e) => onChange({ ...details, ticket: e.target.value })}
      className="bg-secondary border-border"
    />
  </motion.div>
);

const ProfileEntry = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venue') || '';
  const navigate = useNavigate();
  const { loginWithPhone, currentProfile } = useHanginnStore();
  const intents = INTENTS[roomType as RoomType] || [];

  const [form, setForm] = useState({
    phone: currentProfile?.phone || '',
    nickname: currentProfile?.nickname || '',
    ageBand: currentProfile?.age_band || '',
    intent: '',
    vibe: '',
  });
  const [showTransit, setShowTransit] = useState(false);
  const [transitDetails, setTransitDetails] = useState({ destination: '', flightTime: '', travelWindow: '', ticket: '' });
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const canSubmit = form.phone && form.nickname && form.ageBand && form.intent;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await loginWithPhone(form.phone, {
        nickname: form.nickname,
        age_band: form.ageBand,
        hometown: '',
        profession: '',
        gender_preference: 'all',
      });
      // Navigate to digital room with intent as rhythm
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

          <div className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Phone number</Label>
              <Input
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

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
          </div>

          {/* Intent selection */}
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

          {/* Transit details */}
          {roomType === 'transit' && form.intent && (
            <div>
              <button
                onClick={() => setShowTransit(!showTransit)}
                className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors underline underline-offset-4 decoration-border"
              >
                {showTransit ? 'Hide travel details' : 'Add travel details'}
              </button>
              <AnimatePresence>
                {showTransit && (
                  <div className="mt-3">
                    <TransitDetails details={transitDetails} onChange={setTransitDetails} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Vibe */}
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

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`w-full rounded-2xl py-4 text-sm font-body font-medium tracking-wide transition-all duration-500 ${
              canSubmit && !submitting
                ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
          >
            {submitting ? 'Entering...' : 'Step inside'}
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfileEntry;
