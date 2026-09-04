import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile, UsuarioAutorizado } from "@/types";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  usuarioAutorizado: UsuarioAutorizado | null;
  carregando: boolean;
  erroAcesso: string | null;
  entrarComGoogle: () => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [usuarioAutorizado, setUsuarioAutorizado] = useState<UsuarioAutorizado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroAcesso, setErroAcesso] = useState<string | null>(null);

  async function processarSessao(sessaoAtual: Session | null) {
    if (!sessaoAtual) {
      setProfile(null);
      setUsuarioAutorizado(null);
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase.rpc("registrar_login");

    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      setErroAcesso("acesso não autorizado, procure o coordenador");
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setUsuarioAutorizado(null);
      setCarregando(false);
      return;
    }

    const perfil = Array.isArray(data) ? data[0] : data;
    setProfile(perfil as Profile);

    const { data: autorizado } = await supabase
      .from("usuarios_autorizados")
      .select("*")
      .eq("email", sessaoAtual.user.email)
      .maybeSingle();

    setUsuarioAutorizado(autorizado as UsuarioAutorizado | null);
    setErroAcesso(null);
    setCarregando(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      processarSessao(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
      setCarregando(true);
      processarSessao(novaSessao);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function entrarComGoogle() {
    setErroAcesso(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  async function sair() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setUsuarioAutorizado(null);
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, usuarioAutorizado, carregando, erroAcesso, entrarComGoogle, sair }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
