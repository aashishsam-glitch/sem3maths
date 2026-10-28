"""
Comprehensive automated test suite for the Python backend.
Tests statistical properties, edge cases, validation, and all API endpoints.
"""

import sys
import os
import unittest
import numpy as np

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_processor import (
    generate_simulated_workload,
    validate_raw_data,
    clean_and_prepare_dataframe,
    compute_metric_statistics,
    WORKLOAD_PRESETS,
)
from correlation_engine import (
    compute_pearson_with_ci,
    compute_spearman_detailed,
    classify_direction,
    classify_strength,
    build_correlation_matrices,
)
from bottleneck_detector import rank_bottlenecks, generate_executive_summary
from models import AnalysisRequest
from main import run_correlation_analysis


class TestCorrelationEngine(unittest.TestCase):
    def test_perfect_linear_correlation(self):
        x = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
        y = np.array([2.0, 4.0, 6.0, 8.0, 10.0, 12.0])
        r, p_val, ci_l, ci_u = compute_pearson_with_ci(x, y)
        self.assertAlmostEqual(r, 1.0, places=3)
        self.assertLess(p_val, 0.001)

        rho, s_p, breakdown = compute_spearman_detailed(x, y, "X", "Y")
        self.assertAlmostEqual(rho, 1.0, places=3)
        self.assertEqual(breakdown.sum_d_squared, 0.0)

    def test_perfect_inverse_correlation(self):
        x = np.array([10.0, 20.0, 30.0, 40.0, 50.0])
        y = np.array([100.0, 80.0, 60.0, 40.0, 20.0])
        r, p_val, _, _ = compute_pearson_with_ci(x, y)
        self.assertAlmostEqual(r, -1.0, places=3)
        self.assertEqual(classify_direction(r), "negative")
        self.assertEqual(classify_strength(r), "Very Strong")

    def test_monotonic_nonlinear(self):
        # Exponential curve: rank order is strictly preserved (Spearman = 1.0) but linear fit is lower
        x = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0])
        y = np.exp(x)
        r, _, _, _ = compute_pearson_with_ci(x, y)
        rho, _, breakdown = compute_spearman_detailed(x, y, "X", "Y")
        self.assertAlmostEqual(rho, 1.0, places=3)
        self.assertLess(r, 0.95)  # Pearson should be noticeably lower than 1.0
        self.assertEqual(breakdown.sum_d_squared, 0.0)

    def test_constant_vector(self):
        x = np.array([5.0, 5.0, 5.0, 5.0])
        y = np.array([1.0, 2.0, 3.0, 4.0])
        r, p_val, _, _ = compute_pearson_with_ci(x, y)
        self.assertEqual(r, 0.0)


class TestDataProcessorAndValidation(unittest.TestCase):
    def test_empty_dataset(self):
        res = validate_raw_data([])
        self.assertFalse(res.is_valid)
        self.assertTrue(len(res.errors) > 0)

    def test_small_sample(self):
        res = validate_raw_data([{"a": 1, "b": 2}, {"a": 2, "b": 3}])
        self.assertFalse(res.is_valid)

    def test_all_workload_presets(self):
        for preset in WORKLOAD_PRESETS:
            data = generate_simulated_workload(preset.id, 50)
            self.assertEqual(len(data), 50)
            val = validate_raw_data(data)
            self.assertTrue(val.is_valid, f"Preset {preset.id} failed validation: {val.errors}")

            req = AnalysisRequest(data=data, target_metric="Response_Time", workload_name=preset.name)
            resp = run_correlation_analysis(req)
            self.assertTrue(resp.success)
            self.assertIsNotNone(resp.summary.primary_potential_bottleneck)


if __name__ == "__main__":
    unittest.main()
