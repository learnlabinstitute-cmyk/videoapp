export interface TerminalUser {
  email: string;
  passwordHash: string; // stored client-side for validation
  terminalId: string; // must match "85291"
  activatedAt: number; // timestamp
  expiresAt: number; // timestamp (activatedAt + 30 days)
  lastLoginAt: number;
}

export interface TerminalSession {
  email: string;
  terminalId: string;
  activatedAt: number;
  expiresAt: number;
  sessionToken: string;
}

export interface RemainingTime {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  percentRemaining: number;
  formattedString: string;
}

export const AUTHORIZED_TERMINAL_ID = '85291';
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in ms = 2,592,000,000 ms

const USERS_STORAGE_KEY = 'terminal_auth_users_85291';
const SESSION_STORAGE_KEY = 'terminal_active_session_85291';

/**
 * Retrieve all registered terminal users from localStorage
 */
export function getRegisteredUsers(): Record<string, TerminalUser> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse registered users:', e);
    return {};
  }
}

/**
 * Save registered users to localStorage
 */
export function saveRegisteredUsers(users: Record<string, TerminalUser>) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save registered users:', e);
  }
}

/**
 * Get active session
 */
export function getActiveSession(): TerminalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: TerminalSession = JSON.parse(raw);
    return session;
  } catch (e) {
    console.error('Failed to parse active session:', e);
    return null;
  }
}

/**
 * Save active session
 */
export function setActiveSession(session: TerminalSession | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to update active session:', e);
  }
}

/**
 * Log in or register an account with Email, Password, and Terminal ID
 */
export function authenticateTerminalUser(
  emailInput: string,
  passwordInput: string,
  terminalIdInput: string
): { success: boolean; session?: TerminalSession; error?: string; isNewUser?: boolean } {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();
  const terminalId = terminalIdInput.trim();

  // Validate inputs
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 3) {
    return { success: false, error: 'Please enter a password (at least 3 characters).' };
  }

  // Strict Terminal ID check: MUST BE 85291 (internal security match)
  if (terminalId !== AUTHORIZED_TERMINAL_ID) {
    return {
      success: false,
      error: 'Invalid Terminal ID. Access requires an authorized terminal security code.',
    };
  }

  const users = getRegisteredUsers();
  const now = Date.now();
  let user = users[email];
  let isNewUser = false;

  if (user) {
    // Existing user: check password
    if (user.passwordHash !== password) {
      return {
        success: false,
        error: 'Incorrect password for this email. Please check your credentials.',
      };
    }

    // Check if terminal ID matches
    if (user.terminalId !== AUTHORIZED_TERMINAL_ID) {
      user.terminalId = AUTHORIZED_TERMINAL_ID;
    }

    // Update last login
    user.lastLoginAt = now;
    users[email] = user;
    saveRegisteredUsers(users);
  } else {
    // New user registration: grant 30 days validity from now
    isNewUser = true;
    const expiresAt = now + THIRTY_DAYS_MS;
    user = {
      email,
      passwordHash: password,
      terminalId: AUTHORIZED_TERMINAL_ID,
      activatedAt: now,
      expiresAt,
      lastLoginAt: now,
    };
    users[email] = user;
    saveRegisteredUsers(users);
  }

  // Create session
  const session: TerminalSession = {
    email: user.email,
    terminalId: AUTHORIZED_TERMINAL_ID,
    activatedAt: user.activatedAt,
    expiresAt: user.expiresAt,
    sessionToken: `term_${AUTHORIZED_TERMINAL_ID}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  };

  setActiveSession(session);
  return { success: true, session, isNewUser };
}

/**
 * Renew / reset validity for another 30 days
 */
export function renewTerminalValidity(email: string): TerminalSession | null {
  const users = getRegisteredUsers();
  const normalized = email.trim().toLowerCase();
  const user = users[normalized];

  if (!user) return null;

  const now = Date.now();
  // If still valid, add 30 days to existing expiry, otherwise 30 days from now
  const baseTime = user.expiresAt > now ? user.expiresAt : now;
  user.expiresAt = baseTime + THIRTY_DAYS_MS;
  user.lastLoginAt = now;
  users[normalized] = user;
  saveRegisteredUsers(users);

  const session = getActiveSession();
  if (session && session.email.toLowerCase() === normalized) {
    session.expiresAt = user.expiresAt;
    setActiveSession(session);
    return session;
  }
  return null;
}

/**
 * Calculate remaining validity in real time
 */
export function calculateRemainingValidity(expiresAt: number, activatedAt: number): RemainingTime {
  const now = Date.now();
  const diffMs = expiresAt - now;

  if (diffMs <= 0) {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      percentRemaining: 0,
      formattedString: 'Expired (0d 00h 00m 00s)',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const totalDuration = Math.max(expiresAt - activatedAt, THIRTY_DAYS_MS);
  const percentRemaining = Math.max(0, Math.min(100, (diffMs / totalDuration) * 100));

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedString = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    percentRemaining,
    formattedString,
  };
}
