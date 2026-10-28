import React, { useState } from 'react';
import { AnalysisResponse } from '../../types';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Check,
  X,
  Copy,
  Printer,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResponse | null;
  rawData: Record<string, any>[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  analysis,
  rawData,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !analysis) return null;

  // Generate markdown report text
  const generateMarkdownReport = (): string => {
    const summary = analysis.summary;
    const top = analysis.bottleneck_ranking[0];

    return `# SYSTEM BOTTLENECK IDENTIFICATION REPORT
**Workload Context:** ${analysis.workload_name}
**Target Metric:** ${analysis.target_metric}
**Observations Evaluated:** ${analysis.total_observations}
**System Health Verdict:** ${summary.health_status}

---

## 1. EXECUTIVE DIAGNOSTIC SUMMARY
- **Primary Potential Bottleneck:** ${top ? top.metric.replace('_', ' ') : 'None'} (${top ? top.risk_level : 'LOW'} Risk)
- **Top Pearson Linear Correlation:** ${summary.highest_pearson_metric?.replace('_', ' ')} (r = ${summary.highest_pearson_value?.toFixed(3)})
- **Top Spearman Rank Correlation:** ${summary.highest_spearman_metric?.replace('_', ' ')} (ρ = ${summary.highest_spearman_value?.toFixed(3)})
- **Executive Verdict:** ${summary.executive_verdict}

> **CRITICAL STATISTICAL NOTICE:**
> Correlation indicates statistical association and co-occurrence, NOT direct root-cause causation.
> Flagged metrics represent strongly associated potential bottlenecks warranting deeper profiling.

---

## 2. BOTTLENECK ASSOCIATION HIERARCHY
| Rank | Metric | Pearson (r) | Spearman (ρ) | Composite Score | Risk Level |
|:---:|:---|:---:|:---:|:---:|:---:|
${analysis.bottleneck_ranking
  .map(
    (b) =>
      `| ${b.rank} | ${b.metric} | ${b.pearson_r > 0 ? '+' : ''}${b.pearson_r.toFixed(3)} | ${b.spearman_rho > 0 ? '+' : ''}${b.spearman_rho.toFixed(3)} | ${b.bottleneck_score.toFixed(3)} | **${b.risk_level}** |`
  )
  .join('\n')}

---

## 3. PEARSON CORRELATION MATRIX
${analysis.pearson_matrix.metrics.join(' | ')}
${analysis.pearson_matrix.metrics.map(() => '---').join(' | ')}
${analysis.pearson_matrix.matrix
  .map((row, i) => `${analysis.pearson_matrix.metrics[i]} | ` + row.map((v) => (v > 0 ? '+' : '') + v.toFixed(2)).join(' | '))
  .join('\n')}

---
*Report synthesized by System Bottleneck Identification Observatory via Python 3.14 + NumPy + SciPy.*
`;
  };

  const handleCopyMarkdown = () => {
    const report = generateMarkdownReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(analysis, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bottleneck-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSVData = () => {
    if (rawData.length === 0) return;
    const headers = Object.keys(rawData[0]);
    const csvRows = [headers.join(',')];
    rawData.forEach((row) => {
      csvRows.push(headers.map((h) => row[h] ?? '').join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-metrics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMatrixCSV = () => {
    const metrics = analysis.pearson_matrix.metrics;
    const rows = [['Metric', ...metrics].join(',')];
    analysis.pearson_matrix.matrix.forEach((row, idx) => {
      rows.push([metrics[idx], ...row.map((v) => v.toFixed(4))].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pearson-matrix-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e]/85 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0d1321] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
              <Download className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                EXPORT STATISTICAL ANALYSIS REPORT
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Download structured datasets, correlation matrices, or markdown summaries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button
            onClick={handleCopyMarkdown}
            className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <FileText className="w-5 h-5 text-amber-400" />
              {copied && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="font-bold text-xs text-white">Copy Markdown</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Comprehensive report
            </div>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left flex flex-col justify-between"
          >
            <div className="mb-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="font-bold text-xs text-white">Download JSON</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Raw analysis payload
            </div>
          </button>

          <button
            onClick={handleDownloadCSVData}
            className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left flex flex-col justify-between"
          >
            <div className="mb-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="font-bold text-xs text-white">Metrics Data CSV</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Observations spreadsheet
            </div>
          </button>

          <button
            onClick={handleDownloadMatrixCSV}
            className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left flex flex-col justify-between"
          >
            <div className="mb-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-400" />
            </div>
            <div className="font-bold text-xs text-white">Matrix CSV</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Pearson correlation grid
            </div>
          </button>
        </div>

        {/* Live Markdown Preview */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed">
          <pre className="whitespace-pre-wrap">{generateMarkdownReport()}</pre>
        </div>
      </div>
    </div>
  );
};
