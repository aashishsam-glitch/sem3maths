import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Play,
  Loader2,
} from 'lucide-react';
import { uploadCsvFile } from '../../services/api';
import { ValidationResponse } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (records: Record<string, any>[], filename: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [loadedRecords, setLoadedRecords] = useState<Record<string, any>[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Only .csv files are supported.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setValidation(null);

    try {
      const res = await uploadCsvFile(file);
      setFileName(res.filename);
      setValidation(res.validation);
      setLoadedRecords(res.records);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload and parse CSV.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (loadedRecords && validation?.is_valid) {
      onDatasetLoaded(loadedRecords, fileName);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e]/85 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0d1321] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                UPLOAD CUSTOM PERFORMANCE DATASET
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Upload comma-separated values (CSV) containing system metrics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/30'
              : 'border-slate-700 hover:border-cyan-500/50 bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleProcessFile(e.target.files[0]);
              }
            }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono text-cyan-300">Parsing and validating in Python...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <UploadCloud className="w-10 h-10 text-cyan-400" />
              <div className="text-sm font-semibold text-white">
                Drag and drop your CSV file here, or{' '}
                <span className="text-cyan-400 underline">browse</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Expected columns e.g.: CPU_Utilization, Memory_Usage, Disk_IO, Network_Latency, Response_Time
              </div>
            </div>
          )}
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Validation summary */}
        {validation && (
          <div className="mt-4 space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-white font-bold mb-1">
                <span>FILE: {fileName}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    validation.is_valid
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {validation.is_valid ? 'VALIDATED' : 'ERRORS DETECTED'}
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">
                {validation.row_count} rows • {validation.numeric_columns.length} numeric columns:
                <div className="text-cyan-300 mt-1 flex flex-wrap gap-1">
                  {validation.numeric_columns.map((c) => (
                    <span key={c} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Validation errors */}
            {validation.errors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[11px] space-y-1">
                {validation.errors.map((e, idx) => (
                  <div key={idx}>• {e}</div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                {validation.warnings.map((w, idx) => (
                  <div key={idx}>⚠️ {w}</div>
                ))}
              </div>
            )}

            {validation.is_valid && (
              <button
                onClick={handleApply}
                className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Load Dataset into Observatory</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
