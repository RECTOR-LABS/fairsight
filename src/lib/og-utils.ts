import type { Grade } from '@/types';
import { gradeColor } from '@/lib/scoring';

export const OG_THEME = {
  bg: '#09090b',        // zinc-950
  card: '#18181b',      // zinc-900
  border: '#27272a',    // zinc-800
  muted: '#a1a1aa',     // zinc-400
  dimmed: '#52525b',    // zinc-600
  text: '#ffffff',
  accent: '#10b981',    // emerald-500
  accentLight: '#34d399', // emerald-400
} as const;

export const GRADE_COLORS: Record<Grade, string> = {
  'A+': gradeColor('A+'),
  'A': gradeColor('A'),
  'B': gradeColor('B'),
  'C': gradeColor('C'),
  'D': gradeColor('D'),
  'F': gradeColor('F'),
};

let fontCache: ArrayBuffer | null = null;

export async function getInterFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(
    'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuBWYAZ9hiJ-Ek-_EeA.woff2',
  );
  fontCache = await res.arrayBuffer();
  return fontCache;
}
