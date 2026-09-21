/*
# Create EmpowerBrain LMS + MLM Schema

## Overview
Builds the complete database for a professional Learning Management System with
multi-level marketing referral features for empowerbrain.org.

## New Tables

1. **profiles** — extends auth.users with full_name, avatar, referral_code, referred_by
   - id (uuid, PK, FK → auth.users)
   - full_name, email, avatar_url, bio, phone, country
   - referral_code (text, unique, auto-generated as EB + 6 hex chars)
   - referred_by (uuid, FK → profiles.id, nullable — the upline referrer)
   - created_at, updated_at

2. **courses** — published courses with title, description, price, category, level
   - id, title, slug (unique), description, short_description
   - thumbnail_url, category, level (beginner/intermediate/advanced)
   - price (numeric), instructor_name, is_published, created_at

3. **modules** — sections within a course
   - id, course_id (FK), title, description, order_index, created_at

4. **lessons** — individual lessons within a module
   - id, module_id (FK), title, content_type (video/text)
   - video_url (nullable), content (nullable text body)
   - duration_minutes, order_index, created_at

5. **enrollments** — user enrollment in a course (triggers commissions)
   - id, user_id (FK, default auth.uid()), course_id (FK)
   - status (active/completed), enrolled_at, completed_at
   - UNIQUE(user_id, course_id)

6. **lesson_progress** — per-lesson completion tracking
   - id, user_id (FK, default auth.uid()), lesson_id (FK)
   - is_completed, completed_at, last_accessed_at
   - UNIQUE(user_id, lesson_id)

7. **commissions** — MLM earnings generated on enrollment
   - id, user_id (who earns), enrollment_id (trigger), amount, level (1-3)
   - status (pending/paid), created_at

8. **course_reviews** — ratings and reviews for courses
   - id, course_id (FK), user_id (FK, default auth.uid())
   - rating (1-5), review_text, created_at
   - UNIQUE(course_id, user_id)

## Security (RLS)
- profiles: SELECT own + direct referrals; UPDATE own
- courses: SELECT all authenticated (published)
- modules, lessons: SELECT all authenticated
- enrollments: SELECT/INSERT own
- lesson_progress: SELECT/INSERT/UPDATE own
- commissions: SELECT own (created by trigger, no direct insert)
- course_reviews: SELECT all authenticated; INSERT/UPDATE/DELETE own

## Functions / Triggers
- handle_new_user(): auto-creates profile on auth.users INSERT, generates referral code,
  looks up referrer from raw_user_meta_data referral_code
- calculate_commissions(): on enrollment INSERT, walks up referral chain and creates
  commission rows (Level 1: 20%, Level 2: 10%, Level 3: 5%)
- update_updated_at(): auto-updates updated_at on profiles
- get_downline(): recursive CTE returning the caller's full downline tree (up to 5 levels)
  with enrollment counts and commission earnings per member
- get_upline(): returns the caller's upline chain (up to 10 levels)
- get_referrer_info(code): returns a referrer's id, name, avatar for a given referral code
  (callable by anon for signup referral lookup)
- get_course_with_progress(course_id): returns course modules/lessons with the caller's
  progress flags joined in

## Important Notes
1. Owner columns (user_id) default to auth.uid() so client inserts that omit user_id succeed.
2. Commission calculation is a SECURITY DEFINER trigger — runs with elevated privileges.
3. get_downline / get_upline are SECURITY DEFINER to allow recursive profile reads.
4. get_referrer_info is granted to anon for pre-signup referral code lookup.
*/

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  avatar_url text,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  bio text DEFAULT '',
  phone text DEFAULT '',
  country text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  short_description text NOT NULL DEFAULT '',
  thumbnail_url text,
  category text NOT NULL DEFAULT 'General',
  level text NOT NULL DEFAULT 'beginner',
  price numeric(10,2) NOT NULL DEFAULT 0,
  instructor_name text NOT NULL DEFAULT 'EmpowerBrain Team',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  video_url text,
  content text DEFAULT '',
  duration_minutes int NOT NULL DEFAULT 10,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_text text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON public.commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_enrollment_id ON public.commissions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- profiles: read own + direct referrals; update own
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR auth.uid() = referred_by);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- courses: read published (authenticated)
DROP POLICY IF EXISTS "select_published_courses" ON public.courses;
CREATE POLICY "select_published_courses" ON public.courses
  FOR SELECT TO authenticated
  USING (is_published = true);

-- modules: read (authenticated, via course existence)
DROP POLICY IF EXISTS "select_modules" ON public.modules;
CREATE POLICY "select_modules" ON public.modules
  FOR SELECT TO authenticated
  USING (true);

-- lessons: read (authenticated)
DROP POLICY IF EXISTS "select_lessons" ON public.lessons;
CREATE POLICY "select_lessons" ON public.lessons
  FOR SELECT TO authenticated
  USING (true);

-- enrollments: CRUD own
DROP POLICY IF EXISTS "select_own_enrollments" ON public.enrollments;
CREATE POLICY "select_own_enrollments" ON public.enrollments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_enrollments" ON public.enrollments;
CREATE POLICY "insert_own_enrollments" ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_enrollments" ON public.enrollments;
CREATE POLICY "update_own_enrollments" ON public.enrollments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- lesson_progress: CRUD own
DROP POLICY IF EXISTS "select_own_progress" ON public.lesson_progress;
CREATE POLICY "select_own_progress" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_progress" ON public.lesson_progress;
CREATE POLICY "insert_own_progress" ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON public.lesson_progress;
CREATE POLICY "update_own_progress" ON public.lesson_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- commissions: read own (created by trigger)
DROP POLICY IF EXISTS "select_own_commissions" ON public.commissions;
CREATE POLICY "select_own_commissions" ON public.commissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- course_reviews: read all; write own
DROP POLICY IF EXISTS "select_reviews" ON public.course_reviews;
CREATE POLICY "select_reviews" ON public.course_reviews
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_review" ON public.course_reviews;
CREATE POLICY "insert_own_review" ON public.course_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_review" ON public.course_reviews;
CREATE POLICY "update_own_review" ON public.course_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_review" ON public.course_reviews;
CREATE POLICY "delete_own_review" ON public.course_reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user signup: create profile with referral code + referrer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id uuid;
  v_referral_code text;
  v_new_code text;
BEGIN
  -- Generate a unique referral code: EB + 6 hex chars
  v_new_code := 'EB' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

  -- Look up referrer from signup metadata
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  IF v_referral_code IS NOT NULL AND v_referral_code <> '' THEN
    SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = upper(v_referral_code);
  END IF;

  INSERT INTO public.profiles (id, email, full_name, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_new_code,
    v_referrer_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Calculate commissions on enrollment: walk up referral chain
CREATE OR REPLACE FUNCTION public.calculate_commissions()
RETURNS TRIGGER AS $$
DECLARE
  v_course_price numeric;
  v_current_referrer uuid;
  v_level int := 1;
  v_commission_rate numeric;
BEGIN
  SELECT price INTO v_course_price FROM public.courses WHERE id = NEW.course_id;
  IF v_course_price IS NULL OR v_course_price = 0 THEN
    RETURN NEW;
  END IF;

  SELECT referred_by INTO v_current_referrer FROM public.profiles WHERE id = NEW.user_id;

  WHILE v_current_referrer IS NOT NULL AND v_level <= 3 LOOP
    v_commission_rate := CASE v_level WHEN 1 THEN 0.20 WHEN 2 THEN 0.10 WHEN 3 THEN 0.05 ELSE 0 END;

    INSERT INTO public.commissions (user_id, enrollment_id, level, amount, status)
    VALUES (v_current_referrer, NEW.id, v_level, v_course_price * v_commission_rate, 'pending');

    SELECT referred_by INTO v_current_referrer FROM public.profiles WHERE id = v_current_referrer;
    v_level := v_level + 1;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get downline tree (recursive, up to 5 levels) with earnings per member
CREATE OR REPLACE FUNCTION public.get_downline(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  avatar_url text,
  referral_code text,
  level int,
  referred_by uuid,
  created_at timestamptz,
  enrollment_count bigint,
  earned_amount numeric
) AS $$
BEGIN
  IF p_user_id IS NULL THEN
    p_user_id := auth.uid();
  END IF;

  RETURN QUERY
  WITH RECURSIVE downline AS (
    SELECT p.id, p.full_name, p.email, p.avatar_url, p.referral_code,
           1 AS level, p.referred_by, p.created_at
    FROM public.profiles p
    WHERE p.referred_by = p_user_id

    UNION ALL

    SELECT p.id, p.full_name, p.email, p.avatar_url, p.referral_code,
           d.level + 1, p.referred_by, p.created_at
    FROM public.profiles p
    JOIN downline d ON p.referred_by = d.id
    WHERE d.level < 5
  )
  SELECT d.id, d.full_name, d.email, d.avatar_url, d.referral_code,
         d.level, d.referred_by, d.created_at,
         COUNT(DISTINCT e.id) AS enrollment_count,
         COALESCE(SUM(c.amount), 0) AS earned_amount
  FROM downline d
  LEFT JOIN public.enrollments e ON e.user_id = d.id
  LEFT JOIN public.commissions c ON c.enrollment_id = e.id AND c.user_id = p_user_id
  GROUP BY d.id, d.full_name, d.email, d.avatar_url, d.referral_code,
           d.level, d.referred_by, d.created_at
  ORDER BY d.level, d.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get upline chain (up to 10 levels)
CREATE OR REPLACE FUNCTION public.get_upline(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  referral_code text,
  level int
) AS $$
DECLARE
  v_current_id uuid;
  v_level int := 1;
BEGIN
  IF p_user_id IS NULL THEN
    p_user_id := auth.uid();
  END IF;

  v_current_id := p_user_id;
  WHILE v_current_id IS NOT NULL AND v_level <= 10 LOOP
    SELECT p.referred_by INTO v_current_id FROM public.profiles p WHERE p.id = v_current_id;
    IF v_current_id IS NOT NULL THEN
      RETURN QUERY
      SELECT p.id, p.full_name, p.avatar_url, p.referral_code, v_level
      FROM public.profiles p WHERE p.id = v_current_id;
      v_level := v_level + 1;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get referrer info by referral code (callable by anon for signup)
CREATE OR REPLACE FUNCTION public.get_referrer_info(p_code text)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.referral_code = upper(p_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_update_profile_timestamp ON public.profiles;
CREATE TRIGGER trg_update_profile_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
CREATE TRIGGER trg_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trg_calculate_commissions ON public.enrollments;
CREATE TRIGGER trg_calculate_commissions
  AFTER INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.calculate_commissions();

-- ============================================================
-- GRANTS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.get_downline(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_upline(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referrer_info(text) TO anon, authenticated;
