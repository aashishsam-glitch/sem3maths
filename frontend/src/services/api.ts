import {
  AnalysisRequest,
  AnalysisResponse,
  ValidationResponse,
  WorkloadPresetInfo,
} from '../types';

const API_BASE = 'http://127.0.0.1:8000';

export async function fetchHealth(): Promise<{ status: string; math_engine: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchWorkloads(): Promise<WorkloadPresetInfo[]> {
  const res = await fetch(`${API_BASE}/workloads`);
  if (!res.ok) throw new Error('Failed to fetch workloads');
  return res.json();
}

export async function fetchSampleData(
  workload: string = 'cpu_bound',
  count: number = 100
): Promise<{ workload_id: string; label: string; total_rows: number; data: Record<string, any>[] }> {
  const res = await fetch(`${API_BASE}/sample-data?workload=${encodeURIComponent(workload)}&count=${count}`);
  if (!res.ok) throw new Error('Failed to load sample dataset');
  return res.json();
}

export async function validateData(records: Record<string, any>[]): Promise<ValidationResponse> {
  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Validation failed');
  }
  return res.json();
}

export async function uploadCsvFile(file: File): Promise<{
  filename: string;
  records: Record<string, any>[];
  validation: ValidationResponse;
}> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'CSV upload failed');
  }
  return res.json();
}

export async function runAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Analysis request failed');
  }
  return res.json();
}

export async function fetchExportPlots(request: AnalysisRequest): Promise<{
  pearson_heatmap_base64: string;
  spearman_heatmap_base64: string;
  scatter_primary_base64?: string;
}> {
  const res = await fetch(`${API_BASE}/export/plots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to render export plots');
  return res.json();
}
