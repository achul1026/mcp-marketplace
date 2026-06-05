import type { VerifyResult } from './github';

export type RiskSignal = { code: string; label: string; weight: number };
export type RiskAssessment = { score: number; level: 'low' | 'medium' | 'high'; signals: RiskSignal[] };

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function assessRisk(v: VerifyResult): RiskAssessment {
  const signals: RiskSignal[] = [];

  if (v.status === 'failed') {
    signals.push({ code: 'unverified', label: 'GitHub verification failed', weight: 40 });
  }
  if (!v.has_readme) {
    signals.push({ code: 'no_readme', label: 'README missing', weight: 30 });
  } else if ((v.readme_length ?? 0) < 300) {
    signals.push({ code: 'thin_readme', label: 'README is very short (<300 chars)', weight: 15 });
  }
  if (!v.license) {
    signals.push({ code: 'no_license', label: 'No license declared', weight: 20 });
  }
  if (v.last_commit) {
    const age = Date.now() - new Date(v.last_commit).getTime();
    if (age > ONE_YEAR_MS) {
      signals.push({ code: 'stale', label: 'No commits in the last year', weight: 25 });
    }
  }

  const score = Math.min(100, signals.reduce((s, x) => s + x.weight, 0));
  const level: RiskAssessment['level'] = score >= 50 ? 'high' : score >= 20 ? 'medium' : 'low';
  return { score, level, signals };
}
