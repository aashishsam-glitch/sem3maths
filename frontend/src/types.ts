export interface MetricStats {
  metric: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  p25: number;
  p75: number;
  p95: number;
  iqr: number;
  skewness: number;
  unit: string;
}

export interface CorrelationPair {
  metric_a: string;
  metric_b: string;
  pearson_r: number;
  pearson_p_value: number;
  pearson_ci_lower?: number | null;
  pearson_ci_upper?: number | null;
  spearman_rho: number;
  spearman_p_value: number;
  direction: "positive" | "negative" | "neutral";
  strength: "Very Strong" | "Strong" | "Moderate" | "Weak" | "Negligible";
  difference: number;
  relationship_summary: string;
  interpretation: string;
  academic_insight: string;
}

export interface SpearmanStepDetail {
  sample_index: number;
  val_x: number;
  val_y: number;
  rank_x: number;
  rank_y: number;
  diff_d: number;
  diff_d_squared: number;
}

export interface SpearmanCalculationBreakdown {
  target_metric: string;
  predictor_metric: string;
  sample_size_n: number;
  sum_d_squared: number;
  raw_formula_rho: number;
  scipy_rho: number;
  ties_present: boolean;
  formula_used: string;
  top_ranked_steps: SpearmanStepDetail[];
  explanation: string;
}

export interface BottleneckMetric {
  rank: number;
  metric: string;
  pearson_r: number;
  spearman_rho: number;
  bottleneck_score: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  direction: string;
  strength: string;
  avg_value: number;
  p95_value: number;
  unit: string;
  diagnostic_summary: string;
  supporting_evidence: string[];
  investigation_steps: string[];
}

export interface ScatterPoint {
  id: number;
  x: number;
  y: number;
  rank_x: number;
  rank_y: number;
}

export interface ScatterSeries {
  metric_x: string;
  metric_y: string;
  points: ScatterPoint[];
  regression_slope: number;
  regression_intercept: number;
  regression_r2: number;
  trendline_equation: string;
  pearson_r: number;
  spearman_rho: number;
}

export interface CorrelationMatrix {
  metrics: string[];
  matrix: number[][];
  p_values: number[][];
}

export interface PipelineStageTrace {
  stage_id: string;
  stage_name: string;
  status: string;
  duration_ms: number;
  details: string;
  math_context?: string;
}

export interface AnalysisSummary {
  primary_potential_bottleneck?: string;
  primary_risk_level?: "HIGH" | "MEDIUM" | "LOW";
  highest_pearson_metric?: string;
  highest_pearson_value?: number;
  highest_spearman_metric?: string;
  highest_spearman_value?: number;
  avg_target_value?: number;
  p95_target_value?: number;
  target_unit?: string;
  total_observations: number;
  health_status: "CRITICAL" | "DEGRADED" | "OPTIMAL";
  executive_verdict: string;
}

export interface AnalysisResponse {
  success: boolean;
  target_metric: string;
  workload_name: string;
  total_observations: number;
  metrics_analyzed: string[];
  metric_stats: Record<string, MetricStats>;
  pearson_matrix: CorrelationMatrix;
  spearman_matrix: CorrelationMatrix;
  pair_details: CorrelationPair[];
  bottleneck_ranking: BottleneckMetric[];
  target_correlations: CorrelationPair[];
  scatter_plots: Record<string, ScatterSeries>;
  spearman_breakdowns: Record<string, SpearmanCalculationBreakdown>;
  pipeline_trace: PipelineStageTrace[];
  summary: AnalysisSummary;
  warnings: string[];
  disclaimer: string;
}

export interface ValidationResponse {
  is_valid: boolean;
  row_count: number;
  column_count: number;
  detected_columns: string[];
  numeric_columns: string[];
  non_numeric_columns: string[];
  missing_value_counts: Record<string, number>;
  zero_variance_columns: string[];
  warnings: string[];
  errors: string[];
}

export interface WorkloadPresetInfo {
  id: string;
  name: string;
  description: string;
  primary_bottleneck_expected: string;
  row_count: number;
  tags: string[];
}

export interface AnalysisRequest {
  data: Record<string, any>[];
  target_metric?: string;
  selected_metrics?: string[];
  workload_name?: string;
  alpha?: number;
}
