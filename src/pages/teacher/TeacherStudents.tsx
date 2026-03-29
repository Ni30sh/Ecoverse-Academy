import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTeacherData } from '@/hooks/useTeacherData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Award } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

function getLevelInfo(points: number) {
  if (points < 100) return { emoji: '🌱', name: 'Seed', level: 1, progress: points / 100 };
  if (points < 300) return { emoji: '🌿', name: 'Sprout', level: 2, progress: (points - 100) / 200 };
  if (points < 600) return { emoji: '🌳', name: 'Sapling', level: 3, progress: (points - 300) / 300 };
  if (points < 1000) return { emoji: '🌲', name: 'Tree', level: 4, progress: (points - 600) / 400 };
  return { emoji: '🏔️', name: 'Forest', level: 5, progress: 1 };
}

export default function TeacherStudents() {
  const { students, submissions, awardBonusPoints } = useTeacherData();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bonusPoints, setBonusPoints] = useState('');
  const [bonusReason, setBonusReason] = useState('');

  const filtered = students.filter(s =>
    !search || s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = students.find(s => s.id === selectedId);
  const studentSubmissions = selectedId
    ? submissions.filter(s => s.user_id === selectedId).slice(0, 5)
    : [];

  const missionsCompleted = (userId: string) =>
    submissions.filter(s => s.user_id === userId && s.status === 'approved').length;

  const handleAwardPoints = () => {
    if (!selectedId || !bonusPoints || !bonusReason) return;
    const pts = parseInt(bonusPoints);
    if (isNaN(pts) || pts < 1 || pts > 50) return;
    awardBonusPoints.mutate({ studentId: selectedId, points: pts, reason: bonusReason });
    setBonusPoints('');
    setBonusReason('');
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-3xl text-jungle-deep">My Students</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-[20px] shadow-card p-12 text-center">
          <span className="text-5xl block mb-4">👩‍🎓</span>
          <p className="font-heading font-bold text-foreground text-lg">No students found</p>
          <p className="text-sm text-muted-foreground">Students from your school will appear here</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map(student => {
            const level = getLevelInfo(student.eco_points);
            const completed = missionsCompleted(student.id);
            return (
              <motion.div
                key={student.id}
                variants={fadeUp}
                className="bg-card rounded-[20px] shadow-card p-5 cursor-pointer hover:shadow-hover transition-shadow group"
                onClick={() => setSelectedId(student.id)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-14 h-14 rounded-full bg-jungle-pale flex items-center justify-center text-2xl border-2 border-jungle-light">
                    {student.avatar_emoji}
                  </span>
                  <div>
                    <p className="font-heading font-bold text-foreground">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">{student.school_name || 'EcoQuest'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-jungle-pale text-jungle-bright px-2 py-0.5 rounded-full font-heading font-bold">
                    {level.emoji} {level.name} · Lv {level.level}
                  </span>
                </div>
                <p className="font-display font-bold text-2xl text-jungle-bright mb-3">
                  {student.eco_points.toLocaleString()} <span className="text-sm text-muted-foreground font-heading">pts</span>
                </p>
                <div className="flex justify-between text-xs text-muted-foreground mb-3">
                  <span>🎯 {completed} missions</span>
                  <span>🔥 {student.streak_days}d streak</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-jungle-bright rounded-full transition-all"
                    style={{ width: `${Math.min(level.progress * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-heading font-semibold">
                  View Details →
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Student Detail Drawer */}
      <Sheet open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[420px] max-w-full overflow-y-auto">
          {selectedStudent && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <span className="w-14 h-14 rounded-full bg-jungle-pale flex items-center justify-center text-2xl border-2 border-jungle-light">
                    {selectedStudent.avatar_emoji}
                  </span>
                  <div>
                    <SheetTitle className="font-heading">{selectedStudent.full_name}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{selectedStudent.school_name || 'EcoQuest'}</p>
                  </div>
                </div>
              </SheetHeader>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="font-display font-bold text-xl text-jungle-bright">{selectedStudent.eco_points}</p>
                  <p className="text-xs text-muted-foreground">EcoPoints</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="font-display font-bold text-xl text-foreground">{selectedStudent.streak_days}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>

              {/* Recent submissions */}
              <div>
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Recent Submissions</h3>
                {studentSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {studentSubmissions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div>
                          <p className="text-sm font-heading font-semibold text-foreground">
                            {(sub.missions as any)?.title ?? 'Mission'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-heading font-bold ${
                          sub.status === 'approved' ? 'bg-jungle-pale text-jungle-bright' :
                          sub.status === 'pending' ? 'bg-sun-gold/10 text-sun-gold' :
                          sub.status === 'rejected' ? 'bg-coral/10 text-coral' :
                          'bg-muted text-muted-foreground'
                        }`}>{sub.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Award Bonus Points */}
              <div className="border-t border-border pt-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-sun-gold" /> Award Bonus Points
                </h3>
                <div className="space-y-3">
                  <div>
                    <Input
                      type="number"
                      placeholder="Points (max 50)"
                      value={bonusPoints}
                      onChange={e => {
                        const v = e.target.value;
                        if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 50)) setBonusPoints(v);
                      }}
                      max={50}
                      min={1}
                      className="rounded-xl"
                    />
                    {bonusPoints && parseInt(bonusPoints) > 50 && (
                      <p className="text-xs text-coral mt-1">Maximum 50 bonus points per award</p>
                    )}
                  </div>
                  <Input
                    placeholder="Reason (shown to student)"
                    value={bonusReason}
                    onChange={e => setBonusReason(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={handleAwardPoints}
                    disabled={!bonusPoints || !bonusReason || parseInt(bonusPoints) > 50 || parseInt(bonusPoints) < 1 || awardBonusPoints.isPending}
                    className="w-full rounded-xl font-heading font-bold bg-jungle-bright hover:bg-jungle-mid text-white"
                  >
                    Award Points
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
