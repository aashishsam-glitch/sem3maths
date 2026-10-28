import React, { useState } from 'react';
import { ScatterSeries, ScatterPoint } from '../../types';
import { ScatterChart, TrendingUp, Layers, RefreshCw } from 'lucide-react';

interface InteractiveScatterPlotProps {
  scatterPlots: Record<string, ScatterSeries>;
  availableMetrics: string[];
  targetMetric: string;
  selectedMetricX: string;
  onChangeMetricX: (metric: string) => void;
  selectedMetricY?: string;
  onChangeMetricY?: (metric: string) => void;
}

export const InteractiveScatterPlot: React.FC<InteractiveScatterPlotProps> = ({
  scatterPlots,
  availableMetrics,
  targetMetric,
  selectedMetricX,
  onChangeMetricX,
}) => {
  const [viewMode, setViewMode] = useState<'raw' | 'ranked'>('raw');
  const [hoveredPoint, setHoveredPoint] = useState<ScatterPoint | null>(null);

  const series = scatterPlots[selectedMetricX];

  if (!series || !series.points || series.points.length === 0) {
    return (
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col items-center justify-center h-full min-h-[360px] text-slate-500 font-mono text-xs">
        No scatter data available for {selectedMetricX}.
      </div>
    );
  }

  const points = series.points;

  // Chart dimensions
  const width = 540;
  const height = 300;
  const padding = { top: 20, right: 25, bottom: 45, left: 55 };

  // Determine domain ranges
  const isRank = viewMode === 'ranked';
  const xValues = points.map((p) => (isRank ? p.rank_x : p.x));
  const yValues = points.map((p) => (isRank ? p.rank_y : p.y));

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  // Buffer margins
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const domainMinX = isRank ? 0 : Math.max(0, minX - spanX * 0.05);
  const domainMaxX = isRank ? maxX + 2 : maxX + spanX * 0.05;
  const domainMinY = isRank ? 0 : Math.max(0, minY - spanY * 0.05);
  const domainMaxY = isRank ? maxY + 2 : maxY + spanY * 0.05;

  const scaleX = (val: number) =>
    padding.left +
    ((val - domainMinX) / (domainMaxX - domainMinX)) *
      (width - padding.left - padding.right);

  const scaleY = (val: number) =>
    height -
    padding.bottom -
    ((val - domainMinY) / (domainMaxY - domainMinY)) *
      (height - padding.top - padding.bottom);

  // Compute trendline coordinates on raw mode
  const trendX1 = domainMinX;
  const trendY1 = series.regression_slope * trendX1 + series.regression_intercept;
  const trendX2 = domainMaxX;
  const trendY2 = series.regression_slope * trendX2 + series.regression_intercept;

  // Rank line is y = x in ranked mode
  const rankLineX1 = domainMinX;
  const rankLineY1 = domainMinX;
  const rankLineX2 = domainMaxX;
  const rankLineY2 = domainMaxX;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col h-full">
      {/* Header & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            SCATTER & REGRESSION ANALYSIS
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {selectedMetricX.replace('_', ' ')} vs {targetMetric.replace('_', ' ')}
          </p>
        </div>

        {/* View mode toggle and metric selector */}
        <div className="flex items-center gap-2">
          {/* Predictor metric selector */}
          <select
            value={selectedMetricX}
            onChange={(e) => onChangeMetricX(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
          >
            {availableMetrics
              .filter((m) => m !== targetMetric)
              .map((m) => (
                <option key={m} value={m}>
                  {m.replace('_', ' ')}
                </option>
              ))}
          </select>

          {/* Raw vs Ranked Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium transition-all ${
                viewMode === 'raw'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Scale
            </button>
            <button
              onClick={() => setViewMode('ranked')}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium transition-all ${
                viewMode === 'ranked'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rank Space
            </button>
          </div>
        </div>
      </div>

      {/* SVG Scatter Chart */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] select-none"
        >
          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((t, idx) => {
            const y = padding.top + t * (height - padding.top - padding.bottom);
            const x = padding.left + t * (width - padding.left - padding.right);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 8}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {isRank
              ? `Rank [ ${selectedMetricX.replace('_', ' ')} ]`
              : selectedMetricX.replace('_', ' ')}
          </text>
          <text
            x={-height / 2}
            y={16}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            transform="rotate(-90)"
          >
            {isRank
              ? `Rank [ ${targetMetric.replace('_', ' ')} ]`
              : targetMetric.replace('_', ' ')}
          </text>

          {/* Trendline */}
          {viewMode === 'raw' ? (
            <line
              x1={scaleX(trendX1)}
              y1={scaleY(trendY1)}
              x2={scaleX(trendX2)}
              y2={scaleY(trendY2)}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          ) : (
            <line
              x1={scaleX(rankLineX1)}
              y1={scaleY(rankLineY1)}
              x2={scaleX(rankLineX2)}
              y2={scaleY(rankLineY2)}
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          )}

          {/* Observation Points */}
          {points.map((p) => {
            const cx = scaleX(isRank ? p.rank_x : p.x);
            const cy = scaleY(isRank ? p.rank_y : p.y);
            const isHovered = hoveredPoint?.id === p.id;

            return (
              <circle
                key={p.id}
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 3.5}
                fill={isRank ? '#06b6d4' : isHovered ? '#f59e0b' : '#38bdf8'}
                fillOpacity={isHovered ? 1.0 : 0.75}
                stroke={isHovered ? '#ffffff' : '#0284c7'}
                strokeWidth={isHovered ? 1.5 : 0.75}
                className="cursor-pointer transition-all duration-75"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>

        {/* Hover Point Tooltip Overlay */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(scaleX(isRank ? hoveredPoint.rank_x : hoveredPoint.x) + 12, width - 150)}px`,
              top: `${Math.max(scaleY(isRank ? hoveredPoint.rank_y : hoveredPoint.y) - 55, 10)}px`,
              pointerEvents: 'none',
            }}
            className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 p-2 rounded-lg shadow-xl text-[10px] font-mono z-20 space-y-0.5"
          >
            <div className="text-cyan-300 font-bold">Obs #{hoveredPoint.id + 1}</div>
            <div className="text-slate-300">
              {selectedMetricX.replace('_', ' ')}: <strong className="text-white">{hoveredPoint.x}</strong> (Rank: {hoveredPoint.rank_x})
            </div>
            <div className="text-slate-300">
              {targetMetric.replace('_', ' ')}: <strong className="text-white">{hoveredPoint.y}</strong> (Rank: {hoveredPoint.rank_y})
            </div>
          </div>
        )}
      </div>

      {/* Regression & Correlation Summary Footer */}
      <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-amber-300 font-bold">
            Pearson r: {series.pearson_r > 0 ? '+' : ''}{series.pearson_r.toFixed(3)}
          </span>
          <span className="text-cyan-300 font-bold">
            Spearman ρ: {series.spearman_rho > 0 ? '+' : ''}{series.spearman_rho.toFixed(3)}
          </span>
        </div>
        <div className="text-slate-400 text-[11px]">
          {viewMode === 'raw' ? series.trendline_equation : 'Identity rank line: perfect monotonic order'}
        </div>
      </div>
    </div>
  );
};
