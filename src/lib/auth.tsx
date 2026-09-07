import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

let currentSession: Session | null = null;
let initialized = false;
const listeners = new Set<(s: Session | null) => void>();

function emit(session: Session | null) {
  currentSession = session;
  listeners.forEach((l) => l(session));
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  supabase.auth.getSession().then(({ data }) => emit(data.session));
  supabase.auth.onAuthStateChange((_event, session) => emit(session));
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(currentSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init();
    setSession(currentSession);
    setReady(true);
    const listener = (s: Session | null) => setSession(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session,
    user: (session?.user ?? null) as User | null,
    userId: session?.user.id ?? null,
    ready,
    signOut: () => supabase.auth.signOut(),
  };
}
