import React, { useState } from 'react';
import { Database, Download, Upload, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { DbService } from '../lib/dbService';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

export function BackupRestoreModal({ isOpen, onClose, onRestoreSuccess }: BackupRestoreModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await DbService.backupData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vcs_clearance_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('System backup generated successfully.');
    } catch (err) {
      setError('Failed to generate backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('WARNING: Restoring data will overwrite existing records. This action cannot be undone. Are you sure you want to proceed?')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    setError(null);
    setSuccess(null);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = event.target?.result as string;
          await DbService.restoreData(json);
          setSuccess('System data restored successfully.');
          onRestoreSuccess();
        } catch (err) {
          setError('Invalid backup file or restore failed.');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to read backup file.');
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FDFCF7] w-full max-w-lg border border-[#7A1326]/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#7A1326] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-[#D4AF37]" />
            <div>
              <h2 className="text-white font-serif text-lg font-bold">System Backup & Restore</h2>
              <p className="text-[#FDFCF7]/70 text-[10px] uppercase tracking-widest font-bold">Data Sovereignty & Recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-1">Important Security Notice</p>
              <p>System backups include all learners, staff accounts, settings, and audit logs. Store downloaded backup files in a secure, encrypted location. Restoring from a backup will overwrite all current database records.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting || isImporting}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#7A1326]/20 hover:border-[#7A1326] hover:bg-[#7A1326]/5 transition-all group rounded-lg"
            >
              <div className="w-12 h-12 bg-[#7A1326]/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6 text-[#7A1326]" />
              </div>
              <span className="font-bold text-[#1A1A1A] text-sm">Download Backup</span>
              <span className="text-[10px] text-[#1A1A1A]/50 mt-1">Export JSON snapshot</span>
              {isExporting && <span className="mt-2 text-[10px] text-[#7A1326] animate-pulse">Generating...</span>}
            </button>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group rounded-lg cursor-pointer">
              <input type="file" accept=".json" onChange={handleImport} disabled={isExporting || isImporting} className="hidden" />
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="font-bold text-[#1A1A1A] text-sm">Upload & Restore</span>
              <span className="text-[10px] text-[#1A1A1A]/50 mt-1">Select backup file</span>
              {isImporting && <span className="mt-2 text-[10px] text-emerald-600 animate-pulse">Restoring...</span>}
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-red-700 text-xs rounded">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-emerald-700 text-xs rounded">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}
        </div>

        <div className="bg-[#FAF8F5] px-6 py-4 border-t border-[#7A1326]/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#1A1A1A]/60 font-bold text-xs uppercase tracking-widest hover:text-[#1A1A1A] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
