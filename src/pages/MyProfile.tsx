import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHanginnStore } from '@/lib/hanginnStore';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const MyProfile = () => {
  const navigate = useNavigate();
  const { currentProfile, updateProfile, signOut } = useHanginnStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nickname: currentProfile?.nickname || '',
    hometown: currentProfile?.hometown || '',
    profession: currentProfile?.profession || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!currentProfile) return;
    await updateProfile(currentProfile.id, form);
    setEditing(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProfile) return;

    setUploading(true);
    try {
      // Resize and compress client-side
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((r) => (img.onload = r));

      const maxSize = 300;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/webp', 0.8));

      const path = `${currentProfile.id}/avatar.webp`;
      // Delete old
      await supabase.storage.from('avatars').remove([path]);
      // Upload new
      const { error } = await supabase.storage.from('avatars').upload(path, blob, {
        contentType: 'image/webp',
        upsert: true,
      });

      if (!error) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        await updateProfile(currentProfile.id, { photo_url: urlData.publicUrl + '?t=' + Date.now() });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center px-6">
          <p className="text-muted-foreground font-body text-sm">Enter a room to create your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">My Profile</h2>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-body transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Avatar */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              {currentProfile.photo_url ? (
                <div className="h-20 w-20 rounded-full overflow-hidden select-none">
                  <img src={currentProfile.photo_url} alt="" className="h-full w-full object-cover" draggable={false} />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-foreground font-display text-2xl">
                  {currentProfile.nickname[0]}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-foreground" />
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              {uploading && <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>}
            </label>
          </div>

          <div className="text-center">
            <p className="font-display text-xl text-foreground">{currentProfile.nickname}</p>
            <p className="text-xs text-muted-foreground font-body mt-1">{currentProfile.age_band}</p>
            {currentProfile.email && <p className="text-xs text-muted-foreground/60 font-body mt-0.5">{currentProfile.email}</p>}
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-body">Hometown</span>
                  <span className="text-sm text-foreground font-body">{currentProfile.hometown || 'Not set'}</span>
                </div>
                <div className="border-t border-border" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-body">Profession</span>
                  <span className="text-sm text-foreground font-body">{currentProfile.profession || 'Not set'}</span>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="w-full rounded-2xl py-3 text-sm font-body text-muted-foreground hover:text-foreground border border-border transition-all duration-500"
              >
                Edit profile
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Nickname</Label>
                <Input value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                  className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Hometown</Label>
                <Input value={form.hometown} onChange={(e) => setForm((f) => ({ ...f, hometown: e.target.value }))}
                  placeholder="Where are you from?" className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block font-body">Profession</Label>
                <Input value={form.profession} onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
                  placeholder="What do you do?" className="bg-secondary border-border" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)}
                  className="flex-1 rounded-2xl py-3 text-sm font-body text-muted-foreground border border-border transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave}
                  className="flex-1 rounded-2xl py-3 text-sm font-body bg-primary/90 text-primary-foreground hover:bg-primary transition-colors">
                  Save
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MyProfile;
