import React, { useState } from 'react';
import { Learner, SchoolSettings, UserAccount, TermArchive } from '../types';
import { ArchiveService } from '../lib/archiveService';
import { DbService } from '../lib/dbService';
import { VivaBadge } from './VivaBadge';
import { 
  Archive, 
  FolderArchive, 
  Clock, 
  CheckCircle2, 
  Users, 
  Calendar, 
  Plus, 
  X, 
  ChevronRight, 
  BarChart3, 
  Download,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface TermArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  learners: Learner[];
  settings: SchoolSettings;
  currentUser: UserAccount | null;
  archives: TermArchive[];
}

export const TermArchiveModal: React.FC<TermArchiveModalProps> = ({
  isOpen,
  onClose,
  learners,
  settings,
  currentUser,
  archives,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'new_archive'>('browse');
  const [archiveName, setArchiveName] = useState(`${settings.academicYear} ${settings.term} Final Cohort Snapshot`);
  const [archiveRemarks, setArchiveRemarks] = useState('Official end-of-term candidate clearance snapshot.');
  const [isArchiving, setIsArchiving] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<TermArchive | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentClearedCount = learners.filter((l) => l.subjects.every((s) => s.status === 'cleared')).length;
  const currentClearanceRate = learners.length > 0 ? Math.round((currentClearedCount / learners.length) * 100) : 0;

  const handleCreateArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveName.trim()) return;

    setIsArchiving(true);
    try {
      const created = await ArchiveService.createTermArchive(
        archiveName.trim(),
        settings.academicYear,
        settings.term,
        learners,
        currentUser?.name || 'Administrator',
        archiveRemarks
      );

      // Log in audit trail
      await DbService.logAudit({
        id: `arch_log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        officerName: currentUser?.name || 'Academic Administrator',
        officerRole: currentUser?.role || 'admin',
        learnerRegNo: `${learners.length} Candidates`,
        learnerName: created.name,
        subjectName: 'Term Archiving Directorate',
        action: 'TERM_ARCHIVED',
        details: `Created snapshot archive for ${created.academicYear} ${created.term} (${created.clearedRate}% clearance rate)`,
      });

      setSuccessNotice(`Successfully archived "${created.name}" with ${created.totalLearners} learner records!`);
      setActiveTab('browse');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      alert('Failed to create archive: ' + (err as Error).message);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FBFBFA] border-2 border-[#1A1A1A] w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#5B0B19] via-[#7A1326] to-[#5B0B19] text-white flex items-center justify-between border-b-2 border-[#D4AF37]">
          <div className="flex items-center gap-3">
            <VivaBadge size="sm" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#F6D365] font-bold">
                Victory College School • Academic Records
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Term & Academic Year Clearance Archives
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-sm font-bold text-white hover:bg-white hover:text-[#7A1326] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#1A1A1A]/10 bg-white px-4 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => {
              setActiveTab('browse');
              setSelectedArchive(null);
            }}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'browse' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            Archived Cohorts ({archives.length})
          </button>
          <button
            onClick={() => setActiveTab('new_archive')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'new_archive' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Term Snapshot
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {successNotice && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              {successNotice}
            </div>
          )}

          {/* TAB 1: BROWSE ARCHIVES */}
          {activeTab === 'browse' && !selectedArchive && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                    Historical Term Clearance Snapshots
                  </h4>
                  <p className="text-[11px] opacity-60">
                    Browse immutable past cohort clearance results and compare performance.
                  </p>
                </div>
              </div>

              {archives.length === 0 ? (
                <div className="p-10 text-center bg-white border border-dashed border-gray-300">
                  <Archive className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-700">No Term Archives Created Yet</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Click "Create Term Snapshot" to save the active {settings.academicYear} {settings.term} cohort.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {archives.map((arch) => (
                    <div
                      key={arch.id}
                      onClick={() => setSelectedArchive(arch)}
                      className="p-4 bg-white border border-[#1A1A1A]/15 hover:border-[#7A1326] hover:shadow-md transition-all cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#7A1326] text-white rounded">
                          {arch.academicYear} • {arch.term}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {arch.clearedRate}% Cleared
                        </span>
                      </div>

                      <h5 className="font-bold text-sm text-[#1A1A1A] leading-tight">
                        {arch.name}
                      </h5>

                      <div className="grid grid-cols-3 gap-2 bg-[#F9F8F6] p-2 text-[10px] text-center">
                        <div>
                          <span className="opacity-60 block">Total</span>
                          <span className="font-bold text-xs">{arch.totalLearners}</span>
                        </div>
                        <div>
                          <span className="opacity-60 block">Cleared</span>
                          <span className="font-bold text-xs text-emerald-700">{arch.clearedLearners}</span>
                        </div>
                        <div>
                          <span className="opacity-60 block">Pending</span>
                          <span className="font-bold text-xs text-amber-700">{arch.totalLearners - arch.clearedLearners}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] opacity-60 pt-1">
                        <span>By: {arch.archivedBy}</span>
                        <span className="flex items-center gap-1 font-bold text-[#7A1326]">
                          Inspect Folios <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1 DETAIL: INSPECT ARCHIVED COHORT */}
          {activeTab === 'browse' && selectedArchive && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedArchive(null)}
                    className="text-xs font-bold text-[#7A1326] hover:underline flex items-center gap-1 mb-1"
                  >
                    ← Back to All Archives
                  </button>
                  <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">
                    {selectedArchive.name}
                  </h4>
                  <p className="text-[11px] opacity-60">
                    Archived on {new Date(selectedArchive.archivedAt).toLocaleString()} by {selectedArchive.archivedBy}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded">
                    {selectedArchive.clearedRate}% Completion ({selectedArchive.clearedLearners}/{selectedArchive.totalLearners})
                  </span>
                </div>
              </div>

              {/* Table of archived learners */}
              <div className="bg-white border border-[#1A1A1A]/15 overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#7A1326] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Reg No</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Class / Stream</th>
                      <th className="p-2">Clearance Status</th>
                      <th className="p-2 text-right">Cleared Subjects</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedArchive.learnersSnapshot.map((l) => {
                      const isClear = l.subjects.every((s) => s.status === 'cleared');
                      const clearedSubs = l.subjects.filter((s) => s.status === 'cleared').length;
                      return (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="p-2 font-mono font-bold text-[#7A1326]">{l.regNo}</td>
                          <td className="p-2 font-semibold">{l.name}</td>
                          <td className="p-2">{l.class} {l.stream}</td>
                          <td className="p-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isClear ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isClear ? 'FULL CLEARANCE' : 'PENDING'}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono font-bold">
                            {clearedSubs}/{l.subjects.length}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE SNAPSHOT */}
          {activeTab === 'new_archive' && (
            <form onSubmit={handleCreateArchive} className="space-y-4 bg-white p-5 border border-[#1A1A1A]/15">
              <div className="border-b border-gray-100 pb-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                  Archive Active Term Cohort
                </h4>
                <p className="text-[11px] opacity-60">
                  Takes an immutable snapshot of all {learners.length} candidate clearance folios, subject notes signatures, and photo proofs for permanent institutional records.
                </p>
              </div>

              {/* Active metrics preview */}
              <div className="grid grid-cols-3 gap-3 bg-[#7A1326]/5 p-3 border-l-4 border-[#7A1326] text-xs">
                <div>
                  <span className="opacity-60 block text-[10px] uppercase font-bold">Active Academic Term</span>
                  <span className="font-bold">{settings.academicYear} • {settings.term}</span>
                </div>
                <div>
                  <span className="opacity-60 block text-[10px] uppercase font-bold">Candidate Count</span>
                  <span className="font-bold">{learners.length} Students</span>
                </div>
                <div>
                  <span className="opacity-60 block text-[10px] uppercase font-bold">Clearance Rate</span>
                  <span className="font-bold text-emerald-700">{currentClearanceRate}% ({currentClearedCount} Cleared)</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                  Archive Snapshot Title
                </label>
                <input
                  type="text"
                  required
                  value={archiveName}
                  onChange={(e) => setArchiveName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold focus:outline-none focus:border-[#7A1326]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                  Administrative Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  value={archiveRemarks}
                  onChange={(e) => setArchiveRemarks(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isArchiving || learners.length === 0}
                  className="px-6 py-2.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  {isArchiving ? 'Snapshotting Records...' : 'Save & Archive Cohort'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
