import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeacherData } from '@/hooks/useTeacherData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const REJECTION_REASONS = ['Photo unclear', 'Mission not completed correctly', 'More evidence needed', 'Other'];

export default function TeacherSubmissions() {
  const { submissions, students, pendingCount, approveSubmission, rejectSubmission } = useTeacherData();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Photo unclear');
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [visibleCount, setVisibleCount] = useState(10);

  const getStudent = (userId: string) => students.find(s => s.id === userId);

  const filtered = submissions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search) {
      const student = getStudent(s.user_id);
      const missionTitle = (s.missions as any)?.title ?? '';
      const q = search.toLowerCase();
      if (!student?.full_name?.toLowerCase().includes(q) && !missionTitle.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const visible = filtered.slice(0, visibleCount);
  const counts = {
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  const handleApprove = (sub: any) => {
    approveSubmission.mutate({
      submissionId: sub.id,
      missionId: sub.mission_id,
      studentId: sub.user_id,
      feedback: feedbacks[sub.id],
    });
  };

  const handleReject = (sub: any) => {
    setRejectingId(sub.id);
  };

  const confirmReject = (sub: any) => {
    rejectSubmission.mutate({
      submissionId: sub.id,
      missionId: sub.mission_id,
      studentId: sub.user_id,
      reason: rejectReason,
      feedback: rejectFeedback,
    });
    setRejectingId(null);
    setRejectFeedback('');
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ] as const;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="font-display font-bold text-3xl text-jungle-deep">Mission Submissions</h1>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setFilter(t.key); setVisibleCount(10); }}
              className={`px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all relative ${
                filter === t.key ? 'bg-primary text-primary-foreground shadow-card' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {'count' in t && t.count > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  t.key === 'pending' ? 'bg-coral text-white' : 'bg-muted text-muted-foreground'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search student or mission..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl w-64"
          />
        </div>
      </div>

      {/* Submissions */}
      {visible.length === 0 ? (
        <div className="bg-card rounded-[20px] shadow-card p-12 text-center">
          <span className="text-5xl block mb-4">📋</span>
          <p className="font-heading font-bold text-foreground text-lg">No submissions found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {visible.map(sub => {
              const student = getStudent(sub.user_id);
              const mission = sub.missions as any;
              const isRejecting = rejectingId === sub.id;

              return (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-card rounded-[20px] shadow-card overflow-hidden"
                >
                  {/* Top section */}
                  <div className="p-5 flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-full bg-jungle-pale flex items-center justify-center text-xl">
                        {student?.avatar_emoji ?? '🌱'}
                      </span>
                      <div>
                        <p className="font-heading font-bold text-foreground">{student?.full_name ?? 'Student'}</p>
                        <p className="text-xs text-muted-foreground">{student?.school_name || 'EcoQuest'}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-heading font-extrabold text-foreground text-lg">{mission?.title ?? 'Mission'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-heading font-bold ${
                        mission?.difficulty === 'easy' ? 'bg-jungle-pale text-jungle-bright' :
                        mission?.difficulty === 'medium' ? 'bg-sun-gold/10 text-sun-gold' :
                        'bg-coral/10 text-coral'
                      }`}>{mission?.difficulty}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                      </p>
                      <p className="font-mono-stat text-sm font-bold text-jungle-bright">{mission?.eco_points_reward ?? 0} pts</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-heading font-bold ${
                        sub.status === 'pending' ? 'bg-sun-gold/10 text-sun-gold' :
                        sub.status === 'approved' ? 'bg-jungle-pale text-jungle-bright' :
                        'bg-coral/10 text-coral'
                      }`}>{sub.status}</span>
                    </div>
                  </div>

                  {/* Proof section */}
                  <div className="px-5 pb-3 space-y-3">
                    {sub.photo_url && (
                      <img
                        src={sub.photo_url}
                        alt="Proof photo"
                        className="w-full max-h-[300px] object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxUrl(sub.photo_url)}
                      />
                    )}
                    {sub.location_coords && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        Location tagged
                      </p>
                    )}
                    {sub.notes && (
                      <div className="bg-muted/30 rounded-xl p-3">
                        <p className="text-sm text-muted-foreground italic">{sub.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions (only for pending) */}
                  {sub.status === 'pending' && (
                    <div className="px-5 pb-5 space-y-3">
                      <Input
                        placeholder="Add feedback (optional)"
                        value={feedbacks[sub.id] || ''}
                        onChange={e => setFeedbacks({ ...feedbacks, [sub.id]: e.target.value })}
                        className="rounded-xl text-sm"
                      />
                      {isRejecting ? (
                        <div className="space-y-2 p-3 bg-coral/5 rounded-xl border border-coral/20">
                          <p className="text-sm font-heading font-bold text-foreground">Select rejection reason:</p>
                          <div className="flex flex-wrap gap-2">
                            {REJECTION_REASONS.map(r => (
                              <button
                                key={r}
                                onClick={() => setRejectReason(r)}
                                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                                  rejectReason === r ? 'bg-coral text-white' : 'bg-card border border-border text-muted-foreground'
                                }`}
                              >{r}</button>
                            ))}
                          </div>
                          <Input
                            placeholder="Additional feedback..."
                            value={rejectFeedback}
                            onChange={e => setRejectFeedback(e.target.value)}
                            className="rounded-xl text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" onClick={() => confirmReject(sub)} className="rounded-lg font-heading font-bold flex-1">
                              Confirm Rejection
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setRejectingId(null)} className="rounded-lg font-heading font-bold">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={() => handleApprove(sub)}
                            disabled={approveSubmission.isPending}
                            className="rounded-xl font-heading font-bold bg-jungle-bright hover:bg-jungle-mid text-white"
                          >
                            ✓ Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(sub)}
                            disabled={rejectSubmission.isPending}
                            className="rounded-xl font-heading font-bold"
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher feedback display for non-pending */}
                  {sub.status !== 'pending' && sub.teacher_feedback && (
                    <div className="px-5 pb-5">
                      <div className="bg-muted/30 rounded-xl p-3">
                        <p className="text-xs font-heading font-bold text-muted-foreground mb-1">Teacher feedback:</p>
                        <p className="text-sm text-foreground">{sub.teacher_feedback}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length > visibleCount && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setVisibleCount(v => v + 10)} className="rounded-xl font-heading font-bold">
                Load more ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Full proof" className="w-full rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
