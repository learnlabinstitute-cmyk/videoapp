import React, { useState, useEffect } from 'react';
import { ChevronDown, User, AlertTriangle } from 'lucide-react';
import {
  TerminalSession,
  calculateRemainingValidity,
  RemainingTime,
} from '../utils/terminalAuth';
import { StudioLogo } from './StudioLogo';

interface TerminalHeaderBadgeProps {
  session: TerminalSession;
  onClick: () => void;
}

export function TerminalHeaderBadge({ session, onClick }: TerminalHeaderBadgeProps) {
  const [remaining, setRemaining] = useState<RemainingTime>(() =>
    calculateRemainingValidity(session.expiresAt, session.activatedAt)
  );

  // Live timer tick every 1000ms
  useEffect(() => {
    setRemaining(calculateRemainingValidity(session.expiresAt, session.activatedAt));

    const interval = setInterval(() => {
      setRemaining(calculateRemainingValidity(session.expiresAt, session.activatedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.expiresAt, session.activatedAt]);

  const isLowTime = !remaining.isExpired && remaining.days < 3;
  const isExpired = remaining.isExpired;

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer shadow-sm ${
        isExpired
          ? 'bg-rose-950/40 border-rose-500/50 hover:bg-rose-900/50 text-rose-200'
          : isLowTime
          ? 'bg-amber-950/40 border-amber-500/50 hover:bg-amber-900/50 text-amber-200'
          : 'bg-stone-900/90 border-stone-800 hover:border-pink-500/50 hover:bg-stone-850 text-stone-200'
      }`}
      title="Click to view license details & countdown status"
    >
      {/* Studio App Logo Icon */}
      <StudioLogo size="sm" showGlow={false} />

      {/* Studio License Badge */}
      <div className="hidden sm:flex items-center gap-1 font-semibold text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
        <span>PRO</span>
      </div>

      {/* User email */}
      <div className="hidden md:flex items-center gap-1 text-[11px] text-stone-400 max-w-[120px] truncate">
        <User className="w-3 h-3 text-stone-500 flex-shrink-0" />
        <span className="truncate">{session.email}</span>
      </div>

      {/* Live Countdown Timer */}
      <div className="flex items-center gap-1.5 font-mono font-medium text-[11px]">
        {isExpired ? (
          <span className="text-rose-400 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Expired
          </span>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLowTime ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLowTime ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span
              className={`font-semibold tracking-tight ${
                isLowTime ? 'text-amber-300' : 'text-pink-300'
              }`}
            >
              ⏱️ {remaining.formattedString}
            </span>
          </>
        )}
      </div>

      <ChevronDown className="w-3 h-3 text-stone-500 group-hover:text-stone-300 transition-transform group-hover:translate-y-0.5" />
    </button>
  );
}
