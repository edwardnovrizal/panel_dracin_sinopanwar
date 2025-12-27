"use client";

import {
    adminLogin,
    clearSession,
    getCurrentUser,
    setSession as setSessionStore,
    subscribeSession,
    refreshSession
} from "@/lib/api";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const user = useSyncExternalStore(subscribeSession, getCurrentUser, getCurrentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        await refreshSession();
      } catch {}
      if (!cancelled) setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => {
    return {
      user,
      loading,
      signIn: async (email, password) => {
        const data = await adminLogin(email, password);
        return data;
      },
      signOut: () => {
        clearSession();
      },
      setSession: (payload) => {
        setSessionStore(payload);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
