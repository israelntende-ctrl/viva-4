import React, { useState } from 'react';
import Papa from 'papaparse';
import { Learner, UserAccount } from '../types';
import { createDefaultSubjects, DbService } from '../lib/dbService';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, FileText, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BulkImportModalProps {
  currentUser: UserAccount;
  officers: UserAccount[];
  existingLearners: Learner[];
  onImportComplete: () => void;
  onClose: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  currentUser,
  officers,
  existingLearners,
  onImportComplete,
  onClose,
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [parsedLearners, setParsedLearners] = useState<Learner[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'preview'>('upload');

  // Sample CSV format generator
  const handleDownloadSample = () => {
    const headers = ['Registration_Number', 'Full_Name', 'Class', 'Stream', 'House', 'Gender', 'Guardian_Phone'];
    const sampleRows = [
      ['VCS101', 'Samuel Kizza', 'S4', 'A', 'Lumumba House', 'M', '+256772111222'],
      ['VCS102', 'Amina Nakate', 'S4', 'A', 'Kabaleega House', 'F', '+256701333444'],
      ['VCS103', 'Brian Mugume', 'S4', 'B', 'Mwanga House', 'M', '+256782555666'],
      ['VCS104', 'Deborah Namutebi', 'S4', 'B', 'Kaggwa House', 'F', '+256752777888'],
      ['VCS105', 'Emmanuel Byaruhanga', 'S4', 'C', 'Lumumba House', 'M', '+256779999000'],
    ];

    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'VCS_Learners_Bulk_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse raw text or file
  const processCSV = (content: string) => {
    const errors: string[] = [];
    const results = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ''),
    });

    if (results.errors.length > 0) {
      errors.push(`CSV Syntax Warning: ${results.errors[0].message}`);
    }

    const data = results.data as Record<string, string>[];
    if (!data || data.length === 0) {
      setValidationErrors(['No readable records found in the provided CSV content.']);
      return;
    }

    const existingRegSet = new Set(existingLearners.map((l) => l.regNo.toUpperCase()));
    const seenRegInBatch = new Set<string>();

    const generatedLearners: Learner[] = [];

    data.forEach((row, idx) => {
      // Find reg number key
      const regNoRaw =
        row['registrationnumber'] ||
        row['regno'] ||
        row['reg'] ||
        row['registration'] ||
        row['studentno'] ||
        row['id'] ||
        `VCS${Date.now().toString().slice(-4)}${idx}`;

      const regNo = regNoRaw.trim().toUpperCase();

      // Find student name key
      const name =
        row['fullname'] ||
        row['name'] ||
        row['studentname'] ||
        row['learnername'] ||
        `Student ${idx + 1}`;

      const className = row['class'] || row['grade'] || 'S4';
      const stream = row['stream'] || row['section'] || 'A';
      const house = row['house'] || row['dormitory'] || 'Lumumba House';
      const gender = (row['gender'] || row['sex'] || 'M').toUpperCase().startsWith('F') ? 'F' : 'M';
      const phone = row['guardianphone'] || row['parentphone'] || row['guardiancontact'] || row['phone'] || '';

      if (seenRegInBatch.has(regNo)) {
        errors.push(`Row ${idx + 1}: Duplicate Reg No "${regNo}" within this import batch.`);
      }
      seenRegInBatch.add(regNo);

      if (existingRegSet.has(regNo)) {
        errors.push(`Row ${idx + 1}: Reg No "${regNo}" already exists in the database and will be updated.`);
      }

      generatedLearners.push({
        id: `lrn_import_${regNo.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
        regNo,
        name: name.trim(),
        class: className.trim(),
        stream: stream.trim(),
        house: house.trim(),
        gender,
        guardianContact: phone.trim(),
        feesStatus: 'cleared',
        academicYear: '2026',
        term: 'Term II',
        subjects: createDefaultSubjects(officers),
      });
    });

    setParsedLearners(generatedLearners);
    setValidationErrors(errors);
    setActiveTab('preview');
  };

  // Handle file drop/upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setCsvText(content);
      processCSV(content);
    };
    reader.readAsText(file);
  };

  // Commit batch to Firestore
  const handleCommitImport = async () => {
    if (parsedLearners.length === 0) return;
    setIsProcessing(true);
    try {
      await DbService.bulkImportLearners(parsedLearners, currentUser);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7A1326', '#D4AF37', '#1A1A1A'],
        });
      } catch (_) {}

      onImportComplete();
      onClose();
    } catch (err) {
      console.error('Failed to import:', err);
      setValidationErrors([`Database write failed: ${(err as Error).message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#F9F8F6] border-2 border-[#1A1A1A] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-white border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7A1326] text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                Bulk Import Learners
              </h3>
              <p className="text-xs opacity-60">
                Upload CSV spreadsheet to batch-register student cohorts into the Firestore database.
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

        {/* Tab Headers */}
        <div className="flex border-b border-[#1A1A1A]/10 bg-white px-6 gap-6 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'upload' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            File Upload
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'paste' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste CSV / Excel Text
          </button>
          {parsedLearners.length > 0 && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'preview' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Preview & Validate ({parsedLearners.length})
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Drag Drop Area */}
              <label className="border-2 border-dashed border-[#1A1A1A]/30 hover:border-[#7A1326] transition-colors p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-white">
                <Upload className="w-10 h-10 text-[#7A1326] mb-3" />
                <p className="font-serif text-lg font-bold text-[#1A1A1A]">
                  Click to select or drag & drop CSV file
                </p>
                <p className="text-xs opacity-60 mt-1 max-w-sm">
                  Accepts comma-delimited (.csv) or tab-delimited spreadsheets exported from Excel or Google Sheets.
                </p>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Sample Template Download Bar */}
              <div className="p-4 bg-white border border-[#1A1A1A]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Need the official spreadsheet template?</p>
                  <p className="text-[11px] opacity-60">Includes required column headers: Registration_Number, Full_Name, Class, Stream, House, Guardian_Phone.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-4 py-2 border border-[#1A1A1A] text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center gap-2 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60 block">
                Paste Raw CSV or Tab-Separated Data
              </label>
              <textarea
                id="csv-raw-textarea"
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Registration_Number,Full_Name,Class,Stream,House,Guardian_Phone&#10;VCS201,John Baptist,S4,A,Lumumba,+256772000000&#10;VCS202,Mary Josephine,S4,B,Kabaleega,+256701000000"
                className="w-full p-4 font-mono text-xs bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#7A1326]"
              ></textarea>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => processCSV(csvText)}
                  disabled={!csvText.trim()}
                  className="px-6 py-2.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] disabled:opacity-40"
                >
                  Parse & Preview Data
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREVIEW & VALIDATION */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Validation warnings banner */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Validation Notes ({validationErrors.length})
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

              {/* Parsed List Table */}
              <div className="bg-white border border-[#1A1A1A]/10 overflow-x-auto max-h-72">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F9F8F6] border-b border-[#1A1A1A]/10 font-bold uppercase text-[9px] tracking-wider opacity-60">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Reg No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Class & Stream</th>
                      <th className="p-3">House</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Subjects Assigned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/10">
                    {parsedLearners.map((lrn, idx) => (
                      <tr key={idx} className="hover:bg-[#F9F8F6]/50">
                        <td className="p-3 font-mono opacity-50">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-[#7A1326]">{lrn.regNo}</td>
                        <td className="p-3 font-serif font-bold text-sm">{lrn.name}</td>
                        <td className="p-3">{lrn.class} {lrn.stream}</td>
                        <td className="p-3 opacity-70">{lrn.house}</td>
                        <td className="p-3 font-mono text-[11px] opacity-60">{lrn.guardianContact || '—'}</td>
                        <td className="p-3 text-[10px] uppercase font-bold text-emerald-700">
                          {lrn.subjects.length} Core Subjects
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="text-xs opacity-70 font-mono">
            {parsedLearners.length > 0
              ? `Ready to import: ${parsedLearners.length} students`
              : 'No file processed yet'}
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
              id="btn-confirm-bulk-import"
              type="button"
              onClick={handleCommitImport}
              disabled={parsedLearners.length === 0 || isProcessing}
              className="px-6 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-md disabled:opacity-40"
            >
              {isProcessing ? (
                <>Importing to Database...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Commit {parsedLearners.length} Students to Database
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
