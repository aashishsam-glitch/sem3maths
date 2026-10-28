"""
Bottleneck Detection and Risk Assessment Module.
Identifies system metrics strongly associated with performance degradation (target metric).
Adheres strictly to statistical rigor: correlation indicates association, NOT causation.
Ranks metrics using composite Pearson + Spearman association metrics.
"""

import os
import sys
from typing import List, Dict, Optional
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from models import (
    BottleneckMetric,
    MetricStats,
    CorrelationPair,
    AnalysisSummary,
)
from correlation_engine import classify_direction, classify_strength


def get_metric_unit(metric_name: str) -> str:
    """Returns appropriate engineering unit for metric."""
    name = metric_name.lower()
    if "cpu" in name or "util" in name or "usage" in name or "load" in name:
        return "%"
    elif "mem" in name or "ram" in name:
        return "%"
    elif "disk" in name or "io" in name:
        return "IOPS" if "iops" in name else "MB/s"
    elif "net" in name or "latency" in name:
        return "ms"
    elif "time" in name or "response" in name:
        return "ms"
    return ""


def evaluate_metric_evidence(
    metric: str,
    target: str,
    pearson_r: float,
    spearman_rho: float,
    avg_val: float,
    p95_val: float,
    unit: str,
    risk_level: str,
) -> List[str]:
    """Generates specific empirical evidence bullets supporting the statistical ranking."""
    evidence = []
    diff = abs(pearson_r - spearman_rho)

    # Correlation association
    evidence.append(
        f"Exhibits a Pearson r of {pearson_r:+.3f} and Spearman rho of {spearman_rho:+.3f} with {target}."
    )

    # Directional meaning
    if pearson_r > 0.4:
        evidence.append(
            f"Statistically co-elevates: high values of {metric} coincide with heightened {target}."
        )
    elif pearson_r < -0.4:
        evidence.append(
            f"Inverse association: increases in {metric} correspond to reduced {target}."
        )
    else:
        evidence.append(
            f"Metric shows negligible linear or rank alignment with {target} fluctuations."
        )

    # Discrepancy check
    if diff >= 0.15:
        if abs(spearman_rho) > abs(pearson_r):
            evidence.append(
                f"Spearman ({spearman_rho:+.2f}) noticeably exceeds Pearson ({pearson_r:+.2f}), indicating non-linear queuing or threshold hockey-stick inflection."
            )
        else:
            evidence.append(
                f"Pearson ({pearson_r:+.2f}) exceeds Spearman ({spearman_rho:+.2f}), suggesting high-leverage extreme values or bursts disproportionately pulling covariance."
            )

    # Statistical workload context
    if p95_val > 85.0 and unit == "%":
        evidence.append(f"Near-capacity saturation: 95th percentile reaches {p95_val:.1f}{unit}.")

    return evidence


def get_investigation_recommendations(metric: str) -> List[str]:
    """Generates actionable engineering diagnostic recommendations."""
    name = metric.lower()
    if "cpu" in name:
        return [
            "Capture CPU flame graphs (perf / async-profiler) to locate hot code loops.",
            "Inspect thread dumps for thread contention, lock convoying, or high context switching.",
            "Verify thread pool sizing and garbage collection CPU cycles.",
        ]
    elif "mem" in name:
        return [
            "Inspect JVM / runtime memory allocations and GC pause telemetry.",
            "Analyze heap dumps for memory leaks, unclosed streams, or oversized caches.",
            "Verify OS page faults and swap disk activity.",
        ]
    elif "disk" in name or "io" in name:
        return [
            "Inspect disk queue depth and I/O wait percentages (iostat / iotop).",
            "Review database slow query logs and missing indexes causing full table scans.",
            "Consider batching writes or migrating to high-IOPS NVMe storage.",
        ]
    elif "net" in name:
        return [
            "Inspect network socket timeouts, packet retransmissions, and TCP buffer saturation.",
            "Trace inter-microservice RPC calls and third-party API dependencies.",
            "Review connection pool starvation and keep-alive configurations.",
        ]
    else:
        return [
            f"Conduct targeted load-testing varying {metric} while holding other factors constant.",
            "Verify correlation stability across different time windows.",
            "Rule out confounding third variables (e.g., overall user request concurrency).",
        ]


def rank_bottlenecks(
    target_metric: str,
    target_pairs: List[CorrelationPair],
    metric_stats: Dict[str, MetricStats],
) -> List[BottleneckMetric]:
    """
    Ranks non-target metrics by their association with the target metric (Response Time).
    Computes composite score: 0.5 * |Pearson r| + 0.5 * |Spearman rho|.
    """
    candidates = []

    for pair in target_pairs:
        # Determine which metric is the predictor
        predictor = pair.metric_a if pair.metric_b == target_metric else pair.metric_b
        if predictor == target_metric:
            continue

        p_r = pair.pearson_r
        s_rho = pair.spearman_rho

        # Composite association score (scaled 0 to 1)
        # We emphasize positive associations since resource saturation causes response time increases
        # but also capture severe negative anomalies if present
        composite_score = 0.5 * abs(p_r) + 0.5 * abs(s_rho)

        # Categorize Risk
        if composite_score >= 0.70 and p_r > 0.2:
            risk = "HIGH"
        elif composite_score >= 0.40:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        stats = metric_stats.get(predictor)
        avg_val = stats.mean if stats else 0.0
        p95_val = stats.p95 if stats else 0.0
        unit = stats.unit if stats else get_metric_unit(predictor)

        direction = classify_direction(p_r)
        strength = classify_strength(p_r)

        # Academic phrasing - Never claim definite root cause
        if risk == "HIGH":
            diag = f"Strongly Associated Metric / Potential Bottleneck — High statistical co-variance with {target_metric}."
        elif risk == "MEDIUM":
            diag = f"Moderately Associated Metric — Moderate co-movement with {target_metric}; secondary factor or co-dependent."
        else:
            diag = f"Weakly Associated Metric — Unlikely primary bottleneck; low co-variance with {target_metric} in this regime."

        evidence = evaluate_metric_evidence(
            predictor, target_metric, p_r, s_rho, avg_val, p95_val, unit, risk
        )
        inv_steps = get_investigation_recommendations(predictor)

        candidates.append(
            {
                "metric": predictor,
                "pearson_r": p_r,
                "spearman_rho": s_rho,
                "bottleneck_score": round(composite_score, 4),
                "risk_level": risk,
                "direction": direction,
                "strength": strength,
                "avg_value": round(avg_val, 2),
                "p95_value": round(p95_val, 2),
                "unit": unit,
                "diagnostic_summary": diag,
                "supporting_evidence": evidence,
                "investigation_steps": inv_steps,
            }
        )

    # Sort descending by bottleneck_score
    candidates.sort(key=lambda x: x["bottleneck_score"], reverse=True)

    ranked_list: List[BottleneckMetric] = []
    for idx, item in enumerate(candidates):
        ranked_list.append(
            BottleneckMetric(
                rank=idx + 1,
                metric=item["metric"],
                pearson_r=item["pearson_r"],
                spearman_rho=item["spearman_rho"],
                bottleneck_score=item["bottleneck_score"],
                risk_level=item["risk_level"],
                direction=item["direction"],
                strength=item["strength"],
                avg_value=item["avg_value"],
                p95_value=item["p95_value"],
                unit=item["unit"],
                diagnostic_summary=item["diagnostic_summary"],
                supporting_evidence=item["supporting_evidence"],
                investigation_steps=item["investigation_steps"],
            )
        )

    return ranked_list


def generate_executive_summary(
    target_metric: str,
    ranked_bottlenecks: List[BottleneckMetric],
    metric_stats: Dict[str, MetricStats],
    total_observations: int,
) -> AnalysisSummary:
    """Generates concise executive decision intelligence for side panel and header."""
    target_st = metric_stats.get(target_metric)
    avg_target = target_st.mean if target_st else None
    p95_target = target_st.p95 if target_st else None
    unit = target_st.unit if target_st else "ms"

    if not ranked_bottlenecks:
        return AnalysisSummary(
            total_observations=total_observations,
            health_status="OPTIMAL",
            executive_verdict="Insufficient metrics to determine system bottlenecks.",
        )

    top = ranked_bottlenecks[0]

    # Find highest Pearson and highest Spearman
    highest_pearson = max(ranked_bottlenecks, key=lambda b: abs(b.pearson_r))
    highest_spearman = max(ranked_bottlenecks, key=lambda b: abs(b.spearman_rho))

    if top.risk_level == "HIGH":
        health = "CRITICAL"
        verdict = (
            f"Strongest statistical association observed between '{top.metric}' and '{target_metric}' "
            f"(Pearson r={top.pearson_r:+.2f}, Spearman rho={top.spearman_rho:+.2f}). "
            f"Flagged as Primary Potential Bottleneck. Further profiling required."
        )
    elif top.risk_level == "MEDIUM":
        health = "DEGRADED"
        verdict = (
            f"Moderate system strain detected. '{top.metric}' shows highest co-variance "
            f"(r={top.pearson_r:+.2f}), but no single resource exhibits dominant critical saturation."
        )
    else:
        health = "OPTIMAL"
        verdict = (
            f"All analyzed metrics demonstrate weak correlation with '{target_metric}'. "
            f"System appears well-balanced under the current observed workload."
        )

    return AnalysisSummary(
        primary_potential_bottleneck=top.metric,
        primary_risk_level=top.risk_level,
        highest_pearson_metric=highest_pearson.metric,
        highest_pearson_value=highest_pearson.pearson_r,
        highest_spearman_metric=highest_spearman.metric,
        highest_spearman_value=highest_spearman.spearman_rho,
        avg_target_value=round(avg_target, 2) if avg_target else None,
        p95_target_value=round(p95_target, 2) if p95_target else None,
        target_unit=unit,
        total_observations=total_observations,
        health_status=health,
        executive_verdict=verdict,
    )
