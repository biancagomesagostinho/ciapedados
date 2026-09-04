import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ResultadoTurmasVisiveis {
  turmas: string[];
  todasLiberadas: boolean;
  bloqueado: boolean;
  carregando: boolean;
}

export function useTurmasVisiveis(): ResultadoTurmasVisiveis {
  const { profile, usuarioAutorizado } = useAuth();
  const [turmas, setTurmas] = useState<string[]>([]);
  const [todasLiberadas, setTodasLiberadas] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      if (!profile || !usuarioAutorizado) {
        setCarregando(false);
        return;
      }

      if (profile.papel === "coordenador" || usuarioAutorizado.acesso_turmas === "todas") {
        const { data } = await supabase.from("alunos_dados").select("turma").eq("aprovado", true);
        const distintas = Array.from(new Set((data ?? []).map((d) => d.turma))).sort();
        setTurmas(distintas);
        setTodasLiberadas(true);
        setBloqueado(false);
        setCarregando(false);
        return;
      }

      if (usuarioAutorizado.acesso_turmas === "selecionadas") {
        setTurmas(usuarioAutorizado.turmas_autorizadas ?? []);
        setTodasLiberadas(false);
        setBloqueado((usuarioAutorizado.turmas_autorizadas ?? []).length === 0);
        setCarregando(false);
        return;
      }

      setTurmas([]);
      setTodasLiberadas(false);
      setBloqueado(true);
      setCarregando(false);
    }

    carregar();
  }, [profile, usuarioAutorizado]);

  return { turmas, todasLiberadas, bloqueado, carregando };
}

export const MENSAGEM_SEM_TURMA = "Nenhuma turma liberada para o seu acesso. Procure o coordenador.";
