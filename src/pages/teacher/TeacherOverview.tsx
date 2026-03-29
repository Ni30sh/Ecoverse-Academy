import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherData } from '@/hooks/useTeacherData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, MapPin, Target, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TeacherOverview() {
  const { profile } = useAuth();
  const {
    students,
    submissions,
    pendingCount,
    weeklyApproved,
    classTotalPoints,
    activeThisWeek,
    classWeekly,
    topStudentsWeek,
    missions,
    missionCompletions,
    approveSubmission,
    rejectSubmission,
  } = useTeacherData();

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending').slice(0, 5);
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved').length;
  const rejectedSubmissions = submissions.filter((s) => s.status === 'rejected').length;
  const avgPoints = students.length > 0 ? Math.round(classTotalPoints / students.length) : 0;
  const engagementRate = students.length > 0 ? Math.round((activeThisWeek / students.length) * 100) : 0;

  const pendingAges = pendingSubmissions.map((s) => {
    const submitted = new Date(s.submitted_at).getTime();
    const now = Date.now();
    return Math.max(0, (now - submitted) / (1000 * 60 * 60));
  });
  const avgReviewHours = pendingAges.length > 0
    ? Math.round((pendingAges.reduce((sum, v) => sum + v, 0) / pendingAges.length) * 10) / 10
    : 0;

  const riskyStudents = students
    .filter((s) => (s.eco_points ?? 0) < avgPoints * 0.4)
    .sort((a, b) => (a.eco_points ?? 0) - (b.eco_points ?? 0))
    .slice(0, 4);

  const topMissions = missions
    .map((m: any) => ({
      id: m.id,
      title: m.title,
      difficulty: m.difficulty,
      completions: missionCompletions[m.id] || 0,
    }))
    .sort((a, b) => b.completions - a.completions)
    .slice(0, 5);

  const getStudentName = (userId: string) => {
    const student = students.find((s) => s.id === userId);
    return student?.full_name ?? 'Student';
  };

  const getStudentEmoji = (userId: string) => {
    const student = students.find((s) => s.id === userId);
    return student?.avatar_emoji ?? '🌱';
  };

  const statCards = [
    {
      label: 'Review Queue',
      value: pendingCount,
      icon: Clock3,
      tone: pendingCount > 0 ? 'text-sun-gold' : 'text-jungle-bright',
      subtext: pendingCount > 0 ? `${avgReviewHours || '<1'}h avg wait` : 'No backlog',
    },
    {
      label: 'Class Engagement',
      value: `${engagementRate}%`,
      icon: Zap,
      tone: engagementRate >= 60 ? 'text-jungle-bright' : 'text-sun-gold',
      subtext: `${activeThisWeek}/${students.length} active this week`,
    },
    {
      label: 'Mission Throughput',
      value: weeklyApproved,
      icon: CheckCircle2,
      tone: 'text-sky-blue',
      subtext: 'Approved this week',
    },
    {
      label: 'Intervention List',
      value: riskyStudents.length,
      icon: AlertTriangle,
      tone: riskyStudents.length > 0 ? 'text-coral' : 'text-jungle-bright',
      subtext: riskyStudents.length > 0 ? 'Students need nudging' : 'No at-risk students',
    },
    {
      label: 'Class Roster',
      value: students.length,
      icon: Users,
      tone: 'text-jungle-mid',
      subtext: `${classTotalPoints.toLocaleString()} total EcoPoints`,
    },
    {
      label: 'Avg Student Points',
      value: avgPoints,
      icon: Target,
      tone: 'text-lavender',
      subtext: 'Benchmark for class growth',
    },
  ];

  return (
    <motion.div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6" variants={stagger} initial="hidden" animate="visible">
      <motion.div
        variants={fadeUp}
        className="rounded-3xl p-6 md:p-7 text-white"
        style={{ background: 'linear-gradient(135deg, #0B3B2E 0%, #1B4332 45%, #2D6A4F 100%)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-jungle-light/80 font-heading font-bold">Teacher Command Center</p>
            <h1 className="font-display font-bold text-3xl mt-2">
              {getGreeting()}, {profile?.full_name?.split(' ')[0] ?? 'Teacher'}
            </h1>
            <p className="text-sm mt-2 text-jungle-light/90">
              Run reviews fast, identify stuck students, and guide class momentum.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/20 p-4 min-w-[210px]">
            <p className="text-xs uppercase tracking-[0.12em] text-jungle-light/80">Today</p>
            <p className="text-sm font-heading font-bold mt-1">
              {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs mt-2 text-jungle-light/80">
              {profile?.school_name || 'EcoQuest'} {profile?.city ? `· ${profile.city}` : ''}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-card rounded-2xl shadow-card p-5 border border-border/70">
            <div className="flex items-center justify-between gap-2">
              <p className="font-label text-muted-foreground uppercase">{card.label}</p>
              <card.icon className={`w-4 h-4 ${card.tone}`} />
            </div>
            <p className="font-display font-bold text-3xl text-foreground mt-2">{card.value}</p>
            <p className="text-xs mt-1 font-heading font-semibold text-muted-foreground">{card.subtext}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <motion.div variants={fadeUp} className="bg-card rounded-2xl shadow-card p-5 border border-border/70">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg text-foreground">Priority Review Queue</h2>
            <Link to="/teacher/submissions" className="text-sm text-primary font-heading font-semibold hover:underline flex items-center gap-1">
              Open full queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-heading font-semibold text-foreground">Queue clear</p>
              <p className="text-sm text-muted-foreground mt-1">No submissions waiting for review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.map((sub) => (
                <PendingCard
                  key={sub.id}
                  submission={sub}
                  studentName={getStudentName(sub.user_id)}
                  studentEmoji={getStudentEmoji(sub.user_id)}
                  onApprove={() => approveSubmission.mutate({ submissionId: sub.id, missionId: sub.mission_id, studentId: sub.user_id })}
                  onReject={() => rejectSubmission.mutate({ submissionId: sub.id, missionId: sub.mission_id, studentId: sub.user_id, reason: 'Needs revision' })}
                />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="bg-card rounded-2xl shadow-card p-5 border border-border/70">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Intervention Watchlist</h2>
          {riskyStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-heading font-semibold text-foreground">No urgent interventions</p>
              <p className="text-sm text-muted-foreground mt-1">Students are pacing well this week.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {riskyStudents.map((student: any) => (
                <Link
                  key={student.id}
                  to="/teacher/students"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-jungle-pale flex items-center justify-center text-sm">
                      {student.avatar_emoji || '🌱'}
                    </span>
                    <div>
                      <p className="font-heading font-semibold text-sm text-foreground">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">Needs support nudge</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono-stat font-bold text-coral">{student.eco_points} pts</span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="bg-card rounded-2xl shadow-card p-5 border border-border/70">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Weekly Class Momentum</h3>
            <span className="text-xs font-heading font-semibold text-muted-foreground">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={classWeekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Bar dataKey="points" fill="#2D6A4F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-card rounded-2xl shadow-card p-5 border border-border/70">
          <h3 className="font-heading font-bold text-foreground mb-4">Submission Pipeline</h3>
          <div className="space-y-4">
            <PipelineRow label="Pending" value={pendingCount} color="bg-sun-gold" total={Math.max(submissions.length, 1)} />
            <PipelineRow label="Approved" value={approvedSubmissions} color="bg-jungle-bright" total={Math.max(submissions.length, 1)} />
            <PipelineRow label="Rejected" value={rejectedSubmissions} color="bg-coral" total={Math.max(submissions.length, 1)} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">Use this to balance strictness and encouragement during review.</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="bg-card rounded-2xl shadow-card p-5 border border-border/70">
          <h3 className="font-heading font-bold text-foreground mb-4">Mission Performance Snapshot</h3>
          {topMissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No mission completion data yet.</p>
          ) : (
            <div className="space-y-2">
              {topMissions.map((mission) => (
                <div key={mission.id} className="grid grid-cols-[1fr_auto] gap-3 items-center p-3 rounded-xl bg-muted/35">
                  <div className="min-w-0">
                    <p className="text-sm font-heading font-semibold text-foreground truncate">{mission.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{mission.difficulty}</p>
                  </div>
                  <span className="text-sm font-mono-stat font-bold text-jungle-bright">{mission.completions} done</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="bg-card rounded-2xl shadow-card p-5 border border-border/70">
          <h3 className="font-heading font-bold text-foreground mb-4">Top Students This Week</h3>
          {topStudentsWeek.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity this week yet.</p>
          ) : (
            <div className="space-y-2">
              {topStudentsWeek.slice(0, 5).map((student) => (
                <Link
                  key={student.user_id}
                  to="/teacher/students"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-jungle-pale flex items-center justify-center text-sm">
                      {student.avatar_emoji}
                    </span>
                    <div>
                      <p className="font-heading font-semibold text-sm text-foreground">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">Rank #{student.rank}</p>
                    </div>
                  </div>
                  <span className="font-mono-stat text-sm font-bold text-jungle-bright">+{student.week_points}</span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function PipelineRow({ label, value, color, total }: { label: string; value: number; color: string; total: number }) {
  const percent = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-heading font-semibold text-foreground">{label}</span>
        <span className="font-mono-stat text-muted-foreground">{value} ({percent}%)</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function PendingCard({ submission, studentName, studentEmoji, onApprove, onReject }: {
  submission: any;
  studentName: string;
  studentEmoji: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  const missionTitle = (submission.missions as any)?.title ?? 'Mission';
  const photoUrl = submission.photo_url;
  const hasLocation = !!submission.location_coords;

  return (
    <div className="bg-muted/35 rounded-2xl p-4 border border-border/60">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-full bg-jungle-pale flex items-center justify-center text-lg shrink-0">
          {studentEmoji}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading font-bold text-sm text-foreground truncate">{studentName}</p>
            <p className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
            </p>
          </div>

          <p className="text-xs text-muted-foreground truncate mt-0.5">{missionTitle}</p>

          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${photoUrl ? 'bg-jungle-pale text-jungle-bright' : 'bg-muted text-muted-foreground'}`}>
              Photo
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${hasLocation ? 'bg-sky-blue/15 text-sky-blue' : 'bg-muted text-muted-foreground'}`}>
              <MapPin className="w-3 h-3" /> Location
            </span>
          </div>
        </div>

        {photoUrl && (
          <img
            src={photoUrl}
            alt="Proof"
            className="w-[56px] h-[56px] rounded-xl object-cover shrink-0"
          />
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={onApprove} className="rounded-lg bg-jungle-bright hover:bg-jungle-mid text-white font-heading font-bold text-xs px-3 flex-1">
          Approve
        </Button>
        <Button size="sm" variant="destructive" onClick={onReject} className="rounded-lg font-heading font-bold text-xs px-3 flex-1">
          Request Fix
        </Button>
      </div>
    </div>
  );
}
