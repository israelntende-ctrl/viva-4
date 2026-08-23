import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { DbService } from '../lib/dbService';
import { VivaBadge } from './VivaBadge';
import { checkAccountLockout, recordFailedLoginAttempt, resetLoginAttempts } from '../lib/security';
import { LogIn, Lock, Mail, AlertCircle, Clock, ShieldAlert, Database, WifiOff, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  users: UserAccount[];
  dbStatus: 'connecting' | 'synced' | 'offline';
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ users, dbStatus, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  // Re-check lockout status whenever the email field changes
  useEffect(() => {
    if (email.trim()) {
      const status = checkAccountLockout(email);
      setIsLocked(status.isLocked);
      setLockoutRemaining(status.remainingSeconds);
      setRemainingAttempts(status.remainingAttempts);
    } else {
      setIsLocked(false);
      setRemainingAttempts(5);
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

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normEmail = email.trim().toLowerCase();

    // Check account lockout status first
    const lockoutStatus = checkAccountLockout(normEmail);
    if (lockoutStatus.isLocked) {
      setIsLocked(true);
      setLockoutRemaining(lockoutStatus.remainingSeconds);
      setError(
        `Account temporarily locked for security due to repeated failed login attempts. Please wait ${Math.floor(
          lockoutStatus.remainingSeconds / 60
        )}m ${lockoutStatus.remainingSeconds % 60}s.`
      );
      return;
    }

    const foundUser = users.find((u) => u.email.trim().toLowerCase() === normEmail);

    if (!foundUser) {
      const record = recordFailedLoginAttempt(normEmail);
      setIsLocked(record.isLocked);
      setLockoutRemaining(record.remainingSeconds);
      setRemainingAttempts(record.remainingAttempts);
      setError(`No registered staff account found for this email. (${record.remainingAttempts} attempt(s) remaining)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const isPasswordValid = await DbService.verifyAndUpgradeUserCredentials(foundUser, password);

      if (!isPasswordValid) {
        const record = recordFailedLoginAttempt(normEmail);
        setIsLocked(record.isLocked);
        setLockoutRemaining(record.remainingSeconds);
        setRemainingAttempts(record.remainingAttempts);

        if (record.isLocked) {
          setError('Security Alert: Maximum failed attempts exceeded (5). Account locked for 15 minutes to protect against unauthorized access.');
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
          }).catch(() => {});
        } else {
          setError(`Incorrect password or PIN. ${record.remainingAttempts} attempt(s) remaining before security lockout.`);
        }
        return;
      }

      resetLoginAttempts(normEmail);
      setPassword('');
      onLoginSuccess(foundUser);
    } catch (err) {
      setError(`Authentication verification error: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Quiet paper texture shared with the portal workspace */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0, transparent 31px, #7A1326 31px, #7A1326 32px), repeating-linear-gradient(90deg, transparent 0, transparent 31px, #7A1326 31px, #7A1326 32px)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Connection status pill */}
        <div className="flex justify-center mb-5">
          <span
            className={`inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest px-2.5 py-1 border font-mono font-bold ${
              dbStatus === 'synced'
                ? 'bg-black/30 text-emerald-300 border-emerald-400/30'
                : dbStatus === 'connecting'
                ? 'bg-black/30 text-amber-300 border-amber-400/30 animate-pulse'
                : 'bg-black/30 text-rose-300 border-rose-400/30'
            }`}
          >
            {dbStatus === 'offline' ? <WifiOff className="w-3 h-3" /> : <Database className="w-3 h-3" />}
            {dbStatus === 'synced' ? 'Firestore Live' : dbStatus === 'connecting' ? 'Connecting…' : 'Offline Mode'}
          </span>
        </div>

        <div className="bg-[#F9F8F6] border-2 border-[#D4AF37]/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Crest header */}
          <div className="p-7 bg-gradient-to-r from-[#5B0B19] via-[#7A1326] to-[#5B0B19] border-b-2 border-[#D4AF37] flex flex-col items-center text-center gap-3">
            <VivaBadge size="lg" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#F6D365] font-bold">
                Victory College School
              </p>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-white leading-tight mt-1">
                Learner Notes Clearance Portal
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-white/60 mt-1.5">
                Restricted Access &middot; Authorized Staff Only
              </p>
            </div>
          </div>

          {/* Login form */}
          <div className="p-7 space-y-5">
            {isLocked && (
              <div className="p-4 bg-red-100 border-2 border-red-500 text-red-900 rounded flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Security Lockout Active</p>
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

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold opacity-60 block mb-1">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 opacity-40" />
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@vcs.ac.ug"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold opacity-60">
                    Security Password / PIN
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
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLocked}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isLocked ? 'Account locked - please wait' : 'Enter account password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs focus:outline-none focus:border-[#7A1326] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 opacity-40 hover:opacity-80"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-login-page"
                type="submit"
                disabled={isSubmitting || isLocked}
                className="w-full py-3 bg-[#7A1326] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5B0B19] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting
                  ? 'Verifying Credentials...'
                  : isLocked
                  ? `Locked (${formatCountdown(lockoutRemaining)})`
                  : 'Sign In to Clearance Portal'}
              </button>
            </form>

            <p className="text-center text-[10px] uppercase tracking-wider text-[#1A1A1A]/40 pt-1">
              Don't have an account? Contact your Dean / Administrator to be registered.
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#1A1A1A]/45 mt-5 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Victory College School &middot; Secured with SHA-256 Credential Hashing
        </p>
      </div>
    </div>
  );
};
