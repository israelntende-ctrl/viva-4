import React, { useState } from 'react';
import { Learner, SubjectRecord, CatalogSubject } from '../types';
import { MASTER_SUBJECT_CATALOG, SUBJECT_COMBINATION_PRESETS } from '../data/subjectCatalog';
import { BookOpen, Plus, Trash2, Check, X, Sparkles, Layers, ShieldCheck, AlertCircle } from 'lucide-react';

interface StudentSubjectAssignmentModalProps {
  learner: Learner;
  allLearners?: Learner[];
  onSaveSubjects: (updatedLearner: Learner, applyToEntireStream?: boolean) => Promise<void>;
  onClose: () => void;
}

export const StudentSubjectAssignmentModal: React.FC<StudentSubjectAssignmentModalProps> = ({
  learner,
  allLearners = [],
  onSaveSubjects,
  onClose,
}) => {
  const [currentSubjects, setCurrentSubjects] = useState<SubjectRecord[]>(
    JSON.parse(JSON.stringify(learner.subjects))
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [applyToStream, setApplyToStream] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // New Custom Subject Form State
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [customDept, setCustomDept] = useState<string>('Academic Dept');

  // Check if subject is enrolled
  const isSubjectEnrolled = (catalogSub: CatalogSubject) => {
    return currentSubjects.some(
      (s) =>
        s.code.toLowerCase() === catalogSub.code.toLowerCase() ||
        s.name.toLowerCase() === catalogSub.name.toLowerCase()
    );
  };

  // Toggle subject from catalog
  const handleToggleCatalogSubject = (catalogSub: CatalogSubject) => {
    if (isSubjectEnrolled(catalogSub)) {
      // Remove subject
      setCurrentSubjects((prev) =>
        prev.filter(
          (s) =>
            s.code.toLowerCase() !== catalogSub.code.toLowerCase() &&
            s.name.toLowerCase() !== catalogSub.name.toLowerCase()
        )
      );
    } else {
      // Add subject
      const newSubjectRecord: SubjectRecord = {
        id: `sub_${catalogSub.code.toLowerCase()}_${Date.now()}`,
        name: catalogSub.name,
        code: catalogSub.code,
        department: catalogSub.department,
        status: 'pending',
        officer: '',
        checklists: catalogSub.defaultChecklists.map((label, idx) => ({
          id: `c_${idx + 1}`,
          label,
          completed: false,
        })),
      };
      setCurrentSubjects((prev) => [...prev, newSubjectRecord]);
    }
  };

  // Apply Combination Preset
  const handleApplyPreset = (presetId: string) => {
    const preset = SUBJECT_COMBINATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const newSubs: SubjectRecord[] = [];
    preset.subjectIds.forEach((catId) => {
      const catSub = MASTER_SUBJECT_CATALOG.find((s) => s.id === catId);
      if (catSub) {
        // preserve existing clearance status if student already has this subject
        const existing = currentSubjects.find((s) => s.code === catSub.code);
        if (existing) {
          newSubs.push(existing);
        } else {
          newSubs.push({
            id: `sub_${catSub.code.toLowerCase()}_${Date.now()}`,
            name: catSub.name,
            code: catSub.code,
            department: catSub.department,
            status: 'pending',
            officer: '',
            checklists: catSub.defaultChecklists.map((label, idx) => ({
              id: `c_${idx + 1}`,
              label,
              completed: false,
            })),
          });
        }
      }
    });

    setCurrentSubjects(newSubs);
  };

  // Add custom elective subject
  const handleAddCustomSubject = () => {
    if (!customName.trim() || !customCode.trim()) return;
    const newSubjectRecord: SubjectRecord = {
      id: `sub_custom_${Date.now()}`,
      name: customName.trim(),
      code: customCode.trim().toUpperCase(),
      department: customDept.trim() || 'General Studies',
      status: 'pending',
      officer: '',
      checklists: [
        { id: 'c_1', label: `${customName} theory notes and syllabus fully documented`, completed: false },
        { id: 'c_2', label: 'Practical assignments and termly workbooks verified', completed: false },
      ],
    };
    setCurrentSubjects((prev) => [...prev, newSubjectRecord]);
    setCustomName('');
    setCustomCode('');
    setShowCustomForm(false);
  };

  // Remove Subject
  const handleRemoveSubject = (id: string) => {
    setCurrentSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedLearner: Learner = {
        ...learner,
        subjects: currentSubjects,
        updatedAt: new Date().toISOString(),
      };
      await onSaveSubjects(updatedLearner, applyToStream);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCatalog = MASTER_SUBJECT_CATALOG.filter((s) => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  const streamLearnerCount = allLearners.filter(
    (l) => l.class === learner.class && l.stream === learner.stream
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-white p-5 border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7A1326]/10 text-[#7A1326] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-[#1A1A1A]">
                Subject Assignment & Curriculum Manager
              </h3>
              <p className="text-xs opacity-60">
                Manage subject folios for <strong className="text-[#7A1326]">{learner.name}</strong> ({learner.regNo}) • Class: {learner.class} {learner.stream}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center text-sm font-bold hover:bg-[#1A1A1A] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Combination Presets */}
          <div className="bg-white p-4 border border-[#1A1A1A]/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Standard Curriculum Combinations:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SUBJECT_COMBINATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className="p-3 border border-[#1A1A1A]/10 bg-[#FAF8F5] text-left hover:border-[#7A1326] hover:bg-[#7A1326]/5 transition-all text-xs flex flex-col justify-between"
                >
                  <p className="font-bold text-[#1A1A1A]">{preset.name}</p>
                  <p className="text-[9px] opacity-60 mt-1">{preset.description}</p>
                  <span className="mt-2 text-[9px] font-bold text-[#7A1326] uppercase">
                    + Apply Combination
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Assigned Subjects vs Catalog */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Current Active Folios */}
            <div className="lg:col-span-5 bg-white p-4 border border-[#1A1A1A]/10 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7A1326]">
                  Assigned Subjects ({currentSubjects.length})
                </span>
                <span className="text-[10px] font-mono opacity-50 font-bold">
                  {currentSubjects.filter((s) => s.status === 'cleared').length} Cleared
                </span>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {currentSubjects.length === 0 ? (
                  <p className="text-xs opacity-50 py-4 text-center">
                    No subjects assigned yet. Select from the catalog on the right.
                  </p>
                ) : (
                  currentSubjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/15 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] text-[#7A1326]">{sub.code}</span>
                          <span className="font-bold text-[#1A1A1A]">{sub.name}</span>
                        </div>
                        <p className="text-[9px] opacity-60">{sub.department}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border ${
                            sub.status === 'cleared'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub.id)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="Remove Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Custom Subject Trigger */}
              <div className="pt-2">
                {!showCustomForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(true)}
                    className="w-full py-2 border border-dashed border-[#1A1A1A]/30 text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/70 hover:border-[#7A1326] hover:text-[#7A1326] flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Custom Subject / Elective
                  </button>
                ) : (
                  <div className="p-3 bg-[#FAF8F5] border border-[#7A1326]/30 space-y-2 text-xs">
                    <p className="font-bold text-[#7A1326]">New Custom Subject</p>
                    <input
                      type="text"
                      placeholder="Subject Name (e.g. German Language)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full p-2 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Code (e.g. GER401)"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        className="p-2 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Department"
                        value={customDept}
                        onChange={(e) => setCustomDept(e.target.value)}
                        className="p-2 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCustomForm(false)}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomSubject}
                        className="px-3 py-1 bg-[#7A1326] text-white text-[10px] font-bold uppercase"
                      >
                        Add to Folio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Master Catalog Selector */}
            <div className="lg:col-span-7 bg-white p-4 border border-[#1A1A1A]/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A]/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                  UNEB / National Subject Catalog
                </span>

                {/* Category Filters */}
                <div className="flex gap-1 text-[9px] font-bold uppercase">
                  {['all', 'core', 'science', 'arts', 'vocational', 'language'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-1 transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#7A1326] text-white'
                          : 'bg-[#FAF8F5] text-[#1A1A1A]/70 hover:bg-black/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                {filteredCatalog.map((catSub) => {
                  const enrolled = isSubjectEnrolled(catSub);
                  return (
                    <button
                      key={catSub.id}
                      type="button"
                      onClick={() => handleToggleCatalogSubject(catSub)}
                      className={`p-3 text-left border transition-all flex items-center justify-between ${
                        enrolled
                          ? 'border-[#7A1326] bg-[#7A1326]/5 ring-1 ring-[#7A1326]'
                          : 'border-[#1A1A1A]/10 bg-[#FAF8F5] hover:border-[#1A1A1A]/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] text-[#7A1326]">
                            {catSub.code}
                          </span>
                          <span className="text-xs font-bold text-[#1A1A1A]">{catSub.name}</span>
                        </div>
                        <p className="text-[9px] opacity-60">{catSub.department}</p>
                      </div>

                      <div className="shrink-0 ml-2">
                        {enrolled ? (
                          <span className="w-5 h-5 rounded-full bg-[#7A1326] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-[#1A1A1A]/30 text-[#1A1A1A]/50 flex items-center justify-center text-xs font-bold">
                            +
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bulk Stream Replication Checkbox */}
          <div className="p-3.5 bg-[#FAF8F5] border border-[#7A1326]/20 flex items-start gap-3">
            <input
              id="chk-stream-sync"
              type="checkbox"
              checked={applyToStream}
              onChange={(e) => setApplyToStream(e.target.checked)}
              className="accent-[#7A1326] w-4 h-4 mt-0.5"
            />
            <div>
              <label htmlFor="chk-stream-sync" className="text-xs font-bold text-[#1A1A1A] cursor-pointer">
                Replicate this subject lineup to all {streamLearnerCount} students in {learner.class} Stream {learner.stream}
              </label>
              <p className="text-[10px] opacity-60 mt-0.5">
                Automatically sets up the academic folio combinations for every candidate in this stream while preserving existing clearance verdicts.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#1A1A1A]/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:border-[#1A1A1A]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || currentSubjects.length === 0}
            className="px-6 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-md disabled:opacity-40"
          >
            <ShieldCheck className="w-4 h-4" />
            {isSaving ? 'Updating Database...' : 'Save Subject Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSubjectAssignmentModal;
