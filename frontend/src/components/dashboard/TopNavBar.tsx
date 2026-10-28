import React from 'react';
import {
  Play,
  Upload,
  Table as TableIcon,
  HelpCircle,
  Download,
  Activity,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { WorkloadPresetInfo, AnalysisResponse } from '../../types';

interface TopNavBarProps {
  workloads: WorkloadPresetInfo[];
  selectedWorkload: string;
  onSelectWorkload: (id: string) => void;
  onRunAnalysis: () => void;
  onOpenUpload: () => void;
  onOpenDataEditor: () => void;
  onOpenExport: () => void;
  explainMode: boolean;
  onToggleExplainMode: () => void;
  isLoading: boolean;
  analysis: AnalysisResponse | null;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  workloads,
  selectedWorkload,
  onSelectWorkload,
  onRunAnalysis,
  onOpenUpload,
  onOpenDataEditor,
  onOpenExport,
  explainMode,
  onToggleExplainMode,
  isLoading,
  analysis,
}) => {
  const healthStatus = analysis?.summary.health_status || 'OPTIMAL';

  return (
    <header className="w-full bg-[#0b0f19]/90 backdrop-blur-xl border-b border-cyan-500/15 sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title & System Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  SYSTEM BOTTLENECK IDENTIFICATION
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  OBSERVATORY 1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Statistical Diagnostics via Pearson & Spearman Rank Correlation
              </p>
            </div>
          </div>

          {/* Health status pill */}
          <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-700">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                healthStatus === 'CRITICAL'
                  ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                  : healthStatus === 'DEGRADED'
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
              }`}
            />
            <span className="text-[10px] text-slate-300">{healthStatus}</span>
          </div>
        </div>

        {/* Middle & Right Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Workload Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 hidden xl:inline text-[11px]">Workload:</span>
            <select
              value={selectedWorkload}
              onChange={(e) => onSelectWorkload(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {workloads.map((w) => (
                <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Upload CSV */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-cyan-500/40"
            title="Upload CSV Telemetry"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>

          {/* Data Editor */}
          <button
            onClick={onOpenDataEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-cyan-500/40"
            title="Inspect & Edit Raw Data"
          >
            <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Data Editor</span>
          </button>

          {/* Explain Mode Toggle */}
          <button
            onClick={onToggleExplainMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              explainMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-glow-amber'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
            }`}
            title="Toggle Educational & Viva Explanations"
          >
            <HelpCircle className={`w-3.5 h-3.5 ${explainMode ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Explain Analysis</span>
          </button>

          {/* Export Report */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-cyan-500/40"
            title="Export Statistical Report"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Run Analysis Primary CTA */}
          <button
            onClick={onRunAnalysis}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Run Analysis'}</span>
          </button>

          {/* Desktop Health Status */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
            <div
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                healthStatus === 'CRITICAL'
                  ? 'bg-rose-500 shadow-[0_0_10px_#ef4444]'
                  : healthStatus === 'DEGRADED'
                  ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]'
                  : 'bg-emerald-400 shadow-[0_0_10px_#10b981]'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider">
              {healthStatus}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
