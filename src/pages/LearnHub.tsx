import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLessons, useUserCompletions, useTopicProgress, useLearningTopics, getTopicGradientClass } from '@/hooks/useLearnData';
import { Skeleton } from '@/components/ui/skeleton';

function ProgressRing({ progress, size = 40, strokeWidth = 3, children }: { progress: number; size?: number; strokeWidth?: number; children?: React.ReactNode }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function LearnHub() {
  const { data: topics = [] } = useLearningTopics();
  const { data: lessons, isLoading: lessonsLoading } = useLessons();
  const { isLoading: completionsLoading } = useUserCompletions();
  const progressByTopic = useTopicProgress();

  const isLoading = lessonsLoading || completionsLoading;
  
  const totalLessons = lessons?.length || 0;
  const totalCompleted = Object.values(progressByTopic).reduce((sum, p) => sum + p.completed, 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="font-display font-black text-[32px] text-foreground">
            Learning Hub 📚
          </h1>
          <p className="text-muted-foreground">Choose a topic to start learning about sustainability</p>
        </motion.div>
        
        {!isLoading && totalLessons > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 text-primary px-4 py-2 rounded-full font-heading font-bold text-sm"
          >
            {totalCompleted} of {totalLessons} lessons completed
          </motion.div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          variants={stagger} 
          initial="hidden" 
          animate="visible"
        >
          {topics.map((topic) => {
            const progress = progressByTopic[topic.id] || { completed: 0, total: 0, percentage: 0 };
            const lessonCount = progress.total;

            return (
              <motion.div key={topic.id} variants={fadeUp}>
                <Link to={`/learn/${topic.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -6 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative rounded-2xl bg-gradient-to-br ${getTopicGradientClass(topic.color)} p-6 cursor-pointer h-48 flex flex-col justify-between shadow-card overflow-hidden group`}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                    
                    <div className="flex items-start justify-between relative z-10">
                      <span className="text-5xl">{topic.icon}</span>
                      <ProgressRing progress={progress.percentage} size={44} strokeWidth={3}>
                        <span className="text-[10px] font-mono text-white/90">{progress.percentage}%</span>
                      </ProgressRing>
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className="font-display font-bold text-white text-xl mb-1">{topic.title}</h3>
                      <span className="text-xs bg-white/20 text-white rounded-full px-3 py-1 font-heading font-bold">
                        {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
