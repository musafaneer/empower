import { useEffect, useState } from 'react';
import {
  Network, Users, DollarSign, TrendingUp, Copy, CheckCircle2,
  Share2, ChevronRight, ChevronDown, UserCircle, Award, Link2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { DownlineMember, UplineMember, Commission } from '@/types/database';

export default function NetworkPage() {
  const { profile } = useAuth();
  const [downline, setDownline] = useState<DownlineMember[]>([]);
  const [upline, setUpline] = useState<UplineMember[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.rpc('get_downline').then(({ data }) => setDownline((data as DownlineMember[]) ?? [])),
      supabase.rpc('get_upline').then(({ data }) => setUpline((data as UplineMember[]) ?? [])),
      supabase
        .from('commissions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setCommissions((data as Commission[]) ?? [])),
    ]).finally(() => setLoading(false));
  }, [profile]);

  const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code ?? ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const pendingAmount = commissions.filter((c) => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0);
  const paidAmount = commissions.filter((c) => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0);

  const levelCounts = [1, 2, 3].map((lvl) => downline.filter((d) => d.level === lvl).length);
  const levelEarnings = [1, 2, 3].map((lvl) =>
    commissions.filter((c) => c.level === lvl).reduce((sum, c) => sum + Number(c.amount), 0)
  );

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

  // Build tree structure from flat downline
  const childrenOf = (parentId: string) => downline.filter((d) => d.referred_by === parentId);

  const renderTreeNode = (member: DownlineMember, depth: number = 0) => {
    const children = childrenOf(member.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(member.id);

    return (
      <div key={member.id} className="relative">
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-ink-50"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleNode(member.id)} className="text-ink-400 hover:text-ink-700">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-sm font-semibold text-brand-700">
            {member.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{member.full_name || 'Unknown'}</p>
            <p className="text-xs text-ink-500">
              Level {member.level} &middot; {member.enrollment_count} enrollment{member.enrollment_count !== 1 ? 's' : ''}
              {member.earned_amount > 0 && <span className="text-accent-600 font-medium"> &middot; ${Number(member.earned_amount).toFixed(2)} earned</span>}
            </p>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const directReferrals = childrenOf(profile?.id ?? '');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Referral Network</h1>
          <p className="mt-1 text-sm text-ink-500">Track your downline, upline, and commission earnings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2.5">
            <Link2 className="h-4 w-4 text-brand-500" />
            <span className="font-mono text-sm font-semibold tracking-wider text-ink-700">{profile?.referral_code}</span>
          </div>
          <button onClick={copyLink} className="btn-primary">
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Network" value={downline.length.toString()} sub={`${levelCounts[0]} direct`} color="brand" />
        <StatCard icon={DollarSign} label="Total Earned" value={`$${totalEarned.toFixed(2)}`} sub={`$${pendingAmount.toFixed(2)} pending`} color="accent" />
        <StatCard icon={TrendingUp} label="Paid Out" value={`$${paidAmount.toFixed(2)}`} sub={`${commissions.length} commissions`} color="brand" />
        <StatCard icon={Network} label="Network Depth" value={`${downline.length > 0 ? Math.max(...downline.map((d) => d.level)) : 0}`} sub="levels deep" color="amber" />
      </div>

      {/* Share Banner */}
      <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-accent-600 to-accent-800 p-6 text-white shadow-lg shadow-accent-600/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Share & Earn</h3>
            </div>
            <p className="mt-1 text-sm text-accent-100">Earn 20% on direct referrals, 10% on level 2, and 5% on level 3.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur">
            <span className="text-sm text-accent-100">Your link:</span>
            <span className="font-mono text-sm font-medium truncate max-w-[200px]">{referralLink}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Downline Tree */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 p-4">
              <h3 className="text-sm font-semibold text-ink-900">Your Downline</h3>
              <p className="mt-0.5 text-xs text-ink-500">{downline.length} member{downline.length !== 1 ? 's' : ''} in your network</p>
            </div>
            <div className="p-3">
              {downline.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-ink-300" />
                  <h4 className="mt-3 text-sm font-semibold text-ink-700">No referrals yet</h4>
                  <p className="mt-1 text-xs text-ink-500">Share your referral link to start building your network.</p>
                </div>
              ) : (
                <div>
                  {/* Root node (you) */}
                  <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-2.5">
                    <button
                      onClick={() => toggleNode(profile?.id ?? '')}
                      className="text-brand-600"
                    >
                      {expandedNodes.has(profile?.id ?? '') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-700">{profile?.full_name || 'You'} (You)</p>
                      <p className="text-xs text-brand-600">{directReferrals.length} direct referral{directReferrals.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Award className="h-4 w-4 text-brand-400" />
                  </div>

                  {/* Tree */}
                  {expandedNodes.has(profile?.id ?? '') && (
                    <div className="mt-1 ml-2 border-l-2 border-ink-100 pl-1">
                      {directReferrals.map((member) => renderTreeNode(member, 0))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Commission History */}
          <div className="mt-6 card overflow-hidden">
            <div className="border-b border-ink-100 p-4">
              <h3 className="text-sm font-semibold text-ink-900">Commission History</h3>
            </div>
            {commissions.length === 0 ? (
              <div className="py-10 text-center">
                <DollarSign className="mx-auto h-8 w-8 text-ink-300" />
                <p className="mt-2 text-sm text-ink-500">No commissions yet. Share your link to start earning!</p>
              </div>
            ) : (
              <div className="divide-y divide-ink-100">
                {commissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 hover:bg-ink-50/50">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        c.level === 1 ? 'bg-brand-100 text-brand-600' :
                        c.level === 2 ? 'bg-accent-100 text-accent-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        <span className="text-xs font-bold">L{c.level}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900">Level {c.level} Commission</p>
                        <p className="text-xs text-ink-500">{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-accent-600">+${Number(c.amount).toFixed(2)}</span>
                      <span className={`badge ${c.status === 'paid' ? 'bg-accent-100 text-accent-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Level breakdown + Upline */}
        <div className="lg:col-span-1">
          {/* Level Breakdown */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-900">Earnings by Level</h3>
            <div className="mt-4 space-y-4">
              {[
                { level: 1, rate: '20%', count: levelCounts[0], earned: levelEarnings[0], color: 'from-brand-500 to-brand-700' },
                { level: 2, rate: '10%', count: levelCounts[1], earned: levelEarnings[1], color: 'from-accent-500 to-accent-700' },
                { level: 3, rate: '5%', count: levelCounts[2], earned: levelEarnings[2], color: 'from-amber-400 to-amber-600' },
              ].map((tier) => (
                <div key={tier.level} className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tier.color} text-sm font-bold text-white`}>
                    L{tier.level}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-700">Level {tier.level} ({tier.rate})</span>
                      <span className="text-sm font-bold text-ink-900">${tier.earned.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-ink-500">{tier.count} member{tier.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upline */}
          <div className="mt-4 card p-5">
            <h3 className="text-sm font-semibold text-ink-900">Your Upline</h3>
            {upline.length === 0 ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2.5 text-xs text-ink-500">
                <UserCircle className="h-4 w-4" />
                You joined without a referral code.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {upline.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-lg bg-ink-50/50 px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-200 text-xs font-semibold text-ink-700">
                      {member.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-700 truncate">{member.full_name || 'Unknown'}</p>
                      <p className="text-xs text-ink-500">Level {member.level} &middot; {member.referral_code}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="mt-4 card p-5">
            <h3 className="text-sm font-semibold text-ink-900">How Commissions Work</h3>
            <div className="mt-3 space-y-2 text-xs text-ink-500">
              <p className="flex gap-2"><span className="font-semibold text-brand-600">Level 1</span> — Someone signs up with your code and enrolls: you earn 20%.</p>
              <p className="flex gap-2"><span className="font-semibold text-accent-600">Level 2</span> — Your referral refers someone who enrolls: you earn 10%.</p>
              <p className="flex gap-2"><span className="font-semibold text-amber-600">Level 3</span> — Their referral enrolls someone: you earn 5%.</p>
              <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2">Commissions are calculated automatically when someone in your network enrolls in a paid course.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: typeof Users; label: string; value: string; sub: string; color: 'brand' | 'accent' | 'amber' }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    accent: 'bg-accent-50 text-accent-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-0.5 text-xs text-ink-400">{sub}</p>
    </div>
  );
}
