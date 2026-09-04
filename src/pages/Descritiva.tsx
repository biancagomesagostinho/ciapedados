import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { AlertTriangle, TrendingDown, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { GaugeChart } from "@/components/ui/GaugeChart";
import { RiskRing } from "@/components/ui/RiskRing";
import { Select } from "@/components/ui/Input";
import { TurmaFilter } from "@/components/TurmaFilter";
import { useAuth } from "@/contexts/AuthContext";
import { useTurmasVisiveis, MENSAGEM_SEM_TURMA } from "@/hooks/useTurmasVisiveis";
import { supabase } from "@/lib/supabase";
import { ORDEM_RISCO } from "@/lib/risco";
import { anosDisponiveis, compararPeriodos } from "@/lib/periodo";
import type { AlunoDado, StatusRisco } from "@/types";

const RISK_COLOR_VAR: Record<StatusRisco, string> = {
  Alto: "var(--risk-alto)",
  Médio: "var(--risk-medio)",
  "Risco Futuro": "var(--risk-futuro)",
  Baixo: "var(--risk-baixo)",
};

export default function Descritiva() {
  useAuth();
  const { turmas: turmasVisiveis, bloqueado, carregando: carregandoTurmas } = useTurmasVisiveis();
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<string[]>([]);
  const [alunos, setAlunos] = useState<AlunoDado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState<string>("todos");

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      let query = supabase.from("alunos_dados").select("*").eq("aprovado", true);
      if (turmasSelecionadas.length > 0) {
        query = query.in("turma", turmasSelecionadas);
      }
      const { data } = await query;
      setAlunos((data as AlunoDado[]) ?? []);
      setCarregando(false);
    }
    if (!bloqueado) carregar();
    else setCarregando(false);
  }, [turmasSelecionadas, bloqueado]);

  function alternarTurma(turma: string) {
    setTurmasSelecionadas((prev) => (prev.includes(turma) ? prev.filter((t) => t !== turma) : [...prev, turma]));
  }

  const notaMedia = useMemo(
    () => (alunos.length ? alunos.reduce((s, a) => s + a.nota, 0) / alunos.length : 0),
    [alunos]
  );
  const freqMedia = useMemo(
    () => (alunos.length ? alunos.reduce((s, a) => s + a.frequencia, 0) / alunos.length : 0),
    [alunos]
  );

  const porTurma = useMemo(() => {
    const mapa = new Map<string, AlunoDado[]>();
    alunos.forEach((a) => mapa.set(a.turma, [...(mapa.get(a.turma) ?? []), a]));
    return mapa;
  }, [alunos]);

  const indiceTurmasSaudaveis = useMemo(() => {
    const turmas = Array.from(porTurma.keys());
    if (turmas.length === 0) return 0;
    let saudaveis = 0;
    turmas.forEach((turma) => {
      const lista = porTurma.get(turma)!;
      const criticos = lista.filter((a) => a.status_risco === "Alto" || a.status_risco === "Médio").length;
      if ((criticos / lista.length) * 100 < 20) saudaveis += 1;
    });
    return (saudaveis / turmas.length) * 100;
  }, [porTurma]);

  const distribuicaoRisco = useMemo(() => {
    const total = alunos.length || 1;
    return ORDEM_RISCO.map((nivel) => ({
      nivel,
      quantidade: alunos.filter((a) => a.status_risco === nivel).length,
      percentual: (alunos.filter((a) => a.status_risco === nivel).length / total) * 100,
    }));
  }, [alunos]);

  const dadosBarras = useMemo(() => {
    return Array.from(porTurma.entries())
      .map(([turma, lista]) => ({
        turma,
        nota: Number((lista.reduce((s, a) => s + a.nota, 0) / lista.length).toFixed(1)),
        frequencia: Number((lista.reduce((s, a) => s + a.frequencia, 0) / lista.length).toFixed(1)),
      }))
      .sort((a, b) => a.turma.localeCompare(b.turma, "pt-BR"));
  }, [porTurma]);

  const anos = useMemo(() => anosDisponiveis(alunos.map((a) => a.periodo)), [alunos]);

  const dadosEvolucao = useMemo(() => {
    const filtrados =
      anoSelecionado === "todos"
        ? alunos
        : alunos.filter((a) => a.periodo.includes(anoSelecionado));

    const porPeriodo = new Map<string, AlunoDado[]>();
    filtrados.forEach((a) => porPeriodo.set(a.periodo, [...(porPeriodo.get(a.periodo) ?? []), a]));

    return Array.from(porPeriodo.entries())
      .sort(([a], [b]) => compararPeriodos(a, b))
      .map(([periodo, lista]) => {
        const notaMediaPeriodo = lista.reduce((s, a) => s + a.nota, 0) / lista.length;
        const freqMediaPeriodo = lista.reduce((s, a) => s + a.frequencia, 0) / lista.length;
        return {
          periodo,
          Frequência: Number(freqMediaPeriodo.toFixed(1)),
          Média: Number((notaMediaPeriodo * 10).toFixed(1)),
          notaReal: Number(notaMediaPeriodo.toFixed(1)),
        };
      });
  }, [alunos, anoSelecionado]);

  const frequenciaCritica = alunos.filter((a) => a.frequencia < 85).length;
  const aprendizagemAtencao = alunos.filter((a) => a.nota < 6).length;
  const casosEstaveis = alunos.filter((a) => a.status_risco === "Baixo").length;

  if (!carregandoTurmas && bloqueado) {
    return (
      <div>
        <h2 className="mb-6 font-serif text-2xl font-semibold text-text">Panorama Atual (Descritivo)</h2>
        <Card>
          <CardContent className="py-8 text-center text-text-muted">{MENSAGEM_SEM_TURMA}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl font-semibold text-text">Panorama Atual (Descritivo)</h2>

      <Card>
        <CardHeader>
          <CardTitle>Filtro de turmas</CardTitle>
          <CardSubtitle>Nenhuma seleção equivale a considerar a escola toda.</CardSubtitle>
        </CardHeader>
        <CardContent>
          <TurmaFilter turmasDisponiveis={turmasVisiveis} selecionadas={turmasSelecionadas} onAlternar={alternarTurma} />
        </CardContent>
      </Card>

      {carregando ? (
        <p className="text-sm text-text-muted">Carregando dados...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col items-center py-6">
                <GaugeChart label="Nota Média Geral" displayValue={notaMedia.toFixed(1)} percentual={(notaMedia / 10) * 100} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center py-6">
                <GaugeChart
                  label="Frequência Média Geral"
                  displayValue={`${freqMedia.toFixed(0)}%`}
                  percentual={freqMedia}
                  colorVar="var(--risk-futuro)"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center py-6">
                <GaugeChart
                  label="Índice de Turmas Saudáveis"
                  displayValue={`${indiceTurmasSaudaveis.toFixed(0)}%`}
                  percentual={indiceTurmasSaudaveis}
                  colorVar="var(--risk-baixo)"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Risco da Escola</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {distribuicaoRisco.map(({ nivel, percentual, quantidade }) => (
                  <div key={nivel} className="flex flex-col items-center gap-2 rounded-md border border-border p-4">
                    <RiskRing percentual={percentual} colorVar={RISK_COLOR_VAR[nivel]} />
                    <p className="text-sm font-semibold text-text">{percentual.toFixed(0)}%</p>
                    <p className="text-center text-xs text-text-muted">
                      {nivel} ({quantidade})
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Nota média por turma</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dadosBarras}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                    <XAxis dataKey="turma" stroke="rgb(var(--text-muted))" fontSize={12} />
                    <YAxis domain={[0, 10]} stroke="rgb(var(--text-muted))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "rgb(var(--card))", border: "1px solid rgb(var(--border))" }} />
                    <Bar dataKey="nota" fill="rgb(var(--gold))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Frequência média por turma</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dadosBarras}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                    <XAxis dataKey="turma" stroke="rgb(var(--text-muted))" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="rgb(var(--text-muted))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "rgb(var(--card))", border: "1px solid rgb(var(--border))" }} />
                    <Bar dataKey="frequencia" fill="rgb(var(--risk-futuro))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Evolução dos Indicadores</CardTitle>
                <CardSubtitle>Projeção baseada nos dados importados</CardSubtitle>
              </div>
              <Select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(e.target.value)}
                className="w-40"
              >
                <option value="todos">Todos os anos</option>
                {anos.map((ano) => (
                  <option key={ano} value={String(ano)}>
                    {ano}
                  </option>
                ))}
              </Select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dadosEvolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="periodo" stroke="rgb(var(--text-muted))" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="rgb(var(--text-muted))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "rgb(var(--card))", border: "1px solid rgb(var(--border))" }}
                    formatter={(value: number, name: string, item: { payload?: { notaReal?: number } }) => {
                      if (name === "Média") return [item.payload?.notaReal, "Nota média"];
                      return [`${value}%`, "Frequência"];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Frequência" stroke="rgb(var(--risk-futuro))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Média" stroke="rgb(var(--gold))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leitura Inteligente</CardTitle>
              <CardSubtitle>O que os dados mostram</CardSubtitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-risk-alto" />
                <p className="text-sm text-text">
                  <span className="font-medium">Frequência crítica:</span> {frequenciaCritica} estudantes abaixo de
                  85%
                </p>
              </div>
              <div className="flex items-center gap-3">
                <TrendingDown size={18} className="text-risk-medio" />
                <p className="text-sm text-text">
                  <span className="font-medium">Aprendizagem em atenção:</span> {aprendizagemAtencao} médias abaixo
                  de 6,0
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-risk-baixo" />
                <p className="text-sm text-text">
                  <span className="font-medium">Casos estáveis:</span> {casosEstaveis} estudantes sem risco atual
                </p>
              </div>
              <Link
                to="/prescritiva"
                className="mt-2 flex w-fit items-center gap-1.5 text-sm font-medium text-gold hover:underline"
              >
                Ver recomendações
                <ArrowRight size={14} />
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
