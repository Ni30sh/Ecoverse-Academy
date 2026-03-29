import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Camera, Upload, Loader2 } from 'lucide-react';

interface ProofSubmissionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: { id: string; mission_id: string } | null;
  mission: { title: string; description: string; icon: string; eco_points_reward: number } | null;
  userId: string;
  onSubmit: (data: { submissionId: string; photoUrl?: string; notes?: string; coords?: { lat: number; lng: number } }) => void;
}

export default function ProofSubmissionSheet({ open, onOpenChange, submission, mission, userId, onSubmit }: ProofSubmissionSheetProps) {
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const localPreview = URL.createObjectURL(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(localPreview);

    setUploading(true);
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('mission-photos').upload(path, file);
    if (data && !error) {
      const { data: urlData } = supabase.storage.from('mission-photos').getPublicUrl(data.path);
      setPhotoUrl(urlData.publicUrl);
    }
    setUploading(false);
  };

  const handleLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async () => {
    if (!submission) return;
    setSubmitting(true);
    onSubmit({
      submissionId: submission.id,
      photoUrl: photoUrl ?? undefined,
      notes: notes || undefined,
      coords: coords ?? undefined,
    });
    setSubmitting(false);
    setNotes('');
    setPhotoUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCoords(null);
    onOpenChange(false);
  };

  if (!mission || !submission) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 font-heading text-foreground">
            <span className="text-2xl">{mission.icon}</span>
            {mission.title}
          </SheetTitle>
          <SheetDescription>{mission.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-heading font-bold text-foreground mb-2">
              <Camera className="inline w-4 h-4 mr-1" /> Upload Photo Proof
            </label>
            {previewUrl || photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={previewUrl || photoUrl || ''} alt="Proof" className="w-full h-48 object-cover" />
                <button
                  onClick={() => {
                    setPhotoUrl(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 bg-card rounded-full p-1 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click or drag to upload</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            )}
          </div>

          {/* Location */}
          <div>
            <Button variant="outline" size="sm" onClick={handleLocation} disabled={locationLoading} className="rounded-xl">
              <MapPin className="w-4 h-4 mr-1" />
              {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : locationLoading ? 'Getting location...' : 'Tag my location'}
            </Button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-heading font-bold text-foreground mb-2">Tell us what you did...</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your mission experience..."
              className="rounded-xl min-h-[100px]"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full font-heading font-bold rounded-xl shadow-card"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Proof · +{mission.eco_points_reward} pts 🌿
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
