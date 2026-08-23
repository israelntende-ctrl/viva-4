import React, { useState, useMemo } from 'react';
import { Learner, SchoolSettings, CardDesignTemplate } from '../types';
import { ClearanceCardRenderer } from './CardDesigns/ClearanceCardRenderer';
import { VivaBadge } from './VivaBadge';
import { Printer, Filter, CheckSquare, Square, Layers, Sparkles, X, ChevronDown } from 'lucide-react';

interface BulkPrintModalProps {
  learners: Learner[];
  settings: SchoolSettings;
  onClose: () => void;
}

export const BulkPrintModal: React.FC<BulkPrintModalProps> = ({
  learners,
  settings,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(learners.map((l) => l.id))
  );
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterStream, setFilterStream] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CLEARED' | 'PENDING'>('ALL');
  const [cardsPerPage, setCardsPerPage] = useState<1 | 2 | 4>(settings.cardsPerPage || 1);
  const [overrideTemplate, setOverrideTemplate] = useState<CardDesignTemplate>(
    settings.activeCardDesign || 'viva-crimson'
  );

  // Available classes
  const classes = useMemo(() => {
    const fromLearners = Array.from(new Set(learners.map((l) => l.class))).filter(Boolean);
    const fromSettings = settings.availableClasses || [];
    return Array.from(new Set([...fromSettings, ...fromLearners])).sort();
  }, [learners, settings]);

  // Available streams
  const streams = useMemo(() => {
    const relevant = filterClass === 'ALL'
      ? learners
      : learners.filter((l) => l.class === filterClass);
    const s = new Set<string>();
    relevant.forEach((l) => {
      if (l.stream) s.add(l.stream);
    });
    return Array.from(s).sort();
  }, [learners, filterClass]);

  // Filtered learners list
  const filteredLearners = useMemo(() => {
    return learners.filter((l) => {
      const matchClass = filterClass === 'ALL' || l.class === filterClass;
      const matchStream = filterStream === 'ALL' || l.stream === filterStream;
      const isComplete = l.subjects.every((s) => s.status === 'cleared');
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'CLEARED' && isComplete) ||
        (filterStatus === 'PENDING' && !isComplete);
      return matchClass && matchStream && matchStatus;
    });
  }, [learners, filterClass, filterStream, filterStatus]);

  // Learners selected for print
  const learnersToPrint = useMemo(() => {
    return filteredLearners.filter((l) => selectedIds.has(l.id));
  }, [filteredLearners, selectedIds]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLearners.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLearners.map((l) => l.id)));
    }
  };

  const toggleSelectId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container - on print, expands to full sheet */}
      <div className="bg-[#F9F8F6] border-2 border-[#1A1A1A] w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:h-auto print:bg-white">
        {/* Non-print Header & Toolbar */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#1A1A1A]/10 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <VivaBadge size="sm" />
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A]">
                Bulk Clearance Card Print Studio
              </h3>
              <p className="text-xs opacity-60">
                Generate high-resolution printable cards for batches of learners.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-print-batch-now"
              onClick={handlePrint}
              disabled={learnersToPrint.length === 0}
              className="px-6 py-2.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-md disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              Print ({learnersToPrint.length}) Cards
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center text-sm font-bold hover:bg-[#1A1A1A] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (No-print) */}
        <div className="p-4 bg-[#F2EFE9] border-b border-[#1A1A1A]/10 flex flex-wrap items-center justify-between gap-4 text-xs font-medium no-print">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold opacity-50">Class:</span>
              <select
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setFilterStream('ALL');
                }}
                className="bg-white border border-[#1A1A1A]/15 py-1 px-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Stream Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold opacity-50">Stream:</span>
              <select
                value={filterStream}
                onChange={(e) => setFilterStream(e.target.value)}
                className="bg-white border border-[#1A1A1A]/15 py-1 px-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Streams</option>
                {streams.map((st) => (
                  <option key={st} value={st}>
                    Stream {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold opacity-50">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'CLEARED' | 'PENDING')}
                className="bg-white border border-[#1A1A1A]/15 py-1 px-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="CLEARED">Fully Cleared Only</option>
                <option value="PENDING">Pending Action Only</option>
              </select>
            </div>

            {/* Card Layout / Grid Density */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold opacity-50">Per Page:</span>
              <select
                value={cardsPerPage}
                onChange={(e) => setCardsPerPage(Number(e.target.value) as 1 | 2 | 4)}
                className="bg-white border border-[#1A1A1A]/15 py-1 px-2 text-xs font-semibold focus:outline-none"
              >
                <option value={1}>1 Card (Full Page)</option>
                <option value={2}>2 Cards (Half Page)</option>
                <option value={4}>4 Cards (Index Cards)</option>
              </select>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold opacity-50">Theme:</span>
              <select
                value={overrideTemplate}
                onChange={(e) => setOverrideTemplate(e.target.value as CardDesignTemplate)}
                className="bg-white border border-[#1A1A1A]/15 py-1 px-2 text-xs font-semibold focus:outline-none"
              >
                <option value="viva-crimson">Viva Imperial Crimson</option>
                <option value="editorial-heritage">Editorial Heritage</option>
                <option value="royal-parchment">Royal Parchment</option>
                <option value="executive-slate">Executive Noir</option>
                <option value="randomized-custom">Custom Randomized</option>
              </select>
            </div>
          </div>

          {/* Select / Deselect All Button */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-[#7A1326] underline hover:opacity-80"
          >
            {selectedIds.size === filteredLearners.length ? (
              <>
                <CheckSquare className="w-4 h-4" /> Deselect All
              </>
            ) : (
              <>
                <Square className="w-4 h-4" /> Select All ({filteredLearners.length})
              </>
            )}
          </button>
        </div>

        {/* Scrollable Printable Sheet Gallery */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-[#E5E2DC] print:bg-white print:p-0 print:overflow-visible">
          {learnersToPrint.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#1A1A1A]/10 p-8">
              <p className="font-serif text-lg text-[#1A1A1A]">No learners selected for batch printing.</p>
              <p className="text-xs opacity-60 mt-1">Adjust filters or select learners above.</p>
            </div>
          ) : (
            <div
              className={`grid gap-8 print:gap-6 ${
                cardsPerPage === 1
                  ? 'grid-cols-1 max-w-2xl mx-auto'
                  : cardsPerPage === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
              }`}
            >
              {learnersToPrint.map((lrn, idx) => (
                <div
                  key={lrn.id}
                  className="relative group transition-transform print:break-inside-avoid print:page-break-inside-avoid"
                  style={{
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  {/* Selection checkbox overlay in preview */}
                  <div className="absolute top-3 right-3 z-20 no-print">
                    <button
                      type="button"
                      onClick={() => toggleSelectId(lrn.id)}
                      className="bg-white/90 border border-[#1A1A1A]/30 p-1.5 shadow-sm hover:bg-white"
                    >
                      {selectedIds.has(lrn.id) ? (
                        <CheckSquare className="w-4 h-4 text-[#7A1326]" />
                      ) : (
                        <Square className="w-4 h-4 text-black/40" />
                      )}
                    </button>
                  </div>

                  {/* Render the Card */}
                  <ClearanceCardRenderer
                    learner={lrn}
                    settings={settings}
                    overrideTemplate={overrideTemplate}
                    showWatermark={true}
                    mode={cardsPerPage === 1 ? 'print-full' : cardsPerPage === 2 ? 'print-half' : 'print-quarter'}
                  />

                  {/* Print Page Break Helper for 1 or 2 per page */}
                  {cardsPerPage === 1 && (
                    <div className="hidden print:block" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}></div>
                  )}
                  {cardsPerPage === 2 && (idx + 1) % 2 === 0 && (
                    <div className="hidden print:block" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}></div>
                  )}
                  {cardsPerPage === 4 && (idx + 1) % 4 === 0 && (
                    <div className="hidden print:block" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3.5 bg-white border-t border-[#1A1A1A]/10 text-xs flex items-center justify-between no-print">
          <span className="opacity-60 font-mono">
            {learnersToPrint.length} cards queued for printing ({cardsPerPage} per sheet)
          </span>
          <span className="font-bold text-[#7A1326]">
            Theme: {overrideTemplate.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};
