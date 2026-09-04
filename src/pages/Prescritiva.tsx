import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useTurmasVisiveis, MENSAGEM_SEM_TURMA } from "@/hooks/useTurmasVisiveis";
import { supabase } from "@/lib/supabase";
import { formatarData } from "@/lib/utils";
import type { AlunoDado, Intervencao, PlanoAcaoCatalogo, StatusAcao, StatusRisco } from "@/types";

const NIVEIS_PLANO: StatusRisco[] = ["Alto", "Médio", "Risco Futuro"];

const STATUS_LABEL: Record<StatusAcao, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export default function Prescritiva() {
  const { profile } = useAuth();
  const { turmas: turmasVisiveis, bloqueado, carregando: carregandoTurmas } = useTurmasVisiveis();

  const [alunos, setAlunos] = useState<AlunoDado[]>([]);
  const [intervencoes, setIntervencoes] = useState<Intervencao[]>([]);
  const [catalogo, setCatalogo] = useState<PlanoAcaoCatalogo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [filtroAcao, setFiltroAcao] = useState("");
  const [filtroTurma, setFiltroTurma] = useState<string[]>([]);
  const [filtroRisco, setFiltroRisco] = useState<StatusRisco[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusAcao[]>([]);

  const [planoEditando, setPlanoEditando] = useState<AlunoDado | null>(null);
  const [textoPlano, setTextoPlano] = useState("");
  const [salvandoPlano, setSalvandoPlano] = useState(false);

  const [modalIntervencao, setModalIntervencao] = useState(false);
  const [alunoIntervencaoId, setAlunoIntervencaoId] = useState("");
  const [descricaoIntervencao, setDescricaoIntervencao] = useState("");
  const [responsavelIntervencao, setResponsavelIntervencao] = useState("");
  const [prazoIntervencao, setPrazoIntervencao] = useState("");
  const [salvandoIntervencao, setSalvandoIntervencao] = useState(false);
  const [erroIntervencao, setErroIntervencao] = useState<string | null>(null);

  async function carregarTudo() {
    setCarregando(true);
    const [{ data: alunosData }, { data: intervencoesData }, { data: catalogoData }] = await Promise.all([
      supabase.from("alunos_dados").select("*").eq("aprovado", true),
      supabase.from("intervencoes").select("*").order("criado_em", { ascending: false }),
      supabase.from("planos_acao_catalogo").select("*").eq("ativo", true),
    ]);
    setAlunos((alunosData as AlunoDado[]) ?? []);
    setIntervencoes((intervencoesData as Intervencao[]) ?? []);
    setCatalogo((catalogoData as PlanoAcaoCatalogo[]) ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    if (!bloqueado) carregarTudo();
    else setCarregando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bloqueado]);

  const alunosMap = useMemo(() => new Map(alunos.map((a) => [a.id, a])), [alunos]);

  const planosAutomaticos = useMemo(
    () => alunos.filter((a) => a.status_risco === "Alto" || a.status_risco === "Médio" || a.status_risco === "Risco Futuro"),
    [alunos]
  );

  const percentuais = useMemo(() => {
    const totalItens = planosAutomaticos.length + intervencoes.length;
    if (totalItens === 0) return { concluido: 0, andamento: 0, pendente: 0 };
    const concluido =
      planosAutomaticos.filter((a) => a.status_acao === "concluido").length +
      intervencoes.filter((i) => i.status === "concluido").length;
    const andamento =
      planosAutomaticos.filter((a) => a.status_acao === "em_andamento").length +
      intervencoes.filter((i) => i.status === "em_andamento").length;
    const pendente = totalItens - concluido - andamento;
    return {
      concluido: (concluido / totalItens) * 100,
      andamento: (andamento / totalItens) * 100,
      pendente: (pendente / totalItens) * 100,
    };
  }, [planosAutomaticos, intervencoes]);

  const planosFiltrados = useMemo(() => {
    return planosAutomaticos.filter((a) => {
      if (filtroAcao && !a.plano_acao_final.toLowerCase().includes(filtroAcao.toLowerCase())) return false;
      if (filtroTurma.length > 0 && !filtroTurma.includes(a.turma)) return false;
      if (filtroRisco.length > 0 && !filtroRisco.includes(a.status_risco)) return false;
      if (filtroStatus.length > 0 && !filtroStatus.includes(a.status_acao)) return false;
      return true;
    });
  }, [planosAutomaticos, filtroAcao, filtroTurma, filtroRisco, filtroStatus]);

  const intervencoesFiltradas = useMemo(() => {
    return intervencoes.filter((i) => {
      const aluno = alunosMap.get(i.aluno_dado_id);
      if (filtroTurma.length > 0 && aluno && !filtroTurma.includes(aluno.turma)) return false;
      if (filtroStatus.length > 0 && !filtroStatus.includes(i.status)) return false;
      return true;
    });
  }, [intervencoes, alunosMap, filtroTurma, filtroStatus]);

  function alternarTurma(turma: string) {
    setFiltroTurma((prev) => (prev.includes(turma) ? prev.filter((t) => t !== turma) : [...prev, turma]));
  }
  function alternarRisco(nivel: StatusRisco) {
    setFiltroRisco((prev) => (prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]));
  }
  function alternarStatus(status: StatusAcao) {
    setFiltroStatus((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  }

  async function atualizarStatusPlano(aluno: AlunoDado, status: StatusAcao) {
    await supabase.from("alunos_dados").update({ status_acao: status }).eq("id", aluno.id);
    setAlunos((prev) => prev.map((a) => (a.id === aluno.id ? { ...a, status_acao: status } : a)));
  }

  async function atualizarStatusIntervencao(intervencao: Intervencao, status: StatusAcao) {
    await supabase.from("intervencoes").update({ status }).eq("id", intervencao.id);
    setIntervencoes((prev) => prev.map((i) => (i.id === intervencao.id ? { ...i, status } : i)));
  }

  function abrirEdicaoPlano(aluno: AlunoDado) {
    setPlanoEditando(aluno);
    setTextoPlano(aluno.plano_acao_final);
  }

  async function salvarPlano() {
    if (!planoEditando || !profile) return;
    setSalvandoPlano(true);
    const agora = new Date().toISOString();
    await supabase
      .from("alunos_dados")
      .update({
        plano_acao_final: textoPlano,
        plano_acao_editado_por: profile.id,
        plano_acao_editado_em: agora,
      })
      .eq("id", planoEditando.id);
    setAlunos((prev) =>
      prev.map((a) =>
        a.id === planoEditando.id
          ? { ...a, plano_acao_final: textoPlano, plano_acao_editado_por: profile.id, plano_acao_editado_em: agora }
          : a
      )
    );
    setSalvandoPlano(false);
    setPlanoEditando(null);
  }

  function abrirModalIntervencao() {
    setAlunoIntervencaoId("");
    setDescricaoIntervencao("");
    setResponsavelIntervencao("");
    setPrazoIntervencao("");
    setErroIntervencao(null);
    setModalIntervencao(true);
  }

  async function salvarIntervencao() {
    setErroIntervencao(null);
    if (!alunoIntervencaoId || !descricaoIntervencao.trim() || !responsavelIntervencao.trim() || !prazoIntervencao) {
      setErroIntervencao("Preencha todos os campos.");
      return;
    }
    if (!profile) return;

    setSalvandoIntervencao(true);
    const { data, error } = await supabase
      .from("intervencoes")
      .insert({
        aluno_dado_id: alunoIntervencaoId,
        descricao: descricaoIntervencao.trim(),
        responsavel: responsavelIntervencao.trim(),
        prazo: prazoIntervencao,
        status: "pendente",
        criado_por: profile.id,
      })
      .select()
      .single();
    setSalvandoIntervencao(false);

    if (error || !data) {
      setErroIntervencao("Não foi possível criar a intervenção.");
      return;
    }

    setIntervencoes((prev) => [data as Intervencao, ...prev]);
    setModalIntervencao(false);
  }

  const catalogoParaAluno = (aluno: AlunoDado) =>
    catalogo.filter((c) => c.niveis_risco_aplicaveis.includes(aluno.status_risco));

  if (!carregandoTurmas && bloqueado) {
    return (
      <div>
        <h2 className="mb-6 font-serif text-2xl font-semibold text-text">Plano Recomendado (Prescritiva)</h2>
        <Card>
          <CardContent className="py-8 text-center text-text-muted">{MENSAGEM_SEM_TURMA}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl font-semibold text-text">Plano Recomendado (Prescritiva)</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-6 text-center">
            <p className="font-serif text-3xl font-bold text-risk-baixo">{percentuais.concluido.toFixed(0)}%</p>
            <p className="mt-1 text-sm text-text-muted">Concluídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="font-serif text-3xl font-bold text-risk-medio">{percentuais.andamento.toFixed(0)}%</p>
            <p className="mt-1 text-sm text-text-muted">Em Andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="font-serif text-3xl font-bold text-risk-alto">{percentuais.pendente.toFixed(0)}%</p>
            <p className="mt-1 text-sm text-text-muted">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="filtroAcao">Ação</Label>
              <Input id="filtroAcao" placeholder="Buscar no texto do plano" value={filtroAcao} onChange={(e) => setFiltroAcao(e.target.value)} />
            </div>
            <div>
              <Label>Status de Risco</Label>
              <div className="flex flex-wrap gap-3 pt-1">
                {NIVEIS_PLANO.map((nivel) => (
                  <label key={nivel} className="flex items-center gap-1.5 text-xs text-text">
                    <Checkbox checked={filtroRisco.includes(nivel)} onChange={() => alternarRisco(nivel)} />
                    {nivel}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Turma</Label>
              <div className="flex flex-wrap gap-3 pt-1">
                {turmasVisiveis.map((turma) => (
                  <label key={turma} className="flex items-center gap-1.5 text-xs text-text">
                    <Checkbox checked={filtroTurma.includes(turma)} onChange={() => alternarTurma(turma)} />
                    {turma}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Status do Plano</Label>
              <div className="flex flex-wrap gap-3 pt-1">
                {(Object.keys(STATUS_LABEL) as StatusAcao[]).map((status) => (
                  <label key={status} className="flex items-center gap-1.5 text-xs text-text">
                    <Checkbox checked={filtroStatus.includes(status)} onChange={() => alternarStatus(status)} />
                    {STATUS_LABEL[status]}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {carregando ? (
        <p className="text-sm text-text-muted">Carregando...</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Planos Recomendados</CardTitle>
              <CardSubtitle>{planosFiltrados.length} aluno(s)</CardSubtitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {planosFiltrados.map((aluno) => (
                  <div key={aluno.id} className="flex flex-col gap-3 rounded-md border border-border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-text">{aluno.nome_aluno}</p>
                        <p className="text-xs text-text-muted">{aluno.turma}</p>
                      </div>
                      <RiskBadge status={aluno.status_risco} />
                    </div>
                    <p className="text-sm text-text-muted">{aluno.plano_acao_final}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Select
                        value={aluno.status_acao}
                        onChange={(e) => atualizarStatusPlano(aluno, e.target.value as StatusAcao)}
                        className="w-auto"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="concluido">Concluído</option>
                      </Select>
                      {profile?.papel === "coordenador" && (
                        <Button size="sm" variant="outline" onClick={() => abrirEdicaoPlano(aluno)}>
                          <Pencil size={13} />
                          Editar plano
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {planosFiltrados.length === 0 && (
                  <p className="text-sm text-text-muted">Nenhum plano encontrado com os filtros atuais.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Intervenções Registradas</CardTitle>
                <CardSubtitle>{intervencoesFiltradas.length} intervenção(ões)</CardSubtitle>
              </div>
              <Button size="sm" onClick={abrirModalIntervencao}>
                <Plus size={15} />
                Criar Intervenção Manual
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {intervencoesFiltradas.map((intervencao) => {
                  const aluno = alunosMap.get(intervencao.aluno_dado_id);
                  return (
                    <div key={intervencao.id} className="flex flex-col gap-2 rounded-md border border-border p-4">
                      <div>
                        <p className="font-medium text-text">{aluno?.nome_aluno ?? "Aluno"}</p>
                        <p className="text-xs text-text-muted">{aluno?.turma}</p>
                      </div>
                      <p className="text-sm text-text-muted">{intervencao.descricao}</p>
                      <p className="text-xs text-text-muted">Responsável: {intervencao.responsavel}</p>
                      <p className="text-xs text-text-muted">Prazo: {formatarData(intervencao.prazo)}</p>
                      <Select
                        value={intervencao.status}
                        onChange={(e) => atualizarStatusIntervencao(intervencao, e.target.value as StatusAcao)}
                        className="mt-auto w-auto"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="concluido">Concluído</option>
                      </Select>
                    </div>
                  );
                })}
                {intervencoesFiltradas.length === 0 && (
                  <p className="text-sm text-text-muted">Nenhuma intervenção registrada ainda.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Modal aberto={!!planoEditando} onFechar={() => setPlanoEditando(null)} titulo="Editar plano de ação" largura="max-w-xl">
        {planoEditando && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              {planoEditando.nome_aluno} · {planoEditando.turma} · {planoEditando.status_risco}
            </p>
            <div>
              <Label htmlFor="catalogo">Sugestões do catálogo</Label>
              <Select id="catalogo" value="" onChange={(e) => e.target.value && setTextoPlano(e.target.value)}>
                <option value="">Selecionar um texto do catálogo...</option>
                {catalogoParaAluno(planoEditando).map((item) => (
                  <option key={item.id} value={item.texto}>
                    {item.texto.slice(0, 70)}
                    {item.texto.length > 70 ? "..." : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="textoPlano">Texto do plano</Label>
              <Textarea id="textoPlano" rows={5} value={textoPlano} onChange={(e) => setTextoPlano(e.target.value)} />
            </div>
            <Button onClick={salvarPlano} disabled={salvandoPlano}>
              {salvandoPlano ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </Modal>

      <Modal aberto={modalIntervencao} onFechar={() => setModalIntervencao(false)} titulo="Criar Intervenção Manual">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="alunoIntervencao">Aluno</Label>
            <Select id="alunoIntervencao" value={alunoIntervencaoId} onChange={(e) => setAlunoIntervencaoId(e.target.value)}>
              <option value="">Selecionar aluno...</option>
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome_aluno} ({aluno.turma})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="descricaoIntervencao">Descrição</Label>
            <Textarea
              id="descricaoIntervencao"
              rows={3}
              value={descricaoIntervencao}
              onChange={(e) => setDescricaoIntervencao(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="responsavelIntervencao">Responsável</Label>
            <Input id="responsavelIntervencao" value={responsavelIntervencao} onChange={(e) => setResponsavelIntervencao(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="prazoIntervencao">Prazo</Label>
            <Input id="prazoIntervencao" type="date" value={prazoIntervencao} onChange={(e) => setPrazoIntervencao(e.target.value)} />
          </div>
          {erroIntervencao && (
            <p className="rounded-md border border-risk-alto/40 bg-risk-alto/10 px-3 py-2 text-sm text-risk-alto">
              {erroIntervencao}
            </p>
          )}
          <Button onClick={salvarIntervencao} disabled={salvandoIntervencao}>
            {salvandoIntervencao ? "Salvando..." : "Salvar intervenção"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
