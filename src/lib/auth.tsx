'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ sessionCreated: boolean; emailConfirmationRequired: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  // MFA
  listMFAFactors: () => Promise<MFAFactor[]>;
  enrollTOTP: () => Promise<{ factorId: string; qrCode: string; secret: string }>;
  verifyTOTPEnrollment: (factorId: string, code: string) => Promise<void>;
  challengeAndVerifyMFA: (factorId: string, code: string) => Promise<void>;
  unenrollMFA: (factorId: string) => Promise<void>;
  sendEmailOTP: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      checkMFARequired(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      checkMFARequired(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkMFARequired = async (currentUser: User | null) => {
    if (!currentUser) { setMfaRequired(false); return; }
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    // nextLevel > currentLevel means MFA challenge is still needed
    setMfaRequired(
      !!data && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2'
    );
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    // Prevent a stale session from surviving a sign-up attempt and making the
    // app appear to log into the previously authenticated user.
    await supabase.auth.signOut({ scope: 'local' });

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    return {
      sessionCreated: !!data.session,
      emailConfirmationRequired: !data.session,
    };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
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
    await checkMFARequired(user);
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
    await checkMFARequired(user);
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
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
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        sendPasswordReset,
        updatePassword,
        listMFAFactors,
        enrollTOTP,
        verifyTOTPEnrollment,
        challengeAndVerifyMFA,
        unenrollMFA,
        sendEmailOTP,
      }}
    >
      {children}
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
