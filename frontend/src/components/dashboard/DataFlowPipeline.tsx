import React, { useState } from 'react';
import { PipelineStageTrace } from '../../types';
import {
  GitCommit,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Code2,
  Sigma,
  ShieldCheck,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface DataFlowPipelineProps {
  pipelineTrace: PipelineStageTrace[];
  isAnalyzing: boolean;
}

const DEFAULT_STAGES = [
  {
    id: 's0_input',
    name: 'DATA INPUT',
    code: 'df = pd.DataFrame(records)\n# Ingest CSV or simulated workload observations',
    math: 'Input matrix X in R^{n x p} with n observations across p performance metrics.',
  },
  {
    id: 's1_validation',
    name: 'DATA VALIDATION',
    code: 'assert n >= 4\nassert all(numeric)\ncheck_variance(s_x^2 > 0)',
    math: 'Verify sample size n >= 4, null ratio < 30%, and non-zero variance Var(X_j) > 0.',
  },
  {
    id: 's2_processing',
    name: 'DATA PROCESSING',
    code: 'df = df.fillna(df.median())\ndata = df[active_metrics].to_numpy()',
    math: 'Median imputation for missing values: x_ij := median(X_{*j}) if x_ij is NaN.',
  },
  {
    id: 's3_descriptive',
    name: 'DESCRIPTIVE STATS',
    code: 'mean = np.mean(x)\nstd = np.std(x, ddof=1)\np95 = np.percentile(x, 95)',
    math: 'Moments of distribution: mean x_bar = 1/n sum(x_i), sample variance s^2 = 1/(n-1) sum(x_i - x_bar)^2.',
  },
  {
    id: 's4_pearson',
    name: 'PEARSON ANALYSIS',
    code: 'r = np.corrcoef(x, y)[0, 1]\nt_stat = r * sqrt((n-2)/(1 - r**2))',
    math: 'r = sum((x_i - x_bar)(y_i - y_bar)) / sqrt(sum(x_i - x_bar)^2 * sum(y_i - y_bar)^2)',
  },
  {
    id: 's5_spearman',
    name: 'SPEARMAN ANALYSIS',
    code: 'rx = rankdata(x, method="average")\nry = rankdata(y, method="average")\nrho, p = spearmanr(x, y)',
    math: 'rho = 1 - (6 sum(d_i^2)) / (n(n^2 - 1)), where d_i = R(x_i) - R(y_i)',
  },
  {
    id: 's6_matrix',
    name: 'CORRELATION MATRIX',
    code: 'P_matrix = np.empty((p, p))\nS_matrix = np.empty((p, p))',
    math: 'Symmetric positive semi-definite cross-correlation matrices P in [-1, 1]^{p x p}.',
  },
  {
    id: 's7_bottlenecks',
    name: 'BOTTLENECK RANKING',
    code: 'score = 0.5 * abs(r) + 0.5 * abs(rho)\nrank_bottlenecks(score)',
    math: 'Score(M_j) = 0.5 |r(M_j, T)| + 0.5 |rho(M_j, T)|. Rank descending with causality disclaimer.',
  },
  {
    id: 's8_insights',
    name: 'VISUAL INSIGHTS',
    code: 'render_3d_observatory(r, rho)\nrender_heatmaps_and_scatter()',
    math: 'Dynamic 3D topology & energy particles mapped proportional to correlation magnitude.',
  },
];

export const DataFlowPipeline: React.FC<DataFlowPipelineProps> = ({
  pipelineTrace,
  isAnalyzing,
}) => {
  const [selectedStage, setSelectedStage] = useState<string>(DEFAULT_STAGES[4].id);

  const activeStage = DEFAULT_STAGES.find((s) => s.id === selectedStage) || DEFAULT_STAGES[4];
  const traceItem = pipelineTrace.find((t) => t.stage_id === activeStage.id);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            END-TO-END ANALYTICAL PIPELINE ARCHITECTURE
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Pure Python computational execution pipeline & mathematical lifecycle
          </p>
        </div>

        {isAnalyzing && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>EXECUTING IN PYTHON</span>
          </span>
        )}
      </div>

      {/* Interactive Horizontal Pipeline Schematic */}
      <div className="overflow-x-auto pb-4 mb-3">
        <div className="flex items-center gap-2 min-w-[760px]">
          {DEFAULT_STAGES.map((stage, idx) => {
            const isSelected = selectedStage === stage.id;
            const isLast = idx === DEFAULT_STAGES.length - 1;

            return (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => setSelectedStage(stage.id)}
                  className={`flex-1 p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                      : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-mono text-cyan-400 font-bold mb-1">
                    0{idx + 1}
                  </div>
                  <div className="text-[11px] font-bold tracking-tight truncate">
                    {stage.name}
                  </div>
                </button>

                {!isLast && (
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 ${
                      isAnalyzing ? 'text-cyan-400 animate-pulse' : 'text-slate-600'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-xs font-mono">
        <div>
          <div className="text-cyan-300 font-bold text-xs flex items-center gap-1.5 mb-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            PYTHON BACKEND IMPLEMENTATION
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-emerald-300 text-[11px] overflow-x-auto leading-relaxed">
            {activeStage.code}
          </pre>
          {traceItem && (
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Execution Time: <strong className="text-white">{traceItem.duration_ms} ms</strong> ({traceItem.details})</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-amber-300 font-bold text-xs flex items-center gap-1.5 mb-2">
            <Sigma className="w-4 h-4 text-amber-400" />
            MATHEMATICAL FORMULATION
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200 text-[11px] leading-relaxed">
            {activeStage.math}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Strict separation: all linear covariance, rank sorting, and hypothesis tests execute server-side in Python.
          </div>
        </div>
      </div>
    </div>
  );
};
