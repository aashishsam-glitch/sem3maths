import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Scale,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';

export const EducationalExplainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'comparison' | 'causation' | 'viva'>('concepts');

  return (
    <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-[#0d1321]/90 flex flex-col h-full shadow-2xl shadow-amber-950/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            ACADEMIC EXPLAINABILITY & VIVA DEFENSE GUIDE
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Mathematical theory, correlation interpretation, and presentation defenses
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'concepts'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Core Concepts
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'comparison'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pearson vs Spearman
          </button>
          <button
            onClick={() => setActiveTab('causation')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'causation'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Correlation ≠ Causation
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'viva'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Viva Q&A Prep
          </button>
        </div>
      </div>

      {/* Tab 1: Core Concepts */}
      {activeTab === 'concepts' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
            {/* +1 */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/30">
              <div className="text-amber-300 font-bold text-sm mb-1">+1.00 : Strong Positive</div>
              <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                As variable X escalates, variable Y consistently escalates in lockstep.
              </div>
              <div className="mt-2 text-cyan-300 font-mono text-[10px] bg-slate-950 p-1.5 rounded">
                CPU Utilization ↑ → Response Time ↑
              </div>
            </div>

            {/* 0 */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700">
              <div className="text-slate-400 font-bold text-sm mb-1">0.00 : Independence / No Linear Co-movement</div>
              <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                Fluctuations in variable X provide zero predictive information regarding shifts in variable Y.
              </div>
              <div className="mt-2 text-slate-400 font-mono text-[10px] bg-slate-950 p-1.5 rounded">
                Disk I/O ↔ Response Time (Uncorrelated)
              </div>
            </div>

            {/* -1 */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/30">
              <div className="text-purple-300 font-bold text-sm mb-1">-1.00 : Strong Negative</div>
              <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                As variable X increases, variable Y reliably diminishes proportionally.
              </div>
              <div className="mt-2 text-purple-300 font-mono text-[10px] bg-slate-950 p-1.5 rounded">
                Free Memory ↑ → Response Time ↓
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans">
            <h3 className="font-bold text-white text-xs mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              How the Mathematical Magnitude is Classified:
            </h3>
            <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-center">
              <li className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-rose-400 font-bold">0.80 - 1.00</span>
                <div className="text-[10px] text-slate-400 mt-0.5">Very Strong</div>
              </li>
              <li className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-amber-400 font-bold">0.60 - 0.79</span>
                <div className="text-[10px] text-slate-400 mt-0.5">Strong</div>
              </li>
              <li className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-cyan-400 font-bold">0.40 - 0.59</span>
                <div className="text-[10px] text-slate-400 mt-0.5">Moderate</div>
              </li>
              <li className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-blue-400 font-bold">0.20 - 0.39</span>
                <div className="text-[10px] text-slate-400 mt-0.5">Weak</div>
              </li>
              <li className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-500 font-bold">0.00 - 0.19</span>
                <div className="text-[10px] text-slate-400 mt-0.5">Negligible</div>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Pearson vs Spearman */}
      {activeTab === 'comparison' && (
        <div className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pearson Panel */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs font-mono mb-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                PEARSON CORRELATION COEFFICIENT (r)
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                Evaluates the <strong>linear relationship</strong> between two continuous variables.
                Measures how closely observations cluster around a straight line equation <span className="font-mono text-amber-200">y = mx + c</span>.
              </p>
              <div className="p-2.5 rounded bg-slate-950 font-mono text-[10px] text-amber-200 border border-slate-800 mb-2">
                r = ∑(x_i - x̄)(y_i - ȳ) / √[∑(x_i - x̄)² ∑(y_i - ȳ)²]
              </div>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li>• Assumes approximate bivariate normal distribution.</li>
                <li>• Highly sensitive to extreme outlier bursts.</li>
                <li>• Underestimates non-linear curves (exponential queuing).</li>
              </ul>
            </div>

            {/* Spearman Panel */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30">
              <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs font-mono mb-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                SPEARMAN RANK CORRELATION (ρ)
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                Evaluates the <strong>monotonic relationship</strong> between two variables by converting continuous numbers into ordinal ranks <span className="font-mono text-cyan-200">R(x)</span> and <span className="font-mono text-cyan-200">R(y)</span>.
              </p>
              <div className="p-2.5 rounded bg-slate-950 font-mono text-[10px] text-cyan-200 border border-slate-800 mb-2">
                ρ = 1 - [6 ∑ d_i²] / [n(n² - 1)], where d_i = R(x_i) - R(y_i)
              </div>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li>• Non-parametric: makes no distributional normality assumptions.</li>
                <li>• Robust against extreme outlier leverage.</li>
                <li>• Accurately measures exponential curves and hockey-stick spikes.</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-sans leading-relaxed">
            <strong className="text-white">Why both are combined in this system:</strong>
            {' '}When Pearson and Spearman are both high, the metric has a stable linear impact.
            When Spearman is significantly higher than Pearson (<span className="font-mono text-purple-300">ρ &gt;&gt; r</span>), it reveals a threshold queuing cliff (e.g. Garbage Collection pause storms or queuing theory knee).
          </div>
        </div>
      )}

      {/* Tab 3: Correlation ≠ Causation */}
      {activeTab === 'causation' && (
        <div className="space-y-3 text-xs font-sans">
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-[11px] leading-relaxed">
            <div className="font-bold text-rose-300 text-xs font-mono mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              THE GOLDEN STATISTICAL PRINCIPLE: CORRELATION ≠ CAUSATION
            </div>
            High correlation proves that two variables co-vary together in the observed sample.
            It does <strong className="underline decoration-rose-400">NOT</strong> prove that metric X is the root-cause engine creating the latency in Response Time.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-bold text-white text-[11px] mb-1">1. Common Confounding Cause</div>
              <div className="text-[10px] text-slate-400 leading-relaxed">
                A sudden spike in user concurrency (traffic surge) causes CPU to rise AND Response Time to rise simultaneously. CPU did not cause the slow response; external request volume caused both.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-bold text-white text-[11px] mb-1">2. Reverse Causality</div>
              <div className="text-[10px] text-slate-400 leading-relaxed">
                Slow responses might cause connection back-pressure, thread accumulation, and socket queueing, creating secondary CPU contention.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-bold text-white text-[11px] mb-1">3. Intermediate Co-Factor</div>
              <div className="text-[10px] text-slate-400 leading-relaxed">
                A database query lacking an index burns CPU while holding locks, causing Disk I/O waits and high response time.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Viva Presentation Questions */}
      {activeTab === 'viva' && (
        <div className="space-y-3 text-xs overflow-y-auto max-h-[420px] pr-1">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="font-bold text-cyan-300 text-xs mb-1">
              Q1: Why did you implement both Pearson and Spearman correlation?
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
              <strong>Answer:</strong> Computer systems rarely behave strictly linearly. Queuing systems follow non-linear curves (e.g. M/M/1 queuing curves where latency explodes asymptotically when utilization exceeds 80%). Pearson only measures straight-line linear co-variance. Spearman converts values to ordinal ranks, allowing us to capture monotonic relationships regardless of whether the growth is linear, exponential, or power-law, while being resilient against outlier bursts.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="font-bold text-amber-300 text-xs mb-1">
              Q2: How are duplicate/tied values handled during Spearman ranking?
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
              <strong>Answer:</strong> When duplicate observations occur, standard fractional ranking (average ranking) is used. For example, if two items tie for rank 2 and 3, both receive rank 2.5. When ties exist, the simplified textbook formula <span className="font-mono text-cyan-300">1 - (6∑d²)/(n(n²-1))</span> is slightly inaccurate, so our Python backend computes Pearson's r directly on the fractional ranks via SciPy for 100% mathematical precision.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="font-bold text-rose-300 text-xs mb-1">
              Q3: Does the highest ranked metric guarantee the exact root-cause bottleneck?
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
              <strong>Answer:</strong> No, and this is a core thesis of our project. Correlation measures association, not causation. A high correlation flags a metric as a <em>Potential Bottleneck</em> and <em>Strongly Associated Metric</em>. It directs engineering teams where to target deep diagnostic profiling (e.g. flame graphs, thread dumps, I/O wait queues), eliminating trial-and-error debugging.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
