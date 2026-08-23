import React, { useRef, useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { PenTool, Type, Eraser, Check, X, ShieldCheck, RefreshCw } from 'lucide-react';

interface SignaturePadModalProps {
  currentUser: UserAccount;
  currentSignature?: string;
  onSaveSignature: (signatureDataUrl: string, signatureType: 'drawn' | 'calligraphy', saveToProfile: boolean) => void;
  onClose: () => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  currentUser,
  currentSignature,
  onSaveSignature,
  onClose,
}) => {
  const [mode, setMode] = useState<'draw' | 'calligraphy'>('draw');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<string>('#7A1326');
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);

  // Calligraphy options
  const [selectedCalligraphyFont, setSelectedCalligraphyFont] = useState<number>(0);
  const [customSignText, setCustomSignText] = useState<string>(currentUser.name);

  const calligraphyStyles = [
    { name: 'Executive Script', font: 'font-serif italic font-medium', tracking: 'tracking-normal' },
    { name: 'Classical Copperplate', font: 'font-serif italic font-bold', tracking: 'tracking-wide' },
    { name: 'Dean Formal Signature', font: 'font-mono italic font-semibold', tracking: 'tracking-tight' },
    { name: 'Artisan Cursive', font: 'font-serif italic font-normal', tracking: 'tracking-widest' },
  ];

  // Initialize canvas
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
      }
    }
  }, [mode, penColor, penWidth]);

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Convert Calligraphy text to PNG Data URL via hidden canvas
  const renderCalligraphyToDataUrl = (): string => {
    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = 400;
    hiddenCanvas.height = 120;
    const ctx = hiddenCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
    ctx.fillStyle = penColor;
    ctx.textBaseline = 'middle';
    ctx.font = selectedCalligraphyFont === 0 
      ? 'italic 34px "Newsreader", "Playfair Display", Georgia, serif'
      : selectedCalligraphyFont === 1 
      ? 'bold italic 32px "Playfair Display", serif'
      : selectedCalligraphyFont === 2 
      ? 'italic 600 30px "Courier New", monospace'
      : 'italic 30px "Newsreader", serif';

    ctx.fillText(customSignText || currentUser.name, 25, 60);

    // Add subtle underline
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(20, 85);
    ctx.lineTo(360, 85);
    ctx.stroke();

    return hiddenCanvas.toDataURL('image/png');
  };

  const handleApply = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSaveSignature(dataUrl, 'drawn', saveToProfile);
    } else {
      const dataUrl = renderCalligraphyToDataUrl();
      onSaveSignature(dataUrl, 'calligraphy', saveToProfile);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-white p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7A1326]/10 text-[#7A1326] flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">Officer Digital Signature</h3>
              <p className="text-[10px] opacity-60">
                Authorized sign-off for {currentUser.name} ({currentUser.department})
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

        {/* Tab Controls */}
        <div className="flex border-b border-[#1A1A1A]/10 bg-white px-4 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setMode('draw')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              mode === 'draw'
                ? 'border-[#7A1326] text-[#7A1326]'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" /> Draw by Hand
          </button>
          <button
            onClick={() => setMode('calligraphy')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              mode === 'calligraphy'
                ? 'border-[#7A1326] text-[#7A1326]'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Calligraphy Script
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Pen Color & Width Toolbar */}
          <div className="flex items-center justify-between text-xs pb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold opacity-60">Ink Color:</span>
              <button
                type="button"
                onClick={() => setPenColor('#7A1326')}
                className={`w-6 h-6 rounded-full bg-[#7A1326] border-2 transition-all ${
                  penColor === '#7A1326' ? 'border-[#1A1A1A] ring-2 ring-[#7A1326]/40 scale-110' : 'border-white'
                }`}
                title="Crimson Ink"
              />
              <button
                type="button"
                onClick={() => setPenColor('#1A1A1A')}
                className={`w-6 h-6 rounded-full bg-[#1A1A1A] border-2 transition-all ${
                  penColor === '#1A1A1A' ? 'border-[#7A1326] ring-2 ring-black/40 scale-110' : 'border-white'
                }`}
                title="Black Ink"
              />
              <button
                type="button"
                onClick={() => setPenColor('#1E3A8A')}
                className={`w-6 h-6 rounded-full bg-[#1E3A8A] border-2 transition-all ${
                  penColor === '#1E3A8A' ? 'border-[#1A1A1A] ring-2 ring-blue-500/40 scale-110' : 'border-white'
                }`}
                title="Blue Ink"
              />
            </div>

            {mode === 'draw' && (
              <button
                type="button"
                onClick={clearCanvas}
                className="text-rose-700 hover:text-rose-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Eraser className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Canvas Mode */}
          {mode === 'draw' && (
            <div className="space-y-2">
              <div className="relative bg-white border-2 border-dashed border-[#1A1A1A]/30 rounded-xs overflow-hidden shadow-inner touch-none">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] cursor-crosshair bg-white"
                />

                {/* Baseline Guide */}
                <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-[#1A1A1A]/20 pointer-events-none" />

                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-[#1A1A1A]/35">
                    Draw your official sign-off with mouse or finger here
                  </div>
                )}
              </div>
              <p className="text-[10px] opacity-60 text-right">
                Use smooth strokes. Your signature will be scaled onto student clearance slips.
              </p>
            </div>
          )}

          {/* Calligraphy Mode */}
          {mode === 'calligraphy' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                  Signature Name / Initials:
                </label>
                <input
                  type="text"
                  value={customSignText}
                  onChange={(e) => setCustomSignText(e.target.value)}
                  placeholder="e.g. Mr. Isaac Okello or I. Okello"
                  className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
                />
              </div>

              <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                Select Calligraphic Script Style:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {calligraphyStyles.map((style, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCalligraphyFont(idx)}
                    className={`p-3 text-left border transition-all ${
                      selectedCalligraphyFont === idx
                        ? 'border-[#7A1326] bg-[#7A1326]/5 ring-1 ring-[#7A1326]'
                        : 'border-[#1A1A1A]/10 bg-white hover:border-[#1A1A1A]/30'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold opacity-50 block mb-1">
                      {style.name}
                    </span>
                    <div
                      className={`text-lg text-[#7A1326] truncate ${style.font} ${style.tracking}`}
                      style={{ color: penColor }}
                    >
                      {customSignText || currentUser.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save to Profile Option */}
          <div className="p-3 bg-white border border-[#1A1A1A]/10 flex items-center gap-2.5">
            <input
              id="chk-save-profile"
              type="checkbox"
              checked={saveToProfile}
              onChange={(e) => setSaveToProfile(e.target.checked)}
              className="accent-[#7A1326] w-4 h-4"
            />
            <label htmlFor="chk-save-profile" className="text-xs font-semibold cursor-pointer">
              Save as my default official signature for all future clearances
            </label>
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
            onClick={handleApply}
            disabled={mode === 'draw' && !hasDrawn}
            className="px-5 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-sm disabled:opacity-40"
          >
            <Check className="w-4 h-4" /> Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePadModal;
