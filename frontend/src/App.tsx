import React, { useState, useEffect } from 'react';
import {
  fetchHealth,
  fetchWorkloads,
  fetchSampleData,
  runAnalysis,
} from './services/api';
import {
  AnalysisResponse,
  WorkloadPresetInfo,
} from './types';
import { TopNavBar } from './components/dashboard/TopNavBar';
import { SystemObservatory3D } from './components/three/SystemObservatory3D';
import { KpiOverviewRibbon } from './components/dashboard/KpiOverviewRibbon';
import { BottleneckPanel } from './components/dashboard/BottleneckPanel';
import { CorrelationHeatmap } from './components/dashboard/CorrelationHeatmap';
import { InteractiveScatterPlot } from './components/dashboard/InteractiveScatterPlot';
import { ComparisonView } from './components/dashboard/ComparisonView';
import { DataTableModal } from './components/dashboard/DataTableModal';
import { DataFlowPipeline } from './components/dashboard/DataFlowPipeline';
import { EducationalExplainer } from './components/dashboard/EducationalExplainer';
import { ExportModal } from './components/dashboard/ExportModal';
import { UploadModal } from './components/dashboard/UploadModal';
import { LiveAnalysisOverlay } from './components/dashboard/LiveAnalysisOverlay';
import {
  Grid,
  TrendingUp,
  Scale,
  GitCommit,
  BookOpen,
  AlertTriangle,
  Info,
} from 'lucide-react';

type DashboardTab = 'heatmap' | 'scatter' | 'comparison' | 'pipeline' | 'explainer';

export const App: React.FC = () => {
  const [workloads, setWorkloads] = useState<WorkloadPresetInfo[]>([]);
  const [selectedWorkload, setSelectedWorkload] = useState<string>('cpu_bound');
  const [currentRecords, setCurrentRecords] = useState<Record<string, any>[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>('CPU_Utilization');
  const [targetMetric, setTargetMetric] = useState<string>('Response_Time');
  const [activeTab, setActiveTab] = useState<DashboardTab>('heatmap');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLiveOverlay, setShowLiveOverlay] = useState<boolean>(false);
  const [explainMode, setExplainMode] = useState<boolean>(false);

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isDataEditorOpen, setIsDataEditorOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const wList = await fetchWorkloads();
        setWorkloads(wList);

        const sampleRes = await fetchSampleData('cpu_bound', 100);
        setCurrentRecords(sampleRes.data);

        const analysisRes = await runAnalysis({
          data: sampleRes.data,
          target_metric: 'Response_Time',
          workload_name: 'CPU Saturation Workload',
        });
        setAnalysis(analysisRes);
        if (analysisRes.bottleneck_ranking.length > 0) {
          setSelectedMetric(analysisRes.bottleneck_ranking[0].metric);
        }
      } catch (err: any) {
        console.error('Initialization error:', err);
        setErrorMessage(err.message || 'Failed to initialize system telemetry');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Handle workload change
  const handleSelectWorkload = async (wId: string) => {
    setSelectedWorkload(wId);
    try {
      setIsLoading(true);
      const sampleRes = await fetchSampleData(wId, 100);
      setCurrentRecords(sampleRes.data);

      const chosenW = workloads.find((w) => w.id === wId);
      const analysisRes = await runAnalysis({
        data: sampleRes.data,
        target_metric: 'Response_Time',
        workload_name: chosenW?.name || wId,
      });
      setAnalysis(analysisRes);
      if (analysisRes.bottleneck_ranking.length > 0) {
        setSelectedMetric(analysisRes.bottleneck_ranking[0].metric);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load workload');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger analysis execution with live animation
  const handleTriggerAnalysis = () => {
    setShowLiveOverlay(true);
  };

  const handleAnalysisAnimationComplete = async () => {
    setShowLiveOverlay(false);
    try {
      setIsLoading(true);
      const chosenW = workloads.find((w) => w.id === selectedWorkload);
      const analysisRes = await runAnalysis({
        data: currentRecords,
        target_metric: targetMetric,
        workload_name: chosenW?.name || 'Custom Dataset',
      });
      setAnalysis(analysisRes);
      if (analysisRes.bottleneck_ranking.length > 0) {
        setSelectedMetric(analysisRes.bottleneck_ranking[0].metric);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  // When a user selects a node in 3D
  const handleSelectMetricFrom3D = (metricName: string) => {
    setSelectedMetric(metricName);
    setActiveTab('scatter');
  };

  // When a user selects a pair in the heatmap
  const handleSelectPairFromHeatmap = (mA: string, mB: string) => {
    const predictor = mA === targetMetric ? mB : mA;
    setSelectedMetric(predictor);
    setActiveTab('scatter');
  };

  const handleDatasetLoaded = async (records: Record<string, any>[], filename: string) => {
    setCurrentRecords(records);
    try {
      setIsLoading(true);
      const analysisRes = await runAnalysis({
        data: records,
        target_metric: targetMetric,
        workload_name: `Uploaded: ${filename}`,
      });
      setAnalysis(analysisRes);
      if (analysisRes.bottleneck_ranking.length > 0) {
        setSelectedMetric(analysisRes.bottleneck_ranking[0].metric);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze uploaded file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 cyber-grid relative">
      {/* Top Navigation */}
      <TopNavBar
        workloads={workloads}
        selectedWorkload={selectedWorkload}
        onSelectWorkload={handleSelectWorkload}
        onRunAnalysis={handleTriggerAnalysis}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDataEditor={() => setIsDataEditorOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        explainMode={explainMode}
        onToggleExplainMode={() => {
          const next = !explainMode;
          setExplainMode(next);
          if (next) setActiveTab('explainer');
        }}
        isLoading={isLoading}
        analysis={analysis}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top KPI Ribbon */}
        <KpiOverviewRibbon
          analysis={analysis}
          onSelectMetric={(m) => {
            setSelectedMetric(m);
            setActiveTab('scatter');
          }}
        />

        {/* Upper Center Stage: 3D System Observatory (Left/Center) + Bottleneck Diagnostics (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 3D Observatory (8 cols) */}
          <div className="lg:col-span-8 h-full flex flex-col">
            <SystemObservatory3D
              analysis={analysis}
              selectedMetric={selectedMetric}
              onSelectMetric={handleSelectMetricFrom3D}
            />
          </div>

          {/* Dedicated Bottleneck Hierarchy (4 cols) */}
          <div className="lg:col-span-4 h-full flex flex-col">
            {analysis && (
              <BottleneckPanel
                bottlenecks={analysis.bottleneck_ranking}
                targetMetric={analysis.target_metric}
                selectedMetric={selectedMetric}
                onSelectMetric={(m) => setSelectedMetric(m)}
              />
            )}
          </div>
        </div>

        {/* Lower Analytics Suite Navigation Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('heatmap')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === 'heatmap'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-cyan-400" />
                <span>Correlation Heatmap</span>
              </button>

              <button
                onClick={() => setActiveTab('scatter')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === 'scatter'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Scatter & Trendline</span>
              </button>

              <button
                onClick={() => setActiveTab('comparison')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === 'comparison'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-purple-400" />
                <span>Pearson vs Spearman</span>
              </button>

              <button
                onClick={() => setActiveTab('pipeline')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === 'pipeline'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                <span>Data Flow Pipeline</span>
              </button>

              <button
                onClick={() => setActiveTab('explainer')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === 'explainer'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Educational Guide & Viva</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
              Dataset: <span className="text-slate-300">{analysis?.workload_name || 'Simulated'}</span>
            </div>
          </div>

          {/* Active Tab View */}
          <div className="min-h-[380px]">
            {activeTab === 'heatmap' && analysis && (
              <CorrelationHeatmap
                pearsonMatrix={analysis.pearson_matrix}
                spearmanMatrix={analysis.spearman_matrix}
                pairs={analysis.pair_details}
                onSelectPair={handleSelectPairFromHeatmap}
              />
            )}

            {activeTab === 'scatter' && analysis && (
              <InteractiveScatterPlot
                scatterPlots={analysis.scatter_plots}
                availableMetrics={analysis.metrics_analyzed}
                targetMetric={analysis.target_metric}
                selectedMetricX={selectedMetric || analysis.metrics_analyzed[0]}
                onChangeMetricX={(m) => setSelectedMetric(m)}
              />
            )}

            {activeTab === 'comparison' && analysis && (
              <ComparisonView
                targetCorrelations={analysis.target_correlations}
                targetMetric={analysis.target_metric}
                spearmanBreakdowns={analysis.spearman_breakdowns}
              />
            )}

            {activeTab === 'pipeline' && (
              <DataFlowPipeline
                pipelineTrace={analysis?.pipeline_trace || []}
                isAnalyzing={isLoading}
              />
            )}

            {activeTab === 'explainer' && <EducationalExplainer />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 py-4 px-6 text-center text-xs font-mono text-slate-500 bg-[#07090e]">
        SYSTEM BOTTLENECK IDENTIFICATION USING CORRELATION AND RANK CORRELATION • PURE PYTHON ANALYTICAL CORE • 3D SYSTEM OBSERVATORY
      </footer>

      {/* Modals & Overlays */}
      <LiveAnalysisOverlay
        isOpen={showLiveOverlay}
        onComplete={handleAnalysisAnimationComplete}
      />

      <DataTableModal
        isOpen={isDataEditorOpen}
        onClose={() => setIsDataEditorOpen(false)}
        data={currentRecords}
        onUpdateData={(newData) => setCurrentRecords(newData)}
        onRerunAnalysis={handleTriggerAnalysis}
        metricStats={analysis?.metric_stats}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        analysis={analysis}
        rawData={currentRecords}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
      />
    </div>
  );
};

export default App;
