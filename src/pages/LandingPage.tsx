import { Link } from 'react-router-dom';
import {
  Brain, GraduationCap, TrendingUp, Users, ShieldCheck,
  Zap, Target, Award, ArrowRight, CheckCircle2, Star, Network, DollarSign, Calculator,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/types/database';

export default function LandingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .limit(3)
      .then(({ data }) => {
        setCourses((data as Course[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative gradient-mesh">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Creative Education for a Creative Generation
            </div>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-5xl lg:text-6xl animate-fade-up">
              Transform your thinking.
              <span className="block bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
                Multiply your potential.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-ink-600 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Master mental math with patented abacus methods and the Zargelin Mathematical Chain —
              build focus, confidence, and financial literacy through the power of mental calculation.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/signup" className="btn-primary w-full sm:w-auto">
                Start Learning Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/courses" className="btn-secondary w-full sm:w-auto">
                Browse Courses
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-ink-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent-500" /> Instant access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {[
              { icon: GraduationCap, label: 'Active Courses', value: '6+' },
              { icon: Users, label: 'Learners', value: '12K+' },
              { icon: Award, label: 'Completion Rate', value: '87%' },
              { icon: Calculator, label: 'Patented Methods', value: '2' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <stat.icon className="h-6 w-6 text-brand-500" />
                <span className="font-display text-2xl font-bold text-ink-900">{stat.value}</span>
                <span className="text-sm text-ink-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Why Empower Brain?
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              We fuse education with modern technology to reach today's generation through interactive, purposeful, and engaging content.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: Calculator, title: 'Patented Methods', desc: 'Learn the Zargelin Mathematical Chain (ZMC) and RealFlow Multiplier Algorithm (RFMA) — methods that eliminate the need for memorizing multiplication tables.' },
              { icon: Brain, title: 'Mental Math Mastery', desc: 'Use mental imagery of an abacus to perform calculations in your mind — building speed, accuracy, and deep numerical fluency.' },
              { icon: Target, title: 'Focus & Concentration', desc: 'Through regular mental math practice, develop the ability to sustain concentration over longer periods and eliminate distractions.' },
              { icon: ShieldCheck, title: 'Led by Dr. Zargelin', desc: 'Learn directly from Dr. Omar Zargelin, the inventor of ZMC and RFMA, with decades of experience in mathematical education.' },
              { icon: Zap, title: 'Interactive Learning', desc: 'Access courses on any device, anytime. Practice with ZMC eLearning calculators and interactive learning games.' },
              { icon: TrendingUp, title: 'Financial Literacy', desc: 'Build real-world financial skills — quick calculation, budgeting, and confidence in everyday money management.' },
            ].map((feature, i) => (
              <div key={i} className="card group p-6 transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-ink-600">Three simple steps to start learning and earning.</p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              { step: '01', icon: GraduationCap, title: 'Enroll in a Course', desc: 'Choose from our catalog of mental math and abacus courses and start learning immediately.' },
              { step: '02', icon: Users, title: 'Share Your Link', desc: 'Get a unique referral code. Share it with friends, family, and your community.' },
              { step: '03', icon: DollarSign, title: 'Earn Commissions', desc: 'When your referrals enroll, you earn commissions up to 3 levels deep — automatically.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md">
                  <item.icon className="h-7 w-7 text-brand-600" />
                </div>
                <span className="mt-4 block font-display text-sm font-bold text-brand-500">{item.step}</span>
                <h3 className="mt-1 text-lg font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Featured Courses</h2>
              <p className="mt-3 text-lg text-ink-600">Start with our most popular mental math programs.</p>
            </div>
            <Link to="/courses" className="hidden btn-ghost sm:flex">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="card h-80 animate-shimmer shimmer-bg" />
                ))
              : courses.map((course) => (
                  <Link key={course.id} to={`/courses/${course.slug}`} className="card group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <div className="relative h-44 overflow-hidden">
                      {course.thumbnail_url && (
                        <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
                      <span className="absolute bottom-3 left-3 badge bg-white/90 text-ink-700 capitalize">{course.level}</span>
                      <span className="absolute bottom-3 right-3 badge bg-brand-600 text-white">${course.price}</span>
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-medium text-brand-600">{course.category}</span>
                      <h3 className="mt-1.5 text-base font-semibold leading-snug text-ink-900 line-clamp-2">{course.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500 line-clamp-2">{course.short_description}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
                        <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> 4.8</span>
                        <span>{course.instructor_name}</span>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>

          <div className="mt-10 text-center sm:hidden">
            <Link to="/courses" className="btn-secondary">View All Courses</Link>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="bg-ink-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Earn While You Learn</h2>
            <p className="mt-4 text-lg text-ink-400">
              Our three-level referral commission system rewards you for building a learning community.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { level: 'Level 1', rate: '20%', desc: 'Direct referrals — people who sign up using your code.', color: 'from-brand-500 to-brand-700' },
              { level: 'Level 2', rate: '10%', desc: 'Referrals of your referrals — your extended network.', color: 'from-accent-500 to-accent-700' },
              { level: 'Level 3', rate: '5%', desc: 'Third-degree connections — passive income potential.', color: 'from-ink-500 to-ink-700' },
            ].map((tier, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 p-8">
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${tier.color} text-2xl font-bold`}>
                  {tier.rate}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{tier.level}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{tier.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/signup" className="btn-primary">
              Get Your Referral Code <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-16 text-center shadow-2xl shadow-brand-600/30 sm:px-16">
            <div className="absolute inset-0 gradient-mesh opacity-30" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to empower your brain?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
                Join thousands of learners mastering mental math and building focus with Empower Brain.
              </p>
              <Link to="/signup" className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 active:scale-[0.98]">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" />
    </svg>
  );
}
