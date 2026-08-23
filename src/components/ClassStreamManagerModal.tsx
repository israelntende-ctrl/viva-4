import React, { useState, useMemo } from 'react';
import { SchoolSettings, ClassConfig, StreamInfo, UserAccount, Learner } from '../types';
import { VivaBadge } from './VivaBadge';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Layers, 
  Sparkles, 
  Users, 
  Building, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  ChevronRight,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface ClassStreamManagerModalProps {
  settings: SchoolSettings;
  learners: Learner[];
  users: UserAccount[];
  onSaveSettings: (updatedSettings: SchoolSettings) => Promise<void>;
  onClose: () => void;
}

export const ClassStreamManagerModal: React.FC<ClassStreamManagerModalProps> = ({
  settings,
  learners,
  users,
  onSaveSettings,
  onClose,
}) => {
  const [classes, setClasses] = useState<ClassConfig[]>(
    settings.registeredClasses && settings.registeredClasses.length > 0
      ? settings.registeredClasses
      : [
          {
            id: 'cls_s1',
            name: 'S.1',
            level: 'O-Level',
            classTeacher: 'Mr. David Mukasa',
            description: 'Senior One Lower Secondary',
            streams: [
              { id: 'st_s1_north', name: 'North', color: '#1E40AF', patronName: 'Mr. David Mukasa', room: 'Block A 101', capacity: 55 },
              { id: 'st_s1_south', name: 'South', color: '#047857', patronName: 'Ms. Sarah Namubiru', room: 'Block A 102', capacity: 55 },
              { id: 'st_s1_east', name: 'East', color: '#B45309', patronName: 'Mr. Isaac Okello', room: 'Block A 103', capacity: 50 },
              { id: 'st_s1_west', name: 'West', color: '#6D28D9', patronName: 'Ms. Jane Nabirye', room: 'Block A 104', capacity: 50 },
            ],
          },
          {
            id: 'cls_s2',
            name: 'S.2',
            level: 'O-Level',
            classTeacher: 'Ms. Sarah Namubiru',
            description: 'Senior Two Lower Secondary',
            streams: [
              { id: 'st_s2_north', name: 'North', color: '#1E40AF', patronName: 'Ms. Sarah Namubiru', room: 'Block A 201', capacity: 55 },
              { id: 'st_s2_south', name: 'South', color: '#047857', patronName: 'Dr. Musa Ssekandi', room: 'Block A 202', capacity: 55 },
            ],
          },
          {
            id: 'cls_s4',
            name: 'S.4',
            level: 'O-Level',
            classTeacher: 'Dr. Musa Ssekandi',
            description: 'Senior Four National Candidate Class (UCE)',
            streams: [
              { id: 'st_s4_north', name: 'North', color: '#1E40AF', patronName: 'Dr. Musa Ssekandi', room: 'Cand. Hall 1', capacity: 55 },
              { id: 'st_s4_south', name: 'South', color: '#047857', patronName: 'Mr. Peter Ocen', room: 'Cand. Hall 2', capacity: 55 },
              { id: 'st_s4_a', name: 'A', color: '#7A1326', patronName: 'Mr. Isaac Okello', room: 'Cand. Hall 3', capacity: 45 },
              { id: 'st_s4_b', name: 'B', color: '#0F766E', patronName: 'Ms. Jane Nabirye', room: 'Cand. Hall 4', capacity: 45 },
            ],
          },
        ]
  );

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Derive all subjects across the school
  const allSubjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    learners.forEach(l => {
      l.subjects.forEach(s => {
        if (!map.has(s.id)) {
          map.set(s.id, { id: s.id, name: s.name });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [learners]);

  const handleToggleMandatory = (subjectId: string) => {
    setClasses(prev => prev.map(c => {
      if (c.id !== selectedClassId) return c;
      
      const policies = c.mandatorySubjectPolicies || [];
      const existing = policies.find(p => p.subjectId === subjectId);
      
      let nextPolicies;
      if (existing) {
        nextPolicies = policies.map(p => p.subjectId === subjectId ? { ...p, isMandatory: !p.isMandatory } : p);
      } else {
        nextPolicies = [...policies, { subjectId, isMandatory: true }];
      }
      
      return { ...c, mandatorySubjectPolicies: nextPolicies };
    }));
  };

  // New Class input state
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState<'O-Level' | 'A-Level' | 'Junior' | 'Senior' | 'General'>('O-Level');
  const [newClassTeacher, setNewClassTeacher] = useState('');

  // New Stream input state
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamPatron, setNewStreamPatron] = useState('');
  const [newStreamRoom, setNewStreamRoom] = useState('');
  const [newStreamCapacity, setNewStreamCapacity] = useState('50');
  const [newStreamColor, setNewStreamColor] = useState('#1E40AF');

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const name = newClassName.trim();
    if (classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setFeedback(`Class ${name} already exists.`);
      return;
    }

    const newCls: ClassConfig = {
      id: `cls_${Date.now()}`,
      name,
      level: newClassLevel,
      classTeacher: newClassTeacher || undefined,
      description: `${name} Academic Registration Division`,
      streams: [
        {
          id: `st_${Date.now()}_1`,
          name: 'North',
          color: '#1E40AF',
          patronName: newClassTeacher || '',
          room: 'Main Academic Wing',
          capacity: 50,
        },
      ],
    };

    setClasses([...classes, newCls]);
    setSelectedClassId(newCls.id);
    setNewClassName('');
    setNewClassTeacher('');
    setFeedback(`Class ${name} created with default North stream.`);
  };

  const handleDeleteClass = (classId: string) => {
    if (classes.length <= 1) {
      setFeedback('At least one class must be registered in the school system.');
      return;
    }
    const updated = classes.filter((c) => c.id !== classId);
    setClasses(updated);
    if (selectedClassId === classId) {
      setSelectedClassId(updated[0].id);
    }
    setFeedback('Class removed.');
  };

  const handleAddStream = () => {
    if (!newStreamName.trim() || !selectedClass) return;
    const sName = newStreamName.trim();
    if (selectedClass.streams.some((s) => s.name.toLowerCase() === sName.toLowerCase())) {
      setFeedback(`Stream "${sName}" already exists in ${selectedClass.name}.`);
      return;
    }

    const newStream: StreamInfo = {
      id: `st_${Date.now()}`,
      name: sName,
      patronName: newStreamPatron || undefined,
      room: newStreamRoom || undefined,
      capacity: parseInt(newStreamCapacity) || 50,
      color: newStreamColor,
    };

    const updatedClasses = classes.map((c) => {
      if (c.id === selectedClass.id) {
        return {
          ...c,
          streams: [...c.streams, newStream],
        };
      }
      return c;
    });

    setClasses(updatedClasses);
    setNewStreamName('');
    setNewStreamPatron('');
    setNewStreamRoom('');
    setFeedback(`Added Stream ${sName} to ${selectedClass.name}.`);
  };

  const handleDeleteStream = (streamId: string) => {
    if (!selectedClass) return;
    if (selectedClass.streams.length <= 1) {
      setFeedback(`Every class must have at least one registered stream.`);
      return;
    }

    const updatedClasses = classes.map((c) => {
      if (c.id === selectedClass.id) {
        return {
          ...c,
          streams: c.streams.filter((s) => s.id !== streamId),
        };
      }
      return c;
    });

    setClasses(updatedClasses);
    setFeedback('Stream removed.');
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const distinctClasses = classes.map((c) => c.name);
      const allStreamsSet = new Set<string>();
      classes.forEach((c) => c.streams.forEach((s) => allStreamsSet.add(s.name)));

      const updatedSettings: SchoolSettings = {
        ...settings,
        registeredClasses: classes,
        availableClasses: distinctClasses,
        availableStreams: Array.from(allStreamsSet),
        updatedAt: new Date().toISOString(),
      };

      await onSaveSettings(updatedSettings);
      setFeedback('School Classes and Streams registered successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      setFeedback('Failed to save settings to database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper metrics for selected class
  const classLearners = learners.filter((l) => l.class === selectedClass?.name);

  return (
    <div id="class_stream_manager_modal" className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#7A1326] text-[#FAF8F5] px-6 py-4 flex items-center justify-between border-b-2 border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <VivaBadge size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold tracking-tight">
                  Academic Class & Stream Registration Directorate
                </h2>
                <span className="bg-[#D4AF37] text-[#1A1A1A] text-[9px] font-mono px-2 py-0.5 font-bold uppercase tracking-wider">
                  VCS Structure
                </span>
              </div>
              <p className="text-[11px] text-[#FAF8F5]/80">
                Configure classes, academic levels, stream partitions, classroom capacities & assigned patrons
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded transition-colors text-[#FAF8F5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback bar */}
        {feedback && (
          <div className="bg-amber-100 border-b border-amber-300 px-6 py-2 text-xs font-semibold text-amber-900 flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-amber-800 text-xs hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Registered Classes List (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-4 border-r border-[#1A1A1A]/15 pr-0 md:pr-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#7A1326]" />
                <span>Classes ({classes.length})</span>
              </h3>
            </div>

            {/* Class List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {classes.map((cls) => {
                const count = learners.filter((l) => l.class === cls.name).length;
                const isSelected = cls.id === selectedClass?.id;
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-3 border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#7A1326] text-white border-[#7A1326] shadow-sm'
                        : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#7A1326]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-base">{cls.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 font-mono uppercase ${
                            isSelected ? 'bg-[#D4AF37] text-[#1A1A1A] font-bold' : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {cls.level}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate max-w-[170px] ${isSelected ? 'text-white/80' : 'text-neutral-500'}`}>
                        {cls.streams.length} Stream{cls.streams.length > 1 ? 's' : ''} ({cls.streams.map((s) => s.name).join(', ')})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                        {count} stds
                      </span>
                      {classes.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(cls.id);
                          }}
                          className={`p-1 hover:text-red-500 transition-colors ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}
                          title="Delete class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Class Card */}
            <div className="p-3 bg-white border border-[#1A1A1A]/20 space-y-2 mt-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A1326] flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Register New Class</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="e.g. S.3, Grade 10"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="px-2 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-serif focus:outline-none focus:border-[#7A1326]"
                />
                <select
                  value={newClassLevel}
                  onChange={(e) => setNewClassLevel(e.target.value as any)}
                  className="px-2 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-mono focus:outline-none"
                >
                  <option value="O-Level">O-Level</option>
                  <option value="A-Level">A-Level</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="General">General</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Class Teacher Name (Optional)"
                value={newClassTeacher}
                onChange={(e) => setNewClassTeacher(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-serif focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddClass}
                className="w-full py-1.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#7A1326] transition-colors"
              >
                + Add Class
              </button>
            </div>
          </div>

          {/* Right Column: Streams for Selected Class (8 cols) */}
          <div className="md:col-span-8 flex flex-col gap-4">
            {selectedClass ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1A1A1A]/15">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                        {selectedClass.name} Streams & Roster Partitions
                      </h3>
                      <span className="bg-[#7A1326] text-white text-[10px] font-mono px-2 py-0.5 font-bold uppercase">
                        {selectedClass.level}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Class Teacher: <span className="font-semibold">{selectedClass.classTeacher || 'Unassigned'}</span> • {classLearners.length} Enrolled Students
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono bg-emerald-100 text-emerald-900 px-2.5 py-1 border border-emerald-300 font-bold">
                      {classLearners.filter((l) => l.subjects.every((s) => s.status === 'cleared')).length} Cleared
                    </span>
                    <span className="text-[11px] font-mono bg-amber-100 text-amber-900 px-2.5 py-1 border border-amber-300 font-bold">
                      {classLearners.filter((l) => l.subjects.some((s) => s.status !== 'cleared')).length} In-Progress
                    </span>
                  </div>
                </div>

                {/* Academic Requirement Policy */}
                <div className="bg-white border-2 border-[#1A1A1A]/10 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 border-b border-[#1A1A1A]/10 pb-2">
                    <BookOpen className="w-5 h-5 text-[#7A1326]" />
                    <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">Academic Requirement Policy</h3>
                  </div>
                  <p className="text-[11px] text-neutral-500 mb-4 leading-relaxed">
                    Set mandatory subjects for <span className="font-bold text-[#1A1A1A]">{selectedClass.name}</span>. 
                    Learners will be flagged as "Pending" until these subjects are cleared, regardless of other scores.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {allSubjects.map(sub => {
                      const policy = selectedClass.mandatorySubjectPolicies?.find(p => p.subjectId === sub.id);
                      const isMandatory = policy?.isMandatory || false;
                      
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleToggleMandatory(sub.id)}
                          className={`flex items-center justify-between px-3 py-2.5 border-2 transition-all group ${
                            isMandatory 
                              ? 'bg-[#7A1326]/5 border-[#7A1326] text-[#7A1326]' 
                              : 'bg-[#FAF8F5] border-neutral-100 text-neutral-400 hover:border-[#1A1A1A]/20'
                          }`}
                        >
                          <div className="text-left overflow-hidden">
                            <p className="text-[10px] font-bold uppercase tracking-wider truncate">{sub.name}</p>
                            <p className="text-[8px] font-mono uppercase tracking-tighter opacity-70">
                              {isMandatory ? 'REQUIRED CORE' : 'OPTIONAL / ELECTIVE'}
                            </p>
                          </div>
                          {isMandatory ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 border border-dashed border-neutral-300 shrink-0 group-hover:border-[#1A1A1A]/30" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Streams Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {selectedClass.streams.map((st) => {
                    const stLearners = classLearners.filter((l) => l.stream === st.name);
                    const clearedCount = stLearners.filter((l) => l.subjects.every((s) => s.status === 'cleared')).length;
                    const clearPct = stLearners.length > 0 ? Math.round((clearedCount / stLearners.length) * 100) : 0;

                    return (
                      <div
                        key={st.id}
                        className="p-3.5 bg-white border-2 border-[#1A1A1A]/20 hover:border-[#1A1A1A] transition-all flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full border border-black/20"
                                style={{ backgroundColor: st.color || '#7A1326' }}
                              />
                              <h4 className="font-serif font-bold text-base text-[#1A1A1A]">
                                Stream {st.name}
                              </h4>
                            </div>
                            {selectedClass.streams.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStream(st.id)}
                                className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                                title="Remove stream"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="mt-2 space-y-1 text-xs text-neutral-600">
                            <p className="flex items-center justify-between">
                              <span className="opacity-70">Stream Patron:</span>
                              <span className="font-semibold text-neutral-900">{st.patronName || 'Unassigned'}</span>
                            </p>
                            <p className="flex items-center justify-between">
                              <span className="opacity-70">Room / Hall:</span>
                              <span className="font-mono text-neutral-800">{st.room || 'General Wing'}</span>
                            </p>
                            <p className="flex items-center justify-between">
                              <span className="opacity-70">Enrolled / Cap:</span>
                              <span className="font-mono font-bold text-neutral-900">
                                {stLearners.length} / {st.capacity || 50}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Stream progress bar */}
                        <div className="mt-3 pt-2 border-t border-[#1A1A1A]/10">
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className="text-neutral-500">Clearance Status:</span>
                            <span className="font-bold text-emerald-700">{clearPct}% ({clearedCount}/{stLearners.length})</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 transition-all"
                              style={{ width: `${clearPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Stream to Selected Class Card */}
                <div className="p-4 bg-white border border-[#1A1A1A]/20 space-y-3">
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#7A1326] flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register New Stream in {selectedClass.name}</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Stream (e.g. East, Blue, Sciences)"
                      value={newStreamName}
                      onChange={(e) => setNewStreamName(e.target.value)}
                      className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-serif focus:outline-none focus:border-[#7A1326]"
                    />
                    <input
                      type="text"
                      placeholder="Patron / Teacher Name"
                      value={newStreamPatron}
                      onChange={(e) => setNewStreamPatron(e.target.value)}
                      className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-serif focus:outline-none focus:border-[#7A1326]"
                    />
                    <input
                      type="text"
                      placeholder="Room (e.g. Rm 104)"
                      value={newStreamRoom}
                      onChange={(e) => setNewStreamRoom(e.target.value)}
                      className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-serif focus:outline-none focus:border-[#7A1326]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newStreamColor}
                        onChange={(e) => setNewStreamColor(e.target.value)}
                        className="w-8 h-8 p-0 border border-[#1A1A1A]/20 cursor-pointer rounded"
                        title="Stream Tag Color"
                      />
                      <button
                        type="button"
                        onClick={handleAddStream}
                        className="flex-1 py-1.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] transition-colors"
                      >
                        + Add Stream
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-neutral-400 font-serif">
                Select or add a class on the left to configure streams.
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF8F5] border-t-2 border-[#1A1A1A] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-600 font-mono">
            Total Classes: <span className="font-bold text-neutral-900">{classes.length}</span> • Total Streams: <span className="font-bold text-neutral-900">{classes.reduce((acc, c) => acc + c.streams.length, 0)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#1A1A1A]/30 text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2 bg-[#7A1326] text-[#FAF8F5] border border-[#1A1A1A] text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D4AF37]" />
              <span>{isSaving ? 'Saving Structure...' : 'Save School Structure'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
