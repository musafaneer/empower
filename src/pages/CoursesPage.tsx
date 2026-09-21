import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Star, BookOpen, Calculator, Brain, Target,
  DollarSign, TrendingUp, ArrowRight, Clock, User,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Course, Module, Lesson } from '@/types/database';

type CourseWithMeta = Course & {
  module_count: number;
  lesson_count: number;
};

const CATEGORY_META: Record<string, { icon: typeof Calculator; label: string }> = {
  'Mental Math': { icon: Calculator, label: 'Mental Math' },
  'Patented Methods': { icon: Brain, label: 'Patented Methods' },
  'Cognitive Training': { icon: Target, label: 'Cognitive Training' },
  'Financial Literacy': { icon: DollarSign, label: 'Financial Literacy' },
};

const LEVEL_META: Record<string, { color: string; bg: string; label: string }> = {
  beginner: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Beginner' },
  intermediate: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Intermediate' },
  advanced: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Advanced' },
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');

  useEffect(() => {
    (async () => {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: true });

      if (!courseData) {
        setLoading(false);
        return;
      }

      const courseId = courseData.map((c) => c.id);
      const { data: moduleData } = await supabase
        .from('modules')
        .select('id, course_id')
        .in('course_id', courseId);

      const moduleIds = (moduleData ?? []).map((m) => m.id);
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('id, module_id')
        .in('module_id', moduleIds.length > 0 ? moduleIds : ['00000000-0000-0000-0000-000000000000']);

      const lessonByModule = new Map<string, number>();
      (lessonData ?? []).forEach((l: Lesson) => {
        lessonByModule.set(l.module_id, (lessonByModule.get(l.module_id) ?? 0) + 1);
      });

      const moduleByCourse = new Map<string, number>();
      (moduleData ?? []).forEach((m: Module) => {
        moduleByCourse.set(m.course_id, (moduleByCourse.get(m.course_id) ?? 0) + 1);
      });

      const lessonByCourse = new Map<string, number>();
      (moduleData ?? []).forEach((m: Module) => {
        const count = lessonByCourse.get(m.course_id) ?? 0;
        lessonByCourse.set(m.course_id, count + (lessonByModule.get(m.id) ?? 0));
      });

      const enriched: CourseWithMeta[] = (courseData as Course[]).map((c) => ({
        ...c,
        module_count: moduleByCourse.get(c.id) ?? 0,
        lesson_count: lessonByCourse.get(c.id) ?? 0,
      }));

      setCourses(enriched);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(courses.map((c) => c.category)));
    return ['All', ...cats];
  }, [courses]);

  const levels = ['All', 'beginner', 'intermediate', 'advanced'];

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.short_description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || c.category === category;
      const matchesLevel = level === 'All' || c.level === level;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, search, category, level]);

  return (
    <div className="overflow-hidden">
      {/* Hero Header */}
      <section className="relative gradient-mesh border-b border-ink-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-700">
              <Calculator className="h-4 w-4" />
              Creative Education for a Creative Generation
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
              Course Catalog
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-600">
              Master mental math with patented abacus methods, the Zargelin Mathematical Chain,
              and concentration training — led by Dr. Omar Zargelin.
            </p>
          </div>

          {/* Quick Stats */}
          {!loading && (
            <div className="mt-10 flex flex-wrap gap-6">
              {[
                { icon: BookOpen, label: 'Courses', value: courses.length },
                { icon: Calculator, label: 'Patented Methods', value: 2 },
                { icon: User, label: 'Instructor', value: 'Dr. Zargelin' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-sm">
                  <stat.icon className="h-5 w-5 text-brand-500" />
                  <div>
                    <div className="font-display text-lg font-bold text-ink-900">{stat.value}</div>
                    <div className="text-xs text-ink-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Search + Filters */}
      <section className="sticky top-16 z-30 border-b border-ink-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12"
                placeholder="Search courses, methods, or topics..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const meta = cat !== 'All' ? CATEGORY_META[cat] : null;
                const Icon = meta?.icon ?? BookOpen;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                      category === cat
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                        : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium capitalize transition-all ${
                    level === lvl
                      ? 'bg-ink-900 text-white shadow-sm'
                      : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-500">
              {filtered.length} course{filtered.length !== 1 ? 's' : ''} found
            </p>
            {(search || category !== 'All' || level !== 'All') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategory('All');
                  setLevel('All');
                }}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-96 animate-shimmer shimmer-bg rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <BookOpen className="mx-auto h-14 w-14 text-ink-300" />
              <h3 className="mt-4 text-lg font-semibold text-ink-700">No courses found</h3>
              <p className="mt-1 text-sm text-ink-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course) => {
                const catMeta = CATEGORY_META[course.category];
                const CatIcon = catMeta?.icon ?? BookOpen;
                const levelMeta = LEVEL_META[course.level] ?? LEVEL_META.beginner;
                return (
                  <Link
                    key={course.id}
                    to={`/courses/${course.slug}`}
                    className="card group flex flex-col overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-48 overflow-hidden">
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className={`badge border ${levelMeta.bg} ${levelMeta.color}`}>
                          {levelMeta.label}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 shadow-sm backdrop-blur-sm">
                        <CatIcon className="h-4.5 w-4.5 text-brand-600" />
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-brand-600">{course.category}</span>
                        <span className="text-ink-300">·</span>
                        <span className="flex items-center gap-1 text-ink-400">
                          <Clock className="h-3 w-3" />
                          {course.lesson_count} lessons
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold leading-snug text-ink-900 line-clamp-2 group-hover:text-brand-700 transition-colors">
                        {course.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500 line-clamp-2">
                        {course.short_description}
                      </p>

                      {/* Footer */}
                      <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                            OZ
                          </div>
                          <div className="text-xs">
                            <div className="font-medium text-ink-700">{course.instructor_name}</div>
                            <div className="text-ink-400">Instructor</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-ink-400">
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            4.8
                          </span>
                          <span className="font-display text-base font-bold text-ink-900">
                            ${course.price}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hover CTA bar */}
                    <div className="flex items-center justify-center gap-2 bg-brand-600 py-0 text-sm font-semibold text-white transition-all duration-300 group-hover:py-3 group-hover:opacity-100 max-h-0 opacity-0 overflow-hidden group-hover:max-h-16">
                      View Course <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      {!loading && filtered.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-12 text-center shadow-2xl shadow-brand-600/20 sm:px-16">
              <div className="absolute inset-0 gradient-mesh opacity-30" />
              <div className="relative">
                <TrendingUp className="mx-auto h-10 w-10 text-white/80" />
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Earn While You Learn
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-brand-100">
                  Share your referral code and earn commissions up to 3 levels deep when others enroll.
                </p>
                <Link
                  to="/signup"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 active:scale-[0.98]"
                >
                  Get Your Referral Code <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
