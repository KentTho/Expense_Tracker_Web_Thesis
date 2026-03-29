// src/components/ExportStatusModal.jsx
import React from 'react';
import { FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, X, Download } from "lucide-react";

export default function ExportStatusModal({ isOpen, taskId, status, fileUrl, type, onClose, isDark }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transform animate-scaleIn ${
        isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet className="text-blue-500" size={24} />
            Exporting {type === 'income' ? 'Income' : 'Expense'} Data
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="flex flex-col items-center py-4">
            {status === 'completed' ? (
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                <CheckCircle2 className="text-green-500" size={48} />
              </div>
            ) : status === 'failed' ? (
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
                <AlertTriangle className="text-red-500" size={48} />
              </div>
            ) : (
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                <Loader2 className="text-blue-500 animate-spin" size={48} />
              </div>
            )}

            <p className="font-bold text-lg">
              {status === 'completed' ? 'Export Successful!' :
               status === 'failed' ? 'Export Failed' : 'Processing your data...'}
            </p>
            {taskId && (
              <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-widest">
                Task ID: {taskId.substring(0, 13)}...
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {status === 'completed' && fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Download size={20} /> Download File Now
              </a>
            )}

            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {status === 'completed' ? 'Close' : 'Cancel Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}