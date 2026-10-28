import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Loader2, Sparkles, Cpu, Layers, Sigma } from 'lucide-react';

interface LiveAnalysisOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
}

const ANALYSIS_STEPS = [
  { label: 'Loading system performance telemetry...', math: 'Ingesting observations array & parsing headers' },
  { label: 'Validating metrics & sample variance...', math: 'Checking s_x^2 > 0 and null ratios' },
  { label: 'Calculating Pearson linear correlations...', math: 'Cov(X,Y)/(s_x * s_y) with Fisher z CIs' },
  { label: 'Calculating Spearman rank correlations...', math: 'Converting to R(x), evaluating d_i^2' },
  { label: 'Synthesizing cross-correlation matrix...', math: 'Generating symmetric N x N matrices' },
  { label: 'Identifying strongly associated metrics...', math: 'Evaluating Response Time association score' },
  { label: 'Generating bottleneck diagnostics & insights...', math: 'Formulating association hierarchy' },
];

export const LiveAnalysisOverlay: React.FC<LiveAnalysisOverlayProps> = ({ isOpen, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const stepInterval = 280; // ~2 seconds total for slick professional cadence
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step < ANALYSIS_STEPS.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 350);
      }
    }, stepInterval);

    return () => clearInterval(timer);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / ANALYSIS_STEPS.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e]/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-lg mx-4 bg-[#0d1321] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-950/70 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              RUNNING STATISTICAL ENGINE
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Pure Python Mathematical Computation in Progress
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>PIPELINE PROGRESS</span>
            <span className="text-cyan-300 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-2.5">
          {ANALYSIS_STEPS.map((step, idx) => {
            const isFinished = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 shadow-sm'
                    : isFinished
                    ? 'bg-slate-900/50 border-slate-800/80 text-slate-300'
                    : 'bg-transparent border-transparent text-slate-600'
                }`}
              >
                <div className="mt-0.5">
                  {isFinished ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-600">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium text-slate-200">{step.label}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{step.math}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
