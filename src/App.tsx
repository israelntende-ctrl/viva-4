import React, { useState, useEffect, useMemo } from 'react';
import { 
  Learner, 
  UserAccount, 
  SchoolSettings, 
  AuditLogEntry, 
  ClearanceStatus,
  SubjectRecord,
  TermArchive
} from './types';
import { DbService, DEFAULT_SETTINGS, INITIAL_USERS, createDefaultSubjects } from './lib/dbService';
import { ArchiveService } from './lib/archiveService';
import { VivaBadge } from './components/VivaBadge';
import { ClearanceCardRenderer } from './components/CardDesigns/ClearanceCardRenderer';
import { AdminDesignSelector } from './components/AdminDesignSelector';
import { BulkImportModal } from './components/BulkImportModal';
import { BulkStaffImportModal } from './components/BulkStaffImportModal';
import { BulkPrintModal } from './components/BulkPrintModal';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { LearnerClearanceModal } from './components/LearnerClearanceModal';
import { TeacherSubjectAssignmentModal } from './components/TeacherSubjectAssignmentModal';
import { ClearanceAnalyticsDashboard } from './components/ClearanceAnalyticsDashboard';
import { ClassStreamManagerModal } from './components/ClassStreamManagerModal';
import { PublicVerificationModal } from './components/PublicVerificationModal';
import { LearnerTable } from './components/LearnerTable';
import { TermArchiveModal } from './components/TermArchiveModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { 
  Search, 
  Printer, 
  Upload, 
  UserPlus, 
  Palette, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Users, 
  FileText, 
  Sparkles, 
  Layers, 
  Filter, 
  Plus, 
  Database, 
  Eye, 
  RefreshCw, 
  Download,
  AlertCircle,
  Award,
  BookOpen,
  History,
  CheckCheck,
  Building,
  GraduationCap,
  Sparkle,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  PenTool,
  Camera,
  BarChart3,
  SplitSquareVertical,
  LayoutGrid,
  Table as TableIcon,
  FolderArchive,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Session persistence key (stores only the authenticated user's id, never a password)
const SESSION_STORAGE_KEY = 'vcs_session_user_id';

// Neutral placeholder used only while nobody is signed in yet
const GUEST_USER: UserAccount = {
  id: '',
  email: '',
  name: '',
  role: 'teacher',
  department: '',
  title: '',
  initials: '',
  assignedSubjects: [],
  phone: '',
  password: '',
  createdAt: new Date().toISOString(),
};

export default function App() {
  // Database state
  const [learners, setLearners] = useState<Learner[]>([]);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [archives, setArchives] = useState<TermArchive[]>([]);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'synced' | 'offline'>('connecting');

  // Pagination state
  const [pageSize, setPageSize] = useState(50);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);

  // Auth state - nobody is signed in until they pass the login page
  const [currentUser, setCurrentUser] = useState<UserAccount>(GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAttemptedSessionRestore, setHasAttemptedSessionRestore] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register_staff'>('login');

  // Modals state
  const [isDesignSelectorOpen, setIsDesignSelectorOpen] = useState(false);
  const [isClassStreamManagerOpen, setIsClassStreamManagerOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkStaffImportOpen, setIsBulkStaffImportOpen] = useState(false);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [activeInspectLearner, setActiveInspectLearner] = useState<Learner | null>(null);
  const [isAddLearnerOpen, setIsAddLearnerOpen] = useState(false);
  const [isBatchSubjectModalOpen, setIsBatchSubjectModalOpen] = useState(false);
  const [editingTeacherAccount, setEditingTeacherAccount] = useState<UserAccount | null>(null);
  const [isPublicVerificationOpen, setIsPublicVerificationOpen] = useState(false);
  const [isTermArchiveOpen, setIsTermArchiveOpen] = useState(false);

  // Batch subject clearance dialog state
  const [batchSubjectTarget, setBatchSubjectTarget] = useState<string>('sub_math');
  const [batchActionStatus, setBatchActionStatus] = useState<ClearanceStatus>('cleared');

  // New learner form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    regNo: '',
    class: 'S.4',
    stream: 'North',
    house: 'Lumumba House',
    guardianContact: '',
  });

  // UI Navigation & Filters
  const [activeNavTab, setActiveNavTab] = useState<'clearance' | 'registry' | 'analytics' | 'faculty' | 'audit'>('clearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStream, setSelectedStream] = useState<string>('ALL');
  const [streamSeparationMode, setStreamSeparationMode] = useState<'table' | 'split_streams'>('table');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'CLEARED' | 'PENDING'>('ALL');
  const [selectedDeficientSubject, setSelectedDeficientSubject] = useState<string>('ALL');
  const [facultyDeptFilter, setFacultyDeptFilter] = useState<string>('ALL');
  const [facultySearchQuery, setFacultySearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMyClearancesToday, setShowMyClearancesToday] = useState(false);

  // 1. Initialize Firestore and subscribe to real-time collections
  useEffect(() => {
    let unsubscribeLearners = () => {};
    let unsubscribeUsers = () => {};
    let unsubscribeSettings = () => {};
    let unsubscribeLogs = () => {};
    let unsubscribeSms = () => {};
    let unsubscribeArch = () => {};

    const setupDatabase = async () => {
      try {
        await DbService.initDatabase();
        setDbStatus('synced');

        unsubscribeLearners = DbService.subscribeLearners((data) => {
          setLearners(data);
        });

        unsubscribeUsers = DbService.subscribeUsers((userData) => {
          setUsers(userData);
          setCurrentUser((prev) => {
            if (!prev.id) return prev; // nobody signed in yet - leave as guest
            const found = userData.find((u) => u.id === prev.id);
            return found || prev;
          });
        });

        unsubscribeSettings = DbService.subscribeSettings((settingsData) => {
          setSettings(settingsData);
        });

        unsubscribeLogs = DbService.subscribeAuditLogs((logsData) => {
          setAuditLogs(logsData);
        });

        unsubscribeArch = ArchiveService.subscribeArchives((arch) => {
          setArchives(arch);
        });
      } catch (err) {
        console.warn('Firestore sync note:', err);
        setDbStatus('offline');
      }
    };

    setupDatabase();

    return () => {
      unsubscribeLearners();
      unsubscribeUsers();
      unsubscribeSettings();
      unsubscribeLogs();
      unsubscribeArch();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // 2. Attempt to restore a previously signed-in session (by user id only - never stores passwords)
  useEffect(() => {
    if (hasAttemptedSessionRestore) return;
    if (users.length === 0) return;
    try {
      const storedId = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedId) {
        const found = users.find((u) => u.id === storedId);
        if (found) {
          setCurrentUser(found);
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.warn('Could not restore session:', err);
    }
    setHasAttemptedSessionRestore(true);
  }, [users, hasAttemptedSessionRestore]);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, user.id);
    } catch (err) {
      console.warn('Could not persist session:', err);
    }
    showToast(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(GUEST_USER);
    setIsAuthModalOpen(false);
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not clear session:', err);
    }
    showToast('Signed out successfully.');
  };

  // Distinct Registered Classes List
  const distinctClasses = useMemo(() => {
    const fromLearners = Array.from(new Set(learners.map((l) => l.class))).filter(Boolean);
    const fromSettings = settings.availableClasses || (settings.registeredClasses ? settings.registeredClasses.map((c) => c.name) : []);
    const combined = Array.from(new Set([...fromSettings, ...fromLearners]));
    return combined.sort();
  }, [learners, settings]);

  // Available Streams for active class selection
  const availableStreams = useMemo(() => {
    const relevant = selectedClass === 'ALL'
      ? learners
      : learners.filter((l) => l.class === selectedClass);
    const s = new Set<string>();
    relevant.forEach((l) => {
      if (l.stream) s.add(l.stream);
    });
    // Also include from settings if class matches
    if (selectedClass !== 'ALL' && settings.registeredClasses) {
      const foundCls = settings.registeredClasses.find((c) => c.name === selectedClass);
      if (foundCls) {
        foundCls.streams.forEach((st) => s.add(st.name));
      }
    }
    return Array.from(s).sort();
  }, [learners, selectedClass, settings]);

  // Unique subject list for filter
  const distinctSubjects = useMemo(() => {
    const map = new Map<string, string>();
    learners.forEach((l) => {
      l.subjects.forEach((sub) => {
        if (!map.has(sub.id)) {
          map.set(sub.id, sub.name);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [learners]);

  // Departments list for faculty filter
  const distinctDepartments = useMemo(() => {
    const s = new Set<string>();
    users.forEach((u) => {
      if (u.department) s.add(u.department);
    });
    return Array.from(s).sort();
  }, [users]);

  // Filtered Learners
  const filteredLearners = useMemo(() => {
    return learners.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.regNo.toLowerCase().includes(q) ||
        l.house.toLowerCase().includes(q) ||
        l.class.toLowerCase().includes(q);

      const matchClass = selectedClass === 'ALL' || l.class === selectedClass;
      const matchStream = selectedStream === 'ALL' || l.stream === selectedStream;

      const isCompleted = l.subjects.length > 0 && l.subjects.every((s) => s.status === 'cleared');
      const matchStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'CLEARED' && isCompleted) ||
        (selectedStatusFilter === 'PENDING' && !isCompleted);

      const matchDeficiency =
        selectedDeficientSubject === 'ALL' ||
        l.subjects.some((s) => s.id === selectedDeficientSubject && s.status !== 'cleared');

      const matchMyClearancesToday = !showMyClearancesToday || l.subjects.some(s => {
        const today = new Date().toLocaleDateString('en-GB');
        return s.officer === currentUser.name.toUpperCase() && s.signedDate === today;
      });

      return matchSearch && matchClass && matchStream && matchStatus && matchDeficiency && matchMyClearancesToday;
    });
  }, [learners, searchQuery, selectedClass, selectedStream, selectedStatusFilter, selectedDeficientSubject, showMyClearancesToday, currentUser.name]);

  const paginatedLearners = useMemo(() => {
    return filteredLearners.slice(0, pageSize);
  }, [filteredLearners, pageSize]);

  const hasMoreLearners = filteredLearners.length > pageSize;

  // Filtered Faculty Users
  const filteredFaculty = useMemo(() => {
    return users.filter((u) => {
      const q = facultySearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.assignedSubjects.some((sub) => sub.toLowerCase().includes(q));

      const matchDept = facultyDeptFilter === 'ALL' || u.department === facultyDeptFilter;

      return matchSearch && matchDept;
    });
  }, [users, facultySearchQuery, facultyDeptFilter]);

  // Overall School Clearance Metrics
  const metrics = useMemo(() => {
    let totalSubjects = 0;
    let clearedSubjects = 0;
    let fullyClearedCount = 0;

    learners.forEach((l) => {
      const c = l.subjects.filter((s) => s.status === 'cleared').length;
      totalSubjects += l.subjects.length;
      clearedSubjects += c;
      if (c === l.subjects.length && l.subjects.length > 0) {
        fullyClearedCount++;
      }
    });

    const completionRate =
      totalSubjects > 0 ? Math.round((clearedSubjects / totalSubjects) * 100) : 0;

    return {
      totalLearners: learners.length,
      fullyClearedCount,
      pendingCount: learners.length - fullyClearedCount,
      completionRate,
      clearedSubjects,
      totalSubjects,
      facultyCount: users.length,
    };
  }, [learners, users]);

  // Check if current user is authorized to sign off a subject
  const isUserAuthorizedForSubject = (subjectName: string): boolean => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.assignedSubjects?.includes('ALL')) return true;
    return currentUser.assignedSubjects?.some((sub) =>
      sub.toLowerCase().includes(subjectName.toLowerCase()) ||
      subjectName.toLowerCase().includes(sub.toLowerCase())
    ) || false;
  };

  // Quick Subject Clearance Toggle in Matrix
  const handleQuickStatusChange = async (
    learner: Learner,
    subjectId: string,
    newStatus: ClearanceStatus
  ) => {
    const today = new Date().toLocaleDateString('en-GB');
    const targetSubject = learner.subjects.find((s) => s.id === subjectId);
    if (!targetSubject) return;

    if (!isUserAuthorizedForSubject(targetSubject.name)) {
      showToast(`Access Restricted: Only ${targetSubject.officer || 'Assigned Officer'} or Dean/Admin can sign off ${targetSubject.name}.`);
      return;
    }

    const updatedSubjects = learner.subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        status: newStatus,
        officer: newStatus === 'cleared' ? currentUser.name.toUpperCase() : sub.officer,
        signedDate: newStatus === 'cleared' ? today : undefined,
      };
    });

    const updatedLearner: Learner = {
      ...learner,
      subjects: updatedSubjects,
      updatedAt: new Date().toISOString(),
    };

    await DbService.saveLearner(updatedLearner);

    await DbService.logAudit({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      officerName: currentUser.name,
      officerRole: currentUser.role,
      learnerRegNo: learner.regNo,
      learnerName: learner.name,
      subjectName: targetSubject.name,
      action: newStatus === 'cleared' ? 'CLEARED' : newStatus === 'not_cleared' ? 'FLAGGED' : 'RESET',
      details: `Single folio verification updated to ${newStatus.toUpperCase()}`,
    });

    showToast(`${targetSubject.name} marked as ${newStatus.toUpperCase()} for ${learner.name}`);
  };

  // Batch Clear Subject for Currently Filtered Students
  const handleExecuteBatchSubjectClearance = async () => {
    if (filteredLearners.length === 0) return;
    const targetSubObj = distinctSubjects.find((s) => s.id === batchSubjectTarget);
    const subName = targetSubObj?.name || 'Subject';

    if (!isUserAuthorizedForSubject(subName)) {
      showToast(`Permission denied: You are not authorized to batch clear ${subName}.`);
      return;
    }

    try {
      const count = await DbService.batchUpdateLearnerSubject(
        filteredLearners,
        batchSubjectTarget,
        batchActionStatus,
        currentUser
      );

      try {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#7A1326', '#D4AF37', '#10B981'],
        });
      } catch (_) {}

      setIsBatchSubjectModalOpen(false);
      showToast(`Successfully updated ${subName} to ${batchActionStatus.toUpperCase()} for ${count} students!`);
    } catch (err) {
      console.error(err);
      showToast('Batch update error. Please try again.');
    }
  };

  // Export Matrix to CSV
  const handleExportMatrixCSV = () => {
    const headers = [
      'Registration_Number',
      'Student_Name',
      'Class',
      'Stream',
      'House',
      'Clearance_Percentage',
      'Overall_Status',
      'Mathematics',
      'English_Language',
      'Biology',
      'Chemistry',
      'ICT',
      'Physics',
    ];

    const rows = filteredLearners.map((l) => {
      const clearedCount = l.subjects.filter((s) => s.status === 'cleared').length;
      const isComplete = clearedCount === l.subjects.length;
      const getSubStatus = (code: string) => {
        const found = l.subjects.find((s) => s.code.toLowerCase().includes(code.toLowerCase()) || s.name.toLowerCase().includes(code.toLowerCase()));
        return found ? `${found.status.toUpperCase()} (${found.officer || 'Unsigned'})` : 'N/A';
      };

      return [
        `"${l.regNo}"`,
        `"${l.name}"`,
        `"${l.class}"`,
        `"${l.stream}"`,
        `"${l.house}"`,
        `"${Math.round((clearedCount / l.subjects.length) * 100)}%"`,
        `"${isComplete ? 'CLEARED' : 'PENDING'}"`,
        `"${getSubStatus('math')}"`,
        `"${getSubStatus('eng')}"`,
        `"${getSubStatus('bio')}"`,
        `"${getSubStatus('chem')}"`,
        `"${getSubStatus('ict')}"`,
        `"${getSubStatus('phy')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VCS_Clearance_Matrix_${selectedStream}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Clearance Matrix to CSV successfully.');
  };

  // Export Faculty Roster to CSV
  const handleExportFacultyCSV = () => {
    const headers = ['Staff_Name', 'Email', 'Department', 'Title', 'Role', 'Assigned_Subjects', 'Phone'];
    const rows = filteredFaculty.map((u) => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.department}"`,
      `"${u.title}"`,
      `"${u.role}"`,
      `"${u.assignedSubjects.join('; ')}"`,
      `"${u.phone || ''}"`,
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VCS_Faculty_Roster_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Faculty Roster to CSV successfully.');
  };

  // Add Single Learner
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.regNo.trim()) return;

    const newLearner: Learner = {
      id: `lrn_${Date.now()}`,
      regNo: newStudent.regNo.trim().toUpperCase(),
      name: newStudent.name.trim(),
      class: newStudent.class,
      stream: newStudent.stream,
      house: newStudent.house,
      guardianContact: newStudent.guardianContact,
      feesStatus: 'cleared',
      academicYear: settings.academicYear || '2026',
      term: settings.term || 'Term II',
      subjects: createDefaultSubjects(users),
      createdAt: new Date().toISOString(),
    };

    await DbService.saveLearner(newLearner);
    setNewStudent({
      name: '',
      regNo: '',
      class: 'S4',
      stream: 'A',
      house: 'Lumumba House',
      guardianContact: '',
    });
    setIsAddLearnerOpen(false);
    showToast(`Learner ${newLearner.name} registered in Firestore.`);
  };

  const handleSaveSettings = async (updatedSettings: Partial<SchoolSettings>) => {
    await DbService.saveSettings(updatedSettings);
    showToast('Card design template updated across system.');
  };

  const handleUpdateLearnerFromModal = async (updated: Learner, applyToEntireStream?: boolean) => {
    if (applyToEntireStream) {
      const streamLearners = learners.filter(
        (l) => l.class === updated.class && l.stream === updated.stream && l.id !== updated.id
      );

      for (const peer of streamLearners) {
        const newSubjects = updated.subjects.map((sub) => {
          const existing = peer.subjects.find((ps) => ps.code === sub.code);
          if (existing) return existing;
          return {
            ...sub,
            id: `sub_${sub.code.toLowerCase()}_${peer.id}`,
            status: 'pending' as ClearanceStatus,
            officer: '',
            signatureDataUrl: undefined,
            photoProofUrl: undefined,
          };
        });

        await DbService.saveLearner({
          ...peer,
          subjects: newSubjects,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await DbService.saveLearner(updated);
    setActiveInspectLearner(updated);
    showToast(
      applyToEntireStream
        ? `Subject curriculum synced for all students in ${updated.class} Stream ${updated.stream}!`
        : `Record saved for ${updated.name}`
    );
  };

  const handleSaveTeacherProfile = async (updatedTeacher: UserAccount) => {
    await DbService.saveUser(updatedTeacher);
    if (currentUser.id === updatedTeacher.id) {
      setCurrentUser(updatedTeacher);
    }
    showToast(`Updated faculty profile & subjects for ${updatedTeacher.name}`);
  };

  // Gate the entire portal behind authentication - render the login page until a
  // real staff account has signed in with valid credentials.
  if (!isAuthenticated) {
    return (
      <LoginPage
        users={users}
        dbStatus={dbStatus}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div id="vcs-portal-root" className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] font-sans flex flex-col antialiased selection:bg-[#7A1326] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#7A1326] text-white px-5 py-3 shadow-2xl border-2 border-[#D4AF37] flex items-center gap-3 transition-all duration-300 transform translate-y-0 text-xs font-semibold uppercase tracking-wider animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-[#F6D365]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BRANDED BAR WITH INSTITUTIONAL CREST & AUTH STATUS */}
      <header className="bg-gradient-to-r from-[#5B0B19] via-[#7A1326] to-[#5B0B19] text-white border-b-2 border-[#D4AF37] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & School Header */}
          <div className="flex items-center gap-3.5">
            <VivaBadge size="md" className="cursor-pointer hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#F6D365]">
                  Victory College School
                </span>
                <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-widest bg-black/40 text-white/90 px-2 py-0.5 border border-[#D4AF37]/40 font-mono">
                  <Database className="w-2.5 h-2.5 text-emerald-400" />
                  Firestore Live
                </span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Learner Notes Clearance Portal
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-white/70 hidden sm:block">
                {settings.schoolMotto || 'Knowledge • Virtue • Service'} • {settings.academicYear || '2026'} {settings.term || 'Term II'}
              </p>
            </div>
          </div>

          {/* User Account Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Action: Design Selector */}
            <button
              id="btn-open-design-studio"
              onClick={() => setIsDesignSelectorOpen(true)}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-[#D4AF37] text-[#5B0B19] text-xs font-bold uppercase tracking-wider hover:bg-[#F6D365] transition-all shadow-xs"
              title="Select or randomize the clearance card design template"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Card Design Studio</span>
            </button>

            {/* Current Logged In Officer Badge */}
            <div className="flex items-center gap-2 bg-black/35 border border-white/20 p-1.5 sm:px-3 sm:py-1.5">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#5B0B19] flex items-center justify-center text-xs font-bold font-serif shadow-xs">
                {currentUser.initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-tight truncate max-w-[130px] text-white">
                  {currentUser.name}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-[#F6D365]">
                  {currentUser.role === 'admin' ? '👑 Dean / Admin' : `📚 ${currentUser.department}`}
                </p>
              </div>

              {/* Switch to another registered officer (still requires their password) */}
              <button
                id="btn-open-auth-modal"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="ml-1 px-2 py-1 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded text-[10px] uppercase font-bold flex items-center gap-1 transition-colors"
                title="Switch active faculty officer (credentials required)"
              >
                <LogIn className="w-3 h-3 text-[#F6D365]" />
                <span>Switch</span>
              </button>

              {/* Sign out and return to the login page */}
              <button
                id="btn-logout"
                onClick={handleLogout}
                className="px-2 py-1 text-white/90 hover:text-white bg-white/10 hover:bg-rose-900/60 border border-white/15 rounded text-[10px] uppercase font-bold flex items-center gap-1 transition-colors"
                title="Sign out of the clearance portal"
              >
                <LogOut className="w-3 h-3 text-[#F6D365]" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SUB-HEADER NAVIGATION & ACTIONS BAR */}
      <div className="bg-white border-b border-[#1A1A1A]/10 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3">
            {/* Primary Navigation Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 text-xs font-bold uppercase tracking-wider overflow-x-auto">
              <button
                id="nav-tab-clearance"
                onClick={() => setActiveNavTab('clearance')}
                className={`py-2 px-3 sm:px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeNavTab === 'clearance'
                    ? 'border-[#7A1326] text-[#7A1326]'
                    : 'border-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Clearance Matrix ({learners.length})
              </button>

              <button
                id="nav-tab-registry"
                onClick={() => setActiveNavTab('registry')}
                className={`py-2 px-3 sm:px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeNavTab === 'registry'
                    ? 'border-[#7A1326] text-[#7A1326]'
                    : 'border-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
              >
                <FileText className="w-4 h-4" />
                Printable Cards Gallery
              </button>

              <button
                id="nav-tab-analytics"
                onClick={() => setActiveNavTab('analytics')}
                className={`py-2 px-3 sm:px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeNavTab === 'analytics'
                    ? 'border-[#7A1326] text-[#7A1326]'
                    : 'border-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-[#7A1326]" />
                Analytics & Graphs
              </button>

              <button
                id="nav-tab-faculty"
                onClick={() => setActiveNavTab('faculty')}
                className={`py-2 px-3 sm:px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeNavTab === 'faculty'
                    ? 'border-[#7A1326] text-[#7A1326]'
                    : 'border-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
              >
                <Users className="w-4 h-4" />
                Faculty Roster ({users.length})
              </button>

              <button
                id="nav-tab-audit"
                onClick={() => setActiveNavTab('audit')}
                className={`py-2 px-3 sm:px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeNavTab === 'audit'
                    ? 'border-[#7A1326] text-[#7A1326]'
                    : 'border-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
              >
                <History className="w-4 h-4" />
                Audit Logs ({auditLogs.length})
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
              {/* Backup & Restore Button */}
              <button
                id="btn-open-backup"
                onClick={() => setIsBackupRestoreOpen(true)}
                className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider hover:bg-amber-100 transition-all flex items-center gap-1.5 shadow-2xs"
                title="Full data backup and system restore"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Backup/Restore</span>
              </button>

              {/* Anti-Forgery Certificate Verification Button */}
              <button
                id="btn-open-verification"
                onClick={() => setIsPublicVerificationOpen(true)}
                className="px-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
                title="Verify genuine clearance cards and anti-forgery cryptographic seals"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verify Card</span>
              </button>

              {/* Term Archive Button */}
              <button
                id="btn-open-archives"
                onClick={() => setIsTermArchiveOpen(true)}
                className="px-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
                title="Academic term archives and historical clearance performance"
              >
                <FolderArchive className="w-3.5 h-3.5 text-amber-700" />
                <span>Term Archives</span>
              </button>

              {/* Classes & Streams Registration Button */}
              <button
                id="btn-open-classes-streams"
                onClick={() => setIsClassStreamManagerOpen(true)}
                className="px-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#7A1326] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
                title="Register and configure classes, streams, patrons and capacities"
              >
                <Layers className="w-3.5 h-3.5 text-[#7A1326]" />
                <span>Classes & Streams</span>
              </button>

              {/* Bulk Staff Import Button */}
              <button
                id="btn-open-bulk-staff-import"
                onClick={() => setIsBulkStaffImportOpen(true)}
                className="px-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
                title="Bulk import teachers and faculty members from CSV"
              >
                <Users className="w-3.5 h-3.5 text-[#7A1326]" />
                <span>Bulk Staff CSV</span>
              </button>

              {/* Bulk Learners Import Button */}
              <button
                id="btn-open-bulk-import"
                onClick={() => setIsBulkImportOpen(true)}
                className="px-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
                title="Bulk import students cohort from CSV"
              >
                <Upload className="w-3.5 h-3.5 text-[#7A1326]" />
                <span>Bulk Learners CSV</span>
              </button>

              {/* Batch Print Cards Button */}
              <button
                id="btn-open-bulk-print"
                onClick={() => setIsBulkPrintOpen(true)}
                className="px-3 py-1.5 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#F6D365]" />
                <span>Batch Print</span>
              </button>

              {/* Add Single Learner Button */}
              <button
                id="btn-new-learner"
                onClick={() => setIsAddLearnerOpen(true)}
                className="p-1.5 sm:px-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:border-[#7A1326] transition-all flex items-center gap-1"
                title="Add individual candidate"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Student</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS & OVERVIEW CARDS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 border border-[#7A1326]/20 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold opacity-50">Total Enrolled</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">{metrics.totalLearners}</p>
              <p className="text-[10px] opacity-60">S4 Candidate Cohort</p>
            </div>
            <div className="w-10 h-10 bg-[#7A1326]/10 text-[#7A1326] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 border border-emerald-300 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-800">100% Cleared</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700">{metrics.fullyClearedCount}</p>
              <p className="text-[10px] text-emerald-700 font-semibold">{metrics.completionRate}% Cohort Ready</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 border border-amber-300 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-800">Pending Review</p>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-700">{metrics.pendingCount}</p>
              <p className="text-[10px] text-amber-700 font-semibold">{metrics.clearedSubjects}/{metrics.totalSubjects} Folios Signed</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 border border-[#1A1A1A]/15 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold opacity-50">Active Card Style</p>
              <p className="font-serif text-lg font-bold text-[#7A1326] truncate max-w-[140px]">
                {settings.activeCardDesign?.toUpperCase() || 'VIVA-CRIMSON'}
              </p>
              <p className="text-[10px] text-[#D4AF37] font-bold">
                {settings.cardsPerPage || 1} Card / Sheet
              </p>
            </div>
            <button
              onClick={() => setIsDesignSelectorOpen(true)}
              className="w-10 h-10 bg-[#FAF8F5] border border-[#1A1A1A]/20 flex items-center justify-center hover:bg-[#7A1326] hover:text-white transition-colors"
              title="Customize card design and printable template"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        {/* ========================================================================= */}
        {/* TAB 1: CLEARANCE MATRIX (PRIMARY INTERACTIVE DASHBOARD) */}
        {/* ========================================================================= */}
        {activeNavTab === 'clearance' && (
          <div className="space-y-4">
            {/* 1. Class Cohorts Selector Pills Bar */}
            <div className="bg-white p-3.5 border border-[#1A1A1A]/10 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#7A1326]" />
                  Class:
                </span>

                {/* All Classes Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClass('ALL');
                    setSelectedStream('ALL');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                    selectedClass === 'ALL'
                      ? 'bg-[#7A1326] text-white border-[#7A1326] shadow-xs'
                      : 'bg-[#FAF8F5] text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                  }`}
                >
                  <span>All Classes</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    selectedClass === 'ALL' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#1A1A1A]'
                  }`}>
                    {learners.length}
                  </span>
                </button>

                {/* Individual Class Pills */}
                {distinctClasses.map((cls) => {
                  const classLearners = learners.filter((l) => l.class === cls);
                  const isSelected = selectedClass === cls;
                  const clearedCount = classLearners.filter((l) => l.subjects.every((s) => s.status === 'cleared')).length;
                  const rate = classLearners.length > 0 ? Math.round((clearedCount / classLearners.length) * 100) : 0;

                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setSelectedClass(cls);
                        setSelectedStream('ALL');
                      }}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#7A1326] text-white border-[#7A1326] shadow-xs'
                          : 'bg-[#FAF8F5] text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#7A1326] hover:text-[#7A1326]'
                      }`}
                    >
                      <span>{cls}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-[#1A1A1A]'
                      }`}>
                        {classLearners.length}
                      </span>
                      {classLearners.length > 0 && (
                        <span className={`text-[9px] font-mono font-normal ${
                          isSelected ? 'text-[#F6D365]' : rate === 100 ? 'text-emerald-700 font-bold' : 'opacity-60'
                        }`}>
                          {rate}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Class & Stream Configuration Trigger */}
              <button
                type="button"
                onClick={() => setIsClassStreamManagerOpen(true)}
                className="px-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-[11px] font-bold uppercase tracking-wider hover:border-[#7A1326] hover:text-[#7A1326] transition-all flex items-center gap-1.5"
                title="Manage class names, streams, capacities, and assigned patrons"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#7A1326]" />
                <span>Configure Classes & Streams</span>
              </button>
            </div>

            {/* 2. Filter, Search, and Stream Separation Mode Bar */}
            <div className="bg-white p-4 border border-[#1A1A1A]/10 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 opacity-40" />
                  <input
                    id="search-clearance-input"
                    type="text"
                    placeholder="Search candidate name, Reg No, House..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs opacity-50 hover:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Stream Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold opacity-50">Stream:</span>
                  <select
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    className="bg-[#FAF8F5] border border-[#1A1A1A]/20 py-1.5 px-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Streams</option>
                    {availableStreams.map((st) => (
                      <option key={st} value={st}>
                        Stream {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold opacity-50">Status:</span>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                    className="bg-[#FAF8F5] border border-[#1A1A1A]/20 py-1.5 px-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="CLEARED">100% Cleared Only</option>
                    <option value="PENDING">Pending Incomplete</option>
                  </select>
                </div>

                {/* Deficiency Subject Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold opacity-50">Deficiency:</span>
                  <select
                    value={selectedDeficientSubject}
                    onChange={(e) => setSelectedDeficientSubject(e.target.value)}
                    className="bg-[#FAF8F5] border border-[#1A1A1A]/20 py-1.5 px-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="ALL">Any Deficiencies</option>
                    {distinctSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        Missing: {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons: Separation Mode Toggle, Batch Sign-off & CSV Export */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Toggle: Table vs Stream Cards */}
                <div className="bg-[#FAF8F5] border border-[#1A1A1A]/20 p-0.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => setStreamSeparationMode('table')}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                      streamSeparationMode === 'table'
                        ? 'bg-[#7A1326] text-white shadow-2xs'
                        : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
                    }`}
                    title="Display learners in a unified data matrix table"
                  >
                    <TableIcon className="w-3 h-3" />
                    <span>Table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStreamSeparationMode('split_streams')}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                      streamSeparationMode === 'split_streams'
                        ? 'bg-[#7A1326] text-white shadow-2xs'
                        : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
                    }`}
                    title="Separate learners into dedicated stream cohorts side-by-side"
                  >
                    <SplitSquareVertical className="w-3 h-3" />
                    <span>Separated Streams</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMyClearancesToday(!showMyClearancesToday)}
                  className={`px-3 py-1.5 border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs ${
                    showMyClearancesToday
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-[#FAF8F5] border-[#1A1A1A]/20 text-[#1A1A1A]/70 hover:border-emerald-600'
                  }`}
                  title="Show only students you cleared today"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${showMyClearancesToday ? 'text-[#F6D365]' : 'text-emerald-600'}`} />
                  <span>My Clearances Today</span>
                </button>

                <button
                  id="btn-batch-signoff"
                  type="button"
                  onClick={() => setIsBatchSubjectModalOpen(true)}
                  className="px-3 py-1.5 bg-[#FAF8F5] border border-[#7A1326]/30 text-[#7A1326] text-xs font-bold uppercase tracking-wider hover:bg-[#7A1326] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
                  title="Batch sign-off or clear a subject for all students currently filtered"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Batch Sign-off ({filteredLearners.length})</span>
                </button>

                <button
                  id="btn-export-matrix"
                  type="button"
                  onClick={handleExportMatrixCSV}
                  className="px-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
                  title="Download complete clearance report as CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* 3A. STREAM SEPARATION VIEW (Split Stream Panels) */}
            {streamSeparationMode === 'split_streams' && (
              <div className="space-y-6">
                {availableStreams.length === 0 ? (
                  <div className="bg-white p-12 text-center border border-[#1A1A1A]/10 opacity-60">
                    <p className="font-serif text-lg font-bold">No streams found for this selection.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {availableStreams.map((st) => {
                      const streamLearners = filteredLearners.filter((l) => l.stream === st);
                      const clearedStreamCount = streamLearners.filter((l) => l.subjects.every((s) => s.status === 'cleared')).length;
                      const streamRate = streamLearners.length > 0 ? Math.round((clearedStreamCount / streamLearners.length) * 100) : 0;

                      // Find stream metadata from settings if available
                      let streamMeta = { patron: 'Unassigned', room: '', capacity: 45 };
                      if (settings.registeredClasses) {
                        for (const c of settings.registeredClasses) {
                          const f = c.streams.find((s) => s.name === st);
                          if (f) {
                            streamMeta = { patron: f.patronName || 'Unassigned', room: f.room || '', capacity: f.capacity || 45 };
                            break;
                          }
                        }
                      }

                      return (
                        <div
                          key={st}
                          className="bg-white border-2 border-[#1A1A1A]/15 shadow-2xs flex flex-col justify-between"
                        >
                          {/* Stream Header */}
                          <div className="p-4 bg-[#FAF8F5] border-b border-[#1A1A1A]/10 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded bg-[#7A1326] text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs">
                                {st.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">
                                  Stream {st} {selectedClass !== 'ALL' ? `• ${selectedClass}` : ''}
                                </h4>
                                <p className="text-[11px] opacity-60">
                                  Patron: <span className="font-semibold text-[#7A1326]">{streamMeta.patron}</span>
                                  {streamMeta.room && ` • Room ${streamMeta.room}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-xs font-mono font-bold text-[#7A1326]">
                                  {clearedStreamCount}/{streamLearners.length} Cleared ({streamRate}%)
                                </p>
                                <p className="text-[10px] opacity-50 font-mono">
                                  Enrolled: {streamLearners.length} / {streamMeta.capacity}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Stream Progress Bar */}
                          <div className="w-full bg-[#1A1A1A]/10 h-1.5">
                            <div
                              className="h-full bg-emerald-600 transition-all duration-300"
                              style={{ width: `${streamRate}%` }}
                            />
                          </div>

                          {/* Candidates in this Stream */}
                          <div className="p-4 flex-1">
                            {streamLearners.length === 0 ? (
                              <p className="text-xs text-center py-6 opacity-50">
                                No candidates enrolled or matching filters in Stream {st}.
                              </p>
                            ) : (
                              <div className="divide-y divide-[#1A1A1A]/10 max-h-[380px] overflow-y-auto">
                                {streamLearners.map((lrn) => {
                                  const clrCount = lrn.subjects.filter((s) => s.status === 'cleared').length;
                                  const isClr = clrCount === lrn.subjects.length;

                                  return (
                                    <div
                                      key={lrn.id}
                                      className="py-2.5 flex items-center justify-between gap-2 hover:bg-[#FAF8F5] px-2 transition-colors"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="font-mono font-bold text-[#7A1326] text-[10px] bg-[#7A1326]/5 px-1.5 py-0.5 border border-[#7A1326]/20 shrink-0">
                                          {lrn.regNo}
                                        </span>
                                        <div className="truncate">
                                          <p className="font-serif font-bold text-xs text-[#1A1A1A] truncate">
                                            {lrn.name}
                                          </p>
                                          <p className="text-[10px] opacity-50 truncate">
                                            {lrn.class} • {lrn.house}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <span
                                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border ${
                                            isClr
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                              : 'bg-amber-50 text-amber-800 border-amber-300'
                                          }`}
                                        >
                                          {clrCount}/{lrn.subjects.length}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() => setActiveInspectLearner(lrn)}
                                          className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[9px] font-bold uppercase tracking-wider hover:bg-[#7A1326] transition-all flex items-center gap-1 shadow-2xs"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>Inspect</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3B. COMPREHENSIVE MATRIX TABLE (Standard Mode) */}
            {streamSeparationMode === 'table' && (
              <LearnerTable 
                filteredLearners={filteredLearners}
                paginatedLearners={paginatedLearners}
                pageSize={pageSize}
                setPageSize={setPageSize}
                hasMoreLearners={hasMoreLearners}
                handleQuickStatusChange={handleQuickStatusChange}
                setActiveInspectLearner={setActiveInspectLearner}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PRINTABLE CARDS GALLERY */}
        {/* ========================================================================= */}
        {activeNavTab === 'registry' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-[#1A1A1A]/10 shadow-2xs">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                  Print-Ready Candidate Clearance Cards
                </h3>
                <p className="text-xs opacity-60">
                  Applied theme: <span className="font-bold text-[#7A1326]">{settings.activeCardDesign?.toUpperCase()}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDesignSelectorOpen(true)}
                  className="px-4 py-2 bg-[#D4AF37] text-[#5B0B19] text-xs font-bold uppercase tracking-wider hover:bg-[#F6D365] transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Palette className="w-3.5 h-3.5" />
                  Customize Card Theme
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkPrintOpen(true)}
                  className="px-4 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F6D365]" />
                  Batch Print Slips
                </button>
              </div>
            </div>

            {/* Grid of Student Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLearners.map((lrn) => {
                const clearedCount = lrn.subjects.filter((s) => s.status === 'cleared').length;
                const isComplete = clearedCount === lrn.subjects.length;

                return (
                  <div
                    key={lrn.id}
                    className="bg-white border-2 border-[#1A1A1A]/15 hover:border-[#7A1326] transition-all p-5 flex flex-col justify-between shadow-2xs group"
                  >
                    <div>
                      {/* Top bar with mini crest */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 mb-3">
                        <div className="flex items-center gap-2">
                          <VivaBadge size="xs" />
                          <span className="font-mono text-xs font-bold text-[#7A1326]">{lrn.regNo}</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${
                            isComplete
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isComplete ? '★ 100% Cleared' : `${clearedCount}/${lrn.subjects.length} Signed`}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-[#1A1A1A] group-hover:text-[#7A1326] transition-colors">
                        {lrn.name}
                      </h4>
                      <p className="text-xs opacity-60">
                        {lrn.class} {lrn.stream} • {lrn.house}
                      </p>

                      {/* Mini Subjects List */}
                      <div className="mt-4 space-y-1 text-xs">
                        {lrn.subjects.slice(0, 4).map((s) => (
                          <div key={s.id} className="flex justify-between py-0.5 border-b border-black/5 text-[11px]">
                            <span className="opacity-70">{s.name}</span>
                            <span className={`font-mono text-[9px] font-bold ${s.status === 'cleared' ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {s.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                        {lrn.subjects.length > 4 && (
                          <p className="text-[10px] opacity-50 italic">
                            + {lrn.subjects.length - 4} more subjects
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-5 pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveInspectLearner(lrn)}
                        className="flex-1 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-[10px] font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-all text-center"
                      >
                        Inspect & Sign
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveInspectLearner(lrn)}
                        className="p-1.5 bg-[#7A1326] text-white hover:bg-[#5B0B19] transition-colors"
                        title="Print this card"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FACULTY & TEACHERS (STAFF DIRECTORY) */}
        {/* ========================================================================= */}
        {activeNavTab === 'faculty' && (
          <div className="space-y-6">
            {/* Faculty Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-[#1A1A1A]/10 shadow-2xs">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                  Academic Faculty & Verification Officers
                </h3>
                <p className="text-xs opacity-60">
                  {users.length} registered teachers with departmental clearance authority.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Bulk Staff Import Button */}
                <button
                  id="btn-faculty-bulk-import"
                  type="button"
                  onClick={() => setIsBulkStaffImportOpen(true)}
                  className="px-3.5 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[#F6D365]" />
                  <span>Bulk Staff Import (CSV)</span>
                </button>

                {/* Export Faculty CSV */}
                <button
                  type="button"
                  onClick={handleExportFacultyCSV}
                  className="px-3.5 py-2 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Staff</span>
                </button>

                {/* Register Single Teacher */}
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('register_staff');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider hover:border-[#7A1326] transition-all flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#7A1326]" />
                    <span>Add Teacher</span>
                  </button>
                )}
              </div>
            </div>

            {/* Department Filter Pills & Faculty Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#1A1A1A]/10">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFacultyDeptFilter('ALL')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    facultyDeptFilter === 'ALL'
                      ? 'bg-[#7A1326] text-white border-[#7A1326]'
                      : 'bg-[#FAF8F5] text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                  }`}
                >
                  All Departments ({users.length})
                </button>
                {distinctDepartments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setFacultyDeptFilter(dept)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      facultyDeptFilter === dept
                        ? 'bg-[#7A1326] text-white border-[#7A1326]'
                        : 'bg-[#FAF8F5] text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-40" />
                <input
                  type="text"
                  placeholder="Search faculty name, subject..."
                  value={facultySearchQuery}
                  onChange={(e) => setFacultySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
                />
              </div>
            </div>

            {/* Faculty Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFaculty.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className={`bg-white border p-6 flex flex-col justify-between shadow-2xs transition-all ${
                      isCurrent ? 'border-[#7A1326] ring-2 ring-[#7A1326]/20' : 'border-[#1A1A1A]/15 hover:border-[#7A1326]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#7A1326] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs">
                          {u.initials}
                        </div>
                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${
                            u.role === 'admin'
                              ? 'bg-[#D4AF37] text-[#5B0B19] border-[#B89628]'
                              : 'bg-blue-100 text-blue-900 border-blue-200'
                          }`}
                        >
                          {u.role === 'admin' ? '👑 Dean / Admin' : '📚 Teacher'}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">{u.name}</h4>
                      <p className="text-xs font-semibold text-[#7A1326]">{u.department}</p>
                      <p className="text-[11px] opacity-60 mt-0.5">{u.title}</p>
                      <p className="text-[11px] font-mono opacity-50 mt-2">{u.email}</p>

                      <div className="mt-4 pt-3 border-t border-black/5">
                        <p className="text-[9px] uppercase font-bold tracking-wider opacity-50 mb-1.5">
                          Assigned Clearance Courses:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {u.assignedSubjects.map((sub, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-mono uppercase bg-[#FAF8F5] border border-[#1A1A1A]/15 px-1.5 py-0.5 font-semibold"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-[#1A1A1A]/10 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTeacherAccount(u)}
                        className="px-3 py-1.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 text-[10px] font-bold uppercase tracking-wider hover:border-[#7A1326] hover:text-[#7A1326] flex items-center gap-1 transition-all"
                      >
                        <PenTool className="w-3 h-3 text-[#7A1326]" />
                        <span>Subjects & Signature</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser(u);
                          showToast(`Switched active clearance officer to ${u.name}`);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          isCurrent
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-white hover:bg-[#1A1A1A] hover:text-white border-[#1A1A1A]/20'
                        }`}
                      >
                        {isCurrent ? 'Active Officer' : 'Switch To Officer'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ANALYTICS & DATA VISUALIZATION GRAPHS */}
        {/* ========================================================================= */}
        {activeNavTab === 'analytics' && (
          <ClearanceAnalyticsDashboard
            learners={learners}
            settings={settings}
            users={users}
            onOpenClassStreamManager={() => setIsClassStreamManagerOpen(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DATABASE AUDIT LOGS */}
        {/* ========================================================================= */}
        {activeNavTab === 'audit' && (
          <div className="bg-white border border-[#1A1A1A]/10 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                  Firestore Database Clearance Audit Trail
                </h3>
                <p className="text-xs opacity-60">
                  Real-time immutable history of subject verifications, bulk operations, and approvals.
                </p>
              </div>
              <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-3 py-1 font-bold">
                ● Live Sync Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF8F5] border-b border-[#1A1A1A]/10 text-[9px] uppercase tracking-wider font-bold opacity-60">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Acting Officer</th>
                    <th className="py-2.5 px-3">Learner / Target</th>
                    <th className="py-2.5 px-3">Subject / Module</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]/10 font-mono text-[11px]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center opacity-50">
                        No audit actions recorded yet in this session.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-2 px-3 opacity-60">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#1A1A1A]">{log.officerName}</td>
                        <td className="py-2 px-3 text-[#7A1326] font-bold">{log.learnerRegNo} ({log.learnerName})</td>
                        <td className="py-2 px-3">{log.subjectName}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              log.action === 'CLEARED' || log.action === 'BULK_CLEARED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.action === 'BULK_IMPORT'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 opacity-70 text-[10px]">{log.details || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* ALL MODALS & DIALOGS */}
      {/* ========================================================================= */}

      {/* 0. Class & Stream Registration & Hierarchical Setup Modal */}
      {isClassStreamManagerOpen && (
        <ClassStreamManagerModal
          settings={settings}
          learners={learners}
          users={users}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsClassStreamManagerOpen(false)}
        />
      )}

      {/* 1. Admin Design Selector Modal (Randomizer & Template Chooser) */}
      {isDesignSelectorOpen && (
        <AdminDesignSelector
          settings={settings}
          sampleLearner={learners[0] || filteredLearners[0]}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsDesignSelectorOpen(false)}
        />
      )}

      {/* 2. Bulk Import Learners CSV Modal */}
      {isBulkImportOpen && (
        <BulkImportModal
          currentUser={currentUser}
          officers={users}
          existingLearners={learners}
          onImportComplete={() => {
            showToast('Bulk learners committed successfully to Firestore!');
          }}
          onClose={() => setIsBulkImportOpen(false)}
        />
      )}

      {/* 3. Bulk Import Faculty / Staff CSV Modal */}
      {isBulkStaffImportOpen && (
        <BulkStaffImportModal
          currentUser={currentUser}
          existingUsers={users}
          onImportComplete={() => {
            showToast('Bulk faculty roster committed successfully to Firestore!');
          }}
          onClose={() => setIsBulkStaffImportOpen(false)}
        />
      )}

      {/* 4. Bulk Print Cards Modal */}
      {isBulkPrintOpen && (
        <BulkPrintModal
          learners={learners}
          settings={settings}
          onClose={() => setIsBulkPrintOpen(false)}
        />
      )}

      {/* 5. Auth / Teacher Login Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          currentUser={currentUser}
          users={users}
          mode={authModalMode}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* 6. Learner Inspection & Clearance Slip Modal */}
      {activeInspectLearner && (
        <LearnerClearanceModal
          learner={activeInspectLearner}
          allLearners={learners}
          currentUser={currentUser}
          settings={settings}
          onUpdateLearner={handleUpdateLearnerFromModal}
          onClose={() => setActiveInspectLearner(null)}
        />
      )}

      {/* 6b. Teacher Subject & Signature Assignment Modal */}
      {editingTeacherAccount && (
        <TeacherSubjectAssignmentModal
          teacher={editingTeacherAccount}
          onSaveTeacher={handleSaveTeacherProfile}
          onClose={() => setEditingTeacherAccount(null)}
        />
      )}

      {/* 7. Batch Subject Clearance Modal */}
      {isBatchSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1A1A1A] w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-[#7A1326]" />
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Batch Cohort Sign-off</h3>
              </div>
              <button
                onClick={() => setIsBatchSubjectModalOpen(false)}
                className="w-7 h-7 rounded-full border border-black/20 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs opacity-70">
              Apply clearance status for <span className="font-bold text-[#7A1326]">{filteredLearners.length} currently filtered candidates</span>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">Target Subject</label>
                <select
                  value={batchSubjectTarget}
                  onChange={(e) => setBatchSubjectTarget(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 font-semibold focus:outline-none"
                >
                  {distinctSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">Action Status to Apply</label>
                <select
                  value={batchActionStatus}
                  onChange={(e) => setBatchActionStatus(e.target.value as ClearanceStatus)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 font-semibold focus:outline-none"
                >
                  <option value="cleared">Mark as 100% Cleared & Signed</option>
                  <option value="pending">Reset to Pending Review</option>
                  <option value="not_cleared">Flag as Not Cleared</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                <p className="font-bold">Signing Officer: {currentUser.name}</p>
                <p className="opacity-80">This will record an audit trail event for all {filteredLearners.length} students.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBatchSubjectModalOpen(false)}
                className="px-4 py-2 border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchSubjectClearance}
                className="px-5 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] flex items-center gap-1.5 shadow-xs"
              >
                <CheckCheck className="w-4 h-4 text-[#F6D365]" />
                Execute Batch Sign-off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Add Individual Learner Modal */}
      {isAddLearnerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1A1A1A] w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
              <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Add New Learner</h3>
              <button onClick={() => setIsAddLearnerOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">Full Student Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="e.g. Samuel Kizza"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#7A1326]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">Registration No</label>
                  <input
                    type="text"
                    required
                    value={newStudent.regNo}
                    onChange={(e) => setNewStudent({ ...newStudent, regNo: e.target.value })}
                    placeholder="e.g. VCS099"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 font-mono focus:outline-none focus:border-[#7A1326]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">Class</label>
                  <select
                    value={newStudent.class}
                    onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 font-bold focus:outline-none"
                  >
                    {distinctClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">Stream</label>
                  <select
                    value={newStudent.stream}
                    onChange={(e) => setNewStudent({ ...newStudent, stream: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 font-bold focus:outline-none"
                  >
                    {availableStreams.length > 0 ? (
                      availableStreams.map((st) => (
                        <option key={st} value={st}>
                          Stream {st}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="North">Stream North</option>
                        <option value="South">Stream South</option>
                        <option value="East">Stream East</option>
                        <option value="West">Stream West</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">House / Dormitory</label>
                <input
                  type="text"
                  value={newStudent.house}
                  onChange={(e) => setNewStudent({ ...newStudent, house: e.target.value })}
                  placeholder="e.g. Lumumba House"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">Guardian Contact Phone</label>
                <input
                  type="text"
                  value={newStudent.guardianContact}
                  onChange={(e) => setNewStudent({ ...newStudent, guardianContact: e.target.value })}
                  placeholder="+256 772 000000"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#1A1A1A]/20 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLearnerOpen(false)}
                  className="px-4 py-2 border border-[#1A1A1A]/20 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19]"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. System Backup & Recovery Modal */}
      {isBackupRestoreOpen && (
        <BackupRestoreModal
          isOpen={isBackupRestoreOpen}
          onClose={() => setIsBackupRestoreOpen(false)}
          onRestoreSuccess={() => {
            showToast('System data restored. Refreshing collections...');
            // Optional: trigger full re-fetch if not already covered by onSnapshot
          }}
        />
      )}

      {/* 10. Anti-Forgery Public Certificate Verification Modal */}
      {isPublicVerificationOpen && (
        <PublicVerificationModal
          isOpen={isPublicVerificationOpen}
          onClose={() => setIsPublicVerificationOpen(false)}
          learners={learners}
          settings={settings}
        />
      )}

      {/* 11. Academic Term Archive & Cohort Snapshots Modal */}
      {isTermArchiveOpen && (
        <TermArchiveModal
          isOpen={isTermArchiveOpen}
          onClose={() => setIsTermArchiveOpen(false)}
          learners={learners}
          settings={settings}
          currentUser={currentUser}
          archives={archives}
        />
      )}
    </div>
  );
}
