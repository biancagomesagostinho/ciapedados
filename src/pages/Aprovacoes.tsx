import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea, Label } from "@/components/ui/Input";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { supabase } from "@/lib/supabase";
import { formatarData } from "@/lib/utils";
import type { AlunoDado, Envio } from "@/types";

interface EnvioComAutor extends Envio {
  profiles: { nome: string } | null;
  numeroAlunos: number;
}

export default function Aprovacoes() {
  const [envios, setEnvios] = useState<EnvioComAutor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [envioSelecionado, setEnvioSelecionado] = useState<EnvioComAutor | null>(null);
  const [alunosDoEnvio, setAlunosDoEnvio] = useState<AlunoDado[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [mostrarRejeicao, setMostrarRejeicao] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [processando, setProcessando] = useState(false);

  async function carregarPendentes() {
    setCarregando(true);
    const { data: pendentes } = await supabase
      .from("envios")
      .select("*, profiles(nome)")
      .eq("status", "pendente")
      .order("data_envio", { ascending: true });

    const lista = (pendentes ?? []) as unknown as EnvioComAutor[];

    if (lista.length > 0) {
      const ids = lista.map((e) => e.id);
      const { data: alunos } = await supabase.from("alunos_dados").select("envio_id").in("envio_id", ids);
      const contagens = new Map<string, number>();
      (alunos ?? []).forEach((a) => contagens.set(a.envio_id, (contagens.get(a.envio_id) ?? 0) + 1));
      lista.forEach((e) => (e.numeroAlunos = contagens.get(e.id) ?? 0));
    }

    setEnvios(lista);
    setCarregando(false);
  }

  useEffect(() => {
    carregarPendentes();
  }, []);

  async function abrirEnvio(envio: EnvioComAutor) {
    setEnvioSelecionado(envio);
    setCarregandoAlunos(true);
    setMostrarRejeicao(false);
    setMotivo("");
    const { data } = await supabase.from("alunos_dados").select("*").eq("envio_id", envio.id).order("nome_aluno");
    setAlunosDoEnvio((data as AlunoDado[]) ?? []);
    setCarregandoAlunos(false);
  }

  async function aprovar() {
    if (!envioSelecionado) return;
    setProcessando(true);
    await supabase.from("envios").update({ status: "aprovado" }).eq("id", envioSelecionado.id);
    await supabase.from("alunos_dados").update({ aprovado: true }).eq("envio_id", envioSelecionado.id);
    setProcessando(false);
    setEnvioSelecionado(null);
    await carregarPendentes();
  }

  async function rejeitar() {
    if (!envioSelecionado || !motivo.trim()) return;
    setProcessando(true);
    await supabase
      .from("envios")
      .update({ status: "rejeitado", motivo_rejeicao: motivo.trim() })
      .eq("id", envioSelecionado.id);
    setProcessando(false);
    setEnvioSelecionado(null);
    await carregarPendentes();
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl font-semibold text-text">Aprovações</h2>

      <Card>
        <CardHeader>
          <CardTitle>Envios pendentes</CardTitle>
          <CardSubtitle>Revise os dados antes de aprovar ou rejeitar.</CardSubtitle>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-text-muted">Carregando...</p>
          ) : envios.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhum envio pendente no momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="py-2 pr-4 font-medium">Autor</th>
                    <th className="py-2 pr-4 font-medium">Turma</th>
                    <th className="py-2 pr-4 font-medium">Período</th>
                    <th className="py-2 pr-4 font-medium">Data de envio</th>
                    <th className="py-2 pr-4 font-medium">Alunos</th>
                    <th className="py-2 pr-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {envios.map((envio) => (
                    <tr key={envio.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-4">{envio.profiles?.nome ?? "—"}</td>
                      <td className="py-2.5 pr-4">{envio.turma}</td>
                      <td className="py-2.5 pr-4">{envio.periodo}</td>
                      <td className="py-2.5 pr-4">{formatarData(envio.data_envio)}</td>
                      <td className="py-2.5 pr-4">{envio.numeroAlunos}</td>
                      <td className="py-2.5 pr-4">
                        <Button size="sm" variant="outline" onClick={() => abrirEnvio(envio)}>
                          Revisar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        aberto={!!envioSelecionado}
        onFechar={() => setEnvioSelecionado(null)}
        titulo={`Envio de ${envioSelecionado?.profiles?.nome ?? ""}`}
        largura="max-w-3xl"
      >
        {envioSelecionado && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Turma: {envioSelecionado.turma} · Período: {envioSelecionado.periodo} · Arquivo:{" "}
              {envioSelecionado.nome_arquivo}
            </p>

            {carregandoAlunos ? (
              <p className="text-sm text-text-muted">Carregando dados dos alunos...</p>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-md border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-text-muted">
                      <th className="py-2 px-3 font-medium">Nome</th>
                      <th className="py-2 px-3 font-medium">Nota</th>
                      <th className="py-2 px-3 font-medium">Frequência</th>
                      <th className="py-2 px-3 font-medium">Status de Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunosDoEnvio.map((aluno) => (
                      <tr key={aluno.id} className="border-b border-border/50">
                        <td className="py-2 px-3">{aluno.nome_aluno}</td>
                        <td className="py-2 px-3">{aluno.nota.toFixed(1)}</td>
                        <td className="py-2 px-3">{aluno.frequencia.toFixed(0)}%</td>
                        <td className="py-2 px-3">
                          <RiskBadge status={aluno.status_risco} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {mostrarRejeicao ? (
              <div>
                <Label htmlFor="motivo">Motivo da rejeição *</Label>
                <Textarea
                  id="motivo"
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Explique o motivo da rejeição para o autor do envio."
                />
                <div className="mt-3 flex gap-2">
                  <Button variant="danger" onClick={rejeitar} disabled={processando || !motivo.trim()}>
                    Confirmar rejeição
                  </Button>
                  <Button variant="ghost" onClick={() => setMostrarRejeicao(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={aprovar} disabled={processando}>
                  Aprovar
                </Button>
                <Button variant="danger" onClick={() => setMostrarRejeicao(true)} disabled={processando}>
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
