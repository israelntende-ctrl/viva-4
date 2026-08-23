export type ClearanceStatus = 'cleared' | 'not_cleared' | 'pending';

export type UserRole = 'admin' | 'teacher';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  title: string;
  initials: string;
  assignedSubjects: string[]; // subject codes or names like ['ICT', 'Computer Studies', 'ALL']
  phone?: string;
  avatarUrl?: string;
  password?: string; // Stored as salted cryptographic hash
  passwordSalt?: string;
  signatureDataUrl?: string; // Teacher digital signature data URL
  signatureStyle?: string; // Calligraphy style preset or drawn
  createdAt?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface SubjectRecord {
  id: string;
  name: string;
  code: string;
  department: string;
  status: ClearanceStatus;
  officer: string;
  signedDate?: string;
  remarks?: string;
  checklists: ChecklistItem[];
  // Photographic proof of clearance in student's notes/exercise book
  photoProofUrl?: string;
  photoProofTimestamp?: string;
  photoProofCaption?: string;
  // Digital signature of verifying officer
  signatureDataUrl?: string;
  signatureType?: 'drawn' | 'calligraphy' | 'stamp';
}

export interface CatalogSubject {
  id: string;
  name: string;
  code: string;
  department: string;
  category: 'core' | 'science' | 'arts' | 'language' | 'vocational';
  defaultChecklists: string[];
}

export interface SubjectOverride {
  subjectId: string;
  action: 'add' | 'drop';
  reason?: string;
  authorizedBy?: string;
}

export interface Learner {
  id: string;
  regNo: string;
  name: string;
  class: string;
  stream: string;
  house: string;
  gender?: 'M' | 'F';
  guardianContact?: string;
  feesStatus: 'cleared' | 'pending';
  academicYear?: string;
  term?: string;
  subjects: SubjectRecord[];
  overrides?: SubjectOverride[];
  createdAt?: string;
  updatedAt?: string;
}

export type CardDesignTemplate = 
  | 'viva-crimson'
  | 'editorial-heritage'
  | 'royal-parchment'
  | 'executive-slate'
  | 'randomized-custom';

export interface StreamInfo {
  id: string;
  name: string;
  color?: string;
  patronName?: string;
  patronPhone?: string;
  room?: string;
  capacity?: number;
}

export interface MandatorySubjectPolicy {
  subjectId: string; // ID of CatalogSubject
  isMandatory: boolean;
}

export interface ClassConfig {
  id: string;
  name: string; // e.g. "S.1", "S.2", "S.3", "S.4", "S.5", "S.6"
  level: 'O-Level' | 'A-Level' | 'Junior' | 'Senior' | 'General';
  streams: StreamInfo[];
  classTeacher?: string;
  description?: string;
  mandatorySubjectPolicies?: MandatorySubjectPolicy[];
}

export interface RandomizedStyleConfig {
  id: string;
  primaryColor: string; // e.g. #7A1326
  secondaryColor: string; // e.g. #D4AF37
  backgroundColor: string; // e.g. #FDFCF7
  textColor: string; // e.g. #1A1A1A
  borderColor: string;
  borderStyle: 'double' | 'solid' | 'dashed' | 'ornate';
  watermarkStyle: 'shield' | 'flame' | 'crest' | 'diagonal';
  fontTheme: 'serif' | 'classic' | 'modern' | 'diploma';
  headerBannerStyle: 'full-maroon' | 'ribbon' | 'minimal' | 'arch';
  sealColor: string;
  sealStyle: 'round-crimson' | 'gold-embossed' | 'royal-shield' | 'traditional-stamp';
  name: string;
}


export interface TermArchive {
  id: string;
  name: string;
  academicYear: string;
  term: string;
  archivedAt: string;
  archivedBy: string;
  totalLearners: number;
  clearedLearners: number;
  clearedRate: number;
  learnersSnapshot: Learner[];
  remarks?: string;
}

export interface SchoolSettings {
  id?: string;
  schoolName: string;
  schoolMotto: string;
  pobox: string;
  academicYear: string;
  term: string;
  activeCardDesign: CardDesignTemplate;
  randomizedConfig?: RandomizedStyleConfig;
  cardsPerPage: 1 | 2 | 4;
  allowTeacherOverride: boolean;
  deanSignatureUrl?: string; // Official signature of Dean of Studies
  badgeUrl?: string; // Optional custom badge URL
  availableClasses?: string[];
  availableStreams?: string[];
  registeredClasses?: ClassConfig[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  officerName: string;
  officerRole: string;
  learnerRegNo: string;
  learnerName: string;
  subjectName: string;
  action: 
    | 'CLEARED' 
    | 'FLAGGED' 
    | 'RESET' 
    | 'REMARKS_UPDATED' 
    | 'BULK_IMPORT' 
    | 'BULK_CLEARED' 
    | 'PHOTO_PROOF_ADDED' 
    | 'SIGNATURE_UPDATED' 
    | 'SUBJECTS_REASSIGNED'
    | 'TERM_ARCHIVED'
    | 'SECURITY_LOCKOUT_TRIGGERED'
    | 'BACKUP_RESTORED'
    | 'GUARDIAN_SMS_DISPATCHED';
  details?: string;
}

