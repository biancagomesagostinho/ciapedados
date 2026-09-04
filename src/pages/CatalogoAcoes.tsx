import { useEffect, useState } from "react";
import { Plus, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea, Label } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { PlanoAcaoCatalogo, StatusRisco } from "@/types";

const NIVEIS: StatusRisco[] = ["Alto", "Médio", "Risco Futuro"];

export default function CatalogoAcoes() {
  const { profile } = useAuth();
  const [itens, setItens] = useState<PlanoAcaoCatalogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [niveisSelecionados, setNiveisSelecionados] = useState<StatusRisco[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from("planos_acao_catalogo").select("*").order("criado_em", { ascending: false });
    setItens((data as PlanoAcaoCatalogo[]) ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirCadastro() {
    setTexto("");
    setNiveisSelecionados([]);
    setErro(null);
    setModalAberto(true);
  }

  function alternarNivel(nivel: StatusRisco) {
    setNiveisSelecionados((prev) => (prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]));
  }

  async function salvar() {
    setErro(null);
    if (!texto.trim()) {
      setErro("Informe o texto da ação.");
      return;
    }
    if (niveisSelecionados.length === 0) {
      setErro("Selecione pelo menos um nível de risco aplicável.");
      return;
    }

    setSalvando(true);
    const { error } = await supabase.from("planos_acao_catalogo").insert({
      texto: texto.trim(),
      niveis_risco_aplicaveis: niveisSelecionados,
      ativo: true,
      criado_por: profile?.id,
    });
    setSalvando(false);

    if (error) {
      setErro("Não foi possível cadastrar a ação.");
      return;
    }

    setModalAberto(false);
    await carregar();
  }

  async function alternarAtivo(item: PlanoAcaoCatalogo) {
    await supabase.from("planos_acao_catalogo").update({ ativo: !item.ativo }).eq("id", item.id);
    await carregar();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-text">Catálogo de Ações</h2>
        <Button onClick={abrirCadastro}>
          <Plus size={16} />
          Cadastrar ação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações cadastradas</CardTitle>
          <CardSubtitle>Textos usados como sugestão nos planos de ação.</CardSubtitle>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-text-muted">Carregando...</p>
          ) : itens.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhuma ação cadastrada ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {itens.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <p className={`text-sm ${item.ativo ? "text-text" : "text-text-muted line-through"}`}>
                      {item.texto}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.niveis_risco_aplicaveis.map((nivel) => (
                        <span
                          key={nivel}
                          className="rounded-full border border-border bg-bg px-2 py-0.5 text-xs text-text-muted"
                        >
                          {nivel}
                        </span>
                      ))}
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                          item.ativo
                            ? "border-risk-baixo/40 bg-risk-baixo/10 text-risk-baixo"
                            : "border-risk-alto/40 bg-risk-alto/10 text-risk-alto"
                        }`}
                      >
                        {item.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => alternarAtivo(item)}>
                    <Power size={13} />
                    {item.ativo ? "Desativar" : "Reativar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal aberto={modalAberto} onFechar={() => setModalAberto(false)} titulo="Cadastrar ação">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="texto">Texto da ação *</Label>
            <Textarea id="texto" rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>

          <div>
            <Label>Níveis de risco aplicáveis *</Label>
            <div className="flex flex-col gap-2">
              {NIVEIS.map((nivel) => (
                <label key={nivel} className="flex items-center gap-2 text-sm text-text">
                  <Checkbox checked={niveisSelecionados.includes(nivel)} onChange={() => alternarNivel(nivel)} />
                  {nivel}
                </label>
              ))}
            </div>
          </div>

          {erro && (
            <p className="rounded-md border border-risk-alto/40 bg-risk-alto/10 px-3 py-2 text-sm text-risk-alto">
              {erro}
            </p>
          )}

          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
