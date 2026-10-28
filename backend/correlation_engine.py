"""
Statistical Engine for Pearson Correlation and Spearman Rank Correlation.
Performs rigorous sample statistics, hypothesis testing (p-values),
confidence intervals, rank conversions, and monotonic relationship evaluations.
All mathematical computations are executed purely in Python via NumPy & SciPy.
"""

import math
from typing import Tuple, List, Dict, Optional
import numpy as np
import scipy.stats as stats
from models import (
    CorrelationPair,
    SpearmanCalculationBreakdown,
    SpearmanStepDetail,
    ScatterPoint,
    ScatterSeries,
    CorrelationMatrix,
)


def classify_direction(coef: float, threshold: float = 0.05) -> str:
    """Classifies correlation direction into positive, negative, or neutral."""
    if coef >= threshold:
        return "positive"
    elif coef <= -threshold:
        return "negative"
    return "neutral"


def classify_strength(coef: float) -> str:
    """
    Standard statistical classification of correlation coefficient magnitude:
    0.80 - 1.00: Very Strong
    0.60 - 0.79: Strong
    0.40 - 0.59: Moderate
    0.20 - 0.39: Weak
    0.00 - 0.19: Negligible
    """
    mag = abs(coef)
    if mag >= 0.80:
        return "Very Strong"
    elif mag >= 0.60:
        return "Strong"
    elif mag >= 0.40:
        return "Moderate"
    elif mag >= 0.20:
        return "Weak"
    return "Negligible"


def compute_pearson_with_ci(
    x: np.ndarray, y: np.ndarray, alpha: float = 0.05
) -> Tuple[float, float, Optional[float], Optional[float]]:
    """
    Calculates sample Pearson correlation coefficient r, two-tailed p-value,
    and 95% Confidence Interval using Fisher's z-transformation.

    Pearson r formula:
        r = sum((x_i - x_mean) * (y_i - y_mean)) / (sqrt(sum((x_i - x_mean)^2)) * sqrt(sum((y_i - y_mean)^2)))
    """
    n = len(x)
    if n < 3:
        return 0.0, 1.0, None, None

    std_x = np.std(x, ddof=1)
    std_y = np.std(y, ddof=1)
    if std_x == 0 or std_y == 0:
        # Constant vector, correlation undefined / 0
        return 0.0, 1.0, None, None

    res = stats.pearsonr(x, y)
    r = float(res.statistic)
    p_val = float(res.pvalue)

    # Clean potential NaN or boundary values
    if math.isnan(r):
        return 0.0, 1.0, None, None

    r = max(-1.0, min(1.0, r))

    ci_low, ci_high = None, None
    if n > 3 and abs(r) < 0.99999:
        try:
            # Fisher z-transformation: z = 0.5 * ln((1 + r) / (1 - r))
            z = np.arctanh(r)
            se_z = 1.0 / math.sqrt(n - 3)
            z_crit = stats.norm.ppf(1 - alpha / 2)
            z_low = z - z_crit * se_z
            z_high = z + z_crit * se_z
            ci_low = float(np.tanh(z_low))
            ci_high = float(np.tanh(z_high))
        except Exception:
            ci_low, ci_high = None, None

    return r, p_val, ci_low, ci_high


def compute_spearman_detailed(
    x: np.ndarray, y: np.ndarray, metric_x: str, metric_y: str
) -> Tuple[float, float, SpearmanCalculationBreakdown]:
    """
    Calculates Spearman rank correlation coefficient rho and generates
    detailed step-by-step breakdown of ranks, rank differences d, and d^2.

    Spearman rho evaluates monotonic relationships by computing Pearson r
    on the ordinal ranks R(x) and R(y).
    """
    n = len(x)
    ranks_x = stats.rankdata(x, method="average")
    ranks_y = stats.rankdata(y, method="average")

    res = stats.spearmanr(x, y)
    rho = float(res.statistic)
    p_val = float(res.pvalue)
    if math.isnan(rho):
        rho = 0.0
        p_val = 1.0
    rho = max(-1.0, min(1.0, rho))

    diff_d = ranks_x - ranks_y
    diff_d2 = diff_d ** 2
    sum_d2 = float(np.sum(diff_d2))

    # Classical formula without ties: 1 - (6 * sum(d^2)) / (n * (n^2 - 1))
    if n > 1:
        raw_formula = 1.0 - (6.0 * sum_d2) / (n * (n ** 2 - 1))
        raw_formula = max(-1.0, min(1.0, float(raw_formula)))
    else:
        raw_formula = 0.0

    # Check if ties are present
    ties_x = len(np.unique(ranks_x)) < n
    ties_y = len(np.unique(ranks_y)) < n
    ties_present = ties_x or ties_y

    formula_used = (
        "Pearson correlation of tied fractional ranks (SciPy rankdata)"
        if ties_present
        else "rho = 1 - (6 * sum(d_i^2)) / (n * (n^2 - 1))"
    )

    # Provide top 25 sample steps for UI explainability modal
    sample_limit = min(n, 25)
    steps: List[SpearmanStepDetail] = []
    for i in range(sample_limit):
        steps.append(
            SpearmanStepDetail(
                sample_index=i + 1,
                val_x=round(float(x[i]), 4),
                val_y=round(float(y[i]), 4),
                rank_x=round(float(ranks_x[i]), 2),
                rank_y=round(float(ranks_y[i]), 2),
                diff_d=round(float(diff_d[i]), 2),
                diff_d_squared=round(float(diff_d2[i]), 4),
            )
        )

    explanation = (
        f"Computed on {n} observations. Sum of squared rank differences sum(d^2) = {sum_d2:.2f}. "
        f"Spearman rho = {rho:.4f}. {'Ties present in data: fractional ranks applied.' if ties_present else 'No duplicate ranks detected.'}"
    )

    breakdown = SpearmanCalculationBreakdown(
        target_metric=metric_y,
        predictor_metric=metric_x,
        sample_size_n=n,
        sum_d_squared=round(sum_d2, 4),
        raw_formula_rho=round(raw_formula, 4),
        scipy_rho=round(rho, 4),
        ties_present=ties_present,
        formula_used=formula_used,
        top_ranked_steps=steps,
        explanation=explanation,
    )

    return rho, p_val, breakdown


def generate_pair_interpretation(
    metric_a: str,
    metric_b: str,
    pearson_r: float,
    spearman_rho: float,
    p_val: float,
) -> Tuple[str, str, str]:
    """
    Generates human-readable, technically rigorous interpretations
    contrasting linear (Pearson) vs monotonic (Spearman) dynamics.
    """
    direction = classify_direction(pearson_r)
    strength = classify_strength(pearson_r)
    diff = abs(pearson_r - spearman_rho)

    # 1. Concise summary arrow
    if direction == "positive":
        arrow_summary = f"{metric_a} ↑ → {metric_b} ↑ ({strength} Positive)"
    elif direction == "negative":
        arrow_summary = f"{metric_a} ↑ → {metric_b} ↓ ({strength} Negative)"
    else:
        arrow_summary = f"{metric_a} ↔ {metric_b} (Independent / Weak)"

    # 2. Plain English Interpretation
    if abs(pearson_r) >= 0.6:
        if direction == "positive":
            interp = (
                f"Elevated levels of {metric_a} are strongly associated with higher {metric_b}. "
                f"As {metric_a} increases, {metric_b} consistently escalates."
            )
        else:
            interp = (
                f"Elevated levels of {metric_a} are strongly associated with diminished {metric_b}. "
                f"An inverse relationship is evident."
            )
    elif abs(pearson_r) >= 0.3:
        interp = (
            f"There is a moderate {direction} co-movement between {metric_a} and {metric_b}. "
            f"Other system variables likely moderate this relationship."
        )
    else:
        interp = (
            f"Negligible or weak linear co-variation detected between {metric_a} and {metric_b}. "
            f"Fluctuations in {metric_a} do not reliably correspond to shifts in {metric_b}."
        )

    # 3. Academic & Comparative Insight (Pearson vs Spearman)
    if diff >= 0.20:
        if abs(spearman_rho) > abs(pearson_r):
            academic = (
                f"Divergence detected (|r - rho| = {diff:.2f}). Spearman ({spearman_rho:+.2f}) exceeds "
                f"Pearson ({pearson_r:+.2f}), indicating a non-linear monotonic relationship (e.g., exponential "
                f"queuing latency or hockey-stick saturation) or robustness against bounded non-linear scale."
            )
        else:
            academic = (
                f"Divergence detected (|r - rho| = {diff:.2f}). Pearson ({pearson_r:+.2f}) exceeds "
                f"Spearman ({spearman_rho:+.2f}), suggesting high-leverage outliers or isolated extreme burst spikes "
                f"are pulling the linear regression line."
            )
    else:
        academic = (
            f"Pearson ({pearson_r:+.2f}) and Spearman ({spearman_rho:+.2f}) are closely aligned "
            f"(diff = {diff:.2f}), confirming a stable linear and monotonic pattern without disruptive outlier skew."
        )

    return arrow_summary, interp, academic


def calculate_scatter_series(
    x: np.ndarray, y: np.ndarray, metric_x: str, metric_y: str, max_points: int = 150
) -> ScatterSeries:
    """
    Computes linear regression trendline (least-squares fit y = mx + c),
    coefficient of determination R^2, and provides coordinate points for plotting.
    """
    n = len(x)
    ranks_x = stats.rankdata(x, method="average")
    ranks_y = stats.rankdata(y, method="average")

    # Linear regression
    if n >= 2 and np.std(x) > 0:
        slope, intercept, r_val, p_val, std_err = stats.linregress(x, y)
        r2 = r_val ** 2
    else:
        slope, intercept, r2 = 0.0, float(np.mean(y)), 0.0

    sign = "+" if intercept >= 0 else "-"
    equation = f"y = {slope:.3f}x {sign} {abs(intercept):.3f} (R² = {r2:.3f})"

    # Sample points if dataset is massive to maintain silky 60fps UI
    indices = np.arange(n)
    if n > max_points:
        step = max(1, n // max_points)
        selected_idx = indices[::step]
    else:
        selected_idx = indices

    points: List[ScatterPoint] = []
    for idx in selected_idx:
        points.append(
            ScatterPoint(
                id=int(idx),
                x=round(float(x[idx]), 3),
                y=round(float(y[idx]), 3),
                rank_x=round(float(ranks_x[idx]), 1),
                rank_y=round(float(ranks_y[idx]), 1),
            )
        )

    p_r, _, _, _ = compute_pearson_with_ci(x, y)
    s_rho, _, _ = compute_spearman_detailed(x, y, metric_x, metric_y)

    return ScatterSeries(
        metric_x=metric_x,
        metric_y=metric_y,
        points=points,
        regression_slope=round(float(slope), 4),
        regression_intercept=round(float(intercept), 4),
        regression_r2=round(float(r2), 4),
        trendline_equation=equation,
        pearson_r=round(float(p_r), 4),
        spearman_rho=round(float(s_rho), 4),
    )


def build_correlation_matrices(
    metrics: List[str], data_dict: Dict[str, np.ndarray]
) -> Tuple[CorrelationMatrix, CorrelationMatrix, List[CorrelationPair]]:
    """
    Constructs complete N x N Pearson and Spearman correlation matrices,
    two-tailed p-values, and detailed metric pair records.
    """
    num_m = len(metrics)
    p_matrix = [[1.0 if i == j else 0.0 for j in range(num_m)] for i in range(num_m)]
    s_matrix = [[1.0 if i == j else 0.0 for j in range(num_m)] for i in range(num_m)]
    p_pvalues = [[0.0 for _ in range(num_m)] for _ in range(num_m)]
    s_pvalues = [[0.0 for _ in range(num_m)] for _ in range(num_m)]

    pairs: List[CorrelationPair] = []

    for i in range(num_m):
        for j in range(num_m):
            m_a = metrics[i]
            m_b = metrics[j]
            x = data_dict[m_a]
            y = data_dict[m_b]

            if i == j:
                p_matrix[i][j] = 1.0
                s_matrix[i][j] = 1.0
                p_pvalues[i][j] = 0.0
                s_pvalues[i][j] = 0.0
            else:
                p_r, p_p, ci_l, ci_u = compute_pearson_with_ci(x, y)
                s_rho, s_p, _ = compute_spearman_detailed(x, y, m_a, m_b)

                p_matrix[i][j] = round(p_r, 4)
                s_matrix[i][j] = round(s_rho, 4)
                p_pvalues[i][j] = round(p_p, 5)
                s_pvalues[i][j] = round(s_p, 5)

                # Only create unique pairs for i < j
                if i < j:
                    arrow, interp, academic = generate_pair_interpretation(
                        m_a, m_b, p_r, s_rho, p_p
                    )
                    pairs.append(
                        CorrelationPair(
                            metric_a=m_a,
                            metric_b=m_b,
                            pearson_r=round(p_r, 4),
                            pearson_p_value=round(p_p, 5),
                            pearson_ci_lower=round(ci_l, 4) if ci_l is not None else None,
                            pearson_ci_upper=round(ci_u, 4) if ci_u is not None else None,
                            spearman_rho=round(s_rho, 4),
                            spearman_p_value=round(s_p, 5),
                            direction=classify_direction(p_r),
                            strength=classify_strength(p_r),
                            difference=round(abs(p_r - s_rho), 4),
                            relationship_summary=arrow,
                            interpretation=interp,
                            academic_insight=academic,
                        )
                    )

    pearson_mat = CorrelationMatrix(metrics=metrics, matrix=p_matrix, p_values=p_pvalues)
    spearman_mat = CorrelationMatrix(metrics=metrics, matrix=s_matrix, p_values=s_pvalues)

    return pearson_mat, spearman_mat, pairs
