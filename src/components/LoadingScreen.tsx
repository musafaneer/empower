import { Brain } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 animate-pulse-slow items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30">
          <Brain className="h-7 w-7 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-sm font-medium text-ink-400">Loading...</p>
      </div>
    </div>
  );
}
