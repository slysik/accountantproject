'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const IDLE_WARNING_MS = 4 * 60 * 1000;
const MFA_TRUST_COOKIE = 'abf_recent_mfa';
const MFA_TRUST_WINDOW_MS = 10 * 60 * 1000;

interface MFAFactor {
  id: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  friendly_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mfaRequired: boolean;
  mfaSetupRequired: boolean;
  signInWithEmail: (_email: string, _password: string) => Promise<void>;
  signUpWithEmail: (
    _email: string,
    _password: string,
    _inviteToken?: string
  ) => Promise<{ sessionCreated: boolean; emailConfirmationRequired: boolean; inviteActivated?: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (_email: string) => Promise<void>;
  resendSignupConfirmation: (_email: string) => Promise<void>;
  updatePassword: (_newPassword: string) => Promise<void>;
  // MFA
  listMFAFactors: () => Promise<MFAFactor[]>;
  enrollTOTP: () => Promise<{ factorId: string; qrCode: string; secret: string }>;
  verifyTOTPEnrollment: (_factorId: string, _code: string) => Promise<void>;
  challengeAndVerifyMFA: (_factorId: string, _code: string) => Promise<void>;
  unenrollMFA: (_factorId: string) => Promise<void>;
  sendEmailOTP: () => Promise<void>;
  set2FARequired: (_enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setRecentMfaCookie(userId: string) {
  const expiresAt = Date.now() + MFA_TRUST_WINDOW_MS;
  document.cookie = `${MFA_TRUST_COOKIE}=${encodeURIComponent(`${userId}:${expiresAt}`)}; Path=/; Max-Age=${Math.floor(MFA_TRUST_WINDOW_MS / 1000)}; SameSite=Lax`;
}

function clearRecentMfaCookie() {
  document.cookie = `${MFA_TRUST_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function hasRecentMfaCookie(userId: string) {
  const cookieValue = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${MFA_TRUST_COOKIE}=`))
    ?.split('=')
    .slice(1)
    .join('=');

  if (!cookieValue) return false;

  const decodedValue = decodeURIComponent(cookieValue);
  const [cookieUserId, expiresAtRaw] = decodedValue.split(':');
  const expiresAt = Number(expiresAtRaw);

  if (cookieUserId !== userId || Number.isNaN(expiresAt) || Date.now() >= expiresAt) {
    clearRecentMfaCookie();
    return false;
  }

  return true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(Math.floor((IDLE_TIMEOUT_MS - IDLE_WARNING_MS) / 1000));
  const idleTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const warningVisibleRef = useRef(false);
  const continueSessionRef = useRef<() => void>(() => {});

  useEffect(() => {
    warningVisibleRef.current = showIdleWarning;
  }, [showIdleWarning]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      await refreshMFAState(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      void refreshMFAState(session?.user ?? null).finally(() => {
        setLoading(false);
      });
      // Auto-mark team member enrollment on first sign-in
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        void (async () => {
          try { await supabase.rpc('mark_team_member_enrolled'); } catch { /* ignore */ }
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading || !user) {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        window.clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setShowIdleWarning(false);
      return;
    }

    const clearTimers = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        window.clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };

    const handleIdleSignOut = async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        clearRecentMfaCookie();
        window.location.href = '/';
      }
    };

    const continueSession = () => {
      clearTimers();
      setShowIdleWarning(false);
      setWarningCountdown(Math.floor((IDLE_TIMEOUT_MS - IDLE_WARNING_MS) / 1000));

      warningTimerRef.current = window.setTimeout(() => {
        setShowIdleWarning(true);
        setWarningCountdown(Math.floor((IDLE_TIMEOUT_MS - IDLE_WARNING_MS) / 1000));

        countdownTimerRef.current = window.setInterval(() => {
          setWarningCountdown((current) => (current > 0 ? current - 1 : 0));
        }, 1000);
      }, IDLE_WARNING_MS);

      idleTimerRef.current = window.setTimeout(handleIdleSignOut, IDLE_TIMEOUT_MS);
    };

    const resetIdleTimer = () => {
      if (warningVisibleRef.current) return;
      continueSession();
    };

    continueSessionRef.current = continueSession;

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    resetIdleTimer();
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    return () => {
      clearTimers();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [loading, user]);

  const getAuthRedirectUrl = (path: string) => {
    const configuredBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    const baseUrl =
      configuredBaseUrl && configuredBaseUrl.trim().length > 0
        ? configuredBaseUrl.replace(/\/+$/, '')
        : window.location.origin;

    return `${baseUrl}${path}`;
  };

  const refreshMFAState = async (currentUser: User | null) => {
    if (!currentUser) {
      setMfaRequired(false);
      setMfaSetupRequired(false);
      clearRecentMfaCookie();
      return;
    }

    try {
      const [{ data: aalData }, { data: factorsData, error: factorsError }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);

      if (factorsError) throw factorsError;

      const verifiedTotpFactors = (factorsData?.totp ?? []).filter(
        (factor) => factor.status === 'verified'
      );

      // nextLevel > currentLevel means MFA challenge is still needed
      const hasRecentMfa = hasRecentMfaCookie(currentUser.id);
      setMfaRequired(
        verifiedTotpFactors.length > 0 &&
        !!aalData &&
        aalData.nextLevel === 'aal2' &&
        aalData.currentLevel !== 'aal2' &&
        !hasRecentMfa
      );
      // Only require setup when the user has explicitly opted in to 2FA
      // and hasn't completed enrollment yet.
      // Existing users with a verified factor are always treated as opted in.
      const hasOptedIn =
        verifiedTotpFactors.length > 0 ||
        currentUser.user_metadata?.require_2fa === true;
      setMfaSetupRequired(hasOptedIn && verifiedTotpFactors.length === 0);
    } catch (error) {
      console.error('Failed to refresh MFA state:', error);
      setMfaRequired(false);
      setMfaSetupRequired(false);
    }
  };

  const markTeamMemberEnrolled = async () => {
    try {
      await supabase.rpc('mark_team_member_enrolled');
    } catch {
      // non-critical — ignore
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await markTeamMemberEnrolled();
  };

  const signUpWithEmail = async (email: string, password: string, inviteToken?: string) => {
    // Prevent a stale session from surviving a sign-up attempt and making the
    // app appear to log into the previously authenticated user.
    await supabase.auth.signOut({ scope: 'local' });

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        inviteToken,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to create account');
    }

    if (payload.session?.access_token && payload.session?.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });
      if (error) throw error;
    }

    return {
      sessionCreated: !!payload.sessionCreated,
      emailConfirmationRequired: !!payload.emailConfirmationRequired,
      inviteActivated: !!payload.inviteActivated,
    };
  };

  const resendSignupConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl('/login'),
      },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl('/dashboard'),
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearRecentMfaCookie();
    window.location.href = '/';
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl('/reset-password'),
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const listMFAFactors = async (): Promise<MFAFactor[]> => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return (data?.totp ?? []) as unknown as MFAFactor[];
  };

  const enrollTOTP = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw error;
    return {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    };
  };

  const verifyTOTPEnrollment = async (factorId: string, code: string) => {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) throw error;
    if (user?.id) setRecentMfaCookie(user.id);
    await refreshMFAState(user);
  };

  const challengeAndVerifyMFA = async (factorId: string, code: string) => {
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) throw challengeErr;
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyErr) throw verifyErr;
    if (user?.id) setRecentMfaCookie(user.id);
    await refreshMFAState(user);
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    await refreshMFAState(user);
  };

  const set2FARequired = async (enabled: boolean) => {
    const { error } = await supabase.auth.updateUser({
      data: { require_2fa: enabled },
    });
    if (error) throw error;
    // Re-fetch session so user_metadata is up to date before refreshing MFA state
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    await refreshMFAState(refreshedUser);
  };

  const sendEmailOTP = async () => {
    if (!user?.email) throw new Error('No email on account');
    const { error } = await supabase.auth.signInWithOtp({ email: user.email });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        mfaRequired,
        mfaSetupRequired,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        sendPasswordReset,
        resendSignupConfirmation,
        updatePassword,
        listMFAFactors,
        enrollTOTP,
        verifyTOTPEnrollment,
        challengeAndVerifyMFA,
        unenrollMFA,
        sendEmailOTP,
        set2FARequired,
      }}
    >
      {children}
      {showIdleWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-primary bg-bg-secondary p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-text-primary">Session expiring soon</h2>
            <p className="mt-2 text-sm text-text-muted">
              You&apos;ll be signed out after 5 minutes of inactivity. Click below to keep working.
            </p>
            <div className="mt-4 rounded-xl bg-bg-tertiary px-4 py-3">
              <p className="text-sm text-text-primary">
                Automatic sign-out in <span className="font-semibold">{warningCountdown}</span> seconds.
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => continueSessionRef.current()}
                className="rounded-xl bg-accent-primary px-4 py-2 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
              >
                Stay signed in
              </button>
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } finally {
                    clearRecentMfaCookie();
                    window.location.href = '/';
                  }
                }}
                className="rounded-xl border border-border-primary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
              >
                Sign out now
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
