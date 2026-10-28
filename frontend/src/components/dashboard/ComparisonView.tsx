import React, { useState } from 'react';
import { CorrelationPair, SpearmanCalculationBreakdown } from '../../types';
import {
  Scale,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Calculator,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface ComparisonViewProps {
  targetCorrelations: CorrelationPair[];
  targetMetric: string;
  spearmanBreakdowns: Record<string, SpearmanCalculationBreakdown>;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  targetCorrelations,
  targetMetric,
  spearmanBreakdowns,
}) => {
  const [selectedBreakdownMetric, setSelectedBreakdownMetric] = useState<string | null>(null);

  const activeBreakdown = selectedBreakdownMetric
    ? spearmanBreakdowns[selectedBreakdownMetric]
    : null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            PEARSON VS SPEARMAN COMPARATIVE EVALUATION
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Linear parametric covariance vs non-parametric monotonic rank alignment
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto flex-1 mb-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
              <th className="py-2.5 px-3">Metric</th>
              <th className="py-2.5 px-3 text-amber-300">Pearson (r)</th>
              <th className="py-2.5 px-3 text-cyan-300">Spearman (ρ)</th>
              <th className="py-2.5 px-3">|r - ρ| Diff</th>
              <th className="py-2.5 px-3">Methodology Diagnosis</th>
              <th className="py-2.5 px-3 text-right">Step Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {targetCorrelations.map((pair) => {
              const predictor =
                pair.metric_a === targetMetric ? pair.metric_b : pair.metric_a;
              const isHighDiff = pair.difference >= 0.15;

              return (
                <tr
                  key={predictor}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-3 font-semibold text-white">
                    {predictor.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-3 text-amber-300 font-bold">
                    {pair.pearson_r > 0 ? '+' : ''}
                    {pair.pearson_r.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-cyan-300 font-bold">
                    {pair.spearman_rho > 0 ? '+' : ''}
                    {pair.spearman_rho.toFixed(3)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isHighDiff
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'text-slate-400'
                      }`}
                    >
                      {pair.difference.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300 max-w-xs text-[11px] leading-relaxed">
                    {pair.academic_insight}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() =>
                        setSelectedBreakdownMetric(
                          selectedBreakdownMetric === predictor ? null : predictor
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-[11px] font-mono transition-all inline-flex items-center gap-1.5"
                    >
                      <Calculator className="w-3 h-3 text-cyan-400" />
                      <span>{selectedBreakdownMetric === predictor ? 'Hide Steps' : 'View Steps'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expandable Spearman Step-by-Step Calculation Modal / Section */}
      {activeBreakdown && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div>
              <div className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                HOW SPEARMAN RANK CORRELATION WAS CALCULATED
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {activeBreakdown.predictor_metric.replace('_', ' ')} vs {activeBreakdown.target_metric.replace('_', ' ')} (n = {activeBreakdown.sample_size_n} samples)
              </div>
            </div>

            <button
              onClick={() => setSelectedBreakdownMetric(null)}
              className="text-xs font-mono text-slate-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>

          {/* Mathematical Formula Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[10px]">FORMULA EMPLOYED</div>
              <div className="text-cyan-300 font-bold mt-1 text-[11px]">
                {activeBreakdown.formula_used}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[10px]">SUM OF SQUARED RANK DIFFERENCES</div>
              <div className="text-amber-300 font-bold mt-1 text-[11px]">
                ∑ d_i² = {activeBreakdown.sum_d_squared}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[10px]">COMPUTED SPEARMAN RHO</div>
              <div className="text-white font-bold mt-1 text-[11px]">
                ρ = {activeBreakdown.scipy_rho > 0 ? '+' : ''}{activeBreakdown.scipy_rho}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 mb-3 font-sans">
            {activeBreakdown.explanation}
          </div>

          {/* Ranks breakdown table */}
          <div className="overflow-x-auto max-h-48 border border-slate-800 rounded-lg">
            <table className="w-full text-center border-collapse text-[11px] font-mono">
              <thead className="bg-slate-950 text-slate-400 sticky top-0">
                <tr>
                  <th className="py-1 px-2 border-b border-slate-800">#</th>
                  <th className="py-1 px-2 border-b border-slate-800">Val X</th>
                  <th className="py-1 px-2 border-b border-slate-800">Rank R(X)</th>
                  <th className="py-1 px-2 border-b border-slate-800">Val Y</th>
                  <th className="py-1 px-2 border-b border-slate-800">Rank R(Y)</th>
                  <th className="py-1 px-2 border-b border-slate-800">d = R(X) - R(Y)</th>
                  <th className="py-1 px-2 border-b border-slate-800">d²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeBreakdown.top_ranked_steps.map((step) => (
                  <tr key={step.sample_index} className="hover:bg-slate-800/40">
                    <td className="py-1 px-2 text-slate-500">{step.sample_index}</td>
                    <td className="py-1 px-2 text-white">{step.val_x}</td>
                    <td className="py-1 px-2 text-cyan-300">{step.rank_x}</td>
                    <td className="py-1 px-2 text-white">{step.val_y}</td>
                    <td className="py-1 px-2 text-rose-300">{step.rank_y}</td>
                    <td className="py-1 px-2 text-slate-300">{step.diff_d > 0 ? '+' : ''}{step.diff_d}</td>
                    <td className="py-1 px-2 text-amber-300 font-bold">{step.diff_d_squared}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
