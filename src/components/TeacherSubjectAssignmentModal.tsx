import React, { useState } from 'react';
import { UserAccount } from '../types';
import { MASTER_SUBJECT_CATALOG } from '../data/subjectCatalog';
import { UserCheck, Shield, Check, X, PenTool, BookOpen, Layers } from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';
import { SignatureDisplay } from './SignatureDisplay';

interface TeacherSubjectAssignmentModalProps {
  teacher: UserAccount;
  onSaveTeacher: (updatedTeacher: UserAccount) => Promise<void>;
  onClose: () => void;
}

export const TeacherSubjectAssignmentModal: React.FC<TeacherSubjectAssignmentModalProps> = ({
  teacher,
  onSaveTeacher,
  onClose,
}) => {
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>(
    teacher.assignedSubjects || []
  );
  const [name, setName] = useState(teacher.name);
  const [department, setDepartment] = useState(teacher.department);
  const [title, setTitle] = useState(teacher.title);
  const [role, setRole] = useState(teacher.role);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>(
    teacher.signatureDataUrl
  );
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasAllScope = assignedSubjects.includes('ALL');

  // Toggle subject assignment
  const handleToggleSubject = (subjectName: string) => {
    if (subjectName === 'ALL') {
      if (hasAllScope) {
        setAssignedSubjects([]);
      } else {
        setAssignedSubjects(['ALL']);
      }
      return;
    }

    setAssignedSubjects((prev) => {
      const filtered = prev.filter((s) => s !== 'ALL');
      if (filtered.includes(subjectName)) {
        return filtered.filter((s) => s !== subjectName);
      } else {
        return [...filtered, subjectName];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: UserAccount = {
        ...teacher,
        name,
        department,
        title,
        role,
        assignedSubjects,
        signatureDataUrl,
      };
      await onSaveTeacher(updated);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white p-5 border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7A1326]/10 text-[#7A1326] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-[#1A1A1A]">
                Faculty Profile & Subject Assignment
              </h3>
              <p className="text-xs opacity-60">
                Configure authorized academic departments and clearance jurisdictions for {teacher.name}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 border border-[#1A1A1A]/10 text-xs">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                Academic Title / Position
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                System Role & Clearance Permission
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'teacher')}
                className="w-full p-2 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
              >
                <option value="teacher">Faculty Member / Subject Teacher</option>
                <option value="admin">Administrator / Dean of Studies</option>
              </select>
            </div>
          </div>

          {/* Officer Digital Signature Setup */}
          <div className="bg-white p-4 border border-[#1A1A1A]/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">Officer Digital Signature Sign-off</p>
                <p className="text-[10px] opacity-60">
                  Applied automatically on clearance folios and printable candidate slips.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSignaturePad(true)}
                className="px-3 py-1.5 bg-[#7A1326]/10 text-[#7A1326] hover:bg-[#7A1326] hover:text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <PenTool className="w-3.5 h-3.5" />
                {signatureDataUrl ? 'Update Signature' : 'Configure Signature'}
              </button>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#1A1A1A]/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold opacity-50 block">Current Signature Stamp:</span>
                <SignatureDisplay
                  signatureUrl={signatureDataUrl}
                  officerName={name}
                  date={new Date().toLocaleDateString('en-GB')}
                />
              </div>
              {signatureDataUrl && (
                <button
                  type="button"
                  onClick={() => setSignatureDataUrl(undefined)}
                  className="text-rose-600 hover:text-rose-800 text-[10px] font-bold uppercase"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Assigned Subjects Matrix */}
          <div className="bg-white p-4 border border-[#1A1A1A]/10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">Authorized Clearance Subjects</p>
                <p className="text-[10px] opacity-60">
                  Select which subjects this teacher has jurisdiction to verify and sign off.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleSubject('ALL')}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-all ${
                  hasAllScope
                    ? 'bg-[#D4AF37] text-[#5B0B19] border-[#D4AF37]'
                    : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#7A1326]'
                }`}
              >
                {hasAllScope ? '★ Universal Clearance (ALL)' : 'Grant Universal Clearance'}
              </button>
            </div>

            {hasAllScope ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#7A1326] shrink-0" />
                <span>
                  This officer has <strong>Universal Academic Clearance</strong> permission and can clear any subject across all departments.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto">
                {MASTER_SUBJECT_CATALOG.map((catSub) => {
                  const isAssigned =
                    assignedSubjects.includes(catSub.name) ||
                    assignedSubjects.some((s) => s.toLowerCase() === catSub.name.toLowerCase());
                  return (
                    <button
                      key={catSub.id}
                      type="button"
                      onClick={() => handleToggleSubject(catSub.name)}
                      className={`p-2.5 text-left border transition-all flex items-center justify-between text-xs ${
                        isAssigned
                          ? 'border-[#7A1326] bg-[#7A1326]/5 font-bold text-[#7A1326]'
                          : 'border-[#1A1A1A]/10 bg-[#FAF8F5] text-[#1A1A1A]/80 hover:border-[#1A1A1A]/30'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-mono text-[9px] block opacity-70">{catSub.code}</span>
                        <span className="truncate">{catSub.name}</span>
                      </div>
                      {isAssigned && <Check className="w-3.5 h-3.5 text-[#7A1326] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
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
            disabled={isSaving}
            className="px-6 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-md disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            {isSaving ? 'Saving Changes...' : 'Save Faculty Profile'}
          </button>
        </div>
      </div>

      {/* Signature Pad Modal Sub-dialog */}
      {showSignaturePad && (
        <SignaturePadModal
          currentUser={teacher}
          currentSignature={signatureDataUrl}
          onSaveSignature={(sigUrl) => {
            setSignatureDataUrl(sigUrl);
          }}
          onClose={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
};

export default TeacherSubjectAssignmentModal;
