import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, TrendingUp, DollarSign, Users, ArrowRight,
  PlayCircle, CheckCircle2, Clock, Award, Network, Copy, Share2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { CourseWithProgress, Commission } from '@/types/database';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [enrollments, setEnrollments] = useState<CourseWithProgress[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingEarned, setPendingEarned] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      fetchEnrollments(),
      fetchCommissions(),
      fetchReferralCount(),
    ]).finally(() => setLoading(false));
  }, [profile]);

  const fetchEnrollments = async () => {
    const { data } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        courses (
          id, title, slug, short_description, thumbnail_url, category, level, price, instructor_name
        )
      `)
      .eq('user_id', profile!.id)
      .order('enrolled_at', { ascending: false });

    if (!data) return;

    const enriched: CourseWithProgress[] = [];
    for (const enrollment of data) {
      const course = enrollment.courses as unknown as CourseWithProgress;
      if (!course) continue;

      const { data: moduleIds } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', course.id);
      const mIds = (moduleIds ?? []).map((m: { id: string }) => m.id);

      let totalLessons = 0;
      let completedCount = 0;

      if (mIds.length > 0) {
        const { data: lessonIds } = await supabase
          .from('lessons')
          .select('id')
          .in('module_id', mIds);
        const lIds = (lessonIds ?? []).map((l: { id: string }) => l.id);
        totalLessons = lIds.length;

        if (lIds.length > 0) {
          const { count } = await supabase
            .from('lesson_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile!.id)
            .eq('is_completed', true)
            .in('lesson_id', lIds);
          completedCount = count ?? 0;
        }
      }

      enriched.push({
        ...course,
        enrollment_id: enrollment.id,
        progress_count: completedCount,
        total_lessons: totalLessons,
      });
    }
    setEnrollments(enriched);
  };

  const fetchCommissions = async () => {
    const { data } = await supabase
      .from('commissions')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false });

    setCommissions((data as Commission[]) ?? []);
    const earned = (data ?? []).reduce((sum, c: Commission) => sum + Number(c.amount), 0);
    const pending = (data ?? []).filter((c: Commission) => c.status === 'pending').reduce((sum, c: Commission) => sum + Number(c.amount), 0);
    setTotalEarned(earned);
    setPendingEarned(pending);
  };

  const fetchReferralCount = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', profile!.id);
    setReferralCount(count ?? 0);
  };

  const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code ?? ''}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-shimmer shimmer-bg rounded-lg" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-shimmer shimmer-bg rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Learner'}</h1>
          <p className="mt-1 text-sm text-ink-500">Continue your learning journey and track your progress.</p>
        </div>
        <Link to="/courses" className="btn-primary">
          <BookOpen className="h-4 w-4" /> Browse Courses
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Enrolled Courses" value={enrollments.length.toString()} color="brand" />
        <StatCard icon={Users} label="Direct Referrals" value={referralCount.toString()} color="accent" />
        <StatCard icon={DollarSign} label="Total Earnings" value={`$${totalEarned.toFixed(2)}`} color="brand" />
        <StatCard icon={Clock} label="Pending Commissions" value={`$${pendingEarned.toFixed(2)}`} color="amber" />
      </div>

      {/* Referral Banner */}
      <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lg shadow-brand-600/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Your Referral Code</h3>
            </div>
            <p className="mt-1 text-sm text-brand-100">Share your link and earn 20% on every enrollment.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur">
              <span className="font-mono text-sm font-semibold tracking-wider">{profile?.referral_code}</span>
            </div>
            <button onClick={copyReferralLink} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-50 active:scale-[0.98]">
              {copied ? <CheckCircle2 className="h-4 w-4 text-accent-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Your Courses</h2>
          <Link to="/network" className="btn-ghost text-brand-600">
            View Network <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="mt-4 card p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-ink-300" />
            <h3 className="mt-4 text-base font-semibold text-ink-700">No courses yet</h3>
            <p className="mt-1 text-sm text-ink-500">Browse our catalog and enroll in your first course.</p>
            <Link to="/courses" className="btn-primary mt-4">Browse Courses</Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((course) => {
              const pct = course.total_lessons > 0 ? Math.round((course.progress_count / course.total_lessons) * 100) : 0;
              return (
                <Link key={course.id} to={`/courses/${course.slug}`} className="card group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <div className="relative h-36 overflow-hidden">
                    {course.thumbnail_url && <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent" />
                    {pct === 100 && (
                      <span className="absolute top-3 right-3 badge bg-accent-500 text-white">
                        <Award className="h-3 w-3" /> Completed
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-medium text-brand-600">{course.category}</span>
                    <h3 className="mt-1 text-sm font-semibold leading-snug text-ink-900 line-clamp-2">{course.title}</h3>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-ink-500">
                        <span>{course.progress_count}/{course.total_lessons} lessons</span>
                        <span className="font-semibold text-ink-700">{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Commissions */}
      {commissions.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-ink-900">Recent Commissions</h2>
          <div className="mt-4 card overflow-hidden">
            <table className="w-full">
              <thead className="bg-ink-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {commissions.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-ink-50/50">
                    <td className="px-4 py-3 text-sm text-ink-700">Level {c.level}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-accent-600">+${Number(c.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${c.status === 'paid' ? 'bg-accent-100 text-accent-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof BookOpen; label: string; value: string; color: 'brand' | 'accent' | 'amber' }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    accent: 'bg-accent-50 text-accent-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}
