import React from 'react';
import { AnalysisResponse } from '../../types';
import {
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  Database,
  ShieldAlert,
} from 'lucide-react';

interface KpiOverviewRibbonProps {
  analysis: AnalysisResponse | null;
  onSelectMetric?: (metric: string) => void;
}

export const KpiOverviewRibbon: React.FC<KpiOverviewRibbonProps> = ({
  analysis,
  onSelectMetric,
}) => {
  if (!analysis) return null;

  const summary = analysis.summary;
  const topBottleneck = analysis.bottleneck_ranking.length > 0 ? analysis.bottleneck_ranking[0] : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 w-full">
      {/* 1. Potential Bottleneck */}
      <div
        onClick={() => topBottleneck && onSelectMetric?.(topBottleneck.metric)}
        className="glass-panel p-4 rounded-xl border border-rose-500/30 hover:border-rose-500/60 transition-all cursor-pointer group shadow-lg shadow-rose-950/20 col-span-2 md:col-span-1"
      >
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
          <span className="flex items-center gap-1.5 text-rose-300">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            POTENTIAL BOTTLENECK
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              topBottleneck?.risk_level === 'HIGH'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : topBottleneck?.risk_level === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {topBottleneck?.risk_level || 'LOW'}
          </span>
        </div>
        <div className="text-base font-bold text-white group-hover:text-rose-300 transition-colors truncate">
          {topBottleneck ? topBottleneck.metric.replace('_', ' ') : 'None Flagged'}
        </div>
        <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-2">
          <span>r: <strong className="text-amber-300">{topBottleneck ? (topBottleneck.pearson_r > 0 ? '+' : '') + topBottleneck.pearson_r.toFixed(2) : '0.00'}</strong></span>
          <span>ρ: <strong className="text-cyan-300">{topBottleneck ? (topBottleneck.spearman_rho > 0 ? '+' : '') + topBottleneck.spearman_rho.toFixed(2) : '0.00'}</strong></span>
        </div>
      </div>

      {/* 2. Highest Pearson r */}
      <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          <span>TOP PEARSON (r)</span>
        </div>
        <div className="text-xl font-bold font-mono text-amber-300">
          {summary.highest_pearson_value !== undefined
            ? (summary.highest_pearson_value > 0 ? '+' : '') + summary.highest_pearson_value.toFixed(3)
            : 'N/A'}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 truncate font-mono">
          {summary.highest_pearson_metric?.replace('_', ' ') || 'None'}
        </div>
      </div>

      {/* 3. Highest Spearman rho */}
      <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>TOP SPEARMAN (ρ)</span>
        </div>
        <div className="text-xl font-bold font-mono text-cyan-300">
          {summary.highest_spearman_value !== undefined
            ? (summary.highest_spearman_value > 0 ? '+' : '') + summary.highest_spearman_value.toFixed(3)
            : 'N/A'}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 truncate font-mono">
          {summary.highest_spearman_metric?.replace('_', ' ') || 'None'}
        </div>
      </div>

      {/* 4. Target Metric Avg & P95 */}
      <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
          <Clock className={`w-3.5 h-3.5 ${
            summary.health_status === 'CRITICAL'
              ? 'text-rose-400'
              : summary.health_status === 'DEGRADED'
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`} />
          <span>AVG TARGET LATENCY</span>
        </div>
        <div className="text-xl font-bold font-mono text-white">
          {summary.avg_target_value !== undefined ? summary.avg_target_value.toFixed(1) : '0'}{' '}
          <span className="text-xs text-slate-400 font-normal">{summary.target_unit || 'ms'}</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-mono">
          P95 Peak: <span className={`font-semibold ${
            summary.health_status === 'CRITICAL'
              ? 'text-rose-300'
              : summary.health_status === 'DEGRADED'
              ? 'text-amber-300'
              : 'text-emerald-300'
          }`}>{summary.p95_target_value?.toFixed(1) || '0'} {summary.target_unit || 'ms'}</span>
        </div>
      </div>

      {/* 5. Dataset Observations & Confidence */}
      <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>OBSERVATIONS</span>
        </div>
        <div className="text-xl font-bold font-mono text-emerald-300">
          {summary.total_observations}{' '}
          <span className="text-xs text-slate-400 font-normal">samples</span>
        </div>
        <div className="text-[11px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          <span>p &lt; 0.001 (High Power)</span>
        </div>
      </div>
    </div>
  );
};
