import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  X,
  Calendar,
  Mail,
  Key,
  Lock,
} from 'lucide-react';
import {
  TerminalSession,
  calculateRemainingValidity,
  RemainingTime,
} from '../utils/terminalAuth';
import { StudioLogo } from './StudioLogo';

interface TerminalStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TerminalSession;
  onLogout: () => void;
}

export function TerminalStatusModal({
  isOpen,
  onClose,
  session,
  onLogout,
}: TerminalStatusModalProps) {
  const [remaining, setRemaining] = useState<RemainingTime>(() =>
    calculateRemainingValidity(session.expiresAt, session.activatedAt)
  );

  // Live countdown timer running every second (read-only duration)
  useEffect(() => {
    if (!isOpen) return;

    setRemaining(calculateRemainingValidity(session.expiresAt, session.activatedAt));

    const interval = setInterval(() => {
      setRemaining(calculateRemainingValidity(session.expiresAt, session.activatedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, session.expiresAt, session.activatedAt]);

  if (!isOpen) return null;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const isLowTime = !remaining.isExpired && remaining.days < 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-white p-1 rounded-xl bg-stone-800/50 hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Professional App Logo */}
        <div className="flex items-center gap-3.5">
          <StudioLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Studio License & Validity</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Authorized studio license • Active session
            </p>
          </div>
        </div>

        {/* Live Counter Display Hero Card */}
        <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-pink-950/30 border border-pink-500/30 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-1.5 text-pink-300 font-medium">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              Live License Countdown Timer
            </span>
            <span className="font-mono text-[11px] text-stone-400">
              {remaining.percentRemaining.toFixed(1)}% remaining
            </span>
          </div>

          {/* Large Digital Clock Grid */}
          <div className="grid grid-cols-4 gap-2 text-center py-2">
            {/* Days */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-tight">
                {remaining.days}
              </span>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
                Days
              </span>
            </div>

            {/* Hours */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
                {remaining.hours.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
                Hours
              </span>
            </div>

            {/* Minutes */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
                {remaining.minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
                Mins
              </span>
            </div>

            {/* Seconds */}
            <div className="bg-stone-900/90 border border-pink-500/40 rounded-xl p-2.5 flex flex-col items-center relative overflow-hidden">
              <span className="text-2xl sm:text-3xl font-mono font-black text-pink-400 tracking-tight">
                {remaining.seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-semibold text-pink-300 uppercase tracking-wider mt-0.5">
                Secs
              </span>
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-pink-500 animate-pulse" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
            <div
              className={`h-full transition-all duration-1000 ${
                isLowTime
                  ? 'bg-amber-500'
                  : remaining.isExpired
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-pink-500 to-amber-400'
              }`}
              style={{ width: `${remaining.percentRemaining}%` }}
            />
          </div>

          {remaining.isExpired && (
            <div className="text-xs text-rose-300 font-medium flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>License period has expired. Please contact support.</span>
            </div>
          )}
        </div>

        {/* Credentials & Terminal Info Card */}
        <div className="bg-stone-950/70 border border-stone-800/80 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-pink-400" />
              Account Email
            </span>
            <span className="font-semibold text-white font-mono">{session.email}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              Terminal Status
            </span>
            <span className="font-medium text-emerald-400 px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/40 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Authorized & Verified</span>
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              License Type
            </span>
            <span className="font-medium text-stone-300 px-2 py-0.5 bg-stone-900 border border-stone-700/80 rounded-md">
              Studio Pro License
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Activated At
            </span>
            <span className="text-stone-300">{formatDate(session.activatedAt)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              Valid Until
            </span>
            <span className="font-medium text-stone-200">{formatDate(session.expiresAt)}</span>
          </div>
        </div>

        {/* Action Buttons: Sign Out & Close only (Duration cannot be extended or edited) */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-medium text-xs border border-stone-700/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-colors flex items-center justify-center cursor-pointer"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
