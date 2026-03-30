import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AGE_BANDS } from '@/lib/types';
import { useHanginnStore } from '@/lib/hanginnStore';

const ProfileEntry = () => {
  const { roomType } = useParams<{ roomType: string }>();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venue') || '';
  const navigate = useNavigate();
  const { loginWithPhone, currentProfile } = useHanginnStore();

  const [form, setForm] = useState({
    phone: currentProfile?.phone || '',
    nickname: currentProfile?.nickname || '',
    ageBand: currentProfile?.age_band || '',
    hometown: currentProfile?.hometown || '',
    profession: currentProfile?.profession || '',
    genderPreference: (currentProfile?.gender_preference || 'all') as 'all' | 'same',
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const canSubmit = form.phone && form.nickname && form.ageBand && form.hometown && form.profession;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await loginWithPhone(form.phone, {
        nickname: form.nickname,
        age_band: form.ageBand,
        hometown: form.hometown,
        profession: form.profession,
        gender_preference: form.genderPreference,
      });
      navigate(`/rooms/${roomType}/live?venue=${venueId}`);
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
          <h2 className="font-display text-lg text-foreground">Quick intro</h2>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <p className="text-sm text-muted-foreground">Just enough to help you meet the right people. Your info stays with your phone number.</p>

          <div className="flex justify-center">
            <button className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Camera className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Phone number</Label>
              <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Nickname</Label>
              <Input placeholder="What should people call you?" value={form.nickname} onChange={(e) => update('nickname', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Age band</Label>
              <div className="flex flex-wrap gap-2">
                {AGE_BANDS.map((band) => (
                  <button
                    key={band}
                    onClick={() => update('ageBand', band)}
                    className={`rounded-full px-4 py-1.5 text-sm font-body transition-colors ${
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

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Hometown</Label>
              <Input placeholder="Where are you from?" value={form.hometown} onChange={(e) => update('hometown', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Profession</Label>
              <Input placeholder="What do you do?" value={form.profession} onChange={(e) => update('profession', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Open to connect with</Label>
              <div className="flex gap-2">
                {[{ v: 'all' as const, l: 'All genders' }, { v: 'same' as const, l: 'Same gender' }].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => update('genderPreference', v)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-body transition-colors ${
                      form.genderPreference === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full rounded-xl py-6 text-base font-body font-semibold"
          >
            {submitting ? 'Entering...' : 'Enter the room'}
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfileEntry;
