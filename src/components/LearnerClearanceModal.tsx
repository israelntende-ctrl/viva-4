import React, { useState } from 'react';
import { Learner, UserAccount, SubjectRecord, ClearanceStatus, SchoolSettings } from '../types';
import { DbService } from '../lib/dbService';
import { ClearanceCardRenderer } from './CardDesigns/ClearanceCardRenderer';
import { VivaBadge } from './VivaBadge';
import { SignatureDisplay } from './SignatureDisplay';
import { SignaturePadModal } from './SignaturePadModal';
import { PhotoProofCaptureModal } from './PhotoProofCaptureModal';
import { PhotoProofViewerModal } from './PhotoProofViewerModal';
import { StudentSubjectAssignmentModal } from './StudentSubjectAssignmentModal';
import { checkIsFullyCleared } from '../lib/clearanceUtils';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Printer,
  Save,
  CheckSquare,
  Square,
  X,
  AlertTriangle,
  Camera,
  PenTool,
  BookOpen,
  Layers,
  Sparkles,
  Eye,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LearnerClearanceModalProps {
  learner: Learner;
  allLearners?: Learner[];
  currentUser: UserAccount;
  settings: SchoolSettings;
  onUpdateLearner: (learner: Learner, applyToEntireStream?: boolean) => Promise<void>;
  onClose: () => void;
}

export const LearnerClearanceModal: React.FC<LearnerClearanceModalProps> = ({
  learner,
  allLearners = [],
  currentUser,
  settings,
  onUpdateLearner,
  onClose,
}) => {
  const clearanceStatus = React.useMemo(() => checkIsFullyCleared(learner, settings), [learner, settings]);
  const [activeTab, setActiveTab] = useState<'clearance' | 'card_preview'>('clearance');
  const [subjectsState, setSubjectsState] = useState<SubjectRecord[]>(
    JSON.parse(JSON.stringify(learner.subjects))
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    learner.subjects[0]?.id || ''
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sub-modals
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [showPhotoProofModal, setShowPhotoProofModal] = useState<boolean>(false);
  const [showPhotoViewerModal, setShowPhotoViewerModal] = useState<boolean>(false);
  const [showSubjectAssignmentModal, setShowSubjectAssignmentModal] = useState<boolean>(false);

  const selectedSubject =
    subjectsState.find((s) => s.id === selectedSubjectId) || subjectsState[0];

  // Check if current user can edit this subject
  const canEditSubject = (subject: SubjectRecord) => {
    if (!subject) return false;
    if (currentUser.role === 'admin') return true;
    const assigned = currentUser.assignedSubjects || [];
    if (assigned.includes('ALL')) return true;
    return assigned.some(
      (as) =>
        as.toLowerCase().includes(subject.name.toLowerCase()) ||
        subject.name.toLowerCase().includes(as.toLowerCase()) ||
        as.toLowerCase().includes(subject.department.toLowerCase())
    );
  };

  // Toggle checklist item
  const handleToggleChecklist = (subjectId: string, checkId: string) => {
    setSubjectsState((prev) =>
      prev.map((sub) => {
        if (sub.id !== subjectId) return sub;
        const nextChecks = sub.checklists.map((c) =>
          c.id === checkId ? { ...c, completed: !c.completed } : c
        );
        return { ...sub, checklists: nextChecks };
      })
    );
  };

  // Update subject status
  const handleUpdateStatus = (subjectId: string, newStatus: ClearanceStatus) => {
    const today = new Date().toLocaleDateString('en-GB');
    setSubjectsState((prev) =>
      prev.map((sub) => {
        if (sub.id !== subjectId) return sub;
        return {
          ...sub,
          status: newStatus,
          officer: newStatus === 'cleared' ? currentUser.name.toUpperCase() : sub.officer,
          signedDate: newStatus === 'cleared' ? today : sub.signedDate,
          signatureDataUrl:
            newStatus === 'cleared'
              ? sub.signatureDataUrl || currentUser.signatureDataUrl || currentUser.name
              : sub.signatureDataUrl,
        };
      })
    );
  };

  // Update remarks
  const handleUpdateRemarks = (subjectId: string, remarks: string) => {
    setSubjectsState((prev) =>
      prev.map((sub) => (sub.id === subjectId ? { ...sub, remarks } : sub))
    );
  };

  // Save digital signature to subject
  const handleSaveSignature = (
    sigUrl: string,
    sigType: 'drawn' | 'calligraphy',
    saveToProfile: boolean
  ) => {
    const today = new Date().toLocaleDateString('en-GB');
    setSubjectsState((prev) =>
      prev.map((sub) => {
        if (sub.id !== selectedSubject.id) return sub;
        return {
          ...sub,
          status: 'cleared',
          officer: currentUser.name.toUpperCase(),
          signedDate: today,
          signatureDataUrl: sigUrl,
          signatureType: sigType,
        };
      })
    );

    if (saveToProfile) {
      DbService.saveUser({
        ...currentUser,
        signatureDataUrl: sigUrl,
        signatureStyle: sigType,
      }).catch(console.error);
    }
  };

  // Save photo proof to subject
  const handleSavePhotoProof = (photoUrl: string, caption?: string) => {
    const today = new Date().toLocaleDateString('en-GB');
    setSubjectsState((prev) =>
      prev.map((sub) => {
        if (sub.id !== selectedSubject.id) return sub;
        return {
          ...sub,
          photoProofUrl: photoUrl,
          photoProofTimestamp: today,
          photoProofCaption: caption,
        };
      })
    );
  };

  // Remove photo proof
  const handleRemovePhotoProof = (subjectId: string) => {
    setSubjectsState((prev) =>
      prev.map((sub) => {
        if (sub.id !== subjectId) return sub;
        return {
          ...sub,
          photoProofUrl: undefined,
          photoProofCaption: undefined,
          photoProofTimestamp: undefined,
        };
      })
    );
  };

  // Admin Override: Clear All Subjects
  const handleAdminClearAll = () => {
    if (currentUser.role !== 'admin') return;
    const today = new Date().toLocaleDateString('en-GB');
    setSubjectsState((prev) =>
      prev.map((sub) => ({
        ...sub,
        status: 'cleared',
        officer: currentUser.name.toUpperCase(),
        signedDate: today,
        remarks: sub.remarks || 'Cleared under Dean of Studies Executive Review.',
        signatureDataUrl: sub.signatureDataUrl || currentUser.signatureDataUrl || currentUser.name,
        checklists: sub.checklists.map((c) => ({ ...c, completed: true })),
      }))
    );
  };

  // Save changes to Firestore and trigger SMS notifications
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const wasFullyClearedBefore = learner.subjects.every((s) => s.status === 'cleared');
      const updatedLearner: Learner = {
        ...learner,
        subjects: subjectsState,
        updatedAt: new Date().toISOString(),
      };

      await onUpdateLearner(updatedLearner);

      // Log audit
      await DbService.logAudit({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        officerName: currentUser.name,
        officerRole: currentUser.role,
        learnerRegNo: learner.regNo,
        learnerName: learner.name,
        subjectName: selectedSubject?.name || 'All Subjects',
        action: 'CLEARED',
        details: `Updated clearance & proofs for ${learner.name}`,
      });

      // Check if newly fully cleared -> Trigger visual feedback
      const allCleared = subjectsState.every((s) => s.status === 'cleared');
      if (!wasFullyClearedBefore && allCleared) {
        try {
          confetti({
            particleCount: 65,
            spread: 65,
            origin: { y: 0.5 },
            colors: ['#7A1326', '#D4AF37', '#10B981'],
          });
        } catch (_) {}
        setFeedback('All subjects cleared! Candidate is now eligible for certificate.');
      } else {
        setFeedback('Changes successfully recorded in the database.');
      }

      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error(err);
      setFeedback('Failed to update database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick direct Guardian SMS trigger
  const handleDirectSmsGuardian = async () => {
    if (!learner.guardianContact) {
      alert(`No guardian contact phone number found for ${learner.name}.`);
      return;
    }
    const messagePrompt = prompt(
      `Send SMS to Guardian (${learner.guardianContact}):`,
      `Victory College School: Dear Guardian of ${learner.name} (${learner.regNo}), this is an update regarding Term II clearance progress.`
    );
    if (!messagePrompt) return;

    try {
      await DbService.logAudit({
        id: `sms_${Date.now()}`,
        timestamp: new Date().toISOString(),
        officerName: currentUser.name,
        officerRole: currentUser.role,
        learnerRegNo: learner.regNo,
        learnerName: learner.name,
        subjectName: 'Guardian SMS Notice',
        action: 'GUARDIAN_SMS_DISPATCHED',
        details: `SMS sent to ${learner.guardianContact}: "${messagePrompt}"`,
      });
      alert(`SMS logged for guardian (${learner.guardianContact}). Note: no live SMS gateway is wired up yet, so this records the notice in the audit trail without sending a real text.`);
    } catch (e) {
      alert('Failed to log SMS dispatch: ' + (e as Error).message);
    }
  };

  const clearedCount = subjectsState.filter((s) => s.status === 'cleared').length;
  const isFullyCleared = clearedCount === subjectsState.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-[#F9F8F6] border-2 border-[#1A1A1A] w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:bg-white">
        {/* Header */}
        <div className="p-5 bg-white border-b border-[#1A1A1A]/10 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <VivaBadge size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A]">
                  {learner.name}
                </h3>
                <span className="font-mono text-xs bg-[#7A1326] text-white px-2 py-0.5 font-bold">
                  {learner.regNo}
                </span>
              </div>
              <p className="text-xs opacity-60">
                {learner.class} {learner.stream} • {learner.house} • Guardian:{' '}
                {learner.guardianContact || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleDirectSmsGuardian}
              title="Send Direct SMS to Guardian"
              className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              SMS Guardian
            </button>

            <button
              type="button"
              onClick={() => setShowSubjectAssignmentModal(true)}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-[#1A1A1A] hover:border-[#7A1326] hover:text-[#7A1326] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5" />
              Subjects ({subjectsState.length})
            </button>

            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={handleAdminClearAll}
                className="px-3.5 py-1.5 bg-[#D4AF37] text-[#5B0B19] text-xs font-bold uppercase tracking-wider hover:bg-[#F6D365] transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Dean Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center text-sm font-bold hover:bg-[#1A1A1A] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[#1A1A1A]/10 bg-white px-6 text-xs font-semibold uppercase tracking-wider no-print">
          <button
            onClick={() => setActiveTab('clearance')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'clearance'
                ? 'border-[#7A1326] text-[#7A1326]'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            Subject Clearance & Checklist ({clearedCount}/{subjectsState.length} Cleared)
          </button>
          <button
            onClick={() => setActiveTab('card_preview')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'card_preview'
                ? 'border-[#7A1326] text-[#7A1326]'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            Official Clearance Card Slip
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {feedback && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
              <span>{feedback}</span>
              <button onClick={() => setFeedback(null)}>✕</button>
            </div>
          )}

          {/* TAB 1: CLEARANCE WORKSPACE */}
          {activeTab === 'clearance' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Clearance Eligibility Banner */}
              {!clearanceStatus.isCleared && (
                <div className="col-span-full bg-amber-50 border-2 border-amber-300 p-4 flex items-start gap-4 shadow-sm">
                  <div className="bg-amber-100 p-2 text-amber-700 rounded-xs">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2">
                      <span>Clearance Eligibility Flag:</span>
                      <span className="bg-amber-200 px-2 py-0.5 rounded-xs text-[10px]">{clearanceStatus.reason}</span>
                    </h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      This candidate does not yet meet the minimum criteria for 100% academic clearance. 
                      {clearanceStatus.missingMandatoryIds.length > 0 && (
                        <span> Mandatory subjects missing: <strong className="font-mono">{clearanceStatus.missingMandatoryIds.join(', ')}</strong>.</span>
                      )}
                      {!learner.subjects.length && (
                        <span> No subjects have been assigned to this student record.</span>
                      )}
                      {learner.feesStatus !== 'cleared' && (
                        <span> Outstanding school fees are still pending.</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Left Column: Subjects List */}
              <div className="space-y-2 bg-white p-4 border border-[#1A1A1A]/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                    Academic Subject Folios
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSubjectAssignmentModal(true)}
                    className="text-[9px] font-bold uppercase text-[#7A1326] hover:underline"
                  >
                    + Edit Lineup
                  </button>
                </div>

                {subjectsState.map((sub) => {
                  const editable = canEditSubject(sub);
                  const isSelected = sub.id === selectedSubjectId;
                  const hasPhoto = Boolean(sub.photoProofUrl);
                  const hasSignature = Boolean(sub.signatureDataUrl);

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`w-full p-3 text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#7A1326] bg-[#7A1326]/5 ring-1 ring-[#7A1326]'
                          : 'border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] text-[#7A1326]">
                            {sub.code}
                          </span>
                          <span className="text-xs font-bold text-[#1A1A1A]">{sub.name}</span>
                        </div>
                        <p className="text-[10px] opacity-60 truncate">{sub.department}</p>
                        
                        {/* Indicators for Photo & Signature */}
                        <div className="flex items-center gap-2 mt-1">
                          {hasPhoto && (
                            <span className="inline-flex items-center gap-0.5 text-[8.5px] text-blue-700 bg-blue-50 px-1 py-0.2 border border-blue-200">
                              <Camera className="w-2.5 h-2.5" /> Book Proof
                            </span>
                          )}
                          {hasSignature && (
                            <span className="inline-flex items-center gap-0.5 text-[8.5px] text-emerald-800 bg-emerald-50 px-1 py-0.2 border border-emerald-200">
                              <PenTool className="w-2.5 h-2.5" /> Signed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {sub.status === 'cleared' ? (
                          <span className="text-emerald-700 font-bold text-[9px] uppercase bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                            CLEARED
                          </span>
                        ) : sub.status === 'not_cleared' ? (
                          <span className="text-rose-700 font-bold text-[9px] uppercase bg-rose-50 px-1.5 py-0.5 border border-rose-200">
                            FLAGGED
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold text-[9px] uppercase bg-amber-50 px-1.5 py-0.5 border border-amber-200">
                            PENDING
                          </span>
                        )}
                        {!editable && (
                          <span className="block text-[8px] opacity-40 uppercase font-mono mt-0.5">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Overrides & Exceptions */}
                <div className="mt-6 pt-4 border-t border-[#1A1A1A]/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                      Requirement Overrides
                    </p>
                    {learner.overrides && learner.overrides.length > 0 && (
                      <span className="bg-[#1E40AF] text-white text-[9px] px-1.5 py-0.5 font-bold">
                        {learner.overrides.length} ACTIVE
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {learner.overrides?.map((ov, i) => (
                      <div key={i} className="p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/15 text-[10px] flex items-center justify-between group">
                        <div className="overflow-hidden">
                          <span className={`font-bold ${ov.action === 'add' ? 'text-blue-700' : 'text-rose-700'}`}>
                            {ov.action.toUpperCase()}
                          </span>: <span className="font-mono font-bold text-neutral-800">{ov.subjectId}</span>
                          <p className="opacity-60 truncate max-w-[180px] italic">"{ov.reason}"</p>
                        </div>
                        <button 
                          onClick={() => {
                            const next = [...(learner.overrides || [])];
                            next.splice(i, 1);
                            onUpdateLearner({ ...learner, overrides: next });
                          }}
                          className="text-neutral-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const sid = prompt('Enter Subject ID or Code to override:');
                        if (!sid) return;
                        const action: 'add' | 'drop' = confirm('Click OK to DROP requirement, Cancel to ADD requirement') ? 'drop' : 'add';
                        const reason = prompt('Reason for override:');
                        if (!reason) return;
                        
                        const next = [...(learner.overrides || []), { subjectId: sid, action, reason }];
                        onUpdateLearner({ ...learner, overrides: next });
                      }}
                      className="w-full py-2 border-2 border-dashed border-[#1A1A1A]/15 text-[10px] font-bold uppercase text-neutral-500 hover:border-[#7A1326] hover:text-[#7A1326] transition-all"
                    >
                      + Add Individual Override
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Columns: Inspection, Photographic Proof & Checklist Form */}
              <div className="md:col-span-2 space-y-5 bg-white p-6 border border-[#1A1A1A]/10">
                {selectedSubject && (
                  <>
                    <div className="border-b border-[#1A1A1A]/10 pb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-xl font-bold text-[#1A1A1A]">
                            {selectedSubject.name} ({selectedSubject.code})
                          </h4>
                          {canEditSubject(selectedSubject) ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold uppercase px-2 py-0.5">
                              Authorized Officer
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-semibold uppercase px-2 py-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Assigned to{' '}
                              {selectedSubject.officer || 'Dept Head'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-60">{selectedSubject.department}</p>
                      </div>

                      {/* Status Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedSubject.id, 'cleared')}
                          disabled={!canEditSubject(selectedSubject)}
                          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                            selectedSubject.status === 'cleared'
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          } disabled:opacity-40`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedSubject.id, 'not_cleared')}
                          disabled={!canEditSubject(selectedSubject)}
                          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                            selectedSubject.status === 'not_cleared'
                              ? 'bg-rose-600 text-white border-rose-700'
                              : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                          } disabled:opacity-40`}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Flag / Hold
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedSubject.id, 'pending')}
                          disabled={!canEditSubject(selectedSubject)}
                          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                            selectedSubject.status === 'pending'
                              ? 'bg-amber-600 text-white border-amber-700'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          } disabled:opacity-40`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </button>
                      </div>
                    </div>

                    {/* PHOTOGRAPHIC PROOF OF CLEARANCE SECTION (OPTIONAL) */}
                    <div className="bg-[#FAF8F5] border border-[#1A1A1A]/10 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-[#7A1326]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                            Photographic Proof in Student's Exercise Book (Optional)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPhotoProofModal(true)}
                          disabled={!canEditSubject(selectedSubject)}
                          className="px-2.5 py-1 bg-[#7A1326]/10 text-[#7A1326] hover:bg-[#7A1326] hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 disabled:opacity-40"
                        >
                          <Camera className="w-3 h-3" />
                          {selectedSubject.photoProofUrl ? 'Change Photo' : '+ Attach Book Photo'}
                        </button>
                      </div>

                      {selectedSubject.photoProofUrl ? (
                        <div className="p-3 bg-white border border-[#1A1A1A]/10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => setShowPhotoViewerModal(true)}
                              className="relative cursor-pointer group shrink-0"
                            >
                              <img
                                src={selectedSubject.photoProofUrl}
                                alt="Book proof"
                                className="w-16 h-16 object-cover border border-[#1A1A1A]/20 rounded-xs group-hover:opacity-80 transition-opacity"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>

                            <div className="text-xs space-y-0.5">
                              <p className="font-bold text-[#1A1A1A]">
                                Verified Coursework Evidence
                              </p>
                              <p className="text-[10px] opacity-70 italic line-clamp-1">
                                "{selectedSubject.photoProofCaption || 'Exercise book notes stamped'}"
                              </p>
                              <p className="text-[9px] opacity-50 font-mono">
                                Attached: {selectedSubject.photoProofTimestamp || selectedSubject.signedDate || 'Today'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowPhotoViewerModal(true)}
                              className="px-3 py-1 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-[10px] font-bold uppercase hover:border-[#7A1326] flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Inspect
                            </button>
                            {canEditSubject(selectedSubject) && (
                              <button
                                type="button"
                                onClick={() => handleRemovePhotoProof(selectedSubject.id)}
                                className="p-1 text-rose-600 hover:text-rose-800"
                                title="Remove photo proof"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] opacity-50">
                          No photographic evidence attached yet. Teachers can snap a photo of the student's notebook or marked exercises for audit compliance.
                        </p>
                      )}
                    </div>

                    {/* Department Checklist items */}
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                        Subject Clearance Verification Checklist
                      </label>
                      <div className="space-y-2">
                        {selectedSubject.checklists?.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              canEditSubject(selectedSubject) &&
                              handleToggleChecklist(selectedSubject.id, item.id)
                            }
                            disabled={!canEditSubject(selectedSubject)}
                            className={`w-full p-3 text-left border flex items-center gap-3 transition-colors ${
                              item.completed
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                                : 'bg-[#FAF8F5] border-[#1A1A1A]/15 text-[#1A1A1A]'
                            } ${
                              !canEditSubject(selectedSubject)
                                ? 'cursor-not-allowed opacity-75'
                                : 'hover:border-[#7A1326]'
                            }`}
                          >
                            {item.completed ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-5 h-5 text-black/40 shrink-0" />
                            )}
                            <span className="text-xs">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Teacher Remarks */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                        Official Departmental Remarks & Feedback
                      </label>
                      <textarea
                        rows={2}
                        value={selectedSubject.remarks || ''}
                        disabled={!canEditSubject(selectedSubject)}
                        onChange={(e) =>
                          handleUpdateRemarks(selectedSubject.id, e.target.value)
                        }
                        placeholder="e.g. All classwork notes, assignments, lab logbook, and practical tools returned."
                        className="w-full p-3 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326] disabled:opacity-60"
                      />
                    </div>

                    {/* Sign-off Details & Digital Signature */}
                    <div className="p-4 bg-[#FAF8F5] border border-[#1A1A1A]/10 text-xs flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold opacity-50 block">
                          Signed Officer
                        </span>
                        <span className="font-mono font-bold text-[#7A1326]">
                          {selectedSubject.officer || 'Awaiting Sign-off'}
                        </span>
                        <span className="text-[9px] opacity-60 block font-mono">
                          {selectedSubject.signedDate || 'Not Stamped'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Signature Preview */}
                        <div>
                          <span className="text-[10px] uppercase font-bold opacity-50 block mb-0.5">
                            Official Signature
                          </span>
                          <SignatureDisplay
                            signatureUrl={selectedSubject.signatureDataUrl}
                            officerName={selectedSubject.officer || currentUser.name}
                            date={selectedSubject.signedDate}
                          />
                        </div>

                        {canEditSubject(selectedSubject) && (
                          <button
                            type="button"
                            onClick={() => setShowSignatureModal(true)}
                            className="px-3 py-1.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-1.5 shadow-2xs"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            {selectedSubject.signatureDataUrl ? 'Re-sign' : 'Sign Folio'}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CARD SLIP PREVIEW */}
          {activeTab === 'card_preview' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex justify-end gap-3 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Learner Card
                </button>
              </div>

              <ClearanceCardRenderer
                learner={{ ...learner, subjects: subjectsState }}
                settings={settings}
                showWatermark={true}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#1A1A1A]/10 flex items-center justify-between no-print">
          <div className="text-xs opacity-70">
            Current Status:{' '}
            <span
              className={`font-bold ${isFullyCleared ? 'text-emerald-700' : 'text-amber-700'}`}
            >
              {isFullyCleared
                ? '100% Fully Cleared'
                : `${clearedCount}/${subjectsState.length} Subjects Cleared`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:border-[#1A1A1A]"
            >
              Close
            </button>
            <button
              id="btn-save-learner-clearance"
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-6 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving to Database...' : 'Save & Sync to Firestore'}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Dialogs */}
      {showSignatureModal && (
        <SignaturePadModal
          currentUser={currentUser}
          currentSignature={selectedSubject?.signatureDataUrl || currentUser.signatureDataUrl}
          onSaveSignature={handleSaveSignature}
          onClose={() => setShowSignatureModal(false)}
        />
      )}

      {showPhotoProofModal && selectedSubject && (
        <PhotoProofCaptureModal
          learner={learner}
          subject={selectedSubject}
          currentUser={currentUser}
          onSaveProof={handleSavePhotoProof}
          onClose={() => setShowPhotoProofModal(false)}
        />
      )}

      {showPhotoViewerModal && selectedSubject && (
        <PhotoProofViewerModal
          learner={learner}
          subject={selectedSubject}
          onClose={() => setShowPhotoViewerModal(false)}
        />
      )}

      {showSubjectAssignmentModal && (
        <StudentSubjectAssignmentModal
          learner={{ ...learner, subjects: subjectsState }}
          allLearners={allLearners}
          onSaveSubjects={async (updatedLearner, applyToStream) => {
            setSubjectsState(updatedLearner.subjects);
            await onUpdateLearner(updatedLearner, applyToStream);
            setFeedback('Subject assignment updated successfully.');
            setTimeout(() => setFeedback(null), 3000);
          }}
          onClose={() => setShowSubjectAssignmentModal(false)}
        />
      )}
    </div>
  );
};

export default LearnerClearanceModal;
