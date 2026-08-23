import React from 'react';
import { Learner, ClearanceStatus, SubjectRecord } from '../types';
import { Eye, CheckCircle2, Clock, XCircle, Plus } from 'lucide-react';

interface LearnerTableProps {
  filteredLearners: Learner[];
  paginatedLearners: Learner[];
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  hasMoreLearners: boolean;
  handleQuickStatusChange: (learner: Learner, subjectId: string, nextStatus: ClearanceStatus) => void;
  setActiveInspectLearner: (learner: Learner) => void;
}

export const LearnerTable: React.FC<LearnerTableProps> = ({
  filteredLearners,
  paginatedLearners,
  pageSize,
  setPageSize,
  hasMoreLearners,
  handleQuickStatusChange,
  setActiveInspectLearner,
}) => {
  return (
    <div className="bg-white border border-[#1A1A1A]/10 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#FAF8F5] border-b-2 border-[#7A1326] text-[#7A1326] font-bold uppercase text-[9px] tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Student & Reg No</th>
              <th className="py-3.5 px-3">Class & Stream</th>
              <th className="py-3.5 px-3">Progress</th>
              <th className="py-3.5 px-3">Departmental Subject Folios (Click badge to toggle)</th>
              <th className="py-3.5 px-4 text-right">Certificate & Slip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]/10 font-medium">
            {filteredLearners.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center opacity-60">
                  <p className="font-serif text-lg font-bold">No candidates match current filters.</p>
                  <p className="text-xs mt-1">Try resetting search or importing new learners.</p>
                </td>
              </tr>
            ) : (
              paginatedLearners.map((lrn) => {
                const clearedCount = lrn.subjects.filter((s) => s.status === 'cleared').length;
                const isComplete = clearedCount === lrn.subjects.length;
                const percentage = lrn.subjects.length > 0 ? Math.round((clearedCount / lrn.subjects.length) * 100) : 0;

                return (
                  <tr key={lrn.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-[#7A1326] text-[11px] bg-[#7A1326]/5 px-2 py-0.5 border border-[#7A1326]/25">
                          {lrn.regNo}
                        </span>
                        <div>
                          <p className="font-serif font-bold text-sm text-[#1A1A1A] leading-tight">
                            {lrn.name}
                          </p>
                          <p className="text-[10px] opacity-50">{lrn.house}</p>
                        </div>
                      </div>
                    </td>

                    {/* Class / Stream */}
                    <td className="py-3.5 px-3 font-semibold text-[#1A1A1A]">
                      <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#1A1A1A]/15 text-xs font-mono font-bold">
                        {lrn.class} • Stream {lrn.stream}
                      </span>
                    </td>

                    {/* Progress Gauge */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isComplete ? 'bg-emerald-600' : 'bg-[#7A1326]'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className={`text-[10px] font-bold font-mono ${isComplete ? 'text-emerald-700' : 'text-[#7A1326]'}`}>
                          {clearedCount}/{lrn.subjects.length} ({percentage}%)
                        </span>
                      </div>
                    </td>

                    {/* Interactive Subject Badges */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {lrn.subjects.map((sub) => {
                          const isCleared = sub.status === 'cleared';
                          const isPending = sub.status === 'pending';
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() =>
                                handleQuickStatusChange(
                                  lrn,
                                  sub.id,
                                  isCleared ? 'pending' : 'cleared'
                                )
                              }
                              title={`${sub.name} (${sub.code}) • Status: ${sub.status.toUpperCase()} • Signed: ${sub.officer || 'None'}. Click to toggle verification.`}
                              className={`px-2 py-1 text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 border cursor-pointer ${
                                isCleared
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                              }`}
                            >
                              {isCleared ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              ) : isPending ? (
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                              ) : (
                                <XCircle className="w-2.5 h-2.5 text-rose-600" />
                              )}
                              <span>{sub.name.slice(0, 4).toUpperCase()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveInspectLearner(lrn)}
                        className="px-3 py-1.5 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#7A1326] transition-all inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3 h-3" />
                        Inspect Slip
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {hasMoreLearners && (
        <div className="flex justify-center py-6 border-t border-[#1A1A1A]/10 bg-white shadow-xs">
          <button
            type="button"
            onClick={() => setPageSize((prev) => prev + 50)}
            className="group px-8 py-2.5 bg-[#FAF8F5] border-2 border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#7A1326] hover:text-white transition-all flex items-center gap-3 shadow-xs"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>
              Displaying {pageSize} of {filteredLearners.length} — Load More Candidates
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
