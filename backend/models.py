"""
Data models and schemas for the System Bottleneck Identification System.
Uses Pydantic v2 schemas for clean REST API request and response contracts.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class MetricStats(BaseModel):
    metric: str
    count: int
    mean: float
    std: float
    min: float
    max: float
    median: float
    p25: float
    p75: float
    p95: float
    iqr: float
    skewness: float
    unit: str = ""


class CorrelationPair(BaseModel):
    metric_a: str
    metric_b: str
    pearson_r: float
    pearson_p_value: float
    pearson_ci_lower: Optional[float] = None
    pearson_ci_upper: Optional[float] = None
    spearman_rho: float
    spearman_p_value: float
    direction: str  # "positive", "negative", "neutral"
    strength: str   # "Very Strong", "Strong", "Moderate", "Weak", "Negligible"
    difference: float  # |pearson - spearman|
    relationship_summary: str
    interpretation: str
    academic_insight: str


class SpearmanStepDetail(BaseModel):
    sample_index: int
    val_x: float
    val_y: float
    rank_x: float
    rank_y: float
    diff_d: float
    diff_d_squared: float


class SpearmanCalculationBreakdown(BaseModel):
    target_metric: str
    predictor_metric: str
    sample_size_n: int
    sum_d_squared: float
    raw_formula_rho: float
    scipy_rho: float
    ties_present: bool
    formula_used: str
    top_ranked_steps: List[SpearmanStepDetail]
    explanation: str


class BottleneckMetric(BaseModel):
    rank: int
    metric: str
    pearson_r: float
    spearman_rho: float
    bottleneck_score: float
    risk_level: str  # "HIGH", "MEDIUM", "LOW"
    direction: str
    strength: str
    avg_value: float
    p95_value: float
    unit: str
    diagnostic_summary: str
    supporting_evidence: List[str]
    investigation_steps: List[str]


class ScatterPoint(BaseModel):
    id: int
    x: float
    y: float
    rank_x: float
    rank_y: float


class ScatterSeries(BaseModel):
    metric_x: str
    metric_y: str
    points: List[ScatterPoint]
    regression_slope: float
    regression_intercept: float
    regression_r2: float
    trendline_equation: str
    pearson_r: float
    spearman_rho: float


class CorrelationMatrix(BaseModel):
    metrics: List[str]
    matrix: List[List[float]]
    p_values: List[List[float]]


class PipelineStageTrace(BaseModel):
    stage_id: str
    stage_name: str
    status: str
    duration_ms: float
    details: str
    math_context: Optional[str] = None


class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    target_metric: Optional[str] = "Response_Time"
    selected_metrics: Optional[List[str]] = None
    workload_name: Optional[str] = "Custom"
    alpha: Optional[float] = 0.05


class AnalysisSummary(BaseModel):
    primary_potential_bottleneck: Optional[str] = None
    primary_risk_level: Optional[str] = None
    highest_pearson_metric: Optional[str] = None
    highest_pearson_value: Optional[float] = None
    highest_spearman_metric: Optional[str] = None
    highest_spearman_value: Optional[float] = None
    avg_target_value: Optional[float] = None
    p95_target_value: Optional[float] = None
    target_unit: Optional[str] = "ms"
    total_observations: int
    health_status: str  # "CRITICAL", "DEGRADED", "OPTIMAL"
    executive_verdict: str


class AnalysisResponse(BaseModel):
    success: bool
    target_metric: str
    workload_name: str
    total_observations: int
    metrics_analyzed: List[str]
    metric_stats: Dict[str, MetricStats]
    pearson_matrix: CorrelationMatrix
    spearman_matrix: CorrelationMatrix
    pair_details: List[CorrelationPair]
    bottleneck_ranking: List[BottleneckMetric]
    target_correlations: List[CorrelationPair]
    scatter_plots: Dict[str, ScatterSeries]
    spearman_breakdowns: Dict[str, SpearmanCalculationBreakdown]
    pipeline_trace: List[PipelineStageTrace]
    summary: AnalysisSummary
    warnings: List[str]
    disclaimer: str = (
        "CAUTION: Correlation indicates statistical co-occurrence and association, NOT direct causation. "
        "A high correlation with Response Time identifies a strongly associated metric and potential bottleneck "
        "warranting engineering investigation (e.g., flame graphs, profiling, thread dump analysis), "
        "not definitive proof of root-cause causality."
    )


class ValidationResponse(BaseModel):
    is_valid: bool
    row_count: int
    column_count: int
    detected_columns: List[str]
    numeric_columns: List[str]
    non_numeric_columns: List[str]
    missing_value_counts: Dict[str, int]
    zero_variance_columns: List[str]
    warnings: List[str]
    errors: List[str]


class WorkloadPresetInfo(BaseModel):
    id: str
    name: str
    description: str
    primary_bottleneck_expected: str
    row_count: int
    tags: List[str]
