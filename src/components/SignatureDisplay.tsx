import React from 'react';

interface SignatureDisplayProps {
  signatureUrl?: string;
  signatureType?: 'drawn' | 'calligraphy' | 'stamp';
  officerName?: string;
  date?: string;
  className?: string;
  color?: string;
}

export const SignatureDisplay: React.FC<SignatureDisplayProps> = ({
  signatureUrl,
  signatureType = 'calligraphy',
  officerName = 'Authorized Officer',
  date,
  className = '',
  color = '#7A1326',
}) => {
  // If a drawn/uploaded image signature exists, render it
  if (signatureUrl && signatureUrl.startsWith('data:image')) {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        <img
          src={signatureUrl}
          alt={`Signature of ${officerName}`}
          className="h-10 sm:h-12 max-w-[140px] object-contain select-none filter contrast-125"
        />
        {date && <span className="text-[8px] font-mono opacity-60 mt-0.5">{date}</span>}
      </div>
    );
  }

  // If a custom calligraphy string was provided or fallback to formatted officer name
  const formattedName = officerName
    .replace(/^MR\.\s*|^MS\.\s*|^DR\.\s*|^MRS\.\s*|^PROF\.\s*/i, '')
    .trim();

  return (
    <div className={`inline-flex flex-col items-start justify-center ${className}`}>
      <div
        className="font-serif italic text-base sm:text-lg tracking-wide select-none leading-none -rotate-1 relative"
        style={{
          color,
          fontFamily: "'Newsreader', 'Playfair Display', 'Caveat', 'Great Vibes', cursive, serif",
          textShadow: '0.2px 0.2px 0px rgba(0,0,0,0.15)',
        }}
      >
        <span className="border-b border-dashed border-current pb-0.5 inline-block">
          {signatureUrl || formattedName || 'I. Ntende'}
        </span>
      </div>
      {date && <span className="text-[7.5px] font-mono opacity-50 mt-0.5">{date}</span>}
    </div>
  );
};

export default SignatureDisplay;
