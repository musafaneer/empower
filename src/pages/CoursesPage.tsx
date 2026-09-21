import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, BookOpen, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/types/database';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setCourses((data as Course[]) ?? []);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(courses.map((c) => c.category)));
    return ['All', ...cats];
  }, [courses]);

  const levels = ['All', 'beginner', 'intermediate', 'advanced'];

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.short_description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || c.category === category;
      const matchesLevel = level === 'All' || c.level === level;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, search, category, level]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Course Catalog</h1>
        <p className="mt-3 text-lg text-ink-500">Master mental math with patented abacus methods, the ZMC, and concentration training.</p>
      </div>

      {/* Search + Filters */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11"
            placeholder="Search courses..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-ink-500">
            <Filter className="h-4 w-4" /> Category:
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-ink-500">
            <Filter className="h-4 w-4" /> Level:
          </div>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                level === lvl
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="mt-6 text-sm text-ink-500">{filtered.length} course{filtered.length !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-80 animate-shimmer shimmer-bg rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 card p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-ink-300" />
          <h3 className="mt-4 text-base font-semibold text-ink-700">No courses found</h3>
          <p className="mt-1 text-sm text-ink-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
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
      )}
    </div>
  );
}
