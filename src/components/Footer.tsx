import { Link } from 'react-router-dom';
import { Brain, Mail, Phone, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-950 text-ink-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
                <Brain className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-lg font-bold text-white">
                Empower<span className="text-brand-400">Brain</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-400">
              Creative Education for a Creative Generation. Master mental math with patented abacus methods and the Zargelin Mathematical Chain.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Platform</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/courses" className="hover:text-brand-400 transition-colors">Browse Courses</Link></li>
              <li><Link to="/signup" className="hover:text-brand-400 transition-colors">Create Account</Link></li>
              <li><Link to="/login" className="hover:text-brand-400 transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@empowerbrain.org</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> (810) 295-4712</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> empowerbrain.org</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-800 pt-6 text-center text-sm text-ink-500">
          &copy; {new Date().getFullYear()} Empower Brain LLC. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
