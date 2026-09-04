import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Tema } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ThemeContextValue {
  tema: Tema;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [tema, setTema] = useState<Tema>("escuro");

  useEffect(() => {
    if (profile?.tema) {
      setTema(profile.tema);
    }
  }, [profile?.tema]);

  useEffect(() => {
    const root = document.documentElement;
    if (tema === "escuro") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [tema]);

  async function alternarTema() {
    const novoTema: Tema = tema === "escuro" ? "claro" : "escuro";
    setTema(novoTema);
    if (profile?.id) {
      await supabase.from("profiles").update({ tema: novoTema }).eq("id", profile.id);
    }
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
