"""
FastAPI Server for System Bottleneck Identification System.
Provides RESTful APIs for data validation, simulation, correlation analysis,
and pipeline telemetry. All mathematical calculations run in Python.
"""

import time
import io
import os
import sys
from typing import List, Dict, Any, Optional

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

from models import (
    AnalysisRequest,
    AnalysisResponse,
    ValidationResponse,
    WorkloadPresetInfo,
    PipelineStageTrace,
)
from data_processor import (
    WORKLOAD_PRESETS,
    generate_simulated_workload,
    validate_raw_data,
    clean_and_prepare_dataframe,
    compute_metric_statistics,
)
from correlation_engine import (
    build_correlation_matrices,
    compute_spearman_detailed,
    calculate_scatter_series,
)
from bottleneck_detector import (
    rank_bottlenecks,
    generate_executive_summary,
)
from visualization import generate_heatmap_image, generate_scatter_image


app = FastAPI(
    title="System Bottleneck Identification API",
    description="Mathematical analytics service computing Pearson & Spearman correlation for software performance diagnostics.",
    version="1.0.0",
)

# Enable CORS for local Vite dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health status and analytical backend metadata."""
    return {
        "status": "healthy",
        "service": "System Bottleneck Identification Engine",
        "math_engine": "NumPy 2.x + SciPy 1.18.x + Pandas",
        "timestamp": time.time(),
    }


@app.get("/workloads", response_model=List[WorkloadPresetInfo])
def get_workload_presets():
    """Lists available realistic simulated performance workloads."""
    return WORKLOAD_PRESETS


@app.get("/sample-data")
def get_sample_dataset(
    workload: str = Query("cpu_bound", description="Workload ID preset"),
    count: int = Query(100, ge=10, le=1000, description="Observation count"),
):
    """
    Returns realistic simulated system metrics telemetry.
    Explicitly labeled as 'Simulated Dataset'.
    """
    valid_ids = [w.id for w in WORKLOAD_PRESETS]
    chosen = workload if workload in valid_ids else "cpu_bound"
    data = generate_simulated_workload(workload_id=chosen, n_samples=count)
    return {
        "workload_id": chosen,
        "label": "Simulated Dataset",
        "total_rows": len(data),
        "data": data,
    }


@app.post("/validate", response_model=ValidationResponse)
def validate_dataset(records: List[Dict[str, Any]]):
    """Validates raw records for numeric viability, sample size, and variance."""
    return validate_raw_data(records)


@app.post("/upload")
async def upload_csv_dataset(file: UploadFile = File(...)):
    """Accepts CSV file upload, parses into records, and validates."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        records = df.to_dict(orient="records")
        validation = validate_raw_data(records)
        return {
            "filename": file.filename,
            "records": records,
            "validation": validation,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")


@app.post("/analyze", response_model=AnalysisResponse)
def run_correlation_analysis(request: AnalysisRequest):
    """
    Executes the complete statistical correlation and bottleneck identification pipeline.
    Pure Python execution:
    1. Input Validation
    2. Data Cleaning & Variance Check
    3. Descriptive Statistics
    4. Pearson Linear Matrix & Hypothesis Tests
    5. Spearman Rank Matrix & Rank Differences
    6. Bottleneck Association Ranking
    7. Scatter Series & Regression Trendlines
    """
    pipeline_traces: List[PipelineStageTrace] = []
    overall_start = time.perf_counter()

    # Stage 1: Validation
    s1_start = time.perf_counter()
    validation = validate_raw_data(request.data)
    if not validation.is_valid:
        raise HTTPException(
            status_code=422,
            detail=f"Data validation failed: {'; '.join(validation.errors)}",
        )
    s1_dur = (time.perf_counter() - s1_start) * 1000
    pipeline_traces.append(
        PipelineStageTrace(
            stage_id="s1_validation",
            stage_name="Data Validation",
            status="COMPLETED",
            duration_ms=round(s1_dur, 2),
            details=f"Validated {validation.row_count} rows across {validation.column_count} columns.",
            math_context="Checked finite numeric values, minimum n >= 4, null ratio < 30%.",
        )
    )

    # Stage 2: Processing & Cleaning
    s2_start = time.perf_counter()
    clean_df, active_metrics, proc_warnings = clean_and_prepare_dataframe(
        data=request.data,
        selected_metrics=request.selected_metrics,
        target_metric=request.target_metric or "Response_Time",
    )
    s2_dur = (time.perf_counter() - s2_start) * 1000
    pipeline_traces.append(
        PipelineStageTrace(
            stage_id="s2_processing",
            stage_name="Data Processing & Cleaning",
            status="COMPLETED",
            duration_ms=round(s2_dur, 2),
            details=f"Prepared {len(active_metrics)} active numeric metrics. Handled missing values via median imputation.",
            math_context="Screened for zero sample variance (s_x^2 > 0) to avoid division by zero in r.",
        )
    )

    if len(active_metrics) < 2:
        raise HTTPException(
            status_code=400,
            detail="Fewer than two metrics with non-zero variance are available for correlation analysis.",
        )

    # Stage 3: Descriptive Statistics
    s3_start = time.perf_counter()
    stats_dict = compute_metric_statistics(clean_df)
    s3_dur = (time.perf_counter() - s3_start) * 1000
    pipeline_traces.append(
        PipelineStageTrace(
            stage_id="s3_descriptive",
            stage_name="Descriptive Statistics",
            status="COMPLETED",
            duration_ms=round(s3_dur, 2),
            details=f"Calculated mean, std, median, IQR, P95, and skewness for all metrics.",
            math_context="Evaluated sample moments and distributional dispersion.",
        )
    )

    # Prepare numpy data dictionary
    data_dict = {col: clean_df[col].to_numpy(dtype=float) for col in active_metrics}
    target_metric = request.target_metric if request.target_metric in active_metrics else active_metrics[-1]

    # Stage 4: Pearson Correlation Analysis
    s4_start = time.perf_counter()
    pearson_mat, spearman_mat, pairs = build_correlation_matrices(
        metrics=active_metrics, data_dict=data_dict
    )
    s4_dur = (time.perf_counter() - s4_start) * 1000
    pipeline_traces.append(
        PipelineStageTrace(
            stage_id="s4_pearson",
            stage_name="Pearson Linear Covariance",
            status="COMPLETED",
            duration_ms=round(s4_dur, 2),
            details=f"Generated {len(active_metrics)}x{len(active_metrics)} Pearson matrix with Fisher z 95% CIs.",
            math_context="Formula: r = sum((x_i - mean_x)(y_i - mean_y)) / (s_x * s_y * (n-1)). Hypothesis test via Student's t(n-2).",
        )
    )

    # Stage 5: Spearman Rank Correlation
    s5_start = time.perf_counter()
    spearman_breakdowns = {}
    for col in active_metrics:
        if col != target_metric:
            _, _, breakdown = compute_spearman_detailed(
                x=data_dict[col],
                y=data_dict[target_metric],
                metric_x=col,
                metric_y=target_metric,
            )
            spearman_breakdowns[col] = breakdown
    s5_dur = (time.perf_counter() - s5_start) * 1000
    pipeline_traces.append(
        PipelineStageTrace(
            stage_id="s5_spearman",
            stage_name="Spearman Rank Transformation",
            status="COMPLETED",
            duration_ms=round(s5_dur, 2),
            details=f"Converted continuous values to fractional ranks R(x_i) and evaluated rank difference vectors d_i.",
            math_context="Formula: rho = 1 - (6 * sum(d_i^2)) / (n * (n^2 - 1)). Measures monotonic relationships without assuming linearity.",
        )
    )

    # Stage 6: Bottleneck Identification
    s6_start = time.perf_counter()
    target_pairs = [
        p for p in pairs if p.metric_a == target_metric or p.metric_b == target_metric
    ]
    bottlenecks = rank_bottlenecks(
        target_metric=target_metric,
        target_pairs=target_pairs,
        metric_stats=stats_dict,
    )
    summary = generate_executive_summary(
        target_metric=target_metric,
        ranked_bottlenecks=bottlenecks,
        metric_stats=stats_dict,
        total_observations=len(clean_df),
    )
    s6_dur = (time.perf_counter() - s6_start) * 1000
    pipeline_traces.append(
        PipelineStageTrace(
            stage_id="s6_bottlenecks",
            stage_name="Bottleneck Association Ranking",
            status="COMPLETED",
            duration_ms=round(s6_dur, 2),
            details=f"Ranked {len(bottlenecks)} candidate metrics against target '{target_metric}'.",
            math_context="Computed composite score: 0.5*|r| + 0.5*|rho|. Categorized risk into High, Medium, Low.",
        )
    )

    # Stage 7: Scatter Series & Regression
    s7_start = time.perf_counter()
    scatter_plots = {}
    for col in active_metrics:
        if col != target_metric:
            series = calculate_scatter_series(
                x=data_dict[col],
                y=data_dict[target_metric],
                metric_x=col,
                metric_y=target_metric,
            )
            scatter_plots[col] = series
    s7_dur = (time.perf_counter() - s7_start) * 1000
    pipeline_traces.append(
        PipelineStageTrace(
            stage_id="s7_regression",
            stage_name="Scatter & Regression Modeling",
            status="COMPLETED",
            duration_ms=round(s7_dur, 2),
            details=f"Computed ordinary least-squares trendline y = mx + c and R^2 for each predictor pair.",
            math_context="Fitted slope m = Cov(X,Y)/Var(X), intercept c = mean(Y) - m*mean(X).",
        )
    )

    return AnalysisResponse(
        success=True,
        target_metric=target_metric,
        workload_name=request.workload_name or "Custom Telemetry",
        total_observations=len(clean_df),
        metrics_analyzed=active_metrics,
        metric_stats=stats_dict,
        pearson_matrix=pearson_mat,
        spearman_matrix=spearman_mat,
        pair_details=pairs,
        bottleneck_ranking=bottlenecks,
        target_correlations=target_pairs,
        scatter_plots=scatter_plots,
        spearman_breakdowns=spearman_breakdowns,
        pipeline_trace=pipeline_traces,
        summary=summary,
        warnings=proc_warnings + validation.warnings,
    )


@app.post("/export/plots")
def generate_export_plots(request: AnalysisRequest):
    """Generates server-side base64 plots for report export."""
    clean_df, active_metrics, _ = clean_and_prepare_dataframe(
        data=request.data,
        selected_metrics=request.selected_metrics,
        target_metric=request.target_metric or "Response_Time",
    )
    data_dict = {col: clean_df[col].to_numpy(dtype=float) for col in active_metrics}
    target = request.target_metric if request.target_metric in active_metrics else active_metrics[-1]

    p_mat, s_mat, pairs = build_correlation_matrices(active_metrics, data_dict)

    heatmap_p = generate_heatmap_image(p_mat.matrix, active_metrics, "Pearson Correlation Heatmap")
    heatmap_s = generate_heatmap_image(s_mat.matrix, active_metrics, "Spearman Rank Correlation Heatmap")

    # Primary predictor scatter
    predictors = [m for m in active_metrics if m != target]
    scatter_primary = None
    if predictors:
        best_p = predictors[0]
        p_r = p_mat.matrix[active_metrics.index(best_p)][active_metrics.index(target)]
        s_rho = s_mat.matrix[active_metrics.index(best_p)][active_metrics.index(target)]
        scatter_primary = generate_scatter_image(
            data_dict[best_p], data_dict[target], best_p, target, p_r, s_rho
        )

    return {
        "pearson_heatmap_base64": heatmap_p,
        "spearman_heatmap_base64": heatmap_s,
        "scatter_primary_base64": scatter_primary,
    }


# Serve built frontend statically if available
frontend_dist = os.path.abspath(os.path.join(current_dir, "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    # Mount static assets
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/") or full_path in [
            "health",
            "workloads",
            "sample-data",
            "validate",
            "upload",
            "analyze",
            "export/plots",
            "docs",
            "openapi.json",
        ]:
            raise HTTPException(status_code=404, detail="Not found")

        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_html = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_html):
            return FileResponse(index_html)
        raise HTTPException(status_code=404, detail="Frontend build index not found")
