"""
Visualization Utilities (Matplotlib / Seaborn) for high-resolution static rendering,
report exports, and backend plot generation.
"""

import io
import base64
from typing import List, Dict, Optional
import matplotlib
matplotlib.use("Agg")  # Headless backend
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd


# Apply dark futuristic styling to matplotlib plots to match dashboard theme
plt.style.use("dark_background")
DARK_BG = "#0B0F19"
PANEL_BG = "#131B2E"
TEXT_COLOR = "#E2E8F0"
ACCENT_AMBER = "#F59E0B"
ACCENT_CYAN = "#06B6D4"


def generate_heatmap_image(
    matrix: List[List[float]],
    metric_names: List[str],
    title: str = "Pearson Correlation Matrix",
) -> str:
    """Renders correlation matrix as base64 PNG data URL."""
    fig, ax = plt.subplots(figsize=(7, 6), facecolor=DARK_BG)
    ax.set_facecolor(PANEL_BG)

    df_matrix = pd.DataFrame(matrix, index=metric_names, columns=metric_names)

    cmap = sns.diverging_palette(220, 20, as_cmap=True)
    sns.heatmap(
        df_matrix,
        annot=True,
        fmt=".2f",
        cmap=cmap,
        vmin=-1.0,
        vmax=1.0,
        center=0.0,
        square=True,
        linewidths=0.5,
        linecolor="#1E293B",
        cbar_kws={"shrink": 0.8, "label": "Correlation Coefficient"},
        ax=ax,
        annot_kws={"size": 10, "weight": "bold", "color": TEXT_COLOR},
    )

    ax.set_title(title, fontsize=13, weight="bold", color=TEXT_COLOR, pad=12)
    plt.xticks(rotation=45, ha="right", color=TEXT_COLOR, fontsize=9)
    plt.yticks(rotation=0, color=TEXT_COLOR, fontsize=9)
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=180, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close(fig)
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def generate_scatter_image(
    x: np.ndarray,
    y: np.ndarray,
    metric_x: str,
    metric_y: str,
    pearson_r: float,
    spearman_rho: float,
) -> str:
    """Renders high-resolution scatter plot with linear trendline."""
    fig, ax = plt.subplots(figsize=(7, 5), facecolor=DARK_BG)
    ax.set_facecolor(PANEL_BG)

    # Scatter points
    ax.scatter(x, y, color=ACCENT_CYAN, alpha=0.75, edgecolors="#38BDF8", s=40, label="Observations")

    # Fit line
    if len(x) > 1 and np.std(x) > 0:
        slope, intercept = np.polyfit(x, y, 1)
        x_line = np.linspace(np.min(x), np.max(x), 100)
        y_line = slope * x_line + intercept
        ax.plot(x_line, y_line, color=ACCENT_AMBER, linewidth=2.0, linestyle="--", label=f"Trend: y = {slope:.2f}x + {intercept:.1f}")

    ax.set_title(
        f"{metric_x} vs {metric_y}\n(Pearson r = {pearson_r:+.2f} | Spearman ρ = {spearman_rho:+.2f})",
        fontsize=12,
        weight="bold",
        color=TEXT_COLOR,
        pad=10,
    )
    ax.set_xlabel(metric_x, color=TEXT_COLOR, fontsize=10)
    ax.set_ylabel(metric_y, color=TEXT_COLOR, fontsize=10)
    ax.grid(True, linestyle=":", alpha=0.3, color="#475569")
    ax.legend(facecolor=PANEL_BG, edgecolor="#334155", labelcolor=TEXT_COLOR)

    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=180, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close(fig)
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("utf-8")
    return f"data:image/png;base64,{b64}"
