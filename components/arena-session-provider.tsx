"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type SessionUser = {
  id: string;
  email: string;
  type: "guest" | "regular";
};

type SessionData = {
  user: SessionUser;
} | null;

type SessionContextValue = {
  data: SessionData;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
  update: async () => {},
});

export function ArenaSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<SessionData>(null);
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session");
      const session = await response.json();
      if (session?.user) {
        setData(session);
        setStatus("authenticated");
      } else {
        setData(null);
        setStatus("unauthenticated");
      }
    } catch {
      setData(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <SessionContext.Provider value={{ data, status, update: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export async function signOut(options?: { redirectTo?: string }) {
  await fetch("/api/auth/signout", { method: "POST" });
  if (options?.redirectTo) {
    window.location.href = options.redirectTo;
  }
}
