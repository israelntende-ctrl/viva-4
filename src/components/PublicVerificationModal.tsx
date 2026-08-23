import React, { useState } from 'react';
import { Learner, SchoolSettings } from '../types';
import { DbService } from '../lib/dbService';
import { generateVerificationSeal } from '../lib/security';
import { VivaBadge } from './VivaBadge';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileCheck2, 
  Award, 
  X, 
  QrCode, 
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';

interface PublicVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  learners: Learner[];
  settings: SchoolSettings;
  initialRegNo?: string;
}

export const PublicVerificationModal: React.FC<PublicVerificationModalProps> = ({
  isOpen,
  onClose,
  learners,
  settings,
  initialRegNo = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialRegNo);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedCandidate, setSearchedCandidate] = useState<Learner | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [verificationSeal, setVerificationSeal] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchedCandidate(null);
    setVerificationSeal(null);

    try {
      // Look up locally first or query Firestore
      const clean = searchQuery.trim().toUpperCase();
      let found: Learner | null = learners.find((l) => l.regNo.toUpperCase() === clean || l.id === clean) || null;
      if (!found) {
        found = await DbService.verifyPublicCertificate(searchQuery);
      }

      if (found) {
        setSearchedCandidate(found);
        const seal = await generateVerificationSeal(found.regNo, found.name, settings.academicYear);
        setVerificationSeal(seal);
      }
    } catch (err) {
      console.warn('Verification search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const isFullyCleared = searchedCandidate?.subjects.every((s) => s.status === 'cleared');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FBFBFA] border-2 border-[#1A1A1A] w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#5B0B19] via-[#7A1326] to-[#5B0B19] text-white flex items-center justify-between border-b-2 border-[#D4AF37]">
          <div className="flex items-center gap-3">
            <VivaBadge size="sm" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#F6D365] font-bold">
                Directorate of Academic Standards • Jinja
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Official Clearance Certificate Verification
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

        {/* Search input form */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block">
              Enter Candidate Registration Number or Scan ID (e.g. VCS001)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 opacity-40" />
                <input
                  type="text"
                  required
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Student Reg No (e.g. VCS001, VCS002...)"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-mono uppercase font-bold focus:outline-none focus:border-[#7A1326]"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSearching ? 'Verifying...' : 'Verify Status'}
              </button>
            </div>
          </form>

          {/* Quick Examples */}
          {!hasSearched && (
            <div className="bg-white p-4 border border-[#1A1A1A]/10 text-xs space-y-2">
              <p className="font-bold text-[11px] uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#7A1326]" />
                Public Anti-Forgery Verification Portal
              </p>
              <p className="text-gray-600 text-[11px]">
                This portal allows UNEB examination invigilators, school security officers, and parents to verify the genuine clearance status of candidate cards in real-time.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-bold opacity-60">Try candidate samples:</span>
                {learners.slice(0, 3).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(l.regNo);
                    }}
                    className="text-[10px] bg-gray-100 hover:bg-[#7A1326] hover:text-white px-2 py-0.5 rounded font-mono font-bold transition-colors"
                  >
                    {l.regNo} ({l.name.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Display */}
          {hasSearched && !searchedCandidate && (
            <div className="p-6 bg-red-50 border border-red-200 text-red-900 rounded text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="font-bold text-sm">No Official Clearance Record Found</p>
              <p className="text-xs text-red-700">
                The registration number <span className="font-mono font-bold">{searchQuery}</span> was not found in the Victory College School official database for {settings.academicYear}.
              </p>
            </div>
          )}

          {searchedCandidate && (
            <div className="bg-white border-2 border-[#1A1A1A] p-5 space-y-4 relative overflow-hidden">
              {/* Status Ribbon */}
              <div className="flex items-center justify-between border-b-2 border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                    isFullyCleared ? 'bg-emerald-700' : 'bg-amber-600'
                  }`}>
                    {isFullyCleared ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#7A1326] text-white rounded">
                        {searchedCandidate.regNo}
                      </span>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        isFullyCleared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isFullyCleared ? 'OFFICIALLY CLEARED FOR EXAMINATIONS' : 'CLEARANCE PENDING / INCOMPLETE'}
                      </span>
                    </div>
                    <h4 className="font-serif text-lg font-bold text-[#1A1A1A] mt-1">
                      {searchedCandidate.name}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Student Metadata Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F9F8F6] p-3 text-xs border border-gray-200">
                <div>
                  <span className="text-[10px] opacity-60 uppercase font-bold block">Class & Stream</span>
                  <span className="font-bold">{searchedCandidate.class} • {searchedCandidate.stream}</span>
                </div>
                <div>
                  <span className="text-[10px] opacity-60 uppercase font-bold block">House</span>
                  <span className="font-bold">{searchedCandidate.house || 'Lumumba'}</span>
                </div>
                <div>
                  <span className="text-[10px] opacity-60 uppercase font-bold block">Academic Term</span>
                  <span className="font-bold">{settings.term}</span>
                </div>
                <div>
                  <span className="text-[10px] opacity-60 uppercase font-bold block">Academic Year</span>
                  <span className="font-bold">{settings.academicYear}</span>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                  Subject & Notes Clearance Status Breakdown
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchedCandidate.subjects.map((sub) => (
                    <div
                      key={sub.id}
                      className={`p-2.5 border text-xs flex items-center justify-between ${
                        sub.status === 'cleared'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{sub.name}</p>
                        <p className="text-[10px] opacity-60">Officer: {sub.officer || 'Pending'}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        sub.status === 'cleared' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Seal */}
              {verificationSeal && (
                <div className="p-3 bg-[#7A1326]/5 border border-[#7A1326]/20 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#7A1326]" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#7A1326]">
                        Cryptographic Anti-Forgery Verification Seal
                      </p>
                      <p className="font-mono text-xs font-bold text-gray-800">
                        {verificationSeal}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Authentic
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
