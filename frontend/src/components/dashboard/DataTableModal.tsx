import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  Search,
  Plus,
  Trash2,
  Play,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
} from 'lucide-react';
import { MetricStats } from '../../types';

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>[];
  onUpdateData: (newData: Record<string, any>[]) => void;
  onRerunAnalysis: () => void;
  metricStats?: Record<string, MetricStats>;
}

export const DataTableModal: React.FC<DataTableModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateData,
  onRerunAnalysis,
  metricStats,
}) => {
  const [tableData, setTableData] = useState<Record<string, any>[]>(data);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (!isOpen) return null;

  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  // Sort & Filter
  const filteredData = tableData.filter((row) =>
    columns.some((col) =>
      String(row[col] ?? '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortCol) return 0;
    const valA = a[sortCol];
    const valB = b[sortCol];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const handleStartEdit = (rowIdx: number, col: string, val: any) => {
    setEditingCell({ rowIdx, col });
    setEditValue(String(val ?? ''));
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    const { rowIdx, col } = editingCell;
    const updated = [...tableData];
    const parsed = Number(editValue);
    updated[rowIdx] = {
      ...updated[rowIdx],
      [col]: isNaN(parsed) ? editValue : parsed,
    };
    setTableData(updated);
    onUpdateData(updated);
    setEditingCell(null);
  };

  const handleDeleteRow = (idx: number) => {
    const updated = tableData.filter((_, i) => i !== idx);
    setTableData(updated);
    onUpdateData(updated);
  };

  const handleAddRow = () => {
    if (columns.length === 0) return;
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      newRow[col] = col.toLowerCase().includes('time') ? 25.0 : 50.0;
    });
    const updated = [newRow, ...tableData];
    setTableData(updated);
    onUpdateData(updated);
  };

  // Check if cell is an outlier (> 2 standard deviations)
  const isOutlier = (col: string, val: any) => {
    if (!metricStats || typeof val !== 'number') return false;
    const st = metricStats[col];
    if (!st || st.std === 0) return false;
    return Math.abs(val - st.mean) > 2 * st.std;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e]/85 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0d1321] border border-cyan-500/30 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
              <TableIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                TELEMETRY DATA EDITOR
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {tableData.length} records • Click any cell to modify values in-place
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onRerunAnalysis();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Apply & Re-run Analysis</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search across telemetry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Row</span>
            </button>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={30}>30 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="bg-slate-950/80 sticky top-0 z-10 text-[11px] text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2 px-3 w-12 text-center">#</th>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="py-2 px-3 cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.replace('_', ' ')}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                ))}
                <th className="py-2 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map((row, rowIdx) => {
                const globalIdx = (currentPage - 1) * pageSize + rowIdx;

                return (
                  <tr key={globalIdx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-500 text-[10px]">
                      {globalIdx + 1}
                    </td>

                    {columns.map((col) => {
                      const val = row[col];
                      const isEditing =
                        editingCell?.rowIdx === globalIdx &&
                        editingCell?.col === col;
                      const outlier = isOutlier(col, val);

                      return (
                        <td
                          key={col}
                          onDoubleClick={() => handleStartEdit(globalIdx, col, val)}
                          className={`py-2 px-3 transition-colors ${
                            outlier ? 'bg-rose-950/30 text-rose-300 font-semibold' : 'text-slate-200'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                autoFocus
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="bg-slate-950 border border-cyan-400 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-20"
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => handleStartEdit(globalIdx, col, val)}
                              className="cursor-pointer hover:underline decoration-cyan-400"
                              title="Click to edit"
                            >
                              {val ?? <span className="text-rose-400 italic">null</span>}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(globalIdx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete observation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {sortedData.length} records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-800 border border-slate-700 disabled:opacity-40 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-800 border border-slate-700 disabled:opacity-40 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
