import React, { useState } from 'react';
import { SchoolSettings, CardDesignTemplate, RandomizedStyleConfig, Learner } from '../types';
import { ClearanceCardRenderer } from './CardDesigns/ClearanceCardRenderer';
import { VivaBadge } from './VivaBadge';
import { Dices, Check, Sparkles, Sliders, Palette, Shield, Layout } from 'lucide-react';

interface AdminDesignSelectorProps {
  settings: SchoolSettings;
  sampleLearner: Learner;
  onSaveSettings: (settings: Partial<SchoolSettings>) => Promise<void>;
  onClose: () => void;
}

const PRESET_RANDOM_THEMES: RandomizedStyleConfig[] = [
  {
    id: 'rnd_viva_crimson',
    name: 'Imperial Viva Crimson',
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
  },
  {
    id: 'rnd_oxford_navy',
    name: 'Chancellor Oxford Navy & Gold',
    primaryColor: '#0E2A47',
    secondaryColor: '#E5A93C',
    backgroundColor: '#F8FAFC',
    textColor: '#0F172A',
    borderColor: '#0E2A47',
    borderStyle: 'solid',
    watermarkStyle: 'crest',
    fontTheme: 'classic',
    headerBannerStyle: 'full-maroon',
    sealColor: '#0E2A47',
    sealStyle: 'round-crimson',
  },
  {
    id: 'rnd_cambridge_emerald',
    name: 'Academic Emerald & Bronze',
    primaryColor: '#0E3B2E',
    secondaryColor: '#C49752',
    backgroundColor: '#F7FAF8',
    textColor: '#142820',
    borderColor: '#0E3B2E',
    borderStyle: 'double',
    watermarkStyle: 'shield',
    fontTheme: 'serif',
    headerBannerStyle: 'full-maroon',
    sealColor: '#0E3B2E',
    sealStyle: 'gold-embossed',
  },
  {
    id: 'rnd_royal_burgundy',
    name: 'Royal Heritage Burgundy',
    primaryColor: '#58101E',
    secondaryColor: '#F59E0B',
    backgroundColor: '#FFFDF9',
    textColor: '#27080D',
    borderColor: '#58101E',
    borderStyle: 'ornate',
    watermarkStyle: 'diagonal',
    fontTheme: 'diploma',
    headerBannerStyle: 'ribbon',
    sealColor: '#58101E',
    sealStyle: 'traditional-stamp',
  },
  {
    id: 'rnd_charcoal_minimal',
    name: 'Executive Noir & Crimson Stamp',
    primaryColor: '#18181B',
    secondaryColor: '#DC2626',
    backgroundColor: '#FAFAFA',
    textColor: '#18181B',
    borderColor: '#18181B',
    borderStyle: 'solid',
    watermarkStyle: 'shield',
    fontTheme: 'modern',
    headerBannerStyle: 'minimal',
    sealColor: '#7A1326',
    sealStyle: 'round-crimson',
  },
];

export const AdminDesignSelector: React.FC<AdminDesignSelectorProps> = ({
  settings,
  sampleLearner,
  onSaveSettings,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CardDesignTemplate>(
    settings.activeCardDesign || 'viva-crimson'
  );
  const [randomizedConfig, setRandomizedConfig] = useState<RandomizedStyleConfig>(
    settings.randomizedConfig || PRESET_RANDOM_THEMES[0]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState<1 | 2 | 4>(settings.cardsPerPage || 1);

  // Algorithmically generate a new fresh theme on click
  const handleGenerateRandomTheme = () => {
    const primaryPalettes = [
      { name: 'Viva Crimson', primary: '#7A1326', secondary: '#D4AF37', border: '#7A1326', seal: '#7A1326', bg: '#FDFCF7' },
      { name: 'Bordeaux Maroon', primary: '#600E1D', secondary: '#F3BA2F', border: '#600E1D', seal: '#600E1D', bg: '#FAF8F5' },
      { name: 'Chancellor Navy', primary: '#0A2540', secondary: '#FFD700', border: '#0A2540', seal: '#0A2540', bg: '#F6F9FC' },
      { name: 'Highland Forest', primary: '#1B4332', secondary: '#D8B168', border: '#1B4332', seal: '#1B4332', bg: '#F8FAF8' },
      { name: 'Imperial Plum', primary: '#4A0E2E', secondary: '#E0A96D', border: '#4A0E2E', seal: '#4A0E2E', bg: '#FCF8FA' },
      { name: 'Academic Bronze', primary: '#452A15', secondary: '#E6B800', border: '#452A15', seal: '#452A15', bg: '#FBF9F5' },
      { name: 'VCS Onyx Noir', primary: '#1F1F1F', secondary: '#C99700', border: '#1F1F1F', seal: '#7A1326', bg: '#FAFAFA' },
    ];

    const borderStyles: ('double' | 'solid' | 'dashed' | 'ornate')[] = ['double', 'solid', 'ornate'];
    const fontThemes: ('serif' | 'classic' | 'modern' | 'diploma')[] = ['serif', 'classic', 'diploma'];
    const sealStyles: ('round-crimson' | 'gold-embossed' | 'royal-shield' | 'traditional-stamp')[] = [
      'round-crimson',
      'gold-embossed',
      'royal-shield',
      'traditional-stamp',
    ];

    const chosenPal = primaryPalettes[Math.floor(Math.random() * primaryPalettes.length)];
    const chosenBorder = borderStyles[Math.floor(Math.random() * borderStyles.length)];
    const chosenFont = fontThemes[Math.floor(Math.random() * fontThemes.length)];
    const chosenSeal = sealStyles[Math.floor(Math.random() * sealStyles.length)];

    const generated: RandomizedStyleConfig = {
      id: `rnd_${Date.now()}`,
      name: `${chosenPal.name} Style`,
      primaryColor: chosenPal.primary,
      secondaryColor: chosenPal.secondary,
      backgroundColor: chosenPal.bg,
      textColor: '#1A1A1A',
      borderColor: chosenPal.border,
      borderStyle: chosenBorder,
      watermarkStyle: 'shield',
      fontTheme: chosenFont,
      headerBannerStyle: 'full-maroon',
      sealColor: chosenPal.seal,
      sealStyle: chosenSeal,
    };

    setRandomizedConfig(generated);
    setSelectedTemplate('randomized-custom');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings({
        activeCardDesign: selectedTemplate,
        randomizedConfig,
        cardsPerPage,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview settings object
  const previewSettings: SchoolSettings = {
    ...settings,
    activeCardDesign: selectedTemplate,
    randomizedConfig,
    cardsPerPage,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#F9F8F6] border-2 border-[#1A1A1A] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VivaBadge size="sm" />
            <div>
              <h3 className="font-serif text-2xl text-[#1A1A1A] font-bold">
                Clearance Card Design Studio
              </h3>
              <p className="text-xs opacity-60">
                Choose or procedurally randomize the official clearance slip template applied across all student cards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center text-sm font-bold hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Studio Body: Left Controls, Right Real-time Preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel: Design Options */}
          <div className="w-full lg:w-96 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-[#1A1A1A]/10 space-y-6 bg-white shrink-0">
            {/* Randomizer Hero Button */}
            <div className="p-4 bg-gradient-to-br from-[#7A1326] to-[#5B0B19] text-white border border-[#D4AF37]">
              <div className="flex items-center gap-2 text-[#F6D365] text-[10px] uppercase tracking-widest font-bold mb-1">
                <Sparkles className="w-4 h-4" />
                Procedural Generator
              </div>
              <h4 className="font-serif text-lg font-bold leading-snug">Randomize Card Design</h4>
              <p className="text-xs text-white/80 mt-1 mb-3">
                Generates a bespoke university color palette, border styling, and heraldic watermark.
              </p>
              <button
                id="btn-randomize-design"
                type="button"
                onClick={handleGenerateRandomTheme}
                className="w-full py-2.5 bg-[#D4AF37] text-[#5B0B19] font-bold text-xs uppercase tracking-wider hover:bg-[#F6D365] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Dices className="w-4 h-4" />
                Shuffle & Randomize Design
              </button>
            </div>

            {/* Template Selector Radio Cards */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 block">
                Standard School Templates
              </label>

              {/* Template 1: Viva Crimson */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('viva-crimson')}
                className={`w-full p-3.5 text-left border transition-all flex items-center justify-between ${
                  selectedTemplate === 'viva-crimson'
                    ? 'border-[#7A1326] bg-[#7A1326]/5 ring-1 ring-[#7A1326]'
                    : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[#7A1326]">★ Viva Imperial Crimson (Official)</p>
                  <p className="text-[10px] opacity-60">Maroon header, gold trim, watermark badge & stamp</p>
                </div>
                {selectedTemplate === 'viva-crimson' && <Check className="w-4 h-4 text-[#7A1326]" />}
              </button>

              {/* Template 2: Editorial Heritage */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('editorial-heritage')}
                className={`w-full p-3.5 text-left border transition-all flex items-center justify-between ${
                  selectedTemplate === 'editorial-heritage'
                    ? 'border-[#1A1A1A] bg-[#1A1A1A]/5 ring-1 ring-[#1A1A1A]'
                    : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Editorial Heritage</p>
                  <p className="text-[10px] opacity-60">Double-border classic frame with Latin crest & serif text</p>
                </div>
                {selectedTemplate === 'editorial-heritage' && <Check className="w-4 h-4 text-[#1A1A1A]" />}
              </button>

              {/* Template 3: Royal Parchment */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('royal-parchment')}
                className={`w-full p-3.5 text-left border transition-all flex items-center justify-between ${
                  selectedTemplate === 'royal-parchment'
                    ? 'border-[#B45309] bg-[#FEF3C7]/20 ring-1 ring-[#B45309]'
                    : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[#78350F]">Royal Parchment Certificate</p>
                  <p className="text-[10px] opacity-60">Gilded gold ornaments, diploma layout & gold seal</p>
                </div>
                {selectedTemplate === 'royal-parchment' && <Check className="w-4 h-4 text-[#B45309]" />}
              </button>

              {/* Template 4: Executive Slate */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('executive-slate')}
                className={`w-full p-3.5 text-left border transition-all flex items-center justify-between ${
                  selectedTemplate === 'executive-slate'
                    ? 'border-zinc-900 bg-zinc-900 text-white ring-1 ring-zinc-700'
                    : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">Executive Noir / Modern</p>
                  <p className="text-[10px] opacity-70">Monochrome digital credential with security hash</p>
                </div>
                {selectedTemplate === 'executive-slate' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Template 5: Custom Random */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('randomized-custom')}
                className={`w-full p-3.5 text-left border transition-all flex items-center justify-between ${
                  selectedTemplate === 'randomized-custom'
                    ? 'border-[#7A1326] bg-[#7A1326]/5 ring-1 ring-[#7A1326]'
                    : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[#7A1326]">Custom Randomized: {randomizedConfig.name}</p>
                  <p className="text-[10px] opacity-60">Primary: {randomizedConfig.primaryColor} • Border: {randomizedConfig.borderStyle}</p>
                </div>
                {selectedTemplate === 'randomized-custom' && <Check className="w-4 h-4 text-[#7A1326]" />}
              </button>
            </div>

            {/* Print Layout Grid Density */}
            <div className="space-y-2 pt-2 border-t border-[#1A1A1A]/10">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 block">
                Batch Print Format (Cards per A4 Page)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 1, label: '1 (Full A4)' },
                  { count: 2, label: '2 (Half Page)' },
                  { count: 4, label: '4 (Index Cards)' },
                ].map((opt) => (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setCardsPerPage(opt.count as 1 | 2 | 4)}
                    className={`py-2 px-1 text-center text-xs font-semibold border transition-all ${
                      cardsPerPage === opt.count
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                        : 'bg-[#F9F8F6] text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Live Card Preview */}
          <div className="flex-1 p-6 sm:p-8 bg-[#EFECE6] overflow-y-auto flex flex-col items-center justify-center">
            <div className="w-full max-w-xl">
              <div className="mb-3 flex items-center justify-between text-xs opacity-60 font-semibold uppercase tracking-wider">
                <span>Live Card Preview</span>
                <span>Target: {sampleLearner.name} ({sampleLearner.regNo})</span>
              </div>

              {/* The Actual Rendered Card */}
              <div className="transform transition-all duration-300">
                <ClearanceCardRenderer
                  learner={sampleLearner}
                  settings={previewSettings}
                  overrideTemplate={selectedTemplate}
                  showWatermark={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#1A1A1A]/10 flex items-center justify-between">
          <div className="text-xs opacity-70">
            Selected: <span className="font-bold text-[#7A1326]">{selectedTemplate.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:border-[#1A1A1A]"
            >
              Cancel
            </button>
            <button
              id="btn-apply-card-theme"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-2 shadow-md"
            >
              {isSaving ? (
                <>Saving to Database...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save & Apply To All Cards
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
