import React, { useState } from 'react';
import { CorrelationMatrix, CorrelationPair } from '../../types';
import { Grid, Eye, ArrowRight, Info, Layers } from 'lucide-react';

interface CorrelationHeatmapProps {
  pearsonMatrix: CorrelationMatrix;
  spearmanMatrix: CorrelationMatrix;
  pairs: CorrelationPair[];
  onSelectPair: (metricA: string, metricB: string) => void;
}

type MatrixMode = 'pearson' | 'spearman' | 'difference';

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  pearsonMatrix,
  spearmanMatrix,
  pairs,
  onSelectPair,
}) => {
  const [mode, setMode] = useState<MatrixMode>('pearson');
  const [hoveredCell, setHoveredCell] = useState<{
    i: number;
    j: number;
    val: number;
    metricA: string;
    metricB: string;
  } | null>(null);

  const metrics = pearsonMatrix.metrics;
  const currentMatrix =
    mode === 'pearson'
      ? pearsonMatrix.matrix
      : mode === 'spearman'
      ? spearmanMatrix.matrix
      : pearsonMatrix.matrix.map((row, i) =>
          row.map((val, j) => Math.abs(val - spearmanMatrix.matrix[i][j]))
        );

  // Helper to find pair detail
  const findPairDetail = (mA: string, mB: string): CorrelationPair | undefined => {
    return pairs.find(
      (p) =>
        (p.metric_a === mA && p.metric_b === mB) ||
        (p.metric_a === mB && p.metric_b === mA)
    );
  };

  // Color generator for heatmap cells
  const getCellColor = (val: number, isDiff: boolean) => {
    if (isDiff) {
      // Divergence mode (0.0 to 1.0)
      const alpha = Math.min(1.0, val * 2.2);
      return `rgba(168, 85, 247, ${Math.max(0.12, alpha)})`;
    }

    // Normal Pearson / Spearman (-1.0 to +1.0)
    if (val >= 0) {
      // Positive: Cyan into Amber / Crimson
      const intensity = Math.min(1.0, Math.pow(val, 1.2));
      if (val >= 0.7) {
        return `rgba(239, 68, 68, ${0.3 + intensity * 0.65})`; // Crimson/Red
      } else if (val >= 0.4) {
        return `rgba(245, 158, 11, ${0.25 + intensity * 0.6})`; // Amber
      } else {
        return `rgba(6, 182, 212, ${0.1 + intensity * 0.4})`; // Cyan
      }
    } else {
      // Negative: Purple / Indigo
      const intensity = Math.min(1.0, Math.pow(Math.abs(val), 1.2));
      return `rgba(139, 92, 246, ${0.25 + intensity * 0.65})`;
    }
  };

  const activePairDetail =
    hoveredCell && hoveredCell.metricA !== hoveredCell.metricB
      ? findPairDetail(hoveredCell.metricA, hoveredCell.metricB)
      : null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col h-full">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <Grid className="w-4 h-4 text-cyan-400" />
            CORRELATION MATRIX HEATMAP
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Interactive multi-variable association matrix
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setMode('pearson')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === 'pearson'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pearson (r)
          </button>
          <button
            onClick={() => setMode('spearman')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === 'spearman'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Spearman (ρ)
          </button>
          <button
            onClick={() => setMode('difference')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              mode === 'difference'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            |r - ρ| Diff
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2 flex-1 flex items-center justify-center">
        <div className="inline-block min-w-full">
          <table className="border-collapse table-fixed w-full text-center">
            <thead>
              <tr>
                <th className="w-24 p-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-left">
                  Metric
                </th>
                {metrics.map((m, idx) => (
                  <th
                    key={idx}
                    className="p-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate max-w-[85px]"
                    title={m}
                  >
                    {m.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((rowMetric, i) => (
                <tr key={i}>
                  <td
                    className="p-2 text-[10px] font-mono font-medium text-slate-300 text-left truncate max-w-[100px]"
                    title={rowMetric}
                  >
                    {rowMetric.replace('_', ' ')}
                  </td>
                  {metrics.map((colMetric, j) => {
                    const val = currentMatrix[i][j];
                    const isDiag = i === j;
                    const isHovered =
                      hoveredCell?.i === i && hoveredCell?.j === j;

                    return (
                      <td
                        key={j}
                        onMouseEnter={() =>
                          setHoveredCell({
                            i,
                            j,
                            val,
                            metricA: rowMetric,
                            metricB: colMetric,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (!isDiag) onSelectPair(rowMetric, colMetric);
                        }}
                        style={{
                          backgroundColor: getCellColor(
                            val,
                            mode === 'difference'
                          ),
                        }}
                        className={`p-2 font-mono text-xs cursor-pointer border border-slate-900/60 transition-all ${
                          isHovered
                            ? 'scale-105 z-10 ring-2 ring-cyan-400 shadow-lg'
                            : ''
                        } ${isDiag ? 'opacity-80' : ''}`}
                      >
                        <span
                          className={`font-bold ${
                            isDiag
                              ? 'text-slate-400'
                              : val > 0.6
                              ? 'text-white'
                              : val < -0.3
                              ? 'text-purple-200'
                              : 'text-slate-200'
                          }`}
                        >
                          {mode === 'difference'
                            ? val.toFixed(2)
                            : (val > 0 ? '+' : '') + val.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Tooltip / Detail Inspector Bar */}
      <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs min-h-[60px] flex items-center justify-between">
        {activePairDetail ? (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>{activePairDetail.metric_a.replace('_', ' ')}</span>
                <span className="text-cyan-400">↔</span>
                <span>{activePairDetail.metric_b.replace('_', ' ')}</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ({activePairDetail.strength} {activePairDetail.direction})
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                {activePairDetail.interpretation}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
              <span className="text-amber-300 font-bold">
                r: {activePairDetail.pearson_r > 0 ? '+' : ''}{activePairDetail.pearson_r.toFixed(3)}
              </span>
              <span className="text-cyan-300 font-bold">
                ρ: {activePairDetail.spearman_rho > 0 ? '+' : ''}{activePairDetail.spearman_rho.toFixed(3)}
              </span>
              <span className="text-slate-500 text-[10px]">
                p: {activePairDetail.pearson_p_value.toFixed(4)}
              </span>
            </div>
          </div>
        ) : hoveredCell && hoveredCell.metricA === hoveredCell.metricB ? (
          <div className="text-slate-400 font-mono text-[11px]">
            Self-correlation diagonal: correlation of a metric with itself is identically 1.0.
          </div>
        ) : (
          <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Hover or click any matrix cell to inspect relationship dynamics and update scatter plot.</span>
          </div>
        )}
      </div>
    </div>
  );
};
