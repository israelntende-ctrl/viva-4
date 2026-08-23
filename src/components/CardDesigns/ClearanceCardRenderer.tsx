import React from 'react';
import { Learner, SchoolSettings, CardDesignTemplate, RandomizedStyleConfig } from '../../types';
import { VivaBadge } from '../VivaBadge';
import { SignatureDisplay } from '../SignatureDisplay';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Award, Camera } from 'lucide-react';

interface ClearanceCardRendererProps {
  learner: Learner;
  settings: SchoolSettings;
  mode?: 'preview' | 'print-full' | 'print-half' | 'print-quarter';
  overrideTemplate?: CardDesignTemplate;
  showWatermark?: boolean;
}

export const ClearanceCardRenderer: React.FC<ClearanceCardRendererProps> = ({
  learner,
  settings,
  mode = 'preview',
  overrideTemplate,
  showWatermark = true,
}) => {
  const activeTemplate = overrideTemplate || settings.activeCardDesign || 'viva-crimson';
  const total = learner.subjects.length;
  const cleared = learner.subjects.filter((s) => s.status === 'cleared').length;
  const percentage = total > 0 ? Math.round((cleared / total) * 100) : 0;
  const isFullyCleared = percentage === 100;

  // 1. TEMPLATE: VIVA CRIMSON (Flagship School Brand)
  if (activeTemplate === 'viva-crimson') {
    return (
      <div className="relative bg-white border-2 border-[#7A1326] p-6 sm:p-7 overflow-hidden shadow-sm flex flex-col justify-between text-[#1A1A1A]">
        {/* Background Watermark Crest */}
        {showWatermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none">
            <VivaBadge size="hero" watermark />
          </div>
        )}

        {/* Top Crimson Header Banner */}
        <div className="relative z-10 -mx-6 sm:-mx-7 -mt-6 sm:-mt-7 mb-5 bg-gradient-to-r from-[#5B0B19] via-[#7A1326] to-[#5B0B19] text-white p-4 px-6 border-b-2 border-[#D4AF37] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VivaBadge size="sm" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#F6D365] font-bold">
                Victory College School
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Learner Notes Clearance Card
              </h3>
              <p className="text-[8px] uppercase tracking-widest text-white/70">
                {settings.schoolMotto || 'Knowledge • Virtue • Service'}
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="inline-block bg-black/40 border border-[#D4AF37]/50 text-[#F6D365] text-[9px] font-mono uppercase px-2.5 py-1 font-bold">
              {settings.academicYear || '2026'} • {settings.term || 'Term II'}
            </span>
          </div>
        </div>

        {/* Learner Information Bar */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#FAF8F5] border border-[#7A1326]/20 mb-5 text-[11px]">
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-[#7A1326] font-bold">Student Name</span>
            <span className="font-serif font-bold text-sm text-[#1A1A1A] block truncate">{learner.name}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-[#7A1326] font-bold">Registration No</span>
            <span className="font-mono font-bold text-xs">{learner.regNo}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-[#7A1326] font-bold">Class & Stream</span>
            <span className="font-semibold text-xs">{learner.class} {learner.stream}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-[#7A1326] font-bold">House / Dorm</span>
            <span className="font-semibold text-xs truncate">{learner.house || 'Lumumba'}</span>
          </div>
        </div>

        {/* Subjects Clearance Matrix */}
        <div className="relative z-10 mb-5 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b-2 border-[#7A1326] bg-[#7A1326]/5">
              <tr className="text-left text-[#7A1326] font-bold uppercase text-[9px] tracking-wider">
                <th className="py-2 px-2">Subject / Code</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2 text-right">Verifying Officer & Signature</th>
                <th className="py-2 px-2 text-right">Sign Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7A1326]/10 font-medium">
              {learner.subjects.map((sub) => (
                <tr key={sub.id} className={sub.status === 'pending' ? 'opacity-60 italic' : ''}>
                  <td className="py-2 px-2 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-[#7A1326] font-bold">{sub.code}</span>
                      <span>{sub.name}</span>
                      {sub.photoProofUrl && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2" title="Photographic exercise book proof attached">
                          <Camera className="w-2.5 h-2.5" /> Proof
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    {sub.status === 'cleared' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-[9px] tracking-wider bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CLEARED
                      </span>
                    ) : sub.status === 'not_cleared' ? (
                      <span className="inline-flex items-center gap-1 text-rose-800 font-bold text-[9px] tracking-wider bg-rose-50 px-2 py-0.5 border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" /> NOT CLEARED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-800 font-semibold text-[9px] tracking-wider bg-amber-50 px-2 py-0.5 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" /> PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-2 text-right">
                    {sub.status === 'cleared' ? (
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <SignatureDisplay
                          signatureUrl={sub.signatureDataUrl}
                          officerName={sub.officer}
                          className="scale-90 origin-right"
                        />
                      </div>
                    ) : (
                      <span className="font-mono text-[10px] text-[#1A1A1A]/40">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-[10px] opacity-70">
                    {sub.signedDate || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Seal & Sign-off */}
        <div className="relative z-10 pt-4 border-t-2 border-[#7A1326] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Circular Stamp */}
            <div className={`w-28 h-28 border-2 rounded-full flex flex-col items-center justify-center p-2 text-center transition-all ${
              isFullyCleared 
                ? 'border-[#7A1326] text-[#7A1326] bg-[#7A1326]/5 rotate-[-6deg]'
                : 'border-black/20 text-black/30 rotate-[-10deg]'
            }`}>
              <ShieldCheck className="w-5 h-5 mb-0.5 opacity-90" />
              <p className="text-[7px] font-black uppercase tracking-tight leading-none">VCS ACADEMIC DEPT</p>
              <p className="text-[8px] font-black uppercase tracking-wider mt-0.5 text-[#7A1326]">
                {isFullyCleared ? '★ CLEARED ★' : 'INCOMPLETE'}
              </p>
              <p className="text-[6px] opacity-75 font-mono">SEAL 2026</p>
            </div>

            <div className="text-[10px] space-y-0.5">
              <p className="font-bold text-[#7A1326] uppercase tracking-wider">Dean of Studies Signature</p>
              <div className="w-36 h-8 border-b border-dashed border-[#1A1A1A]/40 flex items-end">
                <SignatureDisplay
                  signatureUrl={settings.deanSignatureUrl}
                  officerName="I. Ntende"
                  color="#7A1326"
                />
              </div>
              <p className="text-[8px] opacity-50">Authorized School Clearance Stamp</p>
            </div>
          </div>

          <div className="text-right text-[9px] uppercase tracking-widest opacity-60 font-mono">
            <p className="font-bold text-[#1A1A1A]">Card Ref: VCS-CLR-{learner.regNo}</p>
            <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="text-emerald-700 font-bold">{percentage}% Completed</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. TEMPLATE: EDITORIAL HERITAGE (Vintage Classic)
  if (activeTemplate === 'editorial-heritage') {
    return (
      <div className="relative bg-[#FBF9F5] border-[3px] border-double border-[#1A1A1A] p-7 sm:p-8 flex flex-col justify-between text-[#1A1A1A] shadow-xs">
        {showWatermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
            <VivaBadge size="hero" watermark />
          </div>
        )}

        <div className="relative z-10 border-b-2 border-[#1A1A1A] pb-5 mb-5 text-center">
          <div className="flex justify-center mb-2">
            <VivaBadge size="sm" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.35em] font-serif italic text-[#1A1A1A]/70 mb-1">
            Victory College School • Academic Verification
          </p>
          <h3 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight">
            Notes Clearance Certificate
          </h3>
          <p className="text-[9px] uppercase tracking-[0.2em] font-semibold opacity-60 mt-1">
            Academic Session {settings.academicYear || '2026'} — {settings.term || 'Term II'}
          </p>
        </div>

        {/* Student Meta */}
        <div className="relative z-10 space-y-2 mb-5 text-xs">
          <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1">
            <span className="opacity-50 uppercase text-[10px] tracking-wider font-semibold">Full Learner Name</span>
            <span className="font-serif font-bold text-sm">{learner.name}</span>
          </div>
          <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1">
            <span className="opacity-50 uppercase text-[10px] tracking-wider font-semibold">Registration Number</span>
            <span className="font-mono font-bold">{learner.regNo}</span>
          </div>
          <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1">
            <span className="opacity-50 uppercase text-[10px] tracking-wider font-semibold">Class Cohort & Stream</span>
            <span className="font-semibold">{learner.class} {learner.stream} ({learner.house})</span>
          </div>
        </div>

        {/* Subjects */}
        <div className="relative z-10 mb-5 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-[#1A1A1A]">
              <tr className="text-left opacity-60 uppercase text-[9px] tracking-wider">
                <th className="py-2">Subject Course</th>
                <th className="py-2">Verdict</th>
                <th className="py-2 text-right">Head of Subject & Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/10 font-medium">
              {learner.subjects.map((sub) => (
                <tr key={sub.id} className={sub.status === 'pending' ? 'opacity-40 italic' : ''}>
                  <td className="py-2 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] opacity-50">{sub.code}</span>
                      <span>{sub.name}</span>
                      {sub.photoProofUrl && (
                        <span className="text-[8px] bg-black/5 px-1 py-0.2 border border-black/10">📷 Verified</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2">
                    {sub.status === 'cleared' ? (
                      <span className="text-emerald-800 font-bold text-[10px] tracking-wider">★ CLEARED</span>
                    ) : sub.status === 'not_cleared' ? (
                      <span className="text-rose-700 font-bold text-[10px] tracking-wider">✕ NOT CLEARED</span>
                    ) : (
                      <span className="text-amber-700 font-semibold text-[10px] tracking-wider">⏳ PENDING</span>
                    )}
                  </td>
                  <td className="py-1 text-right">
                    {sub.status === 'cleared' ? (
                      <SignatureDisplay
                        signatureUrl={sub.signatureDataUrl}
                        officerName={sub.officer}
                        color="#1A1A1A"
                        className="scale-85 origin-right"
                      />
                    ) : (
                      <span className="font-mono text-[10px] opacity-40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Seal Section */}
        <div className="relative z-10 pt-5 border-t-2 border-dashed border-[#1A1A1A] flex items-center justify-between">
          <div className="w-28 h-28 border-4 border-[#1A1A1A]/30 rounded-full flex flex-col items-center justify-center text-center rotate-[-12deg] p-1">
            <p className="text-[7px] font-black uppercase tracking-tight text-[#1A1A1A]/50">VICTORY COLLEGE</p>
            <p className="text-[8px] font-black uppercase tracking-wider text-[#1A1A1A] mt-0.5">
              {isFullyCleared ? 'DISCITE JUSTITIAM' : 'SUBJECT TO AUDIT'}
            </p>
            <p className="text-[6px] font-mono opacity-50">FINAL VERIFICATION</p>
          </div>

          <div className="text-right text-[9px] uppercase tracking-widest opacity-60 font-mono space-y-1">
            <p>Official Record Ref: {learner.regNo}/2026</p>
            <p>Status: {isFullyCleared ? '100% Cleared for Exams' : `${cleared}/${total} Subjects Cleared`}</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. TEMPLATE: ROYAL PARCHMENT (Ornate Diploma Style)
  if (activeTemplate === 'royal-parchment') {
    return (
      <div className="relative bg-[#FFFDF9] border-4 border-[#B45309] p-6 sm:p-8 flex flex-col justify-between text-[#1A1A1A] shadow-md">
        {/* Ornate Corner Elements */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#B45309]"></div>
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#B45309]"></div>
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#B45309]"></div>
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#B45309]"></div>

        <div className="relative z-10 text-center border-b border-[#B45309]/30 pb-4 mb-4">
          <div className="flex justify-center mb-2">
            <VivaBadge size="md" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#78350F]">
            Victory College School
          </h2>
          <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#92400E] mt-0.5">
            Certificate of Subject & Notes Clearance
          </p>
        </div>

        <div className="relative z-10 bg-[#FEF3C7]/20 border border-[#B45309]/20 p-3 mb-4 text-xs grid grid-cols-2 gap-2">
          <div>
            <span className="text-[9px] uppercase text-[#92400E] font-bold block">Learner Name:</span>
            <span className="font-serif font-bold text-sm">{learner.name}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase text-[#92400E] font-bold block">Registration:</span>
            <span className="font-mono font-bold text-xs">{learner.regNo} ({learner.class} {learner.stream})</span>
          </div>
        </div>

        <div className="relative z-10 mb-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#B45309]/10 text-[#78350F] font-bold text-[9px] uppercase tracking-wider">
              <tr>
                <th className="py-1.5 px-2 text-left">Subject Code</th>
                <th className="py-1.5 px-2 text-left">Course Name</th>
                <th className="py-1.5 px-2 text-center">Status</th>
                <th className="py-1.5 px-2 text-right">Officer Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B45309]/10">
              {learner.subjects.map((sub) => (
                <tr key={sub.id}>
                  <td className="py-1.5 px-2 font-mono text-[10px] font-bold text-[#92400E]">{sub.code}</td>
                  <td className="py-1.5 px-2 font-medium">
                    {sub.name}
                    {sub.photoProofUrl && <span className="ml-1 text-[8px] opacity-70">📷</span>}
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold text-[9px]">
                    {sub.status === 'cleared' ? (
                      <span className="text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-xs">CLEARED</span>
                    ) : (
                      <span className="text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded-xs">{sub.status.toUpperCase()}</span>
                    )}
                  </td>
                  <td className="py-1 px-2 text-right">
                    {sub.status === 'cleared' ? (
                      <SignatureDisplay
                        signatureUrl={sub.signatureDataUrl}
                        officerName={sub.officer}
                        color="#92400E"
                        className="scale-85 origin-right"
                      />
                    ) : (
                      <span className="font-mono text-[9px] opacity-40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relative z-10 pt-3 border-t border-[#B45309]/30 flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-2">
            <div className="w-20 h-20 rounded-full border-2 border-[#B45309] bg-[#FFFBEB] flex flex-col items-center justify-center text-center p-1 rotate-[-5deg]">
              <Award className="w-5 h-5 text-[#B45309]" />
              <p className="text-[6px] font-bold text-[#78350F]">ROYAL SEAL</p>
              <p className="text-[7px] font-black text-[#B45309]">{isFullyCleared ? 'VALID' : 'PENDING'}</p>
            </div>
            <div>
              <p className="font-serif italic font-bold text-xs text-[#78350F]">VCS Academic Board</p>
              <p className="text-[8px] opacity-60">Verified Official Transcript</p>
            </div>
          </div>
          <div className="text-right font-mono opacity-60">
            <p>Term II • 2026</p>
            <p>ID: {learner.id}</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. TEMPLATE: EXECUTIVE SLATE (High-tech / Modern Monochrome)
  if (activeTemplate === 'executive-slate') {
    return (
      <div className="relative bg-[#18181B] text-white p-6 sm:p-7 border border-zinc-700 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between border-b border-zinc-700 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <VivaBadge size="sm" />
            <div>
              <h3 className="font-bold text-lg text-white">VICTORY COLLEGE SCHOOL</h3>
              <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">
                DIGITAL CLEARANCE CREDENTIAL // 2026
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs bg-zinc-800 text-amber-400 px-3 py-1 border border-zinc-700">
              {learner.regNo}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-3 border border-zinc-800 text-xs mb-4">
          <div>
            <span className="text-[9px] uppercase font-mono text-zinc-500 block">Candidate</span>
            <span className="font-bold text-white truncate block">{learner.name}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-zinc-500 block">Cohort</span>
            <span className="font-bold text-white">{learner.class} Stream {learner.stream}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-zinc-500 block">Status</span>
            <span className={`font-bold font-mono ${isFullyCleared ? 'text-emerald-400' : 'text-amber-400'}`}>
              {percentage}% CLEARED
            </span>
          </div>
        </div>

        <div className="mb-4">
          <table className="w-full text-xs">
            <thead className="border-b border-zinc-800 text-zinc-400 font-mono text-[9px] uppercase">
              <tr>
                <th className="py-1.5 text-left">Unit</th>
                <th className="py-1.5 text-left">Verdict</th>
                <th className="py-1.5 text-right">Signatory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
              {learner.subjects.map((sub) => (
                <tr key={sub.id}>
                  <td className="py-1.5">
                    <span className="text-zinc-500 mr-2">{sub.code}</span>
                    <span className="text-zinc-200">{sub.name}</span>
                    {sub.photoProofUrl && <span className="ml-1 text-[8px] text-blue-400">📷</span>}
                  </td>
                  <td className="py-1.5">
                    {sub.status === 'cleared' ? (
                      <span className="text-emerald-400 font-bold">● OK</span>
                    ) : (
                      <span className="text-amber-400 font-bold">○ PENDING</span>
                    )}
                  </td>
                  <td className="py-1.5 text-right text-zinc-400 uppercase text-[10px]">
                    {sub.status === 'cleared' ? (sub.signatureDataUrl ? '✓ SIGNED' : sub.officer) : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[9px] font-mono text-zinc-500">
          <div>
            <p>AUTH-KEY: {learner.id.substring(0, 12).toUpperCase()}</p>
            <p>VCS SECURE VERIFICATION</p>
          </div>
          <div className="text-right text-zinc-400">
            <p>TERM II EXAM CLEARANCE</p>
          </div>
        </div>
      </div>
    );
  }

  // 5. TEMPLATE: RANDOMIZED PROCEDURAL (Admin Selected Bespoke Style)
  const rnd: RandomizedStyleConfig = settings.randomizedConfig || {
    id: 'rnd_default',
    name: 'Custom Palette',
    primaryColor: '#7A1326',
    secondaryColor: '#D4AF37',
    backgroundColor: '#FDFCF7',
    textColor: '#1A1A1A',
    borderColor: '#7A1326',
    borderStyle: 'double',
    watermarkStyle: 'shield',
    fontTheme: 'serif',
    headerBannerStyle: 'full-maroon',
    sealColor: '#7A1326',
    sealStyle: 'royal-shield',
  };

  return (
    <div
      className="relative p-6 sm:p-8 flex flex-col justify-between shadow-sm overflow-hidden"
      style={{
        backgroundColor: rnd.backgroundColor,
        color: rnd.textColor,
        borderWidth: rnd.borderStyle === 'double' ? '4px' : '2px',
        borderStyle: rnd.borderStyle === 'double' ? 'double' : 'solid',
        borderColor: rnd.borderColor,
      }}
    >
      {/* Dynamic Watermark */}
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
          <VivaBadge size="hero" watermark />
        </div>
      )}

      {/* Header Banner */}
      <div
        className="relative z-10 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-5 p-4 px-6 flex items-center justify-between"
        style={{
          backgroundColor: rnd.primaryColor,
          color: '#FFFFFF',
          borderBottom: `2px solid ${rnd.secondaryColor}`,
        }}
      >
        <div className="flex items-center gap-3">
          <VivaBadge size="sm" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color: rnd.secondaryColor }}>
              {settings.schoolName || 'Victory College School'}
            </p>
            <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Learner Clearance Credential
            </h3>
            <p className="text-[8px] uppercase tracking-widest text-white/70">
              Style: {rnd.name}
            </p>
          </div>
        </div>
        <div className="text-right font-mono text-[9px] uppercase font-bold text-white/80 hidden sm:block">
          {settings.academicYear || '2026'} • {settings.term || 'Term II'}
        </div>
      </div>

      {/* Learner Card Info */}
      <div
        className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 mb-4 text-xs"
        style={{
          backgroundColor: '#FFFFFF',
          border: `1px solid ${rnd.borderColor}33`,
        }}
      >
        <div>
          <span className="text-[9px] uppercase font-bold opacity-60 block">Candidate</span>
          <span className="font-serif font-bold text-sm block truncate">{learner.name}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold opacity-60 block">Reg No</span>
          <span className="font-mono font-bold text-xs">{learner.regNo}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold opacity-60 block">Cohort</span>
          <span className="font-semibold text-xs">{learner.class} {learner.stream}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold opacity-60 block">Clearance</span>
          <span className="font-bold text-xs" style={{ color: rnd.primaryColor }}>
            {percentage}% Cleared
          </span>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="relative z-10 mb-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead style={{ borderBottom: `2px solid ${rnd.primaryColor}`, backgroundColor: `${rnd.primaryColor}10` }}>
            <tr className="text-left uppercase text-[9px] tracking-wider font-bold" style={{ color: rnd.primaryColor }}>
              <th className="py-2 px-2">Subject / Unit</th>
              <th className="py-2 px-2">Clearance Status</th>
              <th className="py-2 px-2 text-right">Verifying Officer & Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 font-medium">
            {learner.subjects.map((sub) => (
              <tr key={sub.id} className={sub.status === 'pending' ? 'opacity-60 italic' : ''}>
                <td className="py-1.5 px-2 font-semibold">
                  <span className="font-mono text-[10px] mr-1.5 opacity-60">{sub.code}</span>
                  {sub.name}
                  {sub.photoProofUrl && <span className="ml-1 text-[8px] text-blue-700 bg-blue-50 px-1 py-0.2">📷</span>}
                </td>
                <td className="py-1.5 px-2">
                  {sub.status === 'cleared' ? (
                    <span className="text-emerald-800 font-bold text-[9px] bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                      CLEARED
                    </span>
                  ) : sub.status === 'not_cleared' ? (
                    <span className="text-rose-800 font-bold text-[9px] bg-rose-50 px-2 py-0.5 border border-rose-200">
                      NOT CLEARED
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold text-[9px] bg-amber-50 px-2 py-0.5 border border-amber-200">
                      PENDING
                    </span>
                  )}
                </td>
                <td className="py-1 px-2 text-right">
                  {sub.status === 'cleared' ? (
                    <SignatureDisplay
                      signatureUrl={sub.signatureDataUrl}
                      officerName={sub.officer}
                      color={rnd.primaryColor}
                      className="scale-85 origin-right"
                    />
                  ) : (
                    <span className="font-mono text-[10px] opacity-40">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Stamp */}
      <div
        className="relative z-10 pt-3 flex items-center justify-between text-xs"
        style={{ borderTop: `2px dashed ${rnd.borderColor}66` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center text-center p-1 rotate-[-8deg]"
            style={{ borderColor: rnd.sealColor, color: rnd.sealColor, backgroundColor: `${rnd.sealColor}08` }}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <p className="text-[7px] font-black uppercase">VCS OFFICIAL</p>
            <p className="text-[8px] font-black">{isFullyCleared ? 'APPROVED' : 'PROVISIONAL'}</p>
          </div>
          <div>
            <p className="font-serif italic font-bold text-xs">Directorate of Academics</p>
            <p className="text-[8px] opacity-60">Victory College School</p>
          </div>
        </div>

        <div className="text-right text-[9px] font-mono opacity-60 uppercase">
          <p>Ref: VCS-{learner.regNo}</p>
          <p>Issued: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>
    </div>
  );
};

