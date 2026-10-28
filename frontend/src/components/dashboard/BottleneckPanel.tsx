import React, { useState } from 'react';
import { BottleneckMetric } from '../../types';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  Search,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

interface BottleneckPanelProps {
  bottlenecks: BottleneckMetric[];
  targetMetric: string;
  selectedMetric: string | null;
  onSelectMetric: (metric: string) => void;
}

export const BottleneckPanel: React.FC<BottleneckPanelProps> = ({
  bottlenecks,
  targetMetric,
  selectedMetric,
  onSelectMetric,
}) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(
    bottlenecks.length > 0 ? bottlenecks[0].metric : null
  );

  const toggleExpand = (metric: string) => {
    setExpandedMetric(expandedMetric === metric ? null : metric);
    onSelectMetric(metric);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            BOTTLENECK ASSOCIATION HIERARCHY
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Ranked correlation with target: <span className="text-cyan-300 font-semibold">{targetMetric}</span>
          </p>
        </div>
      </div>

      {/* Prominent Academic Disclaimer */}
      <div className="mb-4 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200/90 text-[11px] leading-relaxed flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-300">Statistical Caveat:</strong> Correlation indicates
          statistical association and co-occurrence, <strong className="underline decoration-amber-400">NOT causation</strong>.
          Flagged metrics represent <em>Potential Bottlenecks</em> and <em>Strongly Associated Variables</em> requiring further profiling.
        </div>
      </div>

      {/* Ranked Metric Cards */}
      <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[500px]">
        {bottlenecks.map((item) => {
          const isSelected = selectedMetric === item.metric;
          const isExpanded = expandedMetric === item.metric;

          let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
          let borderAccent = 'border-slate-800';
          if (item.risk_level === 'HIGH') {
            badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            borderAccent = 'border-rose-500/40';
          } else if (item.risk_level === 'MEDIUM') {
            badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            borderAccent = 'border-amber-500/40';
          }

          return (
            <div
              key={item.metric}
              className={`rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-900/95 border-cyan-400/60 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 ' + borderAccent
              }`}
            >
              {/* Card Header Row */}
              <div
                onClick={() => toggleExpand(item.metric)}
                className="p-3 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                    #{item.rank}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold text-xs text-white flex items-center gap-2 truncate">
                      <span>{item.metric.replace('_', ' ')}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeBg}`}>
                        {item.risk_level}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Avg: {item.avg_value} {item.unit} | P95: {item.p95_value} {item.unit}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="text-right font-mono text-xs">
                    <div className="text-amber-300 font-semibold">
                      r: {item.pearson_r > 0 ? '+' : ''}{item.pearson_r.toFixed(2)}
                    </div>
                    <div className="text-cyan-300 font-semibold text-[11px]">
                      ρ: {item.spearman_rho > 0 ? '+' : ''}{item.spearman_rho.toFixed(2)}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expandable Supporting Evidence & Next Steps */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800 text-xs space-y-3 animate-in fade-in duration-150">
                  <div className="p-2 rounded-lg bg-slate-950/60 text-slate-300 text-[11px] leading-relaxed border border-slate-800/80">
                    {item.diagnostic_summary}
                  </div>

                  {/* Supporting Evidence */}
                  <div>
                    <div className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5 mb-1.5">
                      <Search className="w-3.5 h-3.5 text-cyan-400" />
                      SUPPORTING STATISTICAL EVIDENCE
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-300 font-sans">
                      {item.supporting_evidence.map((ev, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Investigation steps */}
                  <div>
                    <div className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      RECOMMENDED INVESTIGATION
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-300 font-sans">
                      {item.investigation_steps.map((st, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
