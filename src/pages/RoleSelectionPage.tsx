import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, ShieldCheck, Users } from 'lucide-react';

const roleCards = [
	{
		role: 'student',
		title: 'Student',
		icon: GraduationCap,
		description: 'Join missions, learn eco-friendly habits, and earn EcoPoints.',
		href: '/login-student',
		className: 'border-emerald-500/50 bg-gradient-to-b from-emerald-100/95 via-emerald-100/80 to-teal-100/70 hover:from-emerald-100 hover:via-emerald-200/80 hover:to-teal-200/70 dark:border-emerald-400/45 dark:from-emerald-900/45 dark:via-emerald-950/35 dark:to-teal-950/45 dark:hover:from-emerald-900/55 dark:hover:via-emerald-900/45 dark:hover:to-teal-900/55',
		accent: 'text-emerald-800 dark:text-emerald-300',
	},
	{
		role: 'teacher',
		title: 'Teacher',
		icon: Users,
		description: 'Create missions, review submissions, and inspire your class.',
		href: '/login-teacher',
		className: 'border-blue-500/50 bg-gradient-to-b from-blue-100/95 via-sky-100/80 to-indigo-100/70 hover:from-blue-100 hover:via-sky-200/80 hover:to-indigo-200/70 dark:border-blue-400/45 dark:from-blue-900/45 dark:via-sky-950/35 dark:to-indigo-950/45 dark:hover:from-blue-900/55 dark:hover:via-blue-900/45 dark:hover:to-indigo-900/55',
		accent: 'text-blue-800 dark:text-blue-300',
	},
	{
		role: 'admin',
		title: 'Administrator',
		icon: ShieldCheck,
		description: 'Manage schools, teachers, missions, and system analytics.',
		href: '/login-admin',
		className: 'border-violet-500/50 bg-gradient-to-b from-violet-100/95 via-fuchsia-100/80 to-purple-100/70 hover:from-violet-100 hover:via-fuchsia-200/80 hover:to-purple-200/70 dark:border-violet-400/45 dark:from-violet-900/45 dark:via-fuchsia-950/35 dark:to-purple-950/45 dark:hover:from-violet-900/55 dark:hover:via-violet-900/45 dark:hover:to-purple-900/55',
		accent: 'text-violet-800 dark:text-violet-300',
	},
] as const;

export default function RoleSelectionPage() {
	return (
		<div className="min-h-screen bg-gradient-warm px-6 py-10 lg:py-16">
			<div className="mx-auto w-full max-w-5xl">
				<div className="text-center">
					<h1 className="font-display font-bold text-jungle-deep text-5xl leading-tight dark:text-slate-100">🌍 EcoQuest</h1>
					<p className="mt-4 text-2xl text-foreground/90">Choose your role to get started</p>
					<p className="mt-2 text-foreground/75 dark:text-slate-300">Select how you'll participate in our mission to save the planet</p>
				</div>

				<div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
					{roleCards.map((card, index) => {
						const Icon = card.icon;
						return (
							<motion.div
								key={card.role}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.35, delay: index * 0.08 }}
								className={`rounded-3xl border p-7 shadow-card transition-colors ${card.className}`}
							>
								<Icon className={`h-11 w-11 ${card.accent}`} />
								<h2 className="mt-6 font-display text-3xl font-bold text-foreground dark:text-slate-100">{card.title}</h2>
								<p className="mt-4 min-h-20 text-base leading-7 text-foreground/75 dark:text-slate-300">{card.description}</p>

								<Link
									to={card.href}
									className="mt-7 flex items-center justify-between border-t border-foreground/25 pt-5 font-heading text-lg font-bold text-foreground/90 dark:border-slate-200/20 dark:text-slate-100"
								>
									<span>Get Started</span>
									<ArrowRight className="h-6 w-6" />
								</Link>
							</motion.div>
						);
					})}
				</div>

				<div className="mt-10 text-center text-lg">
					<p className="text-foreground/80 dark:text-slate-300">
						New to EcoQuest?{' '}
						<Link to="/student/signup" className="font-heading font-bold text-emerald-700 hover:underline dark:text-emerald-300">
							Sign up here
						</Link>
					</p>
					<p className="mt-2 text-foreground/80 dark:text-slate-300">
						Already have an account?{' '}
						<Link to="/login-student" className="font-heading font-bold text-emerald-700 hover:underline dark:text-emerald-300">
							Log in directly
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
