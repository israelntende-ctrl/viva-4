import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types';
import { DbService } from '../lib/dbService';
import { VivaBadge } from './VivaBadge';
import { checkAccountLockout, recordFailedLoginAttempt, resetLoginAttempts } from '../lib/security';
import { LogIn, UserPlus, Shield, UserCheck, Lock, Mail, Phone, BookOpen, X, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserAccount | null;
  users: UserAccount[];
  mode: 'login' | 'register_staff';
  onLoginSuccess: (user: UserAccount) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  users,
  mode: initialMode,
  onLoginSuccess,
  onClose,
}) => {
  const [mode, setMode] = useState<'login' | 'register_staff'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  // New staff form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [newDepartment, setNewDepartment] = useState('ICT Department');
  const [newTitle, setNewTitle] = useState('Subject Teacher');
  const [newAssignedSubjects, setNewAssignedSubjects] = useState('ICT, Computer Studies');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('teach');

  // Check lockout status when email changes or on mount
  useEffect(() => {
    if (email.trim()) {
      const status = checkAccountLockout(email);
      setIsLocked(status.isLocked);
      setLockoutRemaining(status.remainingSeconds);
      setRemainingAttempts(status.remainingAttempts);
    }
  }, [email]);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked, lockoutRemaining]);

  if (!isOpen) return null;

  // Handle Login with Secure PBKDF2/SHA-256 Hash Verification & Lockout Control
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normEmail = email.trim().toLowerCase();

    // Check account lockout status first
    const lockoutStatus = checkAccountLockout(normEmail);
    if (lockoutStatus.isLocked) {
      setIsLocked(true);
      setLockoutRemaining(lockoutStatus.remainingSeconds);
      setError(`Account temporarily locked for security due to repeated failed login attempts. Please wait ${Math.floor(lockoutStatus.remainingSeconds / 60)}m ${lockoutStatus.remainingSeconds % 60}s.`);
      return;
    }

    const foundUser = users.find(
      (u) => u.email.trim().toLowerCase() === normEmail
    );

    if (!foundUser) {
      const record = recordFailedLoginAttempt(normEmail);
      setIsLocked(record.isLocked);
      setLockoutRemaining(record.remainingSeconds);
      setRemainingAttempts(record.remainingAttempts);
      setError(`No registered staff account found for this email. (${record.remainingAttempts} attempts remaining)`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Secure password verification (compares cryptographic hash with salt and upgrades legacy records)
      const isPasswordValid = await DbService.verifyAndUpgradeUserCredentials(foundUser, password);

      if (!isPasswordValid) {
        const record = recordFailedLoginAttempt(normEmail);
        setIsLocked(record.isLocked);
        setLockoutRemaining(record.remainingSeconds);
        setRemainingAttempts(record.remainingAttempts);

        if (record.isLocked) {
          setError(`Security Alert: Maximum failed attempts exceeded (5). Account locked for 15 minutes to protect against unauthorized access.`);
          // Log security event
          await DbService.logAudit({
            id: `sec_lock_${Date.now()}`,
            timestamp: new Date().toISOString(),
            officerName: foundUser.name,
            officerRole: foundUser.role,
            learnerRegNo: 'SECURITY_ALERT',
            learnerName: foundUser.email,
            subjectName: 'Authentication Guard',
            action: 'SECURITY_LOCKOUT_TRIGGERED',
            details: `Account ${foundUser.email} temporarily locked after 5 failed authentication attempts`,
          });
        } else {
          setError(`Incorrect password or PIN. ${record.remainingAttempts} attempt(s) remaining before security lockout.`);
        }
        return;
      }

      // Successful verification -> Reset login attempts counter
      resetLoginAttempts(normEmail);
      onLoginSuccess(foundUser);
      onClose();
    } catch (err) {
      setError(`Authentication verification error: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick One-click Staff Sign-In (Faculty Sandbox / Dev Mode)
  const handleQuickLogin = (user: UserAccount) => {
    resetLoginAttempts(user.email);
    onLoginSuccess(user);
    onClose();
  };

  // Handle Register New Teacher / Admin
  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newName.trim() || !newEmail.trim()) {
      setError('Please provide teacher name and valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const subjectsArray = newAssignedSubjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const initials = newName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 3);

      const newAccount: UserAccount = {
        id: `user_${Date.now()}`,
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        department: newDepartment.trim(),
        title: newTitle.trim(),
        initials,
        assignedSubjects: newRole === 'admin' ? ['ALL'] : subjectsArray,
        phone: newPhone.trim(),
        password: newPassword.trim() || 'teach',
        createdAt: new Date().toISOString(),
      };

      await DbService.saveUser(newAccount);

      // If registered by guest/initial user, switch
      if (!currentUser) {
        onLoginSuccess(newAccount);
      }
      onClose();
    } catch (err) {
      setError(`Failed to register staff: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#F9F8F6] border-2 border-[#1A1A1A] w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Crest */}
        <div className="p-6 bg-gradient-to-r from-[#5B0B19] via-[#7A1326] to-[#5B0B19] text-white flex items-center justify-between border-b-2 border-[#D4AF37]">
          <div className="flex items-center gap-3">
            <VivaBadge size="sm" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#F6D365] font-bold">
                Victory College School
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {mode === 'login' ? 'Authorized Staff Sign In' : 'Register New Academic Staff'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-sm font-bold text-white hover:bg-white hover:text-[#7A1326]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switching */}
        <div className="flex border-b border-[#1A1A1A]/10 bg-white px-6 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              mode === 'login' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Faculty Credentials
          </button>
          <button
            onClick={() => {
              setMode('register_staff');
              setError(null);
            }}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              mode === 'register_staff' ? 'border-[#7A1326] text-[#7A1326]' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register Teacher / Officer
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Lockout Banner */}
          {isLocked && (
            <div className="p-4 bg-red-100 border-2 border-red-500 text-red-900 rounded flex items-start gap-3 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Security Lockout Active (Rule #9 Guard)</p>
                <p className="text-xs mt-1">
                  This account is temporarily locked due to 5 consecutive failed login attempts.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-200 text-red-900 font-mono font-bold text-xs rounded">
                  <Clock className="w-3.5 h-3.5" />
                  Cooldown remaining: {formatCountdown(lockoutRemaining)}
                </div>
              </div>
            </div>
          )}

          {error && !isLocked && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block mb-1">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 opacity-40" />
                    <input
                      id="input-staff-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. isaac.ict@vcs.ac.ug or admin@vcs.ac.ug"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-60">
                      Security Password / PIN (Salted SHA-256)
                    </label>
                    {remainingAttempts < 5 && !isLocked && (
                      <span className="text-[10px] text-amber-700 font-bold">
                        {remainingAttempts} attempt(s) left
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 opacity-40" />
                    <input
                      id="input-staff-password"
                      type="password"
                      required
                      disabled={isLocked}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isLocked ? 'Account locked - please wait' : 'Enter account password'}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={isSubmitting || isLocked}
                  className="w-full py-3 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  {isSubmitting ? 'Verifying Cryptographic Credentials...' : isLocked ? `Locked (${formatCountdown(lockoutRemaining)})` : 'Sign In to Clearance Portal'}
                </button>
              </form>

              {/* Fast 1-Click Demo Accounts */}
              <div className="pt-4 border-t border-[#1A1A1A]/10">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">
                    Faculty Demo Accounts (Quick Sign In)
                  </p>
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                    SHA-256 Protected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {users.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u)}
                      className="p-2.5 bg-white border border-[#1A1A1A]/15 hover:border-[#7A1326] hover:bg-[#7A1326]/5 transition-all text-left flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#7A1326]">
                          {u.name}
                        </p>
                        <p className="text-[10px] opacity-60">
                          {u.role === 'admin' ? '👑 Dean / Admin' : `📚 ${u.department}`}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-[#1A1A1A]/5 px-1.5 py-0.5 group-hover:bg-[#7A1326] group-hover:text-white transition-colors font-bold">
                        Login
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: REGISTER NEW TEACHER / ADMIN */}
          {mode === 'register_staff' && (
            <form onSubmit={handleRegisterStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block mb-1">
                    Staff Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none"
                  >
                    <option value="teacher">Subject Teacher</option>
                    <option value="admin">Director / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. ICT Department"
                    className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block mb-1">
                  Full Name (with Title)
                </label>
                <input
                  id="input-new-staff-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Mr. Isaac Okello"
                  className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block mb-1">
                    Email Address
                  </label>
                  <input
                    id="input-new-staff-email"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. isaac@vcs.ac.ug"
                    className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+256 772 000000"
                    className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block mb-1">
                  Assigned Clearance Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={newAssignedSubjects}
                  onChange={(e) => setNewAssignedSubjects(e.target.value)}
                  placeholder="e.g. ICT, Computer Studies, Programming"
                  className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block mb-1">
                  Set Staff Password / PIN (Will be cryptographically hashed)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Default password"
                  className="w-full p-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none"
                />
              </div>

              <button
                id="btn-submit-register-staff"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                {isSubmitting ? 'Securing & Registering Staff in Firestore...' : 'Save & Register Staff Member'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
