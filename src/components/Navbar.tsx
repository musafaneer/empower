import { Link, useNavigate } from 'react-router-dom';
import { Brain, LogOut, LayoutDashboard, BookOpen, Network, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30">
            <Brain className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink-900">
            Empower<span className="text-brand-600">Brain</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link to="/courses" className="btn-ghost">Courses</Link>
          {user && <Link to="/dashboard" className="btn-ghost">Dashboard</Link>}
          {user && <Link to="/network" className="btn-ghost">Referral Network</Link>}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-sm font-semibold text-brand-700">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-ink-700">{profile?.full_name || 'User'}</span>
              </div>
              <button onClick={handleSignOut} className="btn-ghost text-ink-500 hover:text-error-600">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Sign In</Link>
              <Link to="/signup" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-ink-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <Link to="/courses" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              <BookOpen className="h-4 w-4" /> Courses
            </Link>
            {user && (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link to="/network" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
                  <Network className="h-4 w-4" /> Referral Network
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-50">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            )}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1">Sign In</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="btn-primary flex-1">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
