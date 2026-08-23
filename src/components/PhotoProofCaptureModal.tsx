import React, { useState, useRef } from 'react';
import { Camera, Upload, Image as ImageIcon, X, Check, FileCheck, Sparkles, Trash2 } from 'lucide-react';
import { Learner, SubjectRecord, UserAccount } from '../types';

interface PhotoProofCaptureModalProps {
  learner: Learner;
  subject: SubjectRecord;
  currentUser: UserAccount;
  onSaveProof: (photoProofUrl: string, caption?: string) => void;
  onClose: () => void;
}

// Preset realistic student exercise book clearance proofs for instant evaluation & demo
const SAMPLE_PROOF_PRESETS = [
  {
    id: 'p1',
    name: 'Term II Chemistry Practical Workbook',
    caption: 'Verified: Qualitative Analysis & Titration calculations marked with departmental red ink stamp.',
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p2',
    name: 'Physics Mechanics Exercise Notebook',
    caption: 'All 8 modules of Newton laws, optics diagrams, and practical lab experiments stamped.',
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p3',
    name: 'Biology Specimen & Ecology Dossier',
    caption: 'Dissection microscope sketches and cell physiology chapter notes verified.',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p4',
    name: 'Mathematics Pure & Applied Workbooks',
    caption: 'Past paper correction folder, calculus notes, and graph logbook fully stamped.',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
  },
];

export const PhotoProofCaptureModal: React.FC<PhotoProofCaptureModalProps> = ({
  learner,
  subject,
  currentUser,
  onSaveProof,
  onClose,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(subject.photoProofUrl || '');
  const [caption, setCaption] = useState<string>(
    subject.photoProofCaption || `Photographic evidence of ${subject.name} complete coursework notes in student's exercise book.`
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress & read user image file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Canvas compression for compact Firestore storage
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoUrl(compressedDataUrl);
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!photoUrl) return;
    onSaveProof(photoUrl, caption);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7A1326]/10 text-[#7A1326] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Exercise Book Clearance Photo Proof
              </h3>
              <p className="text-[10px] opacity-60">
                {learner.name} ({learner.regNo}) • {subject.name} ({subject.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center text-sm hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-[#1A1A1A]/80 leading-relaxed">
            Attach a photo of the student's physical exercise book or coursework notes showing teacher
            markings, stamps, or completed folios as verification proof.
          </p>

          {/* Image Preview / Dropzone */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {photoUrl ? (
              <div className="relative border-2 border-[#7A1326] bg-black/5 rounded-xs overflow-hidden max-h-64 flex items-center justify-center">
                <img
                  src={photoUrl}
                  alt="Student Book Clearance Proof"
                  className="w-full h-60 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white/90 backdrop-blur-xs text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider rounded-xs shadow-sm hover:bg-white"
                  >
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="p-1 bg-rose-600 text-white rounded-xs shadow-sm hover:bg-rose-700"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 rounded-xs">
                  Captured by: {currentUser.name} • {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#1A1A1A]/30 bg-white p-8 text-center cursor-pointer hover:border-[#7A1326] transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-[#7A1326]/10 text-[#7A1326] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-xs text-[#1A1A1A]">
                  Click to Take Photo or Upload from Device
                </p>
                <p className="text-[10px] opacity-60 mt-1">
                  Supports Camera Snapshots, JPG, PNG, WebP (auto-compressed)
                </p>
              </div>
            )}
          </div>

          {/* Quick Preset Samples for Testing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Or Select Preset Demo Proof:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_PROOF_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setPhotoUrl(preset.url);
                    setCaption(preset.caption);
                  }}
                  className="p-2 border border-[#1A1A1A]/10 bg-white text-left hover:border-[#7A1326] hover:bg-[#7A1326]/5 transition-all text-xs flex items-center gap-2"
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-10 h-10 object-cover rounded-xs shrink-0"
                  />
                  <div className="truncate">
                    <p className="font-bold text-[11px] text-[#1A1A1A] truncate">{preset.name}</p>
                    <p className="text-[9px] opacity-50 truncate">{preset.caption}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Caption / Teacher Verification Remarks */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
              Verification Notes & Page References:
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Term II practical experiment pages 40-52 stamped with departmental ink."
              className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#1A1A1A]/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:border-[#1A1A1A]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!photoUrl || isProcessing}
            className="px-5 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-sm disabled:opacity-40"
          >
            <FileCheck className="w-4 h-4" /> Save Photographic Proof
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoProofCaptureModal;
