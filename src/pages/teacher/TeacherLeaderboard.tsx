import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTeacherLeaderboardData, TimePeriod } from '@/hooks/useLeaderboardData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

export default function TeacherLeaderboard() {
  const [period, setPeriod] = useState<TimePeriod>('all_time');
  const { data, isLoading } = useTeacherLeaderboardData(period);

  const top3 = data?.top3 ?? [];
  const rest = data?.rest ?? [];
  const allEntries = data?.entries ?? [];
  const totalPoints = data?.totalPoints ?? 0;
  const totalStudents = data?.totalStudents ?? 0;
  const pointsChart = data?.pointsChart ?? [];
  const weeklyGrowth = data?.weeklyGrowth ?? [];

  return (
    <motion.div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6" initial="hidden" animate="visible" variants={stagger}>
      <motion.h1 variants={fadeUp} className="font-display font-bold text-3xl text-jungle-deep text-center">
        Class Leaderboard 🏆
      </motion.h1>

      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card shadow-card p-4 text-center">
          <p className="text-xs font-heading text-muted-foreground uppercase tracking-wider">Students</p>
          <p className="mt-1 text-2xl font-display font-bold text-foreground">{totalStudents}</p>
        </div>
        <div className="rounded-2xl bg-card shadow-card p-4 text-center">
          <p className="text-xs font-heading text-muted-foreground uppercase tracking-wider">Total EcoPoints</p>
          <p className="mt-1 text-2xl font-display font-bold text-jungle-bright">{totalPoints.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-card shadow-card p-4 text-center">
          <p className="text-xs font-heading text-muted-foreground uppercase tracking-wider">Avg Per Student</p>
          <p className="mt-1 text-2xl font-display font-bold text-foreground">
            {totalStudents > 0 ? Math.round(totalPoints / totalStudents).toLocaleString() : '0'}
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex justify-center gap-2">
        {([['all_time', 'All Time'], ['this_week', 'This Week'], ['this_month', 'This Month']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key as TimePeriod)}
            className={`px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all ${
              period === key
                ? 'bg-primary text-primary-foreground shadow-card'
                : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <>
          {allEntries.length === 0 && (
            <div className="rounded-2xl bg-card shadow-card p-10 text-center text-muted-foreground">No data available</div>
          )}

          {/* Top 3 highlight cards */}
          {top3.length > 0 && (
            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.map((student) => (
                <div
                  key={student.user_id}
                  className={`rounded-2xl border p-5 shadow-card ${student.rank === 1 ? 'bg-gradient-to-b from-sun-gold/15 to-card border-sun-gold/50 md:scale-[1.03]' : 'bg-card border-border'}`}
                >
                  <p className="text-xs font-heading text-muted-foreground">Rank #{student.rank}</p>
                  <p className="mt-1 text-lg font-display font-bold text-foreground truncate">{student.full_name}</p>
                  <p className="mt-2 text-2xl font-display font-bold text-jungle-bright">{student.eco_points.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-muted-foreground">🔥 Top performer</p>
                </div>
              ))}
            </motion.div>
          )}

          {allEntries.length > 0 && (
            <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl shadow-card p-4">
                <p className="text-sm font-heading font-bold text-foreground mb-3">Points Comparison</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pointsChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="points" fill="#2BB673" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card rounded-2xl shadow-card p-4">
                <p className="text-sm font-heading font-bold text-foreground mb-3">Weekly Growth</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyGrowth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="points" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* Table for remaining students */}
          {allEntries.length > 0 && (
            <motion.div variants={fadeUp} className="bg-card rounded-2xl shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Missions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEntries.map(student => (
                    <TableRow key={student.user_id}>
                      <TableCell className="font-mono-stat font-bold text-muted-foreground">{student.rank}</TableCell>
                      <TableCell className="font-heading font-bold text-sm">{student.full_name}</TableCell>
                      <TableCell className="text-right font-mono-stat font-bold text-jungle-bright">{student.eco_points.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-foreground/80">{student.missions_completed ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          )}

          {/* Class summary */}
          {allEntries.length > 0 && (
            <motion.div variants={fadeUp} className="bg-card rounded-2xl shadow-card p-6 text-center">
              <span className="text-4xl block mb-2">🌍</span>
              <p className="font-heading font-bold text-foreground">Your class is leading the way!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {totalStudents} students · {totalPoints.toLocaleString()} total EcoPoints
              </p>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
