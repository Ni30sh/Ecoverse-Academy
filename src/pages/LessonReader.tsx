import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Leaf, CheckCircle } from 'lucide-react';
import { useLesson, useUserCompletions, useCompleteLesson, useLearningTopics } from '@/hooks/useLearnData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface FactBox {
  text?: string;
  title?: string;
  content?: string;
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
}

function renderMarkdownBlock(body: string): string {
  const blocks = body.split('\n\n');
  return blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // Headers
    if (trimmed.startsWith('### ')) return `<h3 class="font-heading font-bold text-lg text-foreground mt-6 mb-2">${renderInline(trimmed.slice(4))}</h3>`;
    if (trimmed.startsWith('## ')) return `<h2 class="font-heading font-bold text-xl text-foreground mt-6 mb-2">${renderInline(trimmed.slice(3))}</h2>`;
    if (trimmed.startsWith('# ')) return `<h2 class="font-display font-bold text-2xl text-foreground mt-6 mb-3">${renderInline(trimmed.slice(2))}</h2>`;
    // List blocks
    const lines = trimmed.split('\n');
    const isListBlock = lines.every(l => /^[\-\*]\s/.test(l.trim()));
    if (isListBlock) {
      const items = lines.map(l => `<li>${renderInline(l.trim().replace(/^[\-\*]\s/, ''))}</li>`).join('');
      return `<ul class="list-disc pl-5 space-y-1 my-3">${items}</ul>`;
    }
    // Regular paragraph
    return `<p>${renderInline(trimmed)}</p>`;
  }).join('');
}

export default function LessonReader() {
  const { topic, lessonId } = useParams<{ topic: string; lessonId: string }>();
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { data: topics = [] } = useLearningTopics();
  
  const { data: lesson, isLoading: lessonLoading } = useLesson(lessonId || '');
  const { data: completions, isLoading: completionsLoading } = useUserCompletions();
  const completeLesson = useCompleteLesson();
  
  const isLoading = lessonLoading || completionsLoading;
  const topicInfo = topic ? topics.find((t) => t.id === topic) : null;
  const isCompleted = completions?.some(c => c.lesson_id === lessonId) || false;

  useEffect(() => {
    console.log('Lesson ID:', lessonId);
    console.log('Params:', { topic, lessonId });
  }, [topic, lessonId]);

  useEffect(() => {
    console.log('Data:', lesson);
  }, [lesson]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const contentTop = contentRef.current.offsetTop;
      const contentHeight = contentRef.current.offsetHeight;
      
      const scrolled = scrollTop - contentTop + clientHeight;
      const progress = Math.min(100, Math.max(0, (scrolled / contentHeight) * 100));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleComplete = async () => {
    if (!lesson || isCompleted) return;
    
    try {
      const result = await completeLesson.mutateAsync({
        lessonId: lesson.id,
        ecoPoints: lesson.eco_points_reward,
      });
      
      if (!result.alreadyCompleted) {
        toast.success(`Lesson complete! +${Number(lesson.eco_points_reward || 0)} EcoPoints earned 🌿`);
      }
    } catch (error) {
      toast.error('Failed to mark lesson as complete');
    }
  };

  if (!lessonId || !topic) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-3">
        <p className="text-muted-foreground">Missing lesson route information.</p>
        <button onClick={() => navigate('/learn')} className="text-primary hover:underline">
          ← Back to topics
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[600px] rounded-2xl" />
      </div>
    );
  }

  if (!lesson || !topicInfo) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <p className="text-muted-foreground">Lesson not found</p>
        <button onClick={() => navigate(`/learn/${topic}`)} className="text-primary hover:underline">
          ← Back to lessons
        </button>
      </div>
    );
  }

  const contentJson = (lesson as any).content_json;
  const lessonBody =
    typeof (lesson as any).body === 'string'
      ? (lesson as any).body
      : typeof contentJson?.body === 'string'
      ? contentJson.body
      : 'This lesson content is being prepared. Please check back soon.';
  const lessonSummary =
    typeof (lesson as any).summary === 'string'
      ? (lesson as any).summary
      : typeof contentJson?.summary === 'string'
      ? contentJson.summary
      : 'Lesson summary is currently unavailable.';
  const factBoxes = Array.isArray((lesson as any).fact_boxes)
    ? ((lesson as any).fact_boxes as FactBox[])
    : [];
  const keyTakeaways = Array.isArray((lesson as any).key_takeaways)
    ? ((lesson as any).key_takeaways as string[])
    : [];
  const estimatedMinutes = Number((lesson as any).estimated_minutes || 0);
  const ecoPointsReward = Number((lesson as any).eco_points_reward || 0);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Progress bar at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <motion.div 
          className="h-full bg-primary"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <button 
        onClick={() => navigate(`/learn/${topic}`)} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-heading font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {topicInfo.title}
      </button>

      <div ref={contentRef} className="rounded-2xl bg-card shadow-card p-6 md:p-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-muted rounded-full px-3 py-1 text-xs font-heading font-bold text-muted-foreground">
            Article
          </span>
          {isCompleted && (
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-heading font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Completed
            </span>
          )}
        </div>
        
        <h1 className="font-display font-black text-2xl md:text-3xl text-foreground mb-4">
          {lesson.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> {estimatedMinutes > 0 ? estimatedMinutes : 5} min read
          </span>
          <span className="flex items-center gap-1">
            <Leaf className="w-4 h-4 text-primary" /> +{ecoPointsReward} pts
          </span>
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground leading-relaxed mb-6">{lessonSummary}</p>
          
          <div 
            className="text-foreground/80 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdownBlock(lessonBody) }}
          />
        </div>

        {/* Fact Boxes */}
        {factBoxes.length > 0 && (
          <div className="mt-8 space-y-4">
            {factBoxes.map((fact, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-4"
              >
                <p className="font-heading font-bold text-sm text-primary mb-1">
                  💡 {fact.title || 'Did You Know?'}
                </p>
                <p className="text-sm text-foreground/80 italic">{fact.text || fact.content || ''}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Key Takeaways */}
        {keyTakeaways.length > 0 && (
          <div className="mt-8 p-5 bg-muted/50 rounded-xl">
            <h3 className="font-heading font-bold text-foreground mb-3">Key Takeaways:</h3>
            <ul className="space-y-2">
              {keyTakeaways.map((takeaway, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="text-primary mt-0.5">✓</span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Complete Button */}
        <div className="mt-10 pt-6 border-t">
          {isCompleted ? (
            <div className="flex items-center justify-center gap-2 text-primary font-heading font-bold">
              <CheckCircle className="w-5 h-5" />
              <span>Completed</span>
            </div>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={completeLesson.isPending}
              className="w-full h-14 text-lg font-heading font-bold rounded-xl"
            >
              {completeLesson.isPending ? (
                'Saving...'
              ) : (
                <>
                  Mark as Complete · +{ecoPointsReward} EcoPoints 🌿
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
