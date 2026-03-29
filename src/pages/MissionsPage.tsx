import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_MISSIONS, CATEGORY_INFO } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Leaf, MapPin, Camera, X, Sparkles, ArrowRight, Filter, UserCheck } from 'lucide-react';
import type { Mission, Difficulty } from '@/lib/types';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import ProofSubmissionSheet from '@/components/ProofSubmissionSheet';

const CATEGORY_GRADIENTS: Record<string, string> = {
  planting: 'from-jungle-bright to-jungle-mid',
  waste: 'from-jungle-mid to-jungle-deep',
  energy: 'from-sun-gold to-earth-warm',
  water: 'from-sky-blue to-sky-blue/70',
  transport: 'from-lavender to-lavender/70',
  biodiversity: 'from-jungle-light to-jungle-bright',
  campus: 'from-coral to-earth-warm',
};

function MissionDetailPanel({
  mission,
  status,
  actionLoading,
  onPrimaryAction,
  onClose,
}: {
  mission: Mission;
  status: 'available' | 'in_progress' | 'pending' | 'approved' | 'rejected';
  actionLoading: boolean;
  onPrimaryAction: () => void;
  onClose: () => void;
}) {
  const primaryLabel =
    status === 'available'
      ? 'Start Quest'
      : status === 'in_progress'
      ? 'Submit Proof'
      : status === 'pending'
      ? 'Under Review'
      : status === 'approved'
      ? 'Completed'
      : 'Retry Quest';

  const primaryDisabled = status === 'pending' || status === 'approved' || actionLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-foreground/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', bounce: 0.15 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md h-full bg-card shadow-float p-6 space-y-5 overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[mission.category] || 'from-primary to-primary/70'} flex items-center justify-center`}>
              <span className="text-3xl">{mission.icon_url}</span>
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground">{mission.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  mission.difficulty === 'easy' ? 'bg-jungle-pale text-jungle-bright' :
                  mission.difficulty === 'medium' ? 'bg-sun-gold/10 text-sun-gold' :
                  'bg-coral/10 text-coral'
                }`}>{mission.difficulty}</span>
                <span className="text-sm text-jungle-bright font-mono-stat flex items-center gap-1"><Leaf className="w-3 h-3" /> {mission.eco_points_reward} pts</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">{mission.description}</p>

        {mission.steps && (
          <div>
            <h3 className="font-heading font-bold text-foreground text-sm mb-2">Steps</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {mission.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-jungle-pale text-jungle-bright text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {mission.requires_photo && <span className="flex items-center gap-1 bg-muted rounded-full px-3 py-1"><Camera className="w-3 h-3" /> Photo required</span>}
          {mission.requires_location && <span className="flex items-center gap-1 bg-muted rounded-full px-3 py-1"><MapPin className="w-3 h-3" /> Location required</span>}
          {mission.requires_teacher_approval && <span className="flex items-center gap-1 bg-muted rounded-full px-3 py-1"><UserCheck className="w-3 h-3" /> Teacher approval</span>}
        </div>

        {mission.requires_photo && (
          <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
            <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Drop your proof photo here</p>
            <p className="text-xs text-muted-foreground/60 mt-1">or click to browse</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-heading font-semibold text-foreground">Notes (optional)</label>
          <textarea className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground min-h-[80px] resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Add any notes about your mission..." />
        </div>

        <Button
          onClick={onPrimaryAction}
          disabled={primaryDisabled}
          className="w-full font-heading font-bold rounded-xl shadow-card"
        >
          <Leaf className="w-4 h-4 mr-2" /> {primaryLabel}
        </Button>
      </motion.div>
    </motion.div>
  );
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function MissionsPage() {
  const { user } = useAuth();
  const dashboard = useDashboardData();
  const [category, setCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [selected, setSelected] = useState<Mission | null>(null);
  const [proofSheetOpen, setProofSheetOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedMissionForProof, setSelectedMissionForProof] = useState<any>(null);

  const allMissions = useMemo(() => {
    const active = localStore.query('missions', (m) => m.is_active);
    const source = active.length > 0 ? active : MOCK_MISSIONS;
    return source.map((m: any) => ({
      ...m,
      icon_url: m.icon_url || m.icon || '🌿',
      requires_photo: m.requires_photo ?? false,
      requires_location: m.requires_location ?? false,
      requires_teacher_approval: m.requires_teacher_approval ?? false,
    })) as Mission[];
  }, [dashboard.submissions]);

  const categories = ['all', ...Object.keys(CATEGORY_INFO)];
  
  const filtered = allMissions.filter(m => {
    if (category !== 'all' && m.category !== category) return false;
    if (difficulty !== 'all' && m.difficulty !== difficulty) return false;
    return true;
  });

  const aiPicks = allMissions.slice(0, 3);

  const getSubmissionForMission = (missionId: string) => {
    return dashboard.submissions.find((s: any) => s.mission_id === missionId);
  };

  const getMissionStatus = (missionId: string): 'available' | 'in_progress' | 'pending' | 'approved' | 'rejected' => {
    const sub = getSubmissionForMission(missionId);
    if (!sub) return 'available';
    return (sub.status || 'available') as 'available' | 'in_progress' | 'pending' | 'approved' | 'rejected';
  };

  const openProofSheet = (submission: any, mission: Mission) => {
    setSelectedSubmission(submission);
    setSelectedMissionForProof({
      title: mission.title,
      description: mission.description,
      icon: mission.icon_url,
      eco_points_reward: mission.eco_points_reward,
    });
    setProofSheetOpen(true);
  };

  const handleMissionAction = (mission: Mission) => {
    const sub = getSubmissionForMission(mission.id);
    const status = getMissionStatus(mission.id);

    if (!sub || status === 'available' || status === 'rejected') {
      dashboard.acceptMission.mutate(mission.id);
      return;
    }

    if (status === 'in_progress') {
      openProofSheet(sub, mission);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-bg-dark-panel p-6 md:p-8 shadow-float"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl md:text-4xl" style={{ color: 'hsl(var(--bg-elevated))' }}>
              Your Eco Quests
            </h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--jungle-light))' }}>
              Complete missions to grow your ecosystem · <span className="font-mono-stat">{allMissions.length}</span> missions available
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-lavender/20 text-lavender rounded-full px-3 py-1.5 text-sm font-heading font-bold">
            <Sparkles className="w-4 h-4" /> AI Recommended
          </div>
        </div>
      </motion.div>

      {/* AI Recommended */}
      <div>
        <h2 className="font-heading font-bold text-foreground text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lavender" /> Picked For You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aiPicks.map(m => (
            <motion.div
              key={m.id}
              whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(m)}
              className="p-4 rounded-2xl bg-card shadow-card border border-lavender/20 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{m.icon_url}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-lavender/10 text-lavender font-heading font-bold">AI Pick</span>
              </div>
              <p className="font-heading font-bold text-sm text-foreground">{m.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.description}</p>
              <p className="text-xs text-jungle-bright mt-2 font-mono-stat font-bold flex items-center gap-1"><Leaf className="w-3 h-3" /> {m.eco_points_reward} pts</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Category filters + Difficulty */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-heading font-semibold whitespace-nowrap transition-all ${
                category === c ? 'bg-primary text-primary-foreground shadow-card' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              {c === 'all' ? '🌍 All' : `${CATEGORY_INFO[c]?.icon} ${CATEGORY_INFO[c]?.label}`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="rounded-full border border-border bg-card px-3 py-2 text-sm font-heading text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Mission grid */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-card shadow-card p-12 text-center">
          <span className="text-5xl mb-4 block">🌿</span>
          <h3 className="font-heading font-bold text-foreground text-lg mb-2">No missions found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters to discover more quests</p>
        </motion.div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={stagger} initial="hidden" animate="visible">
          {filtered.map(m => (
            <motion.div
              key={m.id}
              variants={fadeUp}
              whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(m)}
              className="rounded-2xl bg-card shadow-card overflow-hidden cursor-pointer transition-all"
            >
              {/* Gradient top band */}
              <div className={`h-28 bg-gradient-to-br ${CATEGORY_GRADIENTS[m.category] || 'from-primary to-primary/70'} flex items-center justify-center relative`}>
                <span className="text-5xl">{m.icon_url}</span>
                <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-heading font-bold bg-card/90 ${
                  m.difficulty === 'easy' ? 'text-jungle-bright' : m.difficulty === 'medium' ? 'text-sun-gold' : 'text-coral'
                }`}>{m.difficulty}</span>
              </div>
              <div className="p-4">
                <h3 className="font-heading font-bold text-foreground mb-1">{m.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{m.description}</p>
                {/* Requirement chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {m.requires_photo && <span className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground flex items-center gap-1"><Camera className="w-3 h-3" /> Photo</span>}
                  {m.requires_location && <span className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>}
                  {m.requires_teacher_approval && <span className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground flex items-center gap-1"><UserCheck className="w-3 h-3" /> Approval</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="bg-jungle-pale text-jungle-bright text-sm font-mono-stat font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> {m.eco_points_reward}
                  </span>
                  <Button
                    size="sm"
                    className="rounded-lg font-heading font-bold"
                    disabled={getMissionStatus(m.id) === 'pending' || getMissionStatus(m.id) === 'approved'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMissionAction(m);
                    }}
                  >
                    {getMissionStatus(m.id) === 'in_progress'
                      ? 'Continue'
                      : getMissionStatus(m.id) === 'pending'
                      ? 'Pending'
                      : getMissionStatus(m.id) === 'approved'
                      ? 'Done'
                      : 'Start'}{' '}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selected && (
          <MissionDetailPanel
            mission={selected}
            status={getMissionStatus(selected.id)}
            actionLoading={dashboard.acceptMission.isPending || dashboard.submitProof.isPending}
            onPrimaryAction={() => handleMissionAction(selected)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <ProofSubmissionSheet
        open={proofSheetOpen}
        onOpenChange={setProofSheetOpen}
        submission={selectedSubmission}
        mission={selectedMissionForProof}
        userId={user?.id || ''}
        onSubmit={(data) => dashboard.submitProof.mutate(data)}
      />
    </div>
  );
}
