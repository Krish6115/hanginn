import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AGE_BANDS, INTENTS, RoomType } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';

type Step = 'email' | 'otp' | 'details' | 'intent';

const ProfileEntry = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venue') || '';
  const navigate = useNavigate();
  const { sendEmailOtp, verifyEmailOtp, upsertProfile, currentProfile, authUser, saveSessionState } = useHanginnStore();
  const intents = INTENTS[roomType as RoomType] || [];

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({
    nickname: currentProfile?.nickname || '',
    ageBand: currentProfile?.age_band || '',
    intent: '',
    vibe: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authUser && currentProfile) {
      setStep('intent');
      setForm((f) => ({
        ...f,
        nickname: currentProfile.nickname || f.nickname,
        ageBand: currentProfile.age_band || f.ageBand,
      }));
    } else if (authUser) {
      setStep('details');
      setEmail(authUser.email || '');
    }
  }, [authUser, currentProfile]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSendOtp = async () => {
    if (!email || otpSending) return;
    setOtpSending(true);
    setOtpError('');
    setOtp('');
    try {
      await sendEmailOtp(email);
      setStep('otp');
      setResendCooldown(60);
      setTimeout(() => otpRef.current?.focus(), 300);
    } catch (e: any) {
      setOtpError(e.message || 'Failed to send code');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || submitting) return;
    setSubmitting(true);
    setOtpError('');
    try {
      const ok = await verifyEmailOtp(email, otp);
      if (ok) {
        if (currentProfile) {
          setStep('intent');
          setForm((f) => ({
            ...f,
            nickname: currentProfile.nickname || f.nickname,
            ageBand: currentProfile.age_band || f.ageBand,
          }));
        } else {
          setStep('details');
        }
      }
    } catch (e: any) {
      setOtpError(e.message || 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailsNext = () => {
    if (form.nickname && form.ageBand) setStep('intent');
  };

  const handleSubmit = async () => {
    if (!form.intent || submitting) return;
    setSubmitting(true);
    try {
      await upsertProfile(email, {
        nickname: form.nickname,
        age_band: form.ageBand,
      });
      if (venueId === 'event') {
        // Coming from event creation — go back to room page
        navigate(`/rooms/${roomType}`);
      } else {
        saveSessionState({ roomType: roomType!, venueId, step: 'verify', intent: form.intent, vibe: form.vibe });
        navigate(`/rooms/${roomType}/verify?venue=${venueId}&intent=${encodeURIComponent(form.intent)}&vibe=${encodeURIComponent(form.vibe)}`);
      }
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
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Email address</Label>
                  <Input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                {otpError && <p className="text-xs text-destructive font-body">{otpError}</p>}
                <button
                  onClick={handleSendOtp}
                  disabled={!email || otpSending}
                  className={`w-full rounded-2xl py-4 text-sm font-body font-medium tracking-wide transition-all duration-500 ${
                    email && !otpSending
                      ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
                      : 'bg-secondary text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {otpSending ? 'Sending...' : 'Continue'}
                </button>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <p className="text-sm text-muted-foreground font-body mb-1">We sent a code to <span className="text-foreground">{email}</span></p>
                  <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Verification code</Label>
                  <Input
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="bg-secondary border-border text-center text-lg tracking-[0.3em]"
                  />
                </div>
                {otpError && <p className="text-xs text-destructive font-body">{otpError}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 6 || submitting}
                  className={`w-full rounded-2xl py-4 text-sm font-body font-medium tracking-wide transition-all duration-500 ${
                    otp.length >= 6 && !submitting
                      ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
                      : 'bg-secondary text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Verifying...' : 'Verify'}
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0}
                  className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </motion.div>
            )}

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
