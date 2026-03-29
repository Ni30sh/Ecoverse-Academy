import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Target, TreePine, Trophy, BookOpen, Sparkles, Star, Sun, Moon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target]);
  return <span ref={ref} className="font-mono-stat font-bold text-jungle-bright">{count.toLocaleString()}{suffix}</span>;
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-border/30 bg-card/80 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span className="font-display font-bold text-jungle-deep text-xl">EcoQuest</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-heading font-semibold text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Stories</a>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl gap-2">
                {theme === 'light' ? <Sun className="h-4 w-4" /> : theme === 'dark' ? <Moon className="h-4 w-4" /> : <Leaf className="h-4 w-4" />}
                <span className="hidden md:inline capitalize">{theme}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('eco')}>
                <Leaf className="mr-2 h-4 w-4" /> Eco
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-heading font-semibold text-jungle-deep">Log In</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="font-heading font-bold rounded-lg">Sign Up Free</Button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative px-6 md:px-12 py-20 md:py-28 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div className="lg:col-span-7" variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-jungle-pale px-4 py-1.5 text-sm font-heading font-bold text-jungle-bright mb-6">
              <Leaf className="w-4 h-4" /> 1M+ Students Worldwide
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display font-black text-5xl md:text-7xl text-jungle-deep leading-[1.05] tracking-tight mb-6">
              Learning that<br />grows with you.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-lg leading-relaxed mb-8">
              Complete eco missions. Grow your forest. Save the planet.
              EcoQuest makes environmental learning genuinely addictive.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <Link to="/signup">
                <Button size="lg" className="font-heading font-bold text-base px-7 py-6 rounded-xl shadow-card">
                  Start Your Quest <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="font-heading font-bold text-base px-7 py-6 rounded-xl border-jungle-mid text-jungle-deep">
                  See How It Works
                </Button>
              </a>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['🧑‍🌾', '👩‍🔬', '🧑‍🏫'].map((a, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-jungle-pale border-2 border-card flex items-center justify-center text-sm">{a}</div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Join <strong className="text-foreground">50,000+</strong> students already questing</p>
            </motion.div>
          </motion.div>
          <motion.div
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="absolute -inset-10 bg-jungle-pale rounded-full opacity-30 blur-3xl" />
            <div className="relative bg-card rounded-3xl shadow-float p-4 border border-border" style={{ transform: 'perspective(1000px) rotateY(-6deg) rotateX(2deg)' }}>
              <div className="bg-gradient-warm rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌿</span>
                    <span className="font-display font-bold text-jungle-deep text-sm">Dashboard</span>
                  </div>
                  <div className="bg-jungle-pale rounded-full px-3 py-1 text-xs font-mono-stat font-bold text-jungle-bright">2,750 pts</div>
                </div>
                <div className="bg-bg-dark-panel rounded-xl p-3 aspect-video flex items-center justify-center">
                  <span className="text-4xl">🌳🦌🦋</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-card rounded-xl p-3 shadow-card border-l-4 border-l-jungle-bright">
                    <p className="text-[10px] font-label text-muted-foreground">Level</p>
                    <p className="font-mono-stat font-bold text-foreground">5</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 shadow-card border-l-4 border-l-sun-gold">
                    <p className="text-[10px] font-label text-muted-foreground">Streak</p>
                    <p className="font-mono-stat font-bold text-foreground">12🔥</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Ticker */}
      <section className="bg-bg-dark-panel py-5 overflow-hidden">
        <p className="text-center text-xs font-label text-jungle-pale/70 mb-3">Trusted by students at schools across 30+ countries</p>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, rep) => (
            <div key={rep} className="flex items-center gap-12 px-6">
              {['Green Valley Academy', 'Sunrise International', 'Nordic Nature School', 'Cambridge Eco Hub', 'Tokyo Green Academy', 'Berlin Sustainability School'].map(name => (
                <span key={`${rep}-${name}`} className="text-sm font-heading font-bold text-jungle-pale/50">{name}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-jungle-deep mb-4">
              Everything you need to go green
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Gamified learning, real-world missions, and a growing virtual ecosystem.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <TreePine className="w-6 h-6" />, title: 'Ecosystem Growth', desc: 'Watch your virtual forest evolve from barren land to a thriving paradise as you earn EcoPoints.', color: 'bg-jungle-pale text-jungle-bright' },
              { icon: <Target className="w-6 h-6" />, title: 'Daily Missions', desc: 'Complete real-world sustainability challenges. Plant trees, reduce waste, save water.', color: 'bg-sky-blue/10 text-sky-blue' },
              { icon: <Sparkles className="w-6 h-6" />, title: 'AI EcoTutor', desc: 'Get personalized mission recommendations and carbon footprint analysis from our AI.', color: 'bg-lavender/10 text-lavender' },
              { icon: <Trophy className="w-6 h-6" />, title: 'Leaderboards', desc: 'Compete with students and schools worldwide. Climb the ranks and earn legendary badges.', color: 'bg-sun-gold/10 text-sun-gold' },
              { icon: <BookOpen className="w-6 h-6" />, title: 'Learn & Quiz', desc: 'Interactive lessons, quizzes, and mini-games covering climate, energy, and biodiversity.', color: 'bg-coral/10 text-coral' },
              { icon: <Leaf className="w-6 h-6" />, title: 'Real Rewards', desc: 'Redeem EcoPoints for certificates, eco-products, and scholarships.', color: 'bg-earth-warm/10 text-earth-warm' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl bg-card shadow-card p-6 border border-border/50 transition-all cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-heading font-bold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                <a href="#" className="text-sm font-heading font-semibold text-primary mt-3 inline-flex items-center gap-1 hover:underline">
                  Learn more <ArrowRight className="w-3 h-3" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 md:px-12 bg-bg-elevated">
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="font-display font-bold text-3xl text-jungle-deep text-center mb-16">
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Dotted connector line */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-jungle-light/30" />
            {[
              { num: '01', title: 'Sign Up', desc: 'Create your account and choose your interests.' },
              { num: '02', title: 'Complete Missions', desc: 'Take on real-world eco challenges.' },
              { num: '03', title: 'Grow Your Forest', desc: 'Watch your ecosystem evolve.' },
              { num: '04', title: 'Earn Rewards', desc: 'Redeem points for real-world prizes.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`text-center rounded-2xl p-6 ${i % 2 === 0 ? 'bg-card shadow-card' : 'bg-jungle-pale'}`}
              >
                <div className="font-display font-black text-4xl text-jungle-light/30 mb-3">{step.num}</div>
                <h3 className="font-heading font-bold text-foreground text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="font-display font-bold text-3xl text-jungle-deep text-center mb-16">
            What students are saying
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya S.', school: 'Sunrise International', quote: 'EcoQuest made me actually care about the environment. The missions are so fun!', rotate: 'rotate-1' },
              { name: 'Erik L.', school: 'Nordic Nature School', quote: 'Watching my ecosystem grow from a tiny seed to a forest is incredibly satisfying.', rotate: '-rotate-1' },
              { name: 'Maya C.', school: 'Green Valley Academy', quote: 'The leaderboard keeps me motivated every day. Best school app ever!', rotate: 'rotate-1' },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl bg-card shadow-card p-6 border border-border/50 ${t.rotate}`}
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array(5).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-sun-gold text-sun-gold" />)}
                </div>
                <p className="font-heading italic text-foreground mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-jungle-pale flex items-center justify-center text-lg font-bold text-jungle-deep">{t.name[0]}</div>
                  <div>
                    <p className="font-heading font-bold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.school}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-3xl bg-jungle-pale p-12 shadow-card"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl text-jungle-deep mb-4">
            Ready to save the planet?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of students making a real difference. Your journey starts with a single seed.
          </p>
          <Link to="/signup">
            <Button size="lg" className="font-heading font-bold text-lg px-10 py-6 rounded-xl shadow-card">
              Start as a 🌱 Seed <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-dark-panel py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🌿</span>
                <span className="font-display font-bold text-xl" style={{ color: 'hsl(var(--bg-elevated))' }}>EcoQuest</span>
              </div>
              <p className="text-sm" style={{ color: 'hsl(var(--jungle-light))' }}>Making environmental education genuinely addictive.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Missions', 'Leaderboard', 'Rewards'] },
              { title: 'Learn', links: ['Climate Change', 'Biodiversity', 'Energy', 'Water'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            ].map(group => (
              <div key={group.title}>
                <h4 className="font-heading font-bold text-sm mb-3" style={{ color: 'hsl(var(--bg-elevated))' }}>{group.title}</h4>
                <ul className="space-y-2">
                  {group.links.map(link => (
                    <li key={link}><a href="#" className="text-sm hover:underline" style={{ color: 'hsl(var(--jungle-light))' }}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t pt-6" style={{ borderColor: 'hsl(var(--jungle-mid))' }}>
            <p className="text-center text-sm" style={{ color: 'hsl(var(--jungle-light))' }}>© 2025 EcoQuest — Making Earth Cool Again 🌍</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
