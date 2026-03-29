import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock, Leaf, Clock, HelpCircle } from 'lucide-react';
import { useLessons, useUserCompletions, useQuizAttempts, useLearningTopics } from '@/hooks/useLearnData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function TopicLessons() {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const { data: topics = [] } = useLearningTopics();
  const { data: lessons, isLoading: lessonsLoading } = useLessons(topic);
  const { data: completions, isLoading: completionsLoading } = useUserCompletions();
  const { data: quizAttempts } = useQuizAttempts(topic);
  
  const isLoading = lessonsLoading || completionsLoading;
  const topicInfo = topic ? topics.find((t) => t.id === topic) : null;
  
  if (!topicInfo) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Topic not found</p>
        <Link to="/learn" className="text-primary hover:underline">← Back to topics</Link>
      </div>
    );
  }
  
  const completedIds = new Set(completions?.map(c => c.lesson_id) || []);
  const completedCount = lessons?.filter(l => completedIds.has(l.id)).length || 0;
  const totalCount = lessons?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const hasCompletedAnyLesson = completedCount > 0;
  const bestQuizScore = quizAttempts?.[0]?.score;

  const handleLessonStart = (lessonId: string) => {
    console.log('Lesson ID:', lessonId);
    if (!topic || !lessonId) {
      navigate('/learn');
      return;
    }
    navigate(`/learn/${topic}/${lessonId}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/learn')} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-heading font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to topics
      </button>
      
      <div>
        <h1 className="font-display font-black text-2xl text-foreground mb-2">
          {topicInfo.icon} {topicInfo.title}
        </h1>
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground font-heading">
            {completedCount} of {totalCount} completed
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {lessons?.map((lesson, i) => {
            const isCompleted = completedIds.has(lesson.id);
            
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLessonStart(lesson.id)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-card shadow-card cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-heading font-bold ${
                        isCompleted 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : i + 1}
                      </div>
                      <div>
                        <p className="font-heading font-bold text-foreground">{lesson.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="bg-muted rounded-full px-2 py-0.5">Article</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {lesson.estimated_minutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Leaf className="w-3 h-3 text-primary" /> {lesson.eco_points_reward} pts
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={isCompleted ? 'outline' : 'default'}
                      className="rounded-lg font-heading font-bold"
                    >
                      {isCompleted ? 'Review' : 'Start'}
                    </Button>
                  </motion.div>
              </motion.div>
            );
          })}
          
          {/* Quiz Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (lessons?.length || 0) * 0.1 }}
          >
            {hasCompletedAnyLesson ? (
              <Link to={`/learn/${topic}/quiz`}>
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground cursor-pointer shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <HelpCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-lg">Take the Quiz</p>
                        <p className="text-sm text-primary-foreground/80">
                          Test your knowledge and earn bonus EcoPoints
                        </p>
                        {bestQuizScore !== undefined && (
                          <p className="text-xs mt-1 bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            Best: {bestQuizScore}/7
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-display font-bold">+30</span>
                      <p className="text-xs text-primary-foreground/80">max pts</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ) : (
              <div className="p-5 rounded-2xl bg-muted/50 border-2 border-dashed border-muted-foreground/20">
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-muted-foreground">Quiz Locked</p>
                      <p className="text-sm text-muted-foreground/80">
                        Complete a lesson to unlock the quiz
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
