import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  authenticateTerminalUser,
  TerminalSession,
} from '../utils/terminalAuth';
import { StudioLogo } from './StudioLogo';
import { audioEngine } from '../utils/audioEngine';

interface TerminalLoginGateProps {
  onLoginSuccess: (session: TerminalSession) => void;
  defaultEmail?: string;
}

export function TerminalLoginGate({ onLoginSuccess, defaultEmail = '' }: TerminalLoginGateProps) {
  const [email, setEmail] = useState<string>(defaultEmail || '');
  const [password, setPassword] = useState<string>('');
  const [terminalId, setTerminalId] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showTerminalId, setShowTerminalId] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Warm up and resume AudioContext inside this valid user gesture
    audioEngine.unlockAudio();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateTerminalUser(email, password, terminalId);

      if (!result.success || !result.session) {
        setError(result.error || 'Authentication failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg(
        result.isNewUser
          ? 'Studio License activated! Launching workspace...'
          : 'Welcome back! Session verified. Launching workspace...'
      );

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(result.session!);
      }, 650);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 overflow-y-auto font-sans-clean">
      {/* Clean White Card */}
      <div className="relative w-full max-w-[440px] bg-white border border-slate-200/90 rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] p-6 sm:p-8 flex flex-col gap-5 my-auto">
        
        {/* Top Header Branding with Professional App Logo */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            <div className="p-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shadow-xl shadow-indigo-500/20">
              <StudioLogo size="lg" showGlow={false} />
            </div>
            
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Studio Pro Access</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              3D Birthday Video Animator
            </h2>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Sign in with your email, password, and assigned Terminal ID to access your studio workspace.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                Email Address
              </span>
              <span className="text-[10px] font-normal text-slate-400">Your choice</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                Password
              </span>
              <span className="text-[10px] font-normal text-slate-400">Your choice</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terminal ID field (strictly verified internally, value NEVER disclosed) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Terminal ID
              </span>
              <span className="text-[10px] font-normal text-slate-400">Assigned 5-digit key</span>
            </label>
            <div className="relative">
              <input
                type={showTerminalId ? 'text' : 'password'}
                required
                value={terminalId}
                onChange={(e) => setTerminalId(e.target.value)}
                placeholder="Enter assigned Terminal ID"
                className="w-full font-mono text-sm px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowTerminalId(!showTerminalId)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Toggle terminal ID visibility"
              >
                {showTerminalId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Enter your authorized terminal security key to access your studio.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{successMsg}</div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            onMouseDown={() => audioEngine.unlockAudio()}
            onTouchStart={() => audioEngine.unlockAudio()}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-rose-600 to-amber-500 hover:from-indigo-500 hover:via-rose-500 hover:to-amber-400 text-white font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Validating License...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Clean Footer (No test account login) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span>256-bit Encrypted Session</span>
          <span>•</span>
          <span>Studio Edition</span>
        </div>
      </div>
    </div>
  );
}
