import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTurmasVisiveis } from "@/hooks/useTurmasVisiveis";

export function useAlertaAltoRisco() {
  const { turmas, todasLiberadas, bloqueado, carregando } = useTurmasVisiveis();
  const [quantidade, setQuantidade] = useState(0);

  useEffect(() => {
    async function carregar() {
      if (carregando || bloqueado) {
        setQuantidade(0);
        return;
      }

      let query = supabase
        .from("alunos_dados")
        .select("id", { count: "exact", head: true })
        .eq("aprovado", true)
        .eq("status_risco", "Alto");

      if (!todasLiberadas) {
        if (turmas.length === 0) {
          setQuantidade(0);
          return;
        }
        query = query.in("turma", turmas);
      }

      const { count } = await query;
      setQuantidade(count ?? 0);
    }

    carregar();
  }, [turmas, todasLiberadas, bloqueado, carregando]);

  return quantidade;
}
