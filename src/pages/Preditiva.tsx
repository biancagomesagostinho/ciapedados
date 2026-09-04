import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { RiskRing } from "@/components/ui/RiskRing";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Input, Label } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { useTurmasVisiveis, MENSAGEM_SEM_TURMA } from "@/hooks/useTurmasVisiveis";
import { supabase } from "@/lib/supabase";
import { ORDEM_RISCO } from "@/lib/risco";
import { cn } from "@/lib/utils";
import type { AlunoDado, StatusRisco } from "@/types";

const RISK_COLOR_VAR: Record<StatusRisco, string> = {
  Alto: "var(--risk-alto)",
  Médio: "var(--risk-medio)",
  "Risco Futuro": "var(--risk-futuro)",
  Baixo: "var(--risk-baixo)",
};

const RISK_ROW_CLASS: Record<StatusRisco, string> = {
  Alto: "border-l-4 border-l-risk-alto",
  Médio: "border-l-4 border-l-risk-medio",
  "Risco Futuro": "border-l-4 border-l-risk-futuro",
  Baixo: "border-l-4 border-l-risk-baixo",
};

export default function Preditiva() {
  const { turmas: turmasVisiveis, bloqueado, carregando: carregandoTurmas } = useTurmasVisiveis();
  const [alunos, setAlunos] = useState<AlunoDado[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nomeFiltro, setNomeFiltro] = useState("");
  const [turmaFiltro, setTurmaFiltro] = useState<string[]>([]);
  const [notaMin, setNotaMin] = useState("");
  const [notaMax, setNotaMax] = useState("");
  const [freqMin, setFreqMin] = useState("");
  const [freqMax, setFreqMax] = useState("");
  const [riscoFiltro, setRiscoFiltro] = useState<StatusRisco[]>([]);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const { data } = await supabase.from("alunos_dados").select("*").eq("aprovado", true);
      setAlunos((data as AlunoDado[]) ?? []);
      setCarregando(false);
    }
    if (!bloqueado) carregar();
    else setCarregando(false);
  }, [bloqueado]);

  const semFiltroRisco = useMemo(() => {
    return alunos.filter((a) => {
      if (nomeFiltro && !a.nome_aluno.toLowerCase().includes(nomeFiltro.toLowerCase())) return false;
      if (turmaFiltro.length > 0 && !turmaFiltro.includes(a.turma)) return false;
      if (notaMin && a.nota < Number(notaMin)) return false;
      if (notaMax && a.nota > Number(notaMax)) return false;
      if (freqMin && a.frequencia < Number(freqMin)) return false;
      if (freqMax && a.frequencia > Number(freqMax)) return false;
      return true;
    });
  }, [alunos, nomeFiltro, turmaFiltro, notaMin, notaMax, freqMin, freqMax]);

  const visaoRapida = useMemo(() => {
    const total = semFiltroRisco.length || 1;
    return ORDEM_RISCO.map((nivel) => {
      const quantidade = semFiltroRisco.filter((a) => a.status_risco === nivel).length;
      return { nivel, quantidade, percentual: (quantidade / total) * 100 };
    });
  }, [semFiltroRisco]);

  const resultadoFinal = useMemo(() => {
    if (riscoFiltro.length === 0) return semFiltroRisco;
    return semFiltroRisco.filter((a) => riscoFiltro.includes(a.status_risco));
  }, [semFiltroRisco, riscoFiltro]);

  function clicarAtalhoRisco(nivel: StatusRisco) {
    setRiscoFiltro((prev) => (prev.length === 1 && prev[0] === nivel ? [] : [nivel]));
  }

  function alternarTurmaFiltro(turma: string) {
    setTurmaFiltro((prev) => (prev.includes(turma) ? prev.filter((t) => t !== turma) : [...prev, turma]));
  }

  function alternarRiscoFiltro(nivel: StatusRisco) {
    setRiscoFiltro((prev) => (prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]));
  }

  if (!carregandoTurmas && bloqueado) {
    return (
      <div>
        <h2 className="mb-6 font-serif text-2xl font-semibold text-text">Projeção de Risco (Preditiva)</h2>
        <Card>
          <CardContent className="py-8 text-center text-text-muted">{MENSAGEM_SEM_TURMA}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl font-semibold text-text">Projeção de Risco (Preditiva)</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {visaoRapida.map(({ nivel, quantidade, percentual }) => {
          const ativo = riscoFiltro.length === 1 && riscoFiltro[0] === nivel;
          return (
            <button
              key={nivel}
              onClick={() => clicarAtalhoRisco(nivel)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-card border p-4 transition-colors",
                ativo ? "border-gold bg-gold/10" : "border-border bg-card hover:bg-border/10"
              )}
            >
              <RiskRing percentual={percentual} colorVar={RISK_COLOR_VAR[nivel]} />
              <p className="text-sm font-semibold text-text">
                {quantidade} <span className="text-text-muted">({percentual.toFixed(0)}%)</span>
              </p>
              <p className="text-center text-xs text-text-muted">{nivel}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" placeholder="Buscar por nome" value={nomeFiltro} onChange={(e) => setNomeFiltro(e.target.value)} />
            </div>
            <div>
              <Label>Nota (min / max)</Label>
              <div className="flex gap-2">
                <Input type="number" step="0.1" min={0} max={10} value={notaMin} onChange={(e) => setNotaMin(e.target.value)} placeholder="Min" />
                <Input type="number" step="0.1" min={0} max={10} value={notaMax} onChange={(e) => setNotaMax(e.target.value)} placeholder="Max" />
              </div>
            </div>
            <div>
              <Label>Frequência % (min / max)</Label>
              <div className="flex gap-2">
                <Input type="number" min={0} max={100} value={freqMin} onChange={(e) => setFreqMin(e.target.value)} placeholder="Min" />
                <Input type="number" min={0} max={100} value={freqMax} onChange={(e) => setFreqMax(e.target.value)} placeholder="Max" />
              </div>
            </div>
            <div>
              <Label>Status de Risco</Label>
              <div className="flex flex-wrap gap-3 pt-1">
                {ORDEM_RISCO.map((nivel) => (
                  <label key={nivel} className="flex items-center gap-1.5 text-xs text-text">
                    <Checkbox checked={riscoFiltro.includes(nivel)} onChange={() => alternarRiscoFiltro(nivel)} />
                    {nivel}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Turma</Label>
            <div className="flex flex-wrap gap-3 pt-1">
              {turmasVisiveis.map((turma) => (
                <label key={turma} className="flex items-center gap-1.5 text-xs text-text">
                  <Checkbox checked={turmaFiltro.includes(turma)} onChange={() => alternarTurmaFiltro(turma)} />
                  {turma}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
          <CardSubtitle>{resultadoFinal.length} aluno(s) encontrado(s)</CardSubtitle>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-text-muted">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="py-2 pr-4 font-medium">Nome</th>
                    <th className="py-2 pr-4 font-medium">Turma</th>
                    <th className="py-2 pr-4 font-medium">Nota</th>
                    <th className="py-2 pr-4 font-medium">Frequência</th>
                    <th className="py-2 pr-4 font-medium">Status de Risco</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadoFinal.map((aluno) => (
                    <tr key={aluno.id} className={cn("border-b border-border/50 bg-card", RISK_ROW_CLASS[aluno.status_risco])}>
                      <td className="py-2.5 pl-3 pr-4">{aluno.nome_aluno}</td>
                      <td className="py-2.5 pr-4">{aluno.turma}</td>
                      <td className="py-2.5 pr-4">{aluno.nota.toFixed(1)}</td>
                      <td className="py-2.5 pr-4">{aluno.frequencia.toFixed(0)}%</td>
                      <td className="py-2.5 pr-4">
                        <RiskBadge status={aluno.status_risco} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
