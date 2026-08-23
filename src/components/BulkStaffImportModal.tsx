import React, { useState } from 'react';
import Papa from 'papaparse';
import { UserAccount, UserRole } from '../types';
import { DbService } from '../lib/dbService';
import { 
  Users, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  X, 
  UserCheck, 
  ShieldAlert, 
  BookOpen, 
  Trash2,
  Edit2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BulkStaffImportModalProps {
  currentUser: UserAccount;
  existingUsers: UserAccount[];
  onImportComplete: () => void;
  onClose: () => void;
}

export const BulkStaffImportModal: React.FC<BulkStaffImportModalProps> = ({
  currentUser,
  existingUsers,
  onImportComplete,
  onClose,
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [parsedStaff, setParsedStaff] = useState<UserAccount[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'preview'>('upload');

  // Compute initials from full name
  const computeInitials = (name: string): string => {
    const clean = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Rev\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'T';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Download official CSV template
  const handleDownloadSample = () => {
    const headers = [
      'Staff_Name',
      'Email',
      'Department',
      'Title',
      'Role',
      'Assigned_Subjects',
      'Phone'
    ];
    const sampleRows = [
      ['Mr. Isaac Okello', 'isaac.ict@vcs.ac.ug', 'ICT Department', 'Head of Computer Studies', 'teacher', 'ICT, Computer Studies', '+256772491802'],
      ['Mr. Peter Ocen', 'peter.math@vcs.ac.ug', 'Mathematics Dept', 'Senior Math Master', 'teacher', 'Mathematics, Pure Math', '+256701334119'],
      ['Ms. Jane Nabirye', 'jane.eng@vcs.ac.ug', 'Languages Dept', 'Head of English & Literature', 'teacher', 'English Language, Literature', '+256782990412'],
      ['Ms. Sarah Namubiru', 'sarah.bio@vcs.ac.ug', 'Biological Sciences', 'Biology & Health Sciences Lead', 'teacher', 'Biology', '+256752888231'],
      ['Dr. Musa Ssekandi', 'musa.chem@vcs.ac.ug', 'Physical Sciences', 'Chemistry Dept Head', 'teacher', 'Chemistry, Physics', '+256779123456'],
      ['Rev. David Mukasa', 'david.hum@vcs.ac.ug', 'Humanities Dept', 'Senior History & CRE Master', 'teacher', 'History, CRE, Geography', '+256782550491'],
      ['Mrs. Grace Babirye', 'directorate@vcs.ac.ug', 'Directorate of Studies', 'Deputy Academic Registrar', 'admin', 'ALL', '+256772999888'],
    ];

    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'VCS_Faculty_Staff_Bulk_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV / TSV text
  const processStaffCSV = (content: string) => {
    const errors: string[] = [];
    const results = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ''),
    });

    if (results.errors.length > 0) {
      errors.push(`CSV Format Note: ${results.errors[0].message}`);
    }

    const data = results.data as Record<string, string>[];
    if (!data || data.length === 0) {
      setValidationErrors(['No valid staff rows found. Please check your CSV format or paste valid data.']);
      return;
    }

    const existingEmails = new Set(existingUsers.map((u) => u.email?.toLowerCase().trim()));
    const seenEmailsInBatch = new Set<string>();
    const parsedList: UserAccount[] = [];

    data.forEach((row, idx) => {
      const name =
        row['staffname'] ||
        row['name'] ||
        row['fullname'] ||
        row['teachername'] ||
        row['officer'] ||
        `Staff Member ${idx + 1}`;

      const rawEmail =
        row['email'] ||
        row['mail'] ||
        row['emailaddress'] ||
        `staff_${idx + 1}_${Date.now().toString().slice(-4)}@victory.ac.ug`;
      const email = rawEmail.trim().toLowerCase();

      const department =
        row['department'] ||
        row['dept'] ||
        row['faculty'] ||
        'Academic Faculty';

      const title =
        row['title'] ||
        row['designation'] ||
        row['position'] ||
        'Subject Teacher';

      const roleRaw = (row['role'] || row['userrole'] || 'teacher').toLowerCase().trim();
      const role: UserRole = roleRaw.includes('admin') || roleRaw.includes('dean') || roleRaw.includes('director') ? 'admin' : 'teacher';

      const subjectsRaw =
        row['assignedsubjects'] ||
        row['subjects'] ||
        row['courses'] ||
        row['subject'] ||
        (role === 'admin' ? 'ALL' : 'General Subjects');

      // Parse subjects array (split by comma or semicolon)
      const assignedSubjects = subjectsRaw
        .split(/[,;/]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const phone = row['phone'] || row['contact'] || row['telephone'] || row['phonenumber'] || '';
      const customInitials = row['initials'] ? row['initials'].trim().toUpperCase() : computeInitials(name);

      if (seenEmailsInBatch.has(email)) {
        errors.push(`Row ${idx + 1}: Duplicate email "${email}" found in current batch.`);
      }
      seenEmailsInBatch.add(email);

      if (existingEmails.has(email)) {
        errors.push(`Row ${idx + 1}: Email "${email}" already registered. Record will be updated.`);
      }

      const idSafe = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      parsedList.push({
        id: idSafe,
        email,
        name: name.trim(),
        role,
        department: department.trim(),
        title: title.trim(),
        initials: customInitials,
        assignedSubjects: assignedSubjects.length > 0 ? assignedSubjects : ['General Subjects'],
        phone: phone.trim(),
        password: 'teach',
        createdAt: new Date().toISOString(),
      });
    });

    setParsedStaff(parsedList);
    setValidationErrors(errors);
    setActiveTab('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setCsvText(content);
      processStaffCSV(content);
    };
    reader.readAsText(file);
  };

  const handleRemoveStaffRow = (index: number) => {
    setParsedStaff((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleRole = (index: number) => {
    setParsedStaff((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, role: item.role === 'admin' ? 'teacher' : 'admin' } : item
      )
    );
  };

  const handleCommitStaffImport = async () => {
    if (parsedStaff.length === 0) return;
    setIsProcessing(true);
    try {
      await DbService.bulkImportStaff(parsedStaff, currentUser);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#7A1326', '#D4AF37', '#2563EB'],
        });
      } catch (_) {}

      onImportComplete();
      onClose();
    } catch (err) {
      console.error('Failed to import staff:', err);
      setValidationErrors([`Database commit error: ${(err as Error).message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-white border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-[#7A1326] text-[#F6D365] flex items-center justify-center font-bold shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#7A1326] bg-[#7A1326]/10 px-2 py-0.5 border border-[#7A1326]/20">
                  Faculty Roster Management
                </span>
                <span className="text-[9px] uppercase tracking-wider font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                  Firestore Synchronized
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1A1A1A] leading-tight">
                Bulk Import Academic Faculty & Teachers
              </h3>
              <p className="text-xs opacity-60">
                Batch-register subject teachers, department heads, and clearance officers into the VCS Directory.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center text-sm font-bold hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#1A1A1A]/10 bg-white px-6 gap-6 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'upload' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload CSV / Spreadsheet
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'paste' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste CSV or Excel Table
          </button>
          {parsedStaff.length > 0 && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'preview' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Preview & Verify ({parsedStaff.length} Faculty)
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <label className="border-2 border-dashed border-[#1A1A1A]/25 hover:border-[#7A1326] transition-colors p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-white group">
                <div className="w-14 h-14 rounded-full bg-[#7A1326]/10 text-[#7A1326] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="font-serif text-lg font-bold text-[#1A1A1A]">
                  Click to select or drag & drop Faculty CSV file
                </p>
                <p className="text-xs opacity-60 mt-1 max-w-md">
                  Accepts `.csv`, `.tsv`, or `.txt` containing teacher rosters with assigned subjects and departmental designations.
                </p>
                <input
                  id="staff-csv-file-input"
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Template Download Card */}
              <div className="p-4 bg-white border border-[#1A1A1A]/15 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#7A1326]" />
                    Official Victory College School Faculty Import Template
                  </p>
                  <p className="text-[11px] opacity-60 mt-0.5">
                    Includes formatted headers: Staff_Name, Email, Department, Title, Role, Assigned_Subjects, Phone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-4 py-2 bg-[#FAF8F5] border border-[#1A1A1A] text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center gap-2 shrink-0 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#7A1326]" />
                  Download Staff Template CSV
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60 block">
                Paste CSV or Excel Table Rows
              </label>
              <textarea
                id="staff-csv-raw-textarea"
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Staff_Name,Email,Department,Title,Role,Assigned_Subjects,Phone&#10;Mr. Isaac Okello,isaac.ict@vcs.ac.ug,ICT Department,Head of ICT,teacher,ICT; Computer Studies,+256772000000&#10;Dr. Musa Ssekandi,musa.chem@vcs.ac.ug,Physical Sciences,Senior Master,teacher,Chemistry; Physics,+256701000000"
                className="w-full p-4 font-mono text-xs bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#7A1326]"
              ></textarea>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => processStaffCSV(csvText)}
                  disabled={!csvText.trim()}
                  className="px-6 py-2.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] disabled:opacity-40 shadow-xs"
                >
                  Parse & Verify Faculty List
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREVIEW & VERIFY */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {validationErrors.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Roster Ingestion Notes ({validationErrors.length})
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 opacity-80 max-h-24 overflow-y-auto">
                    {validationErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li>...and {validationErrors.length - 5} more notes.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Roster Table */}
              <div className="bg-white border border-[#1A1A1A]/15 shadow-2xs overflow-x-auto max-h-80">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F5] border-b border-[#1A1A1A]/10 font-bold uppercase text-[9px] tracking-wider text-[#7A1326]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Faculty Officer</th>
                      <th className="p-3">Department & Title</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Assigned Clearance Subjects</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/10">
                    {parsedStaff.map((user, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        <td className="p-3 font-mono opacity-50">{idx + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#7A1326] text-white flex items-center justify-center text-xs font-bold font-serif">
                              {user.initials}
                            </div>
                            <div>
                              <p className="font-serif font-bold text-sm text-[#1A1A1A] leading-tight">
                                {user.name}
                              </p>
                              <p className="font-mono text-[10px] opacity-60">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-[#1A1A1A]">{user.department}</p>
                          <p className="text-[10px] opacity-60">{user.title}</p>
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleRole(idx)}
                            title="Click to toggle between Admin and Teacher"
                            className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider border cursor-pointer ${
                              user.role === 'admin'
                                ? 'bg-[#D4AF37] text-[#5B0B19] border-[#B89628]'
                                : 'bg-blue-50 text-blue-900 border-blue-200'
                            }`}
                          >
                            {user.role === 'admin' ? '👑 Admin' : '📚 Teacher'}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {user.assignedSubjects.map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[9px] font-mono font-semibold bg-[#FAF8F5] border border-[#1A1A1A]/15 px-1.5 py-0.5"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] opacity-70">{user.phone || '—'}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveStaffRow(idx)}
                            className="p-1 text-rose-700 hover:bg-rose-50 rounded"
                            title="Remove this staff member from import"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="text-xs opacity-70 font-mono">
            {parsedStaff.length > 0
              ? `Ready to register: ${parsedStaff.length} faculty officers`
              : 'Select a CSV file to begin'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:border-[#1A1A1A]"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-bulk-staff-import"
              type="button"
              onClick={handleCommitStaffImport}
              disabled={parsedStaff.length === 0 || isProcessing}
              className="px-6 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-md disabled:opacity-40"
            >
              {isProcessing ? (
                <>Registering Faculty in Firestore...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#F6D365]" />
                  Commit {parsedStaff.length} Teachers to Directory
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
