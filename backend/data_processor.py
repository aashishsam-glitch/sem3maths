"""
Data Processing, Validation, and Workload Simulation Engine.
Implements robust data cleaning, statistical summary extraction,
and realistic performance workload generators labeled as 'Simulated Dataset'.
"""

import io
import os
import sys
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from scipy import stats

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from models import (
    MetricStats,
    ValidationResponse,
    WorkloadPresetInfo,
)
from bottleneck_detector import get_metric_unit


WORKLOAD_PRESETS: List[WorkloadPresetInfo] = [
    WorkloadPresetInfo(
        id="cpu_bound",
        name="CPU Compute Saturation (Crypto / Microservices)",
        description="CPU reaches sustained high utilization (75-98%). Heavy thread contention drives Response Time escalation.",
        primary_bottleneck_expected="CPU_Utilization",
        row_count=100,
        tags=["High Load", "Linear Latency", "Compute-Intensive"],
    ),
    WorkloadPresetInfo(
        id="memory_leak",
        name="Progressive Memory Leak & Stop-the-World GC",
        description="Memory consumption climbs monotonically. Major GC pause storms cause hockey-stick exponential Response Time spikes.",
        primary_bottleneck_expected="Memory_Usage",
        row_count=100,
        tags=["Non-Linear", "GC Storm", "Spearman Dominant"],
    ),
    WorkloadPresetInfo(
        id="io_bound",
        name="Database I/O & Disk Write Saturation",
        description="Massive batch database writes flood the storage subsystem. Disk queue depth explodes, driving Response Time delays.",
        primary_bottleneck_expected="Disk_IO",
        row_count=100,
        tags=["Storage Bottleneck", "I/O Wait", "High IOPS"],
    ),
    WorkloadPresetInfo(
        id="network_congestion",
        name="Cross-Datacenter Network Latency Spike",
        description="Packet queueing, WAN latency fluctuations, and network socket delays directly dominate end-to-end Response Time.",
        primary_bottleneck_expected="Network_Latency",
        row_count=100,
        tags=["Network Bound", "Jitter", "External RPC"],
    ),
    WorkloadPresetInfo(
        id="balanced",
        name="Balanced Nominal Operations (Healthy Cluster)",
        description="All system metrics operate comfortably well below saturation limits. Correlation with Response Time remains low.",
        primary_bottleneck_expected="None (System Balanced)",
        row_count=100,
        tags=["Optimal", "Low Variance", "No Bottlenecks"],
    ),
    WorkloadPresetInfo(
        id="mixed_spike",
        name="Multi-Resource Traffic Surge (CPU & Network Spike)",
        description="Sudden user concurrency burst strains both CPU compute threads and network socket buffers simultaneously.",
        primary_bottleneck_expected="CPU_Utilization",
        row_count=120,
        tags=["Complex Concurrency", "Multi-Variable", "Burst Load"],
    ),
]


def generate_simulated_workload(workload_id: str = "cpu_bound", n_samples: int = 100) -> List[Dict[str, Any]]:
    """
    Generates realistic, physically plausible system telemetry.
    Labeled explicitly as Simulated Dataset for academic and evaluation integrity.
    """
    np.random.seed(42)  # Deterministic seed for reproducible evaluation
    t = np.linspace(0, 10, n_samples)
    noise = lambda scale: np.random.normal(0, scale, n_samples)

    if workload_id == "cpu_bound":
        # CPU drives response time strongly (Pearson ~0.92, Spearman ~0.94)
        cpu = np.clip(35 + 5.5 * t + 8 * np.sin(t * 1.5) + noise(3.5), 20.0, 99.5)
        # Response time has strong linear & slight quadratic dependency on CPU
        resp_time = np.clip(18.0 + 1.6 * (cpu - 30) + 0.015 * ((cpu - 30) ** 2) + noise(4.0), 12.0, 240.0)
        # Memory stays moderate
        memory = np.clip(45 + 1.2 * t + noise(2.5), 30.0, 75.0)
        # Disk moderate
        disk_io = np.clip(40 + 15 * np.cos(t) + noise(6.0), 10.0, 95.0)
        # Network low
        net_lat = np.clip(4.5 + noise(1.0), 1.5, 12.0)

    elif workload_id == "memory_leak":
        # Memory climbs monotonically from 42% to 96%
        memory = np.clip(42.0 + 5.2 * t + noise(1.5), 38.0, 98.5)
        # Response time stays flat until memory exceeds 78%, then hockey sticks due to GC
        gc_penalty = np.where(memory > 78.0, np.exp((memory - 78.0) * 0.22) * 8.0, 0.0)
        resp_time = np.clip(25.0 + 0.15 * memory + gc_penalty + noise(5.0), 15.0, 310.0)
        cpu = np.clip(35.0 + 0.3 * gc_penalty + noise(4.0), 20.0, 85.0)
        disk_io = np.clip(30.0 + noise(4.0), 10.0, 60.0)
        net_lat = np.clip(5.0 + noise(1.2), 2.0, 12.0)

    elif workload_id == "io_bound":
        # Disk IO floods heavily
        disk_io = np.clip(30.0 + 28.0 * t + 35.0 * np.sin(t * 2.0) + noise(12.0), 15.0, 380.0)
        # Response time correlates directly with Disk I/O wait
        resp_time = np.clip(22.0 + 0.45 * (disk_io - 20) + noise(6.5), 18.0, 260.0)
        cpu = np.clip(28.0 + 0.08 * disk_io + noise(3.0), 18.0, 65.0)
        memory = np.clip(50.0 + noise(2.0), 40.0, 65.0)
        net_lat = np.clip(6.0 + noise(1.5), 2.0, 14.0)

    elif workload_id == "network_congestion":
        # Network Latency spikes across datacenters
        net_lat = np.clip(6.0 + 12.0 * t + 18.0 * np.sin(t * 1.8) + noise(4.0), 3.0, 160.0)
        # Response time mirrors network latency directly
        resp_time = np.clip(16.0 + 1.25 * net_lat + noise(5.0), 15.0, 250.0)
        cpu = np.clip(32.0 + noise(3.5), 18.0, 55.0)
        memory = np.clip(45.0 + noise(2.5), 35.0, 60.0)
        disk_io = np.clip(25.0 + noise(5.0), 10.0, 50.0)

    elif workload_id == "mixed_spike":
        # CPU and Network both strain under traffic burst
        burst = 1.0 / (1.0 + np.exp(-(t - 4.5) * 2.0))
        cpu = np.clip(30.0 + 55.0 * burst + noise(4.0), 20.0, 96.0)
        net_lat = np.clip(5.0 + 45.0 * burst + noise(3.0), 3.0, 80.0)
        resp_time = np.clip(20.0 + 1.1 * (cpu - 25) + 0.8 * net_lat + noise(5.0), 18.0, 240.0)
        memory = np.clip(40.0 + 25.0 * burst + noise(2.0), 30.0, 75.0)
        disk_io = np.clip(35.0 + 20.0 * burst + noise(5.0), 15.0, 85.0)

    else:  # "balanced"
        # Everything low, no bottleneck
        cpu = np.clip(25.0 + 5.0 * np.sin(t) + noise(3.0), 15.0, 42.0)
        memory = np.clip(38.0 + 3.0 * np.cos(t) + noise(2.0), 28.0, 48.0)
        disk_io = np.clip(22.0 + noise(4.0), 10.0, 45.0)
        net_lat = np.clip(4.0 + noise(0.8), 1.5, 8.5)
        resp_time = np.clip(22.0 + 0.1 * cpu + noise(2.5), 16.0, 34.0)

    records: List[Dict[str, Any]] = []
    for i in range(n_samples):
        records.append(
            {
                "Timestamp_Sec": round(float(t[i] * 10), 1),
                "CPU_Utilization": round(float(cpu[i]), 2),
                "Memory_Usage": round(float(memory[i]), 2),
                "Disk_IO": round(float(disk_io[i]), 2),
                "Network_Latency": round(float(net_lat[i]), 2),
                "Response_Time": round(float(resp_time[i]), 2),
            }
        )
    return records


def validate_raw_data(data: List[Dict[str, Any]]) -> ValidationResponse:
    """
    Validates user-uploaded or manually entered dataset against statistical constraints:
    missing values, non-numeric columns, zero variance, and sample size.
    """
    errors: List[str] = []
    warnings: List[str] = []

    if not data or len(data) == 0:
        return ValidationResponse(
            is_valid=False,
            row_count=0,
            column_count=0,
            detected_columns=[],
            numeric_columns=[],
            non_numeric_columns=[],
            missing_value_counts={},
            zero_variance_columns=[],
            warnings=[],
            errors=["Dataset is empty. Please provide at least 4 observations."],
        )

    df = pd.DataFrame(data)
    row_count, col_count = df.shape

    if row_count < 4:
        errors.append(f"Insufficient observations (found {row_count}). Minimum required is 4 rows for correlation.")
    elif row_count < 10:
        warnings.append(f"Small sample size ({row_count} rows). P-values and confidence intervals may have wide margins.")

    detected_cols = list(df.columns)
    numeric_cols: List[str] = []
    non_numeric_cols: List[str] = []
    missing_counts: Dict[str, int] = {}
    zero_variance_cols: List[str] = []

    for col in detected_cols:
        # Check missing values
        null_count = int(df[col].isna().sum())
        missing_counts[col] = null_count

        # Test if column can be coerced to numeric
        converted = pd.to_numeric(df[col], errors="coerce")
        valid_numeric_count = int(converted.notna().sum())

        if valid_numeric_count >= (row_count * 0.7) and valid_numeric_count >= 3:
            numeric_cols.append(col)
            # Check for constant zero-variance
            clean_series = converted.dropna()
            if len(clean_series) > 1 and float(clean_series.std(ddof=1)) == 0.0:
                zero_variance_cols.append(col)
                warnings.append(f"Column '{col}' has zero variance (constant values). Correlation cannot be computed.")
        else:
            non_numeric_cols.append(col)

    if len(numeric_cols) < 2:
        errors.append(f"At least 2 numeric metrics are required for correlation analysis. Found: {numeric_cols}")

    is_valid = len(errors) == 0

    return ValidationResponse(
        is_valid=is_valid,
        row_count=row_count,
        column_count=col_count,
        detected_columns=detected_cols,
        numeric_columns=numeric_cols,
        non_numeric_columns=non_numeric_cols,
        missing_value_counts=missing_counts,
        zero_variance_columns=zero_variance_cols,
        warnings=warnings,
        errors=errors,
    )


def clean_and_prepare_dataframe(
    data: List[Dict[str, Any]],
    selected_metrics: Optional[List[str]] = None,
    target_metric: str = "Response_Time",
) -> Tuple[pd.DataFrame, List[str], List[str]]:
    """
    Cleans raw records into numeric arrays, handles NaN rows via forward-fill/median,
    and returns valid DataFrame and active metric list.
    """
    warnings: List[str] = []
    df = pd.DataFrame(data)

    # Convert columns to numeric
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Keep only numeric columns
    numeric_df = df.select_dtypes(include=[np.number])

    if selected_metrics:
        # Filter by selected
        available = [m for m in selected_metrics if m in numeric_df.columns]
        if target_metric in numeric_df.columns and target_metric not in available:
            available.append(target_metric)
        active_cols = available
    else:
        # Default exclude timestamp if present
        active_cols = [c for c in numeric_df.columns if not any(k in c.lower() for k in ["time_sec", "timestamp", "index", "id"])]
        if not active_cols:
            active_cols = list(numeric_df.columns)

    # Impute missing values with median or drop
    clean_df = numeric_df[active_cols].copy()
    if clean_df.isna().sum().sum() > 0:
        clean_df = clean_df.fillna(clean_df.median())
        warnings.append("Missing values detected and imputed with median for analysis.")

    # Drop zero variance columns
    usable_cols = []
    for col in active_cols:
        if clean_df[col].std(ddof=1) > 1e-9:
            usable_cols.append(col)
        else:
            warnings.append(f"Metric '{col}' excluded due to zero variance.")

    # Ensure target_metric is present
    if target_metric not in usable_cols and len(usable_cols) > 0:
        # Fallback to last column
        target_metric = usable_cols[-1]
        warnings.append(f"Target metric not found or constant; defaulted to '{target_metric}'.")

    return clean_df[usable_cols], usable_cols, warnings


def compute_metric_statistics(df: pd.DataFrame) -> Dict[str, MetricStats]:
    """Computes comprehensive descriptive statistics for each metric."""
    stats_dict: Dict[str, MetricStats] = {}

    for col in df.columns:
        series = df[col].dropna()
        n = len(series)
        if n == 0:
            continue

        mean = float(series.mean())
        std = float(series.std(ddof=1)) if n > 1 else 0.0
        min_v = float(series.min())
        max_v = float(series.max())
        median = float(series.median())
        p25 = float(np.percentile(series, 25))
        p75 = float(np.percentile(series, 75))
        p95 = float(np.percentile(series, 95))
        iqr = p75 - p25
        skew = float(stats.skew(series)) if n > 2 else 0.0

        stats_dict[col] = MetricStats(
            metric=col,
            count=n,
            mean=round(mean, 2),
            std=round(std, 2),
            min=round(min_v, 2),
            max=round(max_v, 2),
            median=round(median, 2),
            p25=round(p25, 2),
            p75=round(p75, 2),
            p95=round(p95, 2),
            iqr=round(iqr, 2),
            skewness=round(skew, 2),
            unit=get_metric_unit(col),
        )

    return stats_dict
