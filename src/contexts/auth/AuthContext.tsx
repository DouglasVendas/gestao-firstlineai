import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  organizationId: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchOrganization(session.user.id);
        } else {
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        setSession(null);
        setUser(null);
        setIsLoading(false);
      });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchOrganization(session.user.id);
      } else {
        setOrganizationId(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrganization = async (userId: string) => {
    try {
      // Preferred source: explicit user->organization mapping
      const { data, error } = await supabase
        .from('users_organizations')
        .select('organization_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (data?.organization_id) {
        setOrganizationId(data.organization_id);
        return;
      }

      if (error) {
        console.warn("users_organizations lookup failed, trying fallbacks:", error.message);
      }

      // Fallback 1: financial_settings (already tenant-scoped by RLS)
      const { data: fsData } = await supabase
        .from('financial_settings')
        .select('organization_id')
        .limit(1)
        .maybeSingle();

      if (fsData?.organization_id) {
        setOrganizationId(fsData.organization_id);
        return;
      }

      // Fallback 2: any visible client row
      const { data: clientData } = await supabase
        .from('clients')
        .select('organization_id')
        .limit(1)
        .maybeSingle();

      if (clientData?.organization_id) {
        setOrganizationId(clientData.organization_id);
      } else {
        setOrganizationId(null);
      }
    } catch (e) {
      console.error("Error fetching org:", e);
      setOrganizationId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, organizationId, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
