/**
 * Client-side "AI" insights engine. Heuristic scoring over the asset portfolio —
 * failure-risk prediction, procurement recommendations and depreciation projection.
 * Pure functions so they are trivially testable and backend-portable.
 */
import type { Asset, MaintenanceRecord } from './types';

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

const monthsSince = (d?: string) => (d ? (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30.4) : 0);

const CONDITION_WEIGHT: Record<string, number> = { NEW: 0, EXCELLENT: 0.05, GOOD: 0.18, FAIR: 0.55, POOR: 0.9 };

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface RiskResult {
  asset: Asset;
  score: number; // 0–100
  severity: Severity;
  reasons: string[];
  recommendation: string;
}

const severityOf = (score: number): Severity =>
  score >= 70 ? 'Critical' : score >= 45 ? 'High' : score >= 25 ? 'Medium' : 'Low';

export const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  High: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  Medium: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30',
  Low: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
};

/** Predict failure/attention risk for a single asset. */
export function computeAssetRisk(asset: Asset, correctiveCount: number): RiskResult {
  const usefulMonths = Math.max(12, (asset.usefulLifeYears ?? 5) * 12);
  const age = monthsSince(asset.purchaseDate);
  const ageRatio = clamp(age / usefulMonths, 0, 1.2);
  const cond = CONDITION_WEIGHT[asset.condition] ?? 0.2;
  const warrantyExpired = asset.warrantyExpiry ? new Date(asset.warrantyExpiry) < new Date() : false;
  const maint = clamp(correctiveCount / 3);

  let score = 100 * clamp(0.42 * Math.min(ageRatio, 1) + 0.3 * cond + 0.14 * (warrantyExpired ? 1 : 0) + 0.14 * maint);
  if (asset.condition === 'POOR' || asset.status === 'DAMAGED') score = Math.max(score, 72);
  if (asset.status === 'LOST') score = Math.max(score, 85);
  score = Math.round(clamp(score / 100) * 100);

  const reasons: string[] = [];
  if (ageRatio >= 0.8) reasons.push(`${Math.round(age / 12 * 10) / 10} yrs old — near end of useful life`);
  else if (ageRatio >= 0.5) reasons.push('Mid-life asset');
  if (cond >= 0.5) reasons.push(`${asset.condition.toLowerCase()} condition`);
  if (warrantyExpired) reasons.push('Warranty expired');
  if (correctiveCount >= 2) reasons.push(`${correctiveCount} corrective repairs`);
  if (asset.status === 'DAMAGED' || asset.status === 'LOST') reasons.push(`Currently ${asset.status.toLowerCase()}`);
  if (!reasons.length) reasons.push('Healthy — no action needed');

  const severity = severityOf(score);
  const recommendation =
    severity === 'Critical' ? 'Plan replacement / decommission' :
    severity === 'High' ? 'Schedule inspection & budget replacement' :
    severity === 'Medium' ? 'Monitor at next service cycle' : 'No action required';

  return { asset, score, severity, reasons: reasons.slice(0, 3), recommendation };
}

/** Rank the whole portfolio by risk. */
export function buildWatchlist(assets: Asset[], maintenance: MaintenanceRecord[]): RiskResult[] {
  const correctiveByAsset = new Map<string, number>();
  for (const m of maintenance) {
    if (m.type === 'CORRECTIVE' || m.type === 'WARRANTY_CLAIM') {
      const id = m.asset?.id;
      if (id) correctiveByAsset.set(id, (correctiveByAsset.get(id) ?? 0) + 1);
    }
  }
  return assets
    .map((a) => computeAssetRisk(a, correctiveByAsset.get(a.id) ?? 0))
    .sort((x, y) => y.score - x.score);
}

export interface ProcurementRec {
  category: string;
  atRisk: number;
  total: number;
  avgAgeYears: number;
  replaceQty: number;
  estimatedSpend: number;
  urgency: Severity;
  rationale: string;
}

/** Aggregate risk into per-category procurement recommendations. */
export function buildProcurementRecs(assets: Asset[], watchlist: RiskResult[]): ProcurementRec[] {
  const riskByAsset = new Map(watchlist.map((r) => [r.asset.id, r.score]));
  const groups = new Map<string, Asset[]>();
  for (const a of assets) {
    const key = a.category?.name ?? 'Uncategorized';
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(a);
  }

  const recs: ProcurementRec[] = [];
  for (const [category, items] of groups) {
    const atRisk = items.filter((a) => (riskByAsset.get(a.id) ?? 0) >= 45).length;
    if (atRisk === 0) continue;
    const avgAgeYears = items.reduce((s, a) => s + monthsSince(a.purchaseDate), 0) / items.length / 12;
    const avgCost = items.reduce((s, a) => s + (a.purchaseCost || 0), 0) / items.length;
    const replaceQty = atRisk;
    const estimatedSpend = Math.round(replaceQty * avgCost);
    const ratio = atRisk / items.length;
    const urgency: Severity = ratio >= 0.5 ? 'Critical' : ratio >= 0.3 ? 'High' : 'Medium';
    recs.push({
      category, atRisk, total: items.length, avgAgeYears, replaceQty, estimatedSpend, urgency,
      rationale: `${atRisk} of ${items.length} ${category.toLowerCase()} flagged (avg age ${avgAgeYears.toFixed(1)} yrs). Budget ${replaceQty} replacement${replaceQty > 1 ? 's' : ''}.`,
    });
  }
  return recs.sort((a, b) => b.estimatedSpend - a.estimatedSpend);
}

/** Project total portfolio book value forward N months (straight-line, floored at 10% salvage). */
export function projectDepreciation(assets: Asset[], months = 24): { month: string; value: number }[] {
  const now = new Date();
  const series: { month: string; value: number }[] = [];
  for (let i = 0; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    let total = 0;
    for (const a of assets) {
      const rate = a.depreciationRate ?? 18;
      const monthlyDep = ((a.purchaseCost || 0) * (rate / 100)) / 12;
      const floor = (a.purchaseCost || 0) * 0.1;
      total += Math.max(floor, (a.currentValue || 0) - monthlyDep * i);
    }
    series.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, value: Math.round(total) });
  }
  return series;
}
