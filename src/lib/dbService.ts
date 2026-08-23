import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  limit,
  startAfter,
  where,
  QueryConstraint
} from './firebase';
import { Learner, UserAccount, SchoolSettings, AuditLogEntry, SubjectRecord, RandomizedStyleConfig, ClearanceStatus, ClassConfig, StreamInfo, TermArchive } from '../types';
import { hashPassword, verifyPassword } from './security';

// Collection references
const LEARNERS_COL = 'learners';
const USERS_COL = 'users';
const SETTINGS_COL = 'settings';
const AUDIT_LOGS_COL = 'auditLogs';

// Default initial seed data
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user_admin',
    email: 'admin@vcs.ac.ug',
    name: 'Israel Ntende',
    role: 'admin',
    department: 'Directorate of Studies',
    title: 'Dean of Academics & Chief Registrar',
    initials: 'IN',
    assignedSubjects: ['ALL'],
    phone: '+256 772 100 001',
    password: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_ict',
    email: 'isaac.ict@vcs.ac.ug',
    name: 'Mr. Isaac Okello',
    role: 'teacher',
    department: 'ICT Department',
    title: 'Head of Computer Studies',
    initials: 'IO',
    assignedSubjects: ['ICT', 'Computer Studies'],
    phone: '+256 772 491 802',
    password: 'teach',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_math',
    email: 'peter.math@vcs.ac.ug',
    name: 'Mr. Peter Ocen',
    role: 'teacher',
    department: 'Mathematics Dept',
    title: 'Senior Mathematics Master',
    initials: 'PO',
    assignedSubjects: ['Mathematics', 'Pure Math'],
    phone: '+256 701 334 119',
    password: 'teach',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_eng',
    email: 'jane.eng@vcs.ac.ug',
    name: 'Ms. Jane Nabirye',
    role: 'teacher',
    department: 'Languages Dept',
    title: 'Head of English & Literature',
    initials: 'JN',
    assignedSubjects: ['English Language', 'Literature in English'],
    phone: '+256 782 990 412',
    password: 'teach',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_bio',
    email: 'sarah.bio@vcs.ac.ug',
    name: 'Ms. Sarah Namubiru',
    role: 'teacher',
    department: 'Biological Sciences',
    title: 'Biology & Health Sciences Lead',
    initials: 'SN',
    assignedSubjects: ['Biology'],
    phone: '+256 752 888 231',
    password: 'teach',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_chem',
    email: 'musa.chem@vcs.ac.ug',
    name: 'Dr. Musa Ssekandi',
    role: 'teacher',
    department: 'Physical Sciences',
    title: 'Chemistry Lab Supervisor',
    initials: 'MS',
    assignedSubjects: ['Chemistry', 'Physics'],
    phone: '+256 779 123 456',
    password: 'teach',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_CLASSES: ClassConfig[] = [
  {
    id: 'cls_s1',
    name: 'S.1',
    level: 'O-Level',
    classTeacher: 'Mr. David Mukasa',
    description: 'Senior One Lower Secondary Foundation',
    streams: [
      { id: 'st_s1_north', name: 'North', color: '#1E40AF', patronName: 'Mr. David Mukasa', room: 'Block A, Rm 101', capacity: 55 },
      { id: 'st_s1_south', name: 'South', color: '#047857', patronName: 'Ms. Sarah Namubiru', room: 'Block A, Rm 102', capacity: 55 },
      { id: 'st_s1_east', name: 'East', color: '#B45309', patronName: 'Mr. Isaac Okello', room: 'Block A, Rm 103', capacity: 50 },
      { id: 'st_s1_west', name: 'West', color: '#6D28D9', patronName: 'Ms. Jane Nabirye', room: 'Block A, Rm 104', capacity: 50 },
    ],
  },
  {
    id: 'cls_s2',
    name: 'S.2',
    level: 'O-Level',
    classTeacher: 'Ms. Sarah Namubiru',
    description: 'Senior Two Lower Secondary Intermediate',
    streams: [
      { id: 'st_s2_north', name: 'North', color: '#1E40AF', patronName: 'Ms. Sarah Namubiru', room: 'Block A, Rm 201', capacity: 55 },
      { id: 'st_s2_south', name: 'South', color: '#047857', patronName: 'Dr. Musa Ssekandi', room: 'Block A, Rm 202', capacity: 55 },
      { id: 'st_s2_east', name: 'East', color: '#B45309', patronName: 'Mr. Peter Ocen', room: 'Block A, Rm 203', capacity: 50 },
      { id: 'st_s2_west', name: 'West', color: '#6D28D9', patronName: 'Mr. Emmanuel Byaruhanga', room: 'Block A, Rm 204', capacity: 50 },
    ],
  },
  {
    id: 'cls_s3',
    name: 'S.3',
    level: 'O-Level',
    classTeacher: 'Mr. Peter Ocen',
    description: 'Senior Three Pre-Candidate Core Level',
    streams: [
      { id: 'st_s3_north', name: 'North', color: '#1E40AF', patronName: 'Mr. Peter Ocen', room: 'Block B, Rm 101', capacity: 50 },
      { id: 'st_s3_south', name: 'South', color: '#047857', patronName: 'Ms. Jane Nabirye', room: 'Block B, Rm 102', capacity: 50 },
      { id: 'st_s3_east', name: 'East', color: '#B45309', patronName: 'Mr. Kenneth Mugisha', room: 'Block B, Rm 103', capacity: 50 },
      { id: 'st_s3_west', name: 'West', color: '#6D28D9', patronName: 'Ms. Ruth Alitwala', room: 'Block B, Rm 104', capacity: 50 },
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
  {
    id: 'cls_s5',
    name: 'S.5',
    level: 'A-Level',
    classTeacher: 'Mr. Kenneth Mugisha',
    description: 'Senior Five Advanced Level High School',
    streams: [
      { id: 'st_s5_sci', name: 'Sciences', color: '#047857', patronName: 'Mr. Kenneth Mugisha', room: 'Science Annex 1', capacity: 45 },
      { id: 'st_s5_arts', name: 'Arts', color: '#B45309', patronName: 'Mr. David Mukasa', room: 'Humanities Wing 1', capacity: 40 },
      { id: 'st_s5_comm', name: 'Commercial', color: '#1E40AF', patronName: 'Ms. Sarah Namubiru', room: 'Business Lab', capacity: 35 },
    ],
  },
  {
    id: 'cls_s6',
    name: 'S.6',
    level: 'A-Level',
    classTeacher: 'Israel Ntende',
    description: 'Senior Six Advanced Level Candidates (UACE)',
    streams: [
      { id: 'st_s6_sci', name: 'Sciences', color: '#047857', patronName: 'Dr. Musa Ssekandi', room: 'UACE Hall A', capacity: 45 },
      { id: 'st_s6_arts', name: 'Arts', color: '#B45309', patronName: 'Ms. Jane Nabirye', room: 'UACE Hall B', capacity: 40 },
      { id: 'st_s6_comm', name: 'Commercial', color: '#1E40AF', patronName: 'Israel Ntende', room: 'UACE Hall C', capacity: 35 },
    ],
  },
];

export const DEFAULT_SETTINGS: SchoolSettings = {
  id: 'main_settings',
  schoolName: 'Victory College School',
  schoolMotto: 'Knowledge • Virtue • Service',
  pobox: 'P.O. Box 412, Jinja • Academic Verification Directorate',
  academicYear: '2026',
  term: 'Term II Finals',
  activeCardDesign: 'viva-crimson',
  cardsPerPage: 1,
  allowTeacherOverride: false,
  availableClasses: ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'],
  availableStreams: ['North', 'South', 'East', 'West', 'A', 'B', 'Sciences', 'Arts', 'Commercial'],
  registeredClasses: DEFAULT_CLASSES,
  updatedAt: new Date().toISOString(),
  randomizedConfig: {
    id: 'rnd_crimson_gold',
    name: 'Viva Imperial Crimson',
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
};

export const DEFAULT_LEARNER_SEEDS: Learner[] = [
  {
    id: 'lrn_1',
    regNo: 'VCS001',
    name: 'John Ocen',
    class: 'S4',
    stream: 'A',
    house: 'Lumumba House',
    gender: 'M',
    guardianContact: '+256 772 491 802',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      {
        id: 'sub_math',
        name: 'Mathematics',
        code: 'MTH401',
        department: 'Mathematics Dept',
        status: 'cleared',
        officer: 'MR. P. OCEN',
        signedDate: '19/08/2026',
        remarks: 'All 10 past paper workbooks verified and stamped.',
        checklists: [
          { id: 'c1', label: 'Complete Pure & Applied Math notes verified', completed: true },
          { id: 'c2', label: 'Graph books and logarithm tables returned', completed: true },
          { id: 'c3', label: 'Midterm correction folio signed by parent', completed: true },
        ],
      },
      {
        id: 'sub_eng',
        name: 'English Language',
        code: 'ENG401',
        department: 'Languages Dept',
        status: 'cleared',
        officer: 'MS. J. NABIRYE',
        signedDate: '20/08/2026',
        remarks: 'Literature set books and essay dossiers submitted.',
        checklists: [
          { id: 'c1', label: 'Grammar and Composition exercise book up to date', completed: true },
          { id: 'c2', label: 'Literature set-books returned to departmental library', completed: true },
          { id: 'c3', label: 'Speech & debate logbook verified', completed: true },
        ],
      },
      {
        id: 'sub_bio',
        name: 'Biology',
        code: 'BIO401',
        department: 'Biological Sciences',
        status: 'cleared',
        officer: 'MS. S. NAMUBIRU',
        signedDate: '20/08/2026',
        remarks: 'Practical specimen drawings fully evaluated.',
        checklists: [
          { id: 'c1', label: 'All Physiology & Ecology modules notes documented', completed: true },
          { id: 'c2', label: 'Dissection toolkit and lab slides checked in', completed: true },
          { id: 'c3', label: 'Fieldwork project report assessed (Grade: A)', completed: true },
        ],
      },
      {
        id: 'sub_chem',
        name: 'Chemistry',
        code: 'CHM401',
        department: 'Physical Sciences',
        status: 'cleared',
        officer: 'DR. M. SSEKANDI',
        signedDate: '21/08/2026',
        remarks: 'Volumetric and Qualitative analysis folios complete.',
        checklists: [
          { id: 'c1', label: 'Organic and Inorganic Chemistry theory notes complete', completed: true },
          { id: 'c2', label: 'Titration practical workbook verified and signed', completed: true },
          { id: 'c3', label: 'Chemical apparatus clearance card presented', completed: true },
        ],
      },
      {
        id: 'sub_ict',
        name: 'ICT',
        code: 'ICT401',
        department: 'ICT Department',
        status: 'pending',
        officer: 'MR. I. OKELLO',
        remarks: 'Submitting final software design documentation.',
        checklists: [
          { id: 'c1', label: 'All 12 Chapters of ICT Theory fully documented', completed: true },
          { id: 'c2', label: 'Programming & Web development project submitted', completed: false },
          { id: 'c3', label: 'Computer Lab workstation #14 inspection cleared', completed: true },
          { id: 'c4', label: 'Practical flash drives & textbook returned to ICT centre', completed: false },
        ],
      },
      {
        id: 'sub_phy',
        name: 'Physics',
        code: 'PHY401',
        department: 'Physical Sciences',
        status: 'cleared',
        officer: 'MR. K. MUGISHA',
        signedDate: '21/08/2026',
        remarks: 'Mechanics and Optics coursework stamped.',
        checklists: [
          { id: 'c1', label: 'Mechanics, Waves & Electricity notes complete', completed: true },
          { id: 'c2', label: 'Laboratory report file evaluated', completed: true },
        ],
      },
    ],
  },
  {
    id: 'lrn_2',
    regNo: 'VCS002',
    name: 'Sarah Nalwanga',
    class: 'S4',
    stream: 'A',
    house: 'Kabaleega House',
    gender: 'F',
    guardianContact: '+256 701 883 112',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      {
        id: 'sub_math',
        name: 'Mathematics',
        code: 'MTH401',
        department: 'Mathematics Dept',
        status: 'cleared',
        officer: 'MR. P. OCEN',
        signedDate: '19/08/2026',
        remarks: 'High standard folio work.',
        checklists: [
          { id: 'c1', label: 'Complete Pure & Applied Math notes verified', completed: true },
          { id: 'c2', label: 'Graph books and logarithm tables returned', completed: true },
        ],
      },
      {
        id: 'sub_eng',
        name: 'English Language',
        code: 'ENG401',
        department: 'Languages Dept',
        status: 'cleared',
        officer: 'MS. J. NABIRYE',
        signedDate: '19/08/2026',
        remarks: 'Stamped.',
        checklists: [
          { id: 'c1', label: 'Grammar and Composition exercise book up to date', completed: true },
          { id: 'c2', label: 'Literature set-books returned to departmental library', completed: true },
        ],
      },
      {
        id: 'sub_bio',
        name: 'Biology',
        code: 'BIO401',
        department: 'Biological Sciences',
        status: 'cleared',
        officer: 'MS. S. NAMUBIRU',
        signedDate: '20/08/2026',
        remarks: 'Specimen notes approved.',
        checklists: [
          { id: 'c1', label: 'All Physiology & Ecology modules notes documented', completed: true },
          { id: 'c2', label: 'Dissection toolkit and lab slides checked in', completed: true },
        ],
      },
      {
        id: 'sub_chem',
        name: 'Chemistry',
        code: 'CHM401',
        department: 'Physical Sciences',
        status: 'cleared',
        officer: 'DR. M. SSEKANDI',
        signedDate: '20/08/2026',
        remarks: 'Approved.',
        checklists: [
          { id: 'c1', label: 'Organic and Inorganic Chemistry theory notes complete', completed: true },
          { id: 'c2', label: 'Titration practical workbook verified and signed', completed: true },
        ],
      },
      {
        id: 'sub_ict',
        name: 'ICT',
        code: 'ICT401',
        department: 'ICT Department',
        status: 'cleared',
        officer: 'MR. I. OKELLO',
        signedDate: '21/08/2026',
        remarks: 'Project graded A+.',
        checklists: [
          { id: 'c1', label: 'All 12 Chapters of ICT Theory fully documented', completed: true },
          { id: 'c2', label: 'Programming & Web development project submitted', completed: true },
          { id: 'c3', label: 'Computer Lab workstation #14 inspection cleared', completed: true },
          { id: 'c4', label: 'Practical flash drives & textbook returned to ICT centre', completed: true },
        ],
      },
      {
        id: 'sub_phy',
        name: 'Physics',
        code: 'PHY401',
        department: 'Physical Sciences',
        status: 'cleared',
        officer: 'MR. K. MUGISHA',
        signedDate: '21/08/2026',
        remarks: 'Cleared.',
        checklists: [
          { id: 'c1', label: 'Mechanics, Waves & Electricity notes complete', completed: true },
        ],
      },
    ],
  },
  {
    id: 'lrn_3',
    regNo: 'VCS003',
    name: 'David Mukasa',
    class: 'S4',
    stream: 'B',
    house: 'Mwanga House',
    gender: 'M',
    guardianContact: '+256 782 550 491',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      {
        id: 'sub_math',
        name: 'Mathematics',
        code: 'MTH401',
        department: 'Mathematics Dept',
        status: 'pending',
        officer: 'MR. P. OCEN',
        remarks: 'Needs chapter 8 geometry revisions.',
        checklists: [
          { id: 'c1', label: 'Complete Pure & Applied Math notes verified', completed: false },
          { id: 'c2', label: 'Graph books and logarithm tables returned', completed: true },
        ],
      },
      {
        id: 'sub_eng',
        name: 'English Language',
        code: 'ENG401',
        department: 'Languages Dept',
        status: 'cleared',
        officer: 'MS. J. NABIRYE',
        signedDate: '19/08/2026',
        remarks: 'Essays approved.',
        checklists: [
          { id: 'c1', label: 'Grammar and Composition exercise book up to date', completed: true },
          { id: 'c2', label: 'Literature set-books returned to departmental library', completed: true },
        ],
      },
      {
        id: 'sub_bio',
        name: 'Biology',
        code: 'BIO401',
        department: 'Biological Sciences',
        status: 'not_cleared',
        officer: 'MS. S. NAMUBIRU',
        remarks: 'Missing term 2 plant physiology lab notes.',
        checklists: [
          { id: 'c1', label: 'All Physiology & Ecology modules notes documented', completed: false },
          { id: 'c2', label: 'Dissection toolkit and lab slides checked in', completed: false },
        ],
      },
      {
        id: 'sub_chem',
        name: 'Chemistry',
        code: 'CHM401',
        department: 'Physical Sciences',
        status: 'pending',
        officer: 'DR. M. SSEKANDI',
        remarks: '',
        checklists: [
          { id: 'c1', label: 'Organic and Inorganic Chemistry theory notes complete', completed: true },
          { id: 'c2', label: 'Titration practical workbook verified and signed', completed: false },
        ],
      },
      {
        id: 'sub_ict',
        name: 'ICT',
        code: 'ICT401',
        department: 'ICT Department',
        status: 'pending',
        officer: 'MR. I. OKELLO',
        remarks: '',
        checklists: [
          { id: 'c1', label: 'All 12 Chapters of ICT Theory fully documented', completed: false },
          { id: 'c2', label: 'Programming & Web development project submitted', completed: false },
          { id: 'c3', label: 'Computer Lab workstation #14 inspection cleared', completed: true },
          { id: 'c4', label: 'Practical flash drives & textbook returned to ICT centre', completed: false },
        ],
      },
      {
        id: 'sub_phy',
        name: 'Physics',
        code: 'PHY401',
        department: 'Physical Sciences',
        status: 'pending',
        officer: 'MR. K. MUGISHA',
        remarks: '',
        checklists: [
          { id: 'c1', label: 'Mechanics, Waves & Electricity notes complete', completed: false },
        ],
      },
    ],
  },
  {
    id: 'lrn_4',
    regNo: 'VCS004',
    name: 'Grace Akello',
    class: 'S4',
    stream: 'B',
    house: 'Kaggwa House',
    gender: 'F',
    guardianContact: '+256 752 900 123',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      {
        id: 'sub_math',
        name: 'Mathematics',
        code: 'MTH401',
        department: 'Mathematics Dept',
        status: 'cleared',
        officer: 'MR. P. OCEN',
        signedDate: '18/08/2026',
        remarks: 'Fully completed.',
        checklists: [
          { id: 'c1', label: 'Complete Pure & Applied Math notes verified', completed: true },
          { id: 'c2', label: 'Graph books and logarithm tables returned', completed: true },
        ],
      },
      {
        id: 'sub_eng',
        name: 'English Language',
        code: 'ENG401',
        department: 'Languages Dept',
        status: 'cleared',
        officer: 'MS. J. NABIRYE',
        signedDate: '19/08/2026',
        remarks: 'Signed off.',
        checklists: [
          { id: 'c1', label: 'Grammar and Composition exercise book up to date', completed: true },
          { id: 'c2', label: 'Literature set-books returned to departmental library', completed: true },
        ],
      },
      {
        id: 'sub_bio',
        name: 'Biology',
        code: 'BIO401',
        department: 'Biological Sciences',
        status: 'cleared',
        officer: 'MS. S. NAMUBIRU',
        signedDate: '20/08/2026',
        remarks: 'Laboratory files approved.',
        checklists: [
          { id: 'c1', label: 'All Physiology & Ecology modules notes documented', completed: true },
          { id: 'c2', label: 'Dissection toolkit and lab slides checked in', completed: true },
        ],
      },
      {
        id: 'sub_chem',
        name: 'Chemistry',
        code: 'CHM401',
        department: 'Physical Sciences',
        status: 'cleared',
        officer: 'DR. M. SSEKANDI',
        signedDate: '20/08/2026',
        remarks: 'Complete.',
        checklists: [
          { id: 'c1', label: 'Organic and Inorganic Chemistry theory notes complete', completed: true },
          { id: 'c2', label: 'Titration practical workbook verified and signed', completed: true },
        ],
      },
      {
        id: 'sub_ict',
        name: 'ICT',
        code: 'ICT401',
        department: 'ICT Department',
        status: 'cleared',
        officer: 'MR. I. OKELLO',
        signedDate: '21/08/2026',
        remarks: 'Project graded A.',
        checklists: [
          { id: 'c1', label: 'All 12 Chapters of ICT Theory fully documented', completed: true },
          { id: 'c2', label: 'Programming & Web development project submitted', completed: true },
          { id: 'c3', label: 'Computer Lab workstation #14 inspection cleared', completed: true },
          { id: 'c4', label: 'Practical flash drives & textbook returned to ICT centre', completed: true },
        ],
      },
      {
        id: 'sub_phy',
        name: 'Physics',
        code: 'PHY401',
        department: 'Physical Sciences',
        status: 'cleared',
        officer: 'MR. K. MUGISHA',
        signedDate: '21/08/2026',
        remarks: 'Cleared.',
        checklists: [
          { id: 'c1', label: 'Mechanics, Waves & Electricity notes complete', completed: true },
        ],
      },
    ],
  },
  {
    id: 'lrn_5',
    regNo: 'VCS005',
    name: 'Samuel Katende',
    class: 'S.1',
    stream: 'North',
    house: 'Lumumba House',
    gender: 'M',
    guardianContact: '+256 772 110 999',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      { id: 'sub_math', name: 'Mathematics', code: 'MTH101', department: 'Mathematics Dept', status: 'cleared', officer: 'MR. P. OCEN', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Basic sets and algebra notes', completed: true }] },
      { id: 'sub_eng', name: 'English Language', code: 'ENG101', department: 'Languages Dept', status: 'cleared', officer: 'MS. J. NABIRYE', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'Comprehension exercise book', completed: true }] },
      { id: 'sub_bio', name: 'Biology', code: 'BIO101', department: 'Biological Sciences', status: 'pending', officer: 'MS. S. NAMUBIRU', checklists: [{ id: 'c1', label: 'Cell biology drawings', completed: false }] },
      { id: 'sub_chem', name: 'Chemistry', code: 'CHM101', department: 'Physical Sciences', status: 'cleared', officer: 'DR. M. SSEKANDI', signedDate: '19/08/2026', checklists: [{ id: 'c1', label: 'States of matter workbook', completed: true }] },
      { id: 'sub_ict', name: 'ICT', code: 'ICT101', department: 'ICT Department', status: 'cleared', officer: 'MR. I. OKELLO', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Typing and hardware basics', completed: true }] },
      { id: 'sub_phy', name: 'Physics', code: 'PHY101', department: 'Physical Sciences', status: 'pending', officer: 'MR. K. MUGISHA', checklists: [{ id: 'c1', label: 'Measurement experiment report', completed: false }] },
    ],
  },
  {
    id: 'lrn_6',
    regNo: 'VCS006',
    name: 'Patricia Namatovu',
    class: 'S.1',
    stream: 'South',
    house: 'Kabaleega House',
    gender: 'F',
    guardianContact: '+256 701 445 220',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      { id: 'sub_math', name: 'Mathematics', code: 'MTH101', department: 'Mathematics Dept', status: 'cleared', officer: 'MR. P. OCEN', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'Basic sets and algebra notes', completed: true }] },
      { id: 'sub_eng', name: 'English Language', code: 'ENG101', department: 'Languages Dept', status: 'cleared', officer: 'MS. J. NABIRYE', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'Comprehension exercise book', completed: true }] },
      { id: 'sub_bio', name: 'Biology', code: 'BIO101', department: 'Biological Sciences', status: 'cleared', officer: 'MS. S. NAMUBIRU', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Cell biology drawings', completed: true }] },
      { id: 'sub_chem', name: 'Chemistry', code: 'CHM101', department: 'Physical Sciences', status: 'cleared', officer: 'DR. M. SSEKANDI', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'States of matter workbook', completed: true }] },
      { id: 'sub_ict', name: 'ICT', code: 'ICT101', department: 'ICT Department', status: 'cleared', officer: 'MR. I. OKELLO', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Typing and hardware basics', completed: true }] },
      { id: 'sub_phy', name: 'Physics', code: 'PHY101', department: 'Physical Sciences', status: 'cleared', officer: 'MR. K. MUGISHA', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Measurement experiment report', completed: true }] },
    ],
  },
  {
    id: 'lrn_7',
    regNo: 'VCS007',
    name: 'Brian Kigozi',
    class: 'S.2',
    stream: 'East',
    house: 'Mwanga House',
    gender: 'M',
    guardianContact: '+256 782 301 990',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      { id: 'sub_math', name: 'Mathematics', code: 'MTH201', department: 'Mathematics Dept', status: 'cleared', officer: 'MR. P. OCEN', signedDate: '19/08/2026', checklists: [{ id: 'c1', label: 'Quadratic equations & geometry', completed: true }] },
      { id: 'sub_eng', name: 'English Language', code: 'ENG201', department: 'Languages Dept', status: 'pending', officer: 'MS. J. NABIRYE', checklists: [{ id: 'c1', label: 'Poetry coursework dossier', completed: false }] },
      { id: 'sub_bio', name: 'Biology', code: 'BIO201', department: 'Biological Sciences', status: 'cleared', officer: 'MS. S. NAMUBIRU', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Nutrition in plants and animals', completed: true }] },
      { id: 'sub_chem', name: 'Chemistry', code: 'CHM201', department: 'Physical Sciences', status: 'pending', officer: 'DR. M. SSEKANDI', checklists: [{ id: 'c1', label: 'Periodic table and bonding', completed: false }] },
      { id: 'sub_ict', name: 'ICT', code: 'ICT201', department: 'ICT Department', status: 'cleared', officer: 'MR. I. OKELLO', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Spreadsheet lab project', completed: true }] },
      { id: 'sub_phy', name: 'Physics', code: 'PHY201', department: 'Physical Sciences', status: 'cleared', officer: 'MR. K. MUGISHA', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'Optics and mirrors experiment', completed: true }] },
    ],
  },
  {
    id: 'lrn_8',
    regNo: 'VCS008',
    name: 'Rebecca Nabukenya',
    class: 'S.3',
    stream: 'West',
    house: 'Kaggwa House',
    gender: 'F',
    guardianContact: '+256 752 400 119',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      { id: 'sub_math', name: 'Mathematics', code: 'MTH301', department: 'Mathematics Dept', status: 'cleared', officer: 'MR. P. OCEN', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'Vectors and trigonometry folio', completed: true }] },
      { id: 'sub_eng', name: 'English Language', code: 'ENG301', department: 'Languages Dept', status: 'cleared', officer: 'MS. J. NABIRYE', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'Prose & Oral literature review', completed: true }] },
      { id: 'sub_bio', name: 'Biology', code: 'BIO301', department: 'Biological Sciences', status: 'cleared', officer: 'MS. S. NAMUBIRU', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Transport and excretion drawings', completed: true }] },
      { id: 'sub_chem', name: 'Chemistry', code: 'CHM301', department: 'Physical Sciences', status: 'cleared', officer: 'DR. M. SSEKANDI', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Acids, bases & salts lab file', completed: true }] },
      { id: 'sub_ict', name: 'ICT', code: 'ICT301', department: 'ICT Department', status: 'cleared', officer: 'MR. I. OKELLO', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Database systems practical', completed: true }] },
      { id: 'sub_phy', name: 'Physics', code: 'PHY301', department: 'Physical Sciences', status: 'pending', officer: 'MR. K. MUGISHA', checklists: [{ id: 'c1', label: 'Current electricity circuits', completed: false }] },
    ],
  },
  {
    id: 'lrn_9',
    regNo: 'VCS009',
    name: 'Arthur Mugalu',
    class: 'S.5',
    stream: 'Sciences',
    house: 'Lumumba House',
    gender: 'M',
    guardianContact: '+256 701 999 888',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      { id: 'sub_pmath', name: 'Pure Mathematics', code: 'PMT501', department: 'Mathematics Dept', status: 'cleared', officer: 'MR. P. OCEN', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Calculus and coordinate geometry', completed: true }] },
      { id: 'sub_phy_a', name: 'Physics (A-Level)', code: 'PHY501', department: 'Physical Sciences', status: 'cleared', officer: 'MR. K. MUGISHA', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Thermal physics and oscillations', completed: true }] },
      { id: 'sub_chem_a', name: 'Chemistry (A-Level)', code: 'CHM501', department: 'Physical Sciences', status: 'cleared', officer: 'DR. M. SSEKANDI', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'Physical and organic chemistry', completed: true }] },
      { id: 'sub_submath', name: 'Subsidiary ICT', code: 'ICT501', department: 'ICT Department', status: 'cleared', officer: 'MR. I. OKELLO', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'A-Level data processing folio', completed: true }] },
    ],
  },
  {
    id: 'lrn_10',
    regNo: 'VCS010',
    name: 'Esther Nakato',
    class: 'S.6',
    stream: 'Arts',
    house: 'Kabaleega House',
    gender: 'F',
    guardianContact: '+256 772 888 111',
    feesStatus: 'cleared',
    academicYear: '2026',
    term: 'Term II',
    subjects: [
      { id: 'sub_lit', name: 'Literature in English', code: 'LIT601', department: 'Languages Dept', status: 'cleared', officer: 'MS. J. NABIRYE', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'African and World Drama dissertations', completed: true }] },
      { id: 'sub_hist', name: 'History (Paper 1-4)', code: 'HST601', department: 'Humanities Dept', status: 'cleared', officer: 'MR. D. MUKASA', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'Modern European & African History', completed: true }] },
      { id: 'sub_div', name: 'Divinity / CRE', code: 'DIV601', department: 'Humanities Dept', status: 'cleared', officer: 'MR. D. MUKASA', signedDate: '20/08/2026', checklists: [{ id: 'c1', label: 'Old & New Testament critical notes', completed: true }] },
      { id: 'sub_gen', name: 'General Paper', code: 'GEN601', department: 'Languages Dept', status: 'cleared', officer: 'ISRAEL NTENDE', signedDate: '21/08/2026', checklists: [{ id: 'c1', label: 'Current affairs and logic dossier', completed: true }] },
    ],
  },
];

// Helper to create default subjects for new learner
export const createDefaultSubjects = (officers: UserAccount[]): SubjectRecord[] => {
  const getOff = (dep: string, fallback: string) => {
    const found = officers.find((o) => o.department.toLowerCase().includes(dep.toLowerCase()));
    return found ? found.name.toUpperCase() : fallback;
  };

  return [
    {
      id: 'sub_math',
      name: 'Mathematics',
      code: 'MTH401',
      department: 'Mathematics Dept',
      status: 'pending',
      officer: getOff('math', 'MR. P. OCEN'),
      checklists: [
        { id: 'c1', label: 'Complete Pure & Applied Math notes verified', completed: false },
        { id: 'c2', label: 'Graph books and logarithm tables returned', completed: false },
        { id: 'c3', label: 'Midterm correction folio signed by parent', completed: false },
      ],
    },
    {
      id: 'sub_eng',
      name: 'English Language',
      code: 'ENG401',
      department: 'Languages Dept',
      status: 'pending',
      officer: getOff('lang', 'MS. J. NABIRYE'),
      checklists: [
        { id: 'c1', label: 'Grammar and Composition exercise book up to date', completed: false },
        { id: 'c2', label: 'Literature set-books returned to departmental library', completed: false },
      ],
    },
    {
      id: 'sub_bio',
      name: 'Biology',
      code: 'BIO401',
      department: 'Biological Sciences',
      status: 'pending',
      officer: getOff('bio', 'MS. S. NAMUBIRU'),
      checklists: [
        { id: 'c1', label: 'All Physiology & Ecology modules notes documented', completed: false },
        { id: 'c2', label: 'Dissection toolkit and lab slides checked in', completed: false },
      ],
    },
    {
      id: 'sub_chem',
      name: 'Chemistry',
      code: 'CHM401',
      department: 'Physical Sciences',
      status: 'pending',
      officer: getOff('chem', 'DR. M. SSEKANDI'),
      checklists: [
        { id: 'c1', label: 'Organic and Inorganic Chemistry theory notes complete', completed: false },
        { id: 'c2', label: 'Titration practical workbook verified and signed', completed: false },
      ],
    },
    {
      id: 'sub_ict',
      name: 'ICT',
      code: 'ICT401',
      department: 'ICT Department',
      status: 'pending',
      officer: getOff('ict', 'MR. I. OKELLO'),
      checklists: [
        { id: 'c1', label: 'All 12 Chapters of ICT Theory fully documented', completed: false },
        { id: 'c2', label: 'Programming & Web development project submitted', completed: false },
        { id: 'c3', label: 'Computer Lab workstation inspection cleared', completed: false },
      ],
    },
    {
      id: 'sub_phy',
      name: 'Physics',
      code: 'PHY401',
      department: 'Physical Sciences',
      status: 'pending',
      officer: getOff('physic', 'MR. K. MUGISHA'),
      checklists: [
        { id: 'c1', label: 'Mechanics, Waves & Electricity notes complete', completed: false },
      ],
    },
  ];
};

// Database Service Functions
export class DbService {
  // Initialize and ensure base seed collections exist
  static async initDatabase(): Promise<void> {
    try {
      // 1. Check settings
      const settingsRef = doc(db, SETTINGS_COL, 'main_settings');
      const settingsSnap = await getDoc(settingsRef);
      if (!settingsSnap.exists()) {
        await setDoc(settingsRef, DEFAULT_SETTINGS);
      }

      // 2. Check users
      const usersSnap = await getDocs(collection(db, USERS_COL));
      if (usersSnap.empty) {
        const batch = writeBatch(db);
        for (const u of INITIAL_USERS) {
          const { hash, salt } = await hashPassword(u.password || 'teach');
          const secureUser: UserAccount = {
            ...u,
            password: hash,
            passwordSalt: salt,
          };
          batch.set(doc(db, USERS_COL, secureUser.id), secureUser);
        }
        await batch.commit();
      }

      // 3. Check learners
      const learnersSnap = await getDocs(collection(db, LEARNERS_COL));
      if (learnersSnap.empty) {
        const batch = writeBatch(db);
        DEFAULT_LEARNER_SEEDS.forEach((l) => {
          batch.set(doc(db, LEARNERS_COL, l.id), l);
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Firestore initial check (fallback to local/offline state if network pending):', err);
    }
  }

  // Subscribe to Learners
  static subscribeLearners(callback: (learners: Learner[]) => void) {
    try {
      return onSnapshot(
        collection(db, LEARNERS_COL),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Learner));
            callback(list);
          } else {
            callback(DEFAULT_LEARNER_SEEDS);
          }
        },
        (err) => {
          console.warn('Firestore learners subscription fallback:', err);
          callback(DEFAULT_LEARNER_SEEDS);
        }
      );
    } catch (e) {
      console.error(e);
      callback(DEFAULT_LEARNER_SEEDS);
      return () => {};
    }
  }

  static subscribeLearnersFiltered(constraints: QueryConstraint[], callback: (learners: Learner[]) => void) {
    try {
      const q = query(collection(db, LEARNERS_COL), ...constraints);
      return onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Learner));
          list.sort((a, b) => a.name.localeCompare(b.name));
          callback(list);
        },
        () => callback([])
      );
    } catch (e) {
      callback([]);
      return () => {};
    }
  }

  // Subscribe to Users
  static subscribeUsers(callback: (users: UserAccount[]) => void) {
    try {
      return onSnapshot(
        collection(db, USERS_COL),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserAccount));
            callback(list);
          } else {
            callback(INITIAL_USERS);
          }
        },
        (err) => {
          console.warn('Firestore users subscription fallback:', err);
          callback(INITIAL_USERS);
        }
      );
    } catch (e) {
      console.error(e);
      callback(INITIAL_USERS);
      return () => {};
    }
  }

  // Subscribe to Settings
  static subscribeSettings(callback: (settings: SchoolSettings) => void) {
    try {
      return onSnapshot(
        doc(db, SETTINGS_COL, 'main_settings'),
        (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.data() as SchoolSettings);
          } else {
            callback(DEFAULT_SETTINGS);
          }
        },
        (err) => {
          console.warn('Firestore settings subscription fallback:', err);
          callback(DEFAULT_SETTINGS);
        }
      );
    } catch (e) {
      console.error(e);
      callback(DEFAULT_SETTINGS);
      return () => {};
    }
  }

  // Save Settings
  static async saveSettings(settings: Partial<SchoolSettings>): Promise<void> {
    const settingsRef = doc(db, SETTINGS_COL, 'main_settings');
    await setDoc(settingsRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  }

  // Save / Update Learner
  static async saveLearner(learner: Learner): Promise<void> {
    const learnerRef = doc(db, LEARNERS_COL, learner.id);
    await setDoc(learnerRef, { ...learner, updatedAt: new Date().toISOString() }, { merge: true });
  }

  // Bulk Import Learners
  static async bulkImportLearners(learners: Learner[], loggedOfficer?: UserAccount): Promise<number> {
    const batch = writeBatch(db);
    learners.forEach((lrn) => {
      const ref = doc(db, LEARNERS_COL, lrn.id);
      batch.set(ref, {
        ...lrn,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();

    // Log action
    if (loggedOfficer) {
      await this.logAudit({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        officerName: loggedOfficer.name,
        officerRole: loggedOfficer.role,
        learnerRegNo: `${learners.length} Students`,
        learnerName: `Cohort Import (${learners[0]?.class || 'S4'})`,
        subjectName: 'All Subjects',
        action: 'BULK_IMPORT',
        details: `Imported ${learners.length} learners into database`,
      });
    }

    return learners.length;
  }

  // Bulk Import Faculty / Staff Users
  static async bulkImportStaff(staffList: UserAccount[], loggedOfficer?: UserAccount): Promise<number> {
    const batch = writeBatch(db);
    staffList.forEach((user) => {
      const ref = doc(db, USERS_COL, user.id);
      batch.set(ref, {
        ...user,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });

    await batch.commit();

    if (loggedOfficer) {
      await this.logAudit({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        officerName: loggedOfficer.name,
        officerRole: loggedOfficer.role,
        learnerRegNo: 'STAFF ROSTER',
        learnerName: `Bulk Staff Import (${staffList.length} Teachers)`,
        subjectName: 'Staff Directory',
        action: 'BULK_IMPORT',
        details: `Imported ${staffList.length} faculty members into staff directory`,
      });
    }

    return staffList.length;
  }

  // Batch update a specific subject status for a set of learners
  static async batchUpdateLearnerSubject(
    learnersToUpdate: Learner[],
    subjectCodeOrId: string,
    newStatus: ClearanceStatus,
    loggedOfficer: UserAccount
  ): Promise<number> {
    const batch = writeBatch(db);
    const today = new Date().toLocaleDateString('en-GB');
    let count = 0;

    learnersToUpdate.forEach((learner) => {
      const targetSub = learner.subjects.find(
        (s) => s.id === subjectCodeOrId || s.code === subjectCodeOrId || s.name.toLowerCase() === subjectCodeOrId.toLowerCase()
      );
      if (!targetSub) return;

      const updatedSubjects = learner.subjects.map((sub) => {
        if (sub.id !== targetSub.id) return sub;
        return {
          ...sub,
          status: newStatus,
          officer: newStatus === 'cleared' ? loggedOfficer.name.toUpperCase() : sub.officer,
          signedDate: newStatus === 'cleared' ? today : undefined,
        };
      });

      const ref = doc(db, LEARNERS_COL, learner.id);
      batch.set(ref, {
        ...learner,
        subjects: updatedSubjects,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      count++;
    });

    await batch.commit();

    await this.logAudit({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      officerName: loggedOfficer.name,
      officerRole: loggedOfficer.role,
      learnerRegNo: `${count} Learners`,
      learnerName: `Cohort Batch Sign-off`,
      subjectName: subjectCodeOrId,
      action: newStatus === 'cleared' ? 'BULK_CLEARED' : 'RESET',
      details: `Batch marked ${subjectCodeOrId} as ${newStatus.toUpperCase()} for ${count} students`,
    });

    return count;
  }

  // Delete Learner
  static async deleteLearner(learnerId: string): Promise<void> {
    await deleteDoc(doc(db, LEARNERS_COL, learnerId));
  }

  // Save User (Register teacher/admin with hashed password)
  static async saveUser(user: UserAccount): Promise<void> {
    let finalUser = { ...user };

    // If password is provided as plain text without salt, hash it with a fresh salt
    if (user.password && !user.passwordSalt && user.password.length < 50) {
      const { hash, salt } = await hashPassword(user.password);
      finalUser.password = hash;
      finalUser.passwordSalt = salt;
    }

    await setDoc(doc(db, USERS_COL, user.id), {
      ...finalUser,
      createdAt: user.createdAt || new Date().toISOString(),
    }, { merge: true });
  }

  // Verify and transparently upgrade user credentials
  static async verifyAndUpgradeUserCredentials(
    user: UserAccount, 
    plainPasswordInput: string
  ): Promise<boolean> {
    const result = await verifyPassword(plainPasswordInput, user.password, user.passwordSalt);
    
    if (result.isValid && result.needsMigration && result.newHash && result.newSalt) {
      // Transparently update Firestore record to salted hash
      try {
        await updateDoc(doc(db, USERS_COL, user.id), {
          password: result.newHash,
          passwordSalt: result.newSalt,
        });
      } catch (err) {
        console.warn('Could not upgrade password hash in Firestore:', err);
      }
    }

    return result.isValid;
  }

  // Public Anti-Forgery Clearance Certificate Lookup
  static async verifyPublicCertificate(regNoOrId: string): Promise<Learner | null> {
    const cleaned = regNoOrId.trim().toUpperCase();
    try {
      const snapshot = await getDocs(collection(db, LEARNERS_COL));
      const match = snapshot.docs.find((d) => {
        const data = d.data() as Learner;
        return (data.regNo && data.regNo.toUpperCase() === cleaned) || d.id === regNoOrId;
      });
      if (match) {
        return { id: match.id, ...match.data() } as Learner;
      }
    } catch (e) {
      console.warn('Certificate lookup fallback to local records:', e);
    }
    return null;
  }

  // Delete User
  static async deleteUser(userId: string): Promise<void> {
    await deleteDoc(doc(db, USERS_COL, userId));
  }

  // Log Audit Entry
  static async logAudit(entry: AuditLogEntry): Promise<void> {
    try {
      await setDoc(doc(db, AUDIT_LOGS_COL, entry.id), entry);
    } catch (e) {
      console.warn('Could not write audit log:', e);
    }
  }

  // Subscribe to Audit Logs
  static subscribeAuditLogs(callback: (logs: AuditLogEntry[]) => void) {
    try {
      return onSnapshot(
        collection(db, AUDIT_LOGS_COL),
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogEntry));
          // Sort descending
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          callback(list.slice(0, 50));
        },
        () => callback([])
      );
    } catch (e) {
      callback([]);
      return () => {};
    }
  }

  // Paginated and Filtered Learner Fetching
  static async getLearnersPaginated(
    pageSize: number,
    lastVisible: any = null,
    filters: { class?: string; stream?: string; search?: string } = {}
  ) {
    try {
      const constraints: QueryConstraint[] = [orderBy('regNo')];

      if (filters.class && filters.class !== 'ALL') {
        constraints.push(where('class', '==', filters.class));
      }
      
      if (filters.stream && filters.stream !== 'ALL') {
        constraints.push(where('stream', '==', filters.stream));
      }

      if (lastVisible) {
        constraints.push(startAfter(lastVisible));
      }

      constraints.push(limit(pageSize));

      const q = query(collection(db, LEARNERS_COL), ...constraints);
      const snapshot = await getDocs(q);
      
      const learners = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Learner));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        learners,
        lastDoc,
        hasMore: learners.length === pageSize
      };
    } catch (error) {
      console.error('Error fetching paginated learners:', error);
      throw error;
    }
  }

  // Backup and Restore
  static async backupData() {
    try {
      const collections = [LEARNERS_COL, USERS_COL, SETTINGS_COL, AUDIT_LOGS_COL, 'archives'];
      const backup: any = {};

      for (const colName of collections) {
        const snap = await getDocs(collection(db, colName));
        backup[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      return backup;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  static async restoreData(backupJson: string) {
    try {
      const data = JSON.parse(backupJson);
      const batch = writeBatch(db);

      for (const colName in data) {
        const records = data[colName];
        for (const record of records) {
          const { id, ...docData } = record;
          const docRef = doc(db, colName, id);
          batch.set(docRef, docData);
        }
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  // Subscribe to SMS Logs (Removed)

}
