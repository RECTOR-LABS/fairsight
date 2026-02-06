'use client';

import type { ScoreBreakdown, Grade } from '@/types';
import { Shield, Users, BarChart3, MessageSquare } from 'lucide-react';

interface Props {
  score: number;
  grade: string;
  breakdown: ScoreBreakdown;
}

const gradeColors: Record<string, string> = {
  'A+': 'text-emerald-400 border-emerald-400',
  'A': 'text-emerald-400 border-emerald-400',
  'B': 'text-lime-400 border-lime-400',
  'C': 'text-yellow-400 border-yellow-400',
  'D': 'text-orange-400 border-orange-400',
  'F': 'text-red-400 border-red-400',
};

const gradeBg: Record<string, string> = {
  'A+': 'from-emerald-500/20 to-emerald-500/5',
  'A': 'from-emerald-500/20 to-emerald-500/5',
  'B': 'from-lime-500/20 to-lime-500/5',
  'C': 'from-yellow-500/20 to-yellow-500/5',
  'D': 'from-orange-500/20 to-orange-500/5',
  'F': 'from-red-500/20 to-red-500/5',
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = grade.startsWith('A') ? '#34d399' : grade === 'B' ? '#a3e635' : grade === 'C' ? '#facc15' : grade === 'D' ? '#fb923c' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className={`text-sm font-semibold ${gradeColors[grade]?.split(' ')[0] || 'text-zinc-400'}`}>
          {grade}
        </span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-zinc-400">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <span className="font-medium text-white">{value}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function FairSightScoreCard({ score, grade, breakdown }: Props) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-gradient-to-b ${gradeBg[grade] || gradeBg['F']} p-6`}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ScoreRing score={score} grade={grade} />

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">FairSight Score</h2>
            <p className="text-sm text-zinc-500">Reputation-weighted trust intelligence</p>
          </div>

          <div className="space-y-3">
            <BreakdownBar label="Reputation" value={breakdown.reputation} icon={Users} color="bg-emerald-500" />
            <BreakdownBar label="Security" value={breakdown.security} icon={Shield} color="bg-blue-500" />
            <BreakdownBar label="Market" value={breakdown.market} icon={BarChart3} color="bg-purple-500" />
            <BreakdownBar label="Community" value={breakdown.community} icon={MessageSquare} color="bg-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
