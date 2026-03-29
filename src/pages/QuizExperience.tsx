import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Leaf, Loader2 } from 'lucide-react';
import { useQuizAttempts, useSaveQuizAttempt, useLearningTopics } from '@/hooks/useLearnData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface QuizQuestion {
  type: 'mcq' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

const normalizeAnswer = (a: string) => a.toLowerCase().trim();

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function buildFallbackQuestions(topicLabel: string): QuizQuestion[] {
  return [
    {
      type: 'mcq',
      question: `What is the main goal of learning about ${topicLabel}?`,
      options: ['To make informed eco-friendly choices', 'To avoid science completely', 'To increase pollution', 'To ignore environmental impact'],
      answer: 'To make informed eco-friendly choices',
      explanation: 'Environmental learning helps you make better daily and community decisions.',
    },
    {
      type: 'mcq',
      question: 'Which action usually helps reduce environmental harm?',
      options: ['Conserving resources', 'Burning more waste', 'Wasting electricity', 'Using single-use items only'],
      answer: 'Conserving resources',
      explanation: 'Conservation reduces pressure on ecosystems and lowers emissions.',
    },
    {
      type: 'mcq',
      question: 'Why are small daily eco-actions important?',
      options: ['They add up over time', 'They never matter', 'They only help one person', 'They increase waste'],
      answer: 'They add up over time',
      explanation: 'Consistent small actions create measurable long-term impact.',
    },
    {
      type: 'true_false',
      question: 'Individual choices can contribute to positive environmental outcomes.',
      options: ['True', 'False'],
      answer: 'True',
      explanation: 'Daily behavior changes are part of broader collective impact.',
    },
    {
      type: 'true_false',
      question: 'Learning environmental topics has no real-world value.',
      options: ['True', 'False'],
      answer: 'False',
      explanation: 'Environmental knowledge supports better actions, policy awareness, and habits.',
    },
    {
      type: 'fill_blank',
      question: `Protecting the environment requires both awareness and ____.` ,
      answer: 'action',
      explanation: 'Awareness matters, but action creates real change.',
    },
    {
      type: 'fill_blank',
      question: 'Reduce, Reuse, and ____ is a common sustainability principle.',
      answer: 'recycle',
      explanation: 'The 3Rs framework encourages responsible consumption and waste reduction.',
    },
  ];
}

export default function QuizExperience() {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const { data: topics = [] } = useLearningTopics();
  const topicInfo = topic ? topics.find((t) => t.id === topic) : null;
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: quizAttempts } = useQuizAttempts(topic);
  const saveQuizAttempt = useSaveQuizAttempt();
  
  const bestScore = quizAttempts?.[0]?.score;

  const startQuiz = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedAnswer(null);
    setFillBlankAnswer('');
    setShowExplanation(false);
    
    try {
      if (!user) {
        throw new Error('Please log in to take the quiz');
      }

      const { data: { session } } = await supabase.auth.getSession();

      // Local auth users may not have a Supabase session token available.
      // In that case, run a local fallback quiz so learning flow still works.
      if (!session) {
        const fallback = buildFallbackQuestions(topicInfo.title);
        setQuestions(fallback);
        setCurrentIdx(0);
        setScore(0);
        setQuizComplete(false);
        toast.message('Using practice quiz in offline mode.');
        return;
      }

      const response = await fetchWithTimeout(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ topic }),
        },
        2500
      );

      if (!response.ok) {
        const fallback = buildFallbackQuestions(topicInfo.title);
        setQuestions(fallback);
        setCurrentIdx(0);
        setScore(0);
        setQuizComplete(false);
        setError('AI quiz service unavailable. Loaded practice quiz instead.');
        toast.message('Loaded practice quiz instead of AI-generated quiz.');
        return;
      }

      const data = await response.json();
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        const fallback = buildFallbackQuestions(topicInfo.title);
        setQuestions(fallback);
        setCurrentIdx(0);
        setScore(0);
        setQuizComplete(false);
        setError('AI quiz returned empty data. Loaded practice quiz instead.');
        toast.message('Loaded practice quiz instead of AI-generated quiz.');
        return;
      }

      setQuestions(data.questions);
      setCurrentIdx(0);
      setScore(0);
      setQuizComplete(false);
    } catch (err) {
      if (!user) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
        toast.error('Please log in to take the quiz.');
      } else {
        const fallback = buildFallbackQuestions(topicInfo.title);
        setQuestions(fallback);
        setCurrentIdx(0);
        setScore(0);
        setQuizComplete(false);
        setError('AI quiz timed out or failed. Loaded practice quiz instead.');
        toast.message('Loaded practice quiz instead of AI-generated quiz.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answer);
    setShowExplanation(true);
    
    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(questions[currentIdx].answer);
    if (isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleFillBlankSubmit = () => {
    handleAnswer(fillBlankAnswer);
  };

  const nextQuestion = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedAnswer(null);
      setFillBlankAnswer('');
      setShowExplanation(false);
    } else {
      // Quiz complete
      setQuizComplete(true);
      
      try {
        const result = await saveQuizAttempt.mutateAsync({
          topic: topic!,
          score,
          totalQuestions: questions.length,
        });
        
        const isNewBest = !bestScore || score > bestScore;
        if (score === questions.length) {
          toast.success('Perfect score! Quiz Master! 🏆');
        } else if (isNewBest && bestScore !== undefined) {
          toast.success(`New best score! +${result.pointsEarned} EcoPoints 🌟`);
        } else {
          toast.success(`Quiz complete! +${result.pointsEarned} EcoPoints earned 🌿`);
        }
      } catch (err) {
        toast.error('Failed to save quiz results');
      }
    }
  };

  if (!topicInfo) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <p className="text-muted-foreground">Topic not found</p>
      </div>
    );
  }

  // Not started state
  if (questions.length === 0 && !isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <button 
          onClick={() => navigate(`/learn/${topic}`)} 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-heading font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {topicInfo.title}
        </button>

        <div className="rounded-2xl bg-card shadow-card p-8 text-center">
          <div className="text-6xl mb-4">{topicInfo.icon}</div>
          <h1 className="font-display font-black text-2xl text-foreground mb-2">
            {topicInfo.title} Quiz
          </h1>
          <p className="text-muted-foreground mb-6">
            Test your knowledge with 7 AI-generated questions
          </p>
          
          <div className="bg-primary/10 rounded-xl p-4 mb-6">
            <p className="text-sm text-foreground">
              <Leaf className="w-4 h-4 inline mr-1 text-primary" />
              Earn up to <span className="font-bold text-primary">+30 EcoPoints</span> based on your score
            </p>
            {bestScore !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                Your best score: {bestScore}/7
              </p>
            )}
          </div>

          {error && (
            <p className="text-destructive text-sm mb-4">{error}</p>
          )}

          <Button onClick={startQuiz} size="lg" className="font-heading font-bold">
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="rounded-2xl bg-card shadow-card p-12 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-4"
          >
            <Leaf className="w-12 h-12 text-primary" />
          </motion.div>
          <p className="text-lg font-heading text-muted-foreground">
            Preparing your quiz... 🌿
          </p>
        </div>
      </div>
    );
  }

  // Quiz complete state
  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const pointsEarned = Math.round((score / questions.length) * 30 / 10) * 10;
    const isNewBest = !bestScore || score > bestScore;

    let message = '';
    let emoji = '';
    if (score === questions.length) {
      message = "Perfect score! You're an Eco Expert!";
      emoji = '🌟';
    } else if (score >= 5) {
      message = 'Great job! You really know your stuff!';
      emoji = '🌿';
    } else if (score >= 3) {
      message = 'Good effort! Keep learning!';
      emoji = '🌱';
    } else {
      message = 'Keep practicing — every attempt makes you smarter!';
      emoji = '💪';
    }

    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-card shadow-card p-8 text-center"
        >
          <div className="text-6xl mb-4">{emoji}</div>
          
          {isNewBest && bestScore !== undefined && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-block bg-yellow-100 text-yellow-800 rounded-full px-4 py-1 text-sm font-bold mb-4"
            >
              🏆 New Best Score!
            </motion.div>
          )}
          
          <h2 className="font-display font-black text-5xl text-foreground mb-2">
            {score} / {questions.length}
          </h2>
          <p className="text-muted-foreground mb-2">correct ({percentage}%)</p>
          
          <p className="text-lg font-heading text-foreground mb-6">{message}</p>
          
          <div className="bg-primary/10 rounded-xl p-4 mb-8 inline-block">
            <p className="flex items-center gap-2 text-primary font-bold">
              <Leaf className="w-5 h-5" />
              +{pointsEarned} EcoPoints earned
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={startQuiz} variant="outline" className="font-heading font-bold">
              Try Again 🔄
            </Button>
            <Button onClick={() => navigate('/learn')} className="font-heading font-bold">
              Back to Topics →
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active quiz state
  const q = questions[currentIdx];
  const isCorrect = normalizeAnswer(selectedAnswer || '') === normalizeAnswer(q.answer);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(`/learn/${topic}`)} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-heading font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {topicInfo.title}
      </button>

      <div className="rounded-2xl bg-card shadow-card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-label">
              Question {currentIdx + 1} of {questions.length}
            </p>
            <p className="font-heading font-bold text-foreground">{topicInfo.title} Quiz</p>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
            Up to +30 pts
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 flex-1 rounded-full transition-all ${
                i < currentIdx ? 'bg-primary' : i === currentIdx ? 'bg-primary/50' : 'bg-border'
              }`} 
            />
          ))}
        </div>

        {/* Question */}
        <h3 className="font-display font-bold text-xl text-foreground mb-6 text-center">
          {q.question}
        </h3>

        {/* Options based on type */}
        {q.type === 'fill_blank' ? (
          <div className="space-y-4">
            <Input
              value={fillBlankAnswer}
              onChange={(e) => setFillBlankAnswer(e.target.value)}
              placeholder="Type your answer..."
              disabled={showExplanation}
              className="text-center text-lg h-14"
              onKeyDown={(e) => e.key === 'Enter' && !showExplanation && handleFillBlankSubmit()}
            />
            {!showExplanation && (
              <Button 
                onClick={handleFillBlankSubmit} 
                className="w-full font-heading font-bold"
                disabled={!fillBlankAnswer.trim()}
              >
                Submit Answer
              </Button>
            )}
          </div>
        ) : (
          <div className={`grid gap-3 ${q.type === 'true_false' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {(q.options || ['True', 'False']).map((opt, i) => {
              let style = 'border-border bg-card hover:border-primary/30 hover:bg-muted/30';
              
              if (showExplanation) {
                if (opt.toLowerCase() === q.answer.toLowerCase()) {
                  style = 'border-primary bg-primary/10';
                } else if (opt === selectedAnswer) {
                  style = 'border-destructive bg-destructive/10';
                }
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={showExplanation}
                  className={`p-4 rounded-xl border-2 text-left font-heading font-semibold text-foreground transition-all ${style}`}
                  whileTap={!showExplanation ? { scale: 0.97 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt}</span>
                    {showExplanation && opt.toLowerCase() === q.answer.toLowerCase() && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                    {showExplanation && opt === selectedAnswer && opt.toLowerCase() !== q.answer.toLowerCase() && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Explanation */}
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className={`p-4 rounded-xl ${isCorrect ? 'bg-primary/10' : 'bg-destructive/10'}`}>
              <p className={`font-heading font-bold text-sm mb-1 ${isCorrect ? 'text-primary' : 'text-destructive'}`}>
                {isCorrect ? '✓ Correct!' : `✗ The answer was: ${q.answer}`}
              </p>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
            
            <Button onClick={nextQuestion} className="w-full font-heading font-bold">
              {currentIdx < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
