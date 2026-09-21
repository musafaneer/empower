export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail_url: string | null;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  instructor_name: string;
  is_published: boolean;
  created_at: string;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'text';
  video_url: string | null;
  content: string;
  duration_minutes: number;
  order_index: number;
  created_at: string;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'completed';
  enrolled_at: string;
  completed_at: string | null;
  created_at: string;
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  last_accessed_at: string;
  created_at: string;
};

export type Commission = {
  id: string;
  user_id: string;
  enrollment_id: string;
  amount: number;
  level: number;
  status: 'pending' | 'paid';
  created_at: string;
};

export type CourseReview = {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  referral_code: string;
  referred_by: string | null;
  bio: string;
  phone: string;
  country: string;
  created_at: string;
  updated_at: string;
};

export type DownlineMember = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  referral_code: string;
  level: number;
  referred_by: string | null;
  created_at: string;
  enrollment_count: number;
  earned_amount: number;
};

export type UplineMember = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  referral_code: string;
  level: number;
};

export type CourseWithProgress = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  thumbnail_url: string | null;
  category: string;
  level: string;
  price: number;
  instructor_name: string;
  enrollment_id: string | null;
  progress_count: number;
  total_lessons: number;
};
