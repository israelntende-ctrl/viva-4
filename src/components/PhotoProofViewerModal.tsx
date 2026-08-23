import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Calendar, User, BookOpen, CheckCircle } from 'lucide-react';
import { Learner, SubjectRecord } from '../types';

interface PhotoProofViewerModalProps {
  learner: Learner;
  subject: SubjectRecord;
  onClose: () => void;
}

export const PhotoProofViewerModal: React.FC<PhotoProofViewerModalProps> = ({
  learner,
  subject,
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!subject.photoProofUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="bg-[#1A1A1A] border border-white/20 w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-[#232323] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#F6D365] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                  Photographic Clearance Proof
                </h3>
                <span className="bg-[#7A1326] text-white text-[10px] font-mono font-bold px-2 py-0.5">
                  {subject.name} ({subject.code})
                </span>
              </div>
              <p className="text-xs text-white/60">
                Candidate: <strong className="text-white">{learner.name}</strong> • Reg No:{' '}
                <strong className="text-[#F6D365]">{learner.regNo}</strong> • Class:{' '}
                {learner.class} {learner.stream}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              className="p-1.5 rounded-xs bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 rounded-xs bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 rounded-xs bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <a
              href={subject.photoProofUrl}
              download={`${learner.regNo}_${subject.code}_proof.jpg`}
              className="p-1.5 rounded-xs bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-sm font-bold hover:bg-white hover:text-black ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Stage */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50 min-h-[360px]">
          <div
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
            }}
            className="flex items-center justify-center max-w-full"
          >
            <img
              src={subject.photoProofUrl}
              alt="Exercise Book Clearance Proof"
              className="max-h-[62vh] object-contain rounded-xs shadow-2xl border border-white/10"
            />
          </div>
        </div>

        {/* Footer info & caption */}
        <div className="p-4 bg-[#232323] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <p className="text-white/80 font-medium">
              {subject.photoProofCaption || 'Exercise book notes & practical folios verification stamp.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-white/50">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-[#D4AF37]" /> Verifying Officer:{' '}
                <strong className="text-white">{subject.officer || 'Department Head'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#D4AF37]" /> Date Recorded:{' '}
                <strong className="text-white">{subject.signedDate || subject.photoProofTimestamp || 'Current Term'}</strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> Official Clearance Folio
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9B1C33] self-end sm:self-auto"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoProofViewerModal;
