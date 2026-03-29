import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import confetti from 'canvas-confetti';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const AVATARS = ['🧑‍🌾', '👩‍🔬', '🧑‍🏫', '🌿', '🦊', '🐢'];
const INTERESTS = [
  { id: 'climate_change', label: 'Climate Change', icon: '🌡️' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'waste', label: 'Waste', icon: '♻️' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'biodiversity', label: 'Biodiversity', icon: '🦋' },
  { id: 'transport', label: 'Transport', icon: '🚲' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, role, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  // Student state
  const [avatar, setAvatar] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState(2);
  // Teacher state
  const [schoolName, setSchoolName] = useState('');
  const [subject, setSubject] = useState('');

  const isTeacherRole = role === 'teacher' || role === 'school_admin';

  const toggleInterest = (id: string) => {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 6 ? [...prev, id] : prev);
  };

  const redirectPath = isTeacherRole ? '/teacher' : '/dashboard';

  const finishStudent = async () => {
    if (user) {
      await supabase.from('profiles').update({
        avatar_emoji: avatar,
        interests,
        daily_goal: goal,
      }).eq('id', user.id);
      await refreshProfile();
    }
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#40916C', '#F4A261', '#48CAE4', '#52B788'] });
    setTimeout(() => navigate(redirectPath), 2000);
  };

  const finishTeacher = async () => {
    if (user) {
      await supabase.from('profiles').update({
        school_name: schoolName,
      }).eq('id', user.id);
      await refreshProfile();
    }
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#40916C', '#F4A261', '#48CAE4', '#52B788'] });
    setTimeout(() => navigate('/teacher'), 1500);
  };

  // ─── Teacher Steps ───
  const teacherSteps = [
    <motion.div key="teacher-welcome" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center">
      <h2 className="font-display font-bold text-2xl text-jungle-deep mb-2">Welcome to EcoQuest, Teacher! 👋</h2>
      <p className="text-muted-foreground mb-8">Let's set up your classroom</p>
      <div className="max-w-sm mx-auto space-y-4 mb-8 text-left">
        <div>
          <label className="text-sm font-heading font-semibold text-foreground mb-1.5 block">Your School Name <span className="text-destructive">*</span></label>
          <Input
            value={schoolName}
            onChange={e => setSchoolName(e.target.value)}
            placeholder="e.g. Green Valley High School"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm font-heading font-semibold text-foreground mb-1.5 block">Subject / Class <span className="text-muted-foreground font-normal">(optional)</span></label>
          <Input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Environmental Science — Grade 10"
            className="rounded-xl"
          />
        </div>
      </div>
      <Button onClick={() => setStep(1)} disabled={!schoolName.trim()} className="font-heading font-bold rounded-xl shadow-card">Next</Button>
    </motion.div>,

    <motion.div key="teacher-ready" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="text-8xl mb-6">🌿</motion.div>
      <h2 className="font-display font-bold text-3xl text-jungle-deep mb-3">You're all set!</h2>
      <p className="text-muted-foreground mb-8">Your teacher dashboard is ready. Start reviewing student missions and tracking your class.</p>
      <Button onClick={finishTeacher} className="font-heading font-bold text-lg px-8 py-6 rounded-xl shadow-card">
        Enter Teacher Dashboard →
      </Button>
    </motion.div>,
  ];

  // ─── Student Steps ───
  const studentSteps = [
    <motion.div key="avatar" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center">
      <h2 className="font-display font-bold text-2xl text-jungle-deep mb-2">Choose Your Avatar</h2>
      <p className="text-muted-foreground mb-8">Pick the character that represents you</p>
      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-8">
        {AVATARS.map(a => (
          <button key={a} onClick={() => setAvatar(a)} className={`text-5xl p-4 rounded-2xl border-2 transition-all ${avatar === a ? 'border-primary bg-jungle-pale scale-110 shadow-card' : 'border-border bg-card hover:border-primary/30'}`}>
            {a}
          </button>
        ))}
      </div>
      <Button onClick={() => setStep(1)} disabled={!avatar} className="font-heading font-bold rounded-xl shadow-card">Next</Button>
    </motion.div>,

    <motion.div key="interests" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center">
      <h2 className="font-display font-bold text-2xl text-jungle-deep mb-2">What interests you?</h2>
      <p className="text-muted-foreground mb-8">Choose the areas you care about</p>
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-8">
        {INTERESTS.map(i => (
          <button key={i.id} onClick={() => toggleInterest(i.id)} className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-heading font-semibold transition-all ${interests.includes(i.id) ? 'border-primary bg-jungle-pale text-jungle-bright shadow-card' : 'border-border bg-card text-foreground hover:border-primary/30'}`}>
            <span className="text-xl">{i.icon}</span>{i.label}
          </button>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => setStep(0)} className="rounded-xl">Back</Button>
        <Button onClick={() => setStep(2)} disabled={interests.length === 0} className="font-heading font-bold rounded-xl shadow-card">Next</Button>
      </div>
    </motion.div>,

    <motion.div key="goal" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center">
      <h2 className="font-display font-bold text-2xl text-jungle-deep mb-2">Set Your Daily Goal</h2>
      <p className="text-muted-foreground mb-6">Choose your pace — you can change this anytime</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 max-w-lg mx-auto">
        {[
          { value: 1, emoji: '🌱', name: 'Casual', tagline: 'Take it easy', pts: '50+', color: 'border-jungle-light bg-jungle-pale/40' },
          { value: 2, emoji: '🌿', name: 'Regular', tagline: 'Steady growth', pts: '100+', color: 'border-primary bg-jungle-pale/60', recommended: true },
          { value: 3, emoji: '🔥', name: 'Hardcore', tagline: 'Maximum impact', pts: '150+', color: 'border-sun-gold bg-sun-gold/10' },
        ].map(tier => (
          <button
            key={tier.value}
            onClick={() => setGoal(tier.value)}
            className={`relative flex-1 flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 ${
              goal === tier.value
                ? `${tier.color} scale-105 shadow-hover ring-2 ring-primary/20`
                : 'border-border bg-card hover:border-primary/30 hover:shadow-card'
            }`}
          >
            {tier.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-label px-3 py-0.5 rounded-full shadow-card">
                ⭐ Recommended
              </span>
            )}
            {goal === tier.value && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">✓</span>
            )}
            <span className="text-4xl">{tier.emoji}</span>
            <span className="font-heading font-bold text-lg text-foreground">{tier.name}</span>
            <span className="text-xs text-muted-foreground">{tier.value} mission{tier.value > 1 ? 's' : ''}/day</span>
            <span className="text-sm font-heading font-semibold text-primary">{tier.pts} pts/day</span>
            <span className="text-xs text-muted-foreground italic">{tier.tagline}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        📊 ~{goal * 50 * 7} EcoPoints/week · 🌳 Your ecosystem grows {goal === 1 ? 'steadily' : goal === 2 ? 'quickly' : 'rapidly'}
      </p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">Back</Button>
        <Button onClick={() => setStep(3)} className="font-heading font-bold rounded-xl shadow-card">Next</Button>
      </div>
    </motion.div>,

    <motion.div key="welcome" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="text-8xl mb-6">🌱</motion.div>
      <h2 className="font-display font-bold text-3xl text-jungle-deep mb-3">Welcome to EcoQuest!</h2>
      <p className="text-muted-foreground mb-4">Your journey begins here. This tiny seedling is your ecosystem.</p>
      <p className="text-primary font-heading font-bold text-lg mb-8">Level 1 — 🌱 Seed</p>
      <Button onClick={finishStudent} className="font-heading font-bold text-lg px-8 py-6 rounded-xl shadow-card">
        Enter My Ecosystem 🌍
      </Button>
    </motion.div>,
  ];

  const steps = isTeacherRole ? teacherSteps : studentSteps;
  const totalSteps = isTeacherRole ? 2 : 4;

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col items-center justify-center p-6">
      <div className="flex gap-2 mb-12">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i <= step ? 'w-12 bg-primary' : 'w-6 bg-border'}`} />
        ))}
      </div>
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
      </div>
    </div>
  );
}
