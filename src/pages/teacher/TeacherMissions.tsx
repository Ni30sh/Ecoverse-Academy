import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTeacherData } from '@/hooks/useTeacherData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Eye, Plus, Leaf, Camera, MapPin, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const CATEGORIES = [
  { value: 'planting', label: '🌱 Planting' },
  { value: 'waste', label: '♻️ Waste' },
  { value: 'energy', label: '⚡ Energy' },
  { value: 'water', label: '💧 Water' },
  { value: 'transport', label: '🚲 Transport' },
  { value: 'biodiversity', label: '🦋 Biodiversity' },
  { value: 'campus', label: '🏫 Campus' },
];

const DIFFICULTY_POINTS: Record<string, number> = { easy: 50, medium: 100, hard: 200 };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function TeacherMissions() {
  const { user } = useAuth();
  const { missions, missionCompletions, createMission } = useTeacherData();
  const [tab, setTab] = useState<'all' | 'custom'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'planting',
    difficulty: 'easy',
    eco_points_reward: 50,
    requires_photo: true,
    requires_location: false,
    school_only: true,
    expires_at: '',
  });

  const allMissions = missions.filter(m => !m.created_by);
  const customMissions = missions.filter(m => m.created_by === user?.id);

  const handleCreate = () => {
    createMission.mutate({
      ...form,
      expires_at: form.expires_at || undefined,
    });
    setModalOpen(false);
    setForm({ title: '', description: '', category: 'planting', difficulty: 'easy', eco_points_reward: 50, requires_photo: true, requires_location: false, school_only: true, expires_at: '' });
  };

  const displayed = tab === 'all' ? allMissions : customMissions;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-3xl text-jungle-deep">Missions</h1>
        <Button onClick={() => setModalOpen(true)} className="rounded-xl font-heading font-bold bg-jungle-bright hover:bg-jungle-mid text-white">
          <Plus className="w-4 h-4 mr-2" /> Create Mission
        </Button>
      </div>

      {/* Info banner about mission visibility */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-jungle-bright/10 border border-jungle-bright/30 rounded-2xl p-4 flex gap-3"
      >
        <div className="text-2xl">📢</div>
        <div>
          <p className="font-heading font-bold text-jungle-deep text-sm">Missions are instantly visible to students!</p>
          <p className="text-xs text-jungle-mid mt-1">When you create a mission, it appears immediately in the student's mission list.</p>
        </div>
      </motion.div>

      <div className="flex gap-2">
        {(['all', 'custom'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all ${
              tab === t ? 'bg-primary text-primary-foreground shadow-card' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {t === 'all' ? 'All Missions' : 'My Custom Missions'}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="bg-card rounded-[20px] shadow-card p-12 text-center">
          <span className="text-5xl block mb-4">🌿</span>
          <p className="font-heading font-bold text-foreground text-lg">
            {tab === 'custom' ? 'No custom missions yet' : 'No missions found'}
          </p>
          <p className="text-sm text-muted-foreground">
            {tab === 'custom' ? 'Create one for your class! 🌿' : ''}
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {displayed.map(m => (
            <motion.div key={m.id} variants={fadeUp} className="bg-card rounded-[20px] shadow-card p-5 relative">
              {/* Visible to students badge */}
              {m.is_active && (
                <div className="absolute top-3 right-3 bg-jungle-bright/20 text-jungle-bright text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-heading font-bold">
                  <Eye className="w-3 h-3" /> Visible
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 pr-16">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <p className="font-heading font-bold text-foreground">{m.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-heading font-bold ${
                      m.difficulty === 'easy' ? 'bg-jungle-pale text-jungle-bright' :
                      m.difficulty === 'medium' ? 'bg-sun-gold/10 text-sun-gold' :
                      'bg-coral/10 text-coral'
                    }`}>{m.difficulty}</span>
                  </div>
                </div>
                <span className="font-mono-stat text-sm font-bold text-jungle-bright flex items-center gap-1">
                  <Leaf className="w-3 h-3" /> {m.eco_points_reward}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{m.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {m.requires_photo && <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> Photo</span>}
                  {m.requires_location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>}
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" /> {missionCompletions[m.id] || 0} completed
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Mission Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-2xl text-jungle-deep">Create New Mission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Info box */}
            <div className="bg-jungle-bright/10 border border-jungle-bright/30 rounded-xl p-3 text-sm">
              <p className="text-jungle-deep font-heading font-semibold">✨ Tip: Missions appear immediately to all your students!</p>
            </div>

            <div className="space-y-2">
              <Label className="font-heading font-bold">Mission Title *</Label>
              <Input 
                value={form.title} 
                onChange={e => setForm({ ...form, title: e.target.value })} 
                placeholder="e.g. Create a butterfly-friendly garden" 
                className="rounded-xl text-sm"
              />
              <p className="text-xs text-muted-foreground">Clear, action-oriented title (3-8 words)</p>
            </div>

            <div className="space-y-2">
              <Label className="font-heading font-bold">Description *</Label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Explain what students need to do, step by step..."
                maxLength={300}
                className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <p className="text-xs text-muted-foreground">{form.description.length}/300 characters</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-heading font-bold text-sm">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-heading font-bold text-sm">Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v, eco_points_reward: DIFFICULTY_POINTS[v] })}>
                  <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (50 pts)</SelectItem>
                    <SelectItem value="medium">Medium (100 pts)</SelectItem>
                    <SelectItem value="hard">Hard (200 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-heading font-bold">EcoPoints Reward</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={10}
                  max={300}
                  value={form.eco_points_reward}
                  onChange={e => setForm({ ...form, eco_points_reward: Math.min(300, Math.max(10, parseInt(e.target.value) || 10)) })}
                  className="rounded-xl text-sm"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">pts</span>
              </div>
              <p className="text-xs text-muted-foreground">Range: 10–300 points</p>
            </div>

            <div className="space-y-3">
              <p className="font-heading font-bold text-sm">Requirements</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <Checkbox checked={form.requires_photo} onCheckedChange={v => setForm({ ...form, requires_photo: !!v })} />
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground">Photo proof required</p>
                    <p className="text-xs text-muted-foreground">Students must submit a photo as evidence</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <Checkbox checked={form.requires_location} onCheckedChange={v => setForm({ ...form, requires_location: !!v })} />
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground">Location tag required</p>
                    <p className="text-xs text-muted-foreground">Students must share GPS coordinates</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                <Checkbox checked={form.school_only} onCheckedChange={v => setForm({ ...form, school_only: !!v })} />
                <div>
                  <p className="text-sm font-heading font-semibold text-foreground">My school only</p>
                  <p className="text-xs text-muted-foreground">Only visible to students in your school</p>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <Label className="font-heading font-bold text-sm">Expiry Date (Optional)</Label>
              <Input 
                type="date" 
                value={form.expires_at} 
                onChange={e => setForm({ ...form, expires_at: e.target.value })} 
                className="rounded-xl text-sm"
              />
              <p className="text-xs text-muted-foreground">Leave empty for no expiry</p>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!form.title || !form.description || createMission.isPending}
              className="w-full rounded-xl font-heading font-bold bg-jungle-bright hover:bg-jungle-mid text-white py-2.5"
            >
              {createMission.isPending ? (
                <>Creating...</>
              ) : (
                <>✨ Launch Mission</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
