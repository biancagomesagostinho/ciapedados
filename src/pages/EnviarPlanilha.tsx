import { useEffect, useState } from "react";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useTurmasVisiveis, MENSAGEM_SEM_TURMA } from "@/hooks/useTurmasVisiveis";
import { supabase } from "@/lib/supabase";
import { baixarModelo, lerPlanilha } from "@/lib/planilha";
import { calcularStatusRisco, gerarPlanoAcao } from "@/lib/risco";
import { formatarData } from "@/lib/utils";
import type { Envio, StatusEnvio } from "@/types";

const STATUS_LABEL: Record<StatusEnvio, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

const STATUS_CLASS: Record<StatusEnvio, string> = {
  pendente: "text-risk-medio border-risk-medio/40 bg-risk-medio/10",
  aprovado: "text-risk-baixo border-risk-baixo/40 bg-risk-baixo/10",
  rejeitado: "text-risk-alto border-risk-alto/40 bg-risk-alto/10",
};

export default function EnviarPlanilha() {
  const { profile, usuarioAutorizado } = useAuth();
  const { turmas, todasLiberadas, bloqueado, carregando: carregandoTurmas } = useTurmasVisiveis();

  const [periodo, setPeriodo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [meusEnvios, setMeusEnvios] = useState<Envio[]>([]);
  const [carregandoEnvios, setCarregandoEnvios] = useState(true);

  async function carregarMeusEnvios() {
    if (!profile) return;
    setCarregandoEnvios(true);
    const { data } = await supabase
      .from("envios")
      .select("*")
      .eq("autor_id", profile.id)
      .order("data_envio", { ascending: false });
    setMeusEnvios((data as Envio[]) ?? []);
    setCarregandoEnvios(false);
  }

  useEffect(() => {
    carregarMeusEnvios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function enviar() {
    setErro(null);
    setSucesso(null);

    if (!arquivo) {
      setErro("Selecione um arquivo .xlsx para enviar.");
      return;
    }
    if (!periodo.trim()) {
      setErro("Informe o período antes de enviar.");
      return;
    }
    if (!profile || !usuarioAutorizado) return;

    setEnviando(true);
    try {
      const linhas = await lerPlanilha(arquivo);
      if (linhas.length === 0) {
        setErro("Não foi possível encontrar dados válidos na planilha. Verifique o formato do modelo.");
        return;
      }

      if (usuarioAutorizado.acesso_turmas === "selecionadas") {
        const naoAutorizadas = linhas.filter((l) => !turmas.includes(l.Turma));
        if (naoAutorizadas.length > 0) {
          setErro(
            `A planilha contém turmas fora do seu acesso: ${Array.from(
              new Set(naoAutorizadas.map((l) => l.Turma))
            ).join(", ")}.`
          );
          return;
        }
      }

      const turmasDoArquivo = Array.from(new Set(linhas.map((l) => l.Turma))).join(", ");
      const statusInicial: StatusEnvio = profile.papel === "coordenador" ? "aprovado" : "pendente";
      const aprovadoInicial = profile.papel === "coordenador";

      const { data: envio, error: erroEnvio } = await supabase
        .from("envios")
        .insert({
          autor_id: profile.id,
          autor_papel: profile.papel,
          nome_arquivo: arquivo.name,
          turma: turmasDoArquivo,
          periodo: periodo.trim(),
          status: statusInicial,
        })
        .select()
        .single();

      if (erroEnvio || !envio) {
        setErro("Não foi possível registrar o envio. Tente novamente.");
        return;
      }

      const linhasAlunos = linhas.map((linha) => {
        const statusRisco = calcularStatusRisco(linha.Nota, linha.Frequência);
        const plano = gerarPlanoAcao(statusRisco);
        return {
          envio_id: envio.id,
          nome_aluno: linha["Nome do Aluno"],
          turma: linha.Turma,
          periodo: periodo.trim(),
          nota: linha.Nota,
          frequencia: linha.Frequência,
          status_risco: statusRisco,
          plano_acao: plano,
          plano_acao_final: plano,
          aprovado: aprovadoInicial,
          status_acao: "pendente" as const,
        };
      });

      const { error: erroAlunos } = await supabase.from("alunos_dados").insert(linhasAlunos);
      if (erroAlunos) {
        setErro("Envio criado, mas houve um erro ao salvar os dados dos alunos.");
        return;
      }

      setSucesso(
        profile.papel === "coordenador"
          ? "Planilha enviada e aprovada automaticamente."
          : "Planilha enviada. Aguarde a aprovação da coordenação."
      );
      setArquivo(null);
      setPeriodo("");
      await carregarMeusEnvios();
    } finally {
      setEnviando(false);
    }
  }

  if (!carregandoTurmas && bloqueado) {
    return (
      <div>
        <h2 className="mb-6 font-serif text-2xl font-semibold text-text">Enviar Planilha</h2>
        <Card>
          <CardContent className="py-8 text-center text-text-muted">{MENSAGEM_SEM_TURMA}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl font-semibold text-text">Enviar Planilha</h2>

      <Card>
        <CardHeader>
          <CardTitle>Novo envio</CardTitle>
          <CardSubtitle>
            Baixe o modelo, preencha os dados dos alunos e envie no formato padrão (.xlsx).
          </CardSubtitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button variant="outline" size="sm" className="w-fit" onClick={baixarModelo}>
            <Download size={15} />
            Baixar modelo
          </Button>

          <div>
            <Label htmlFor="periodo">Período *</Label>
            <Input
              id="periodo"
              placeholder='Ex.: "3º Bimestre 2025"'
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              list="periodos-sugeridos"
            />
            <datalist id="periodos-sugeridos">
              <option value="1º Bimestre 2025" />
              <option value="2º Bimestre 2025" />
              <option value="3º Bimestre 2025" />
              <option value="4º Bimestre 2025" />
            </datalist>
          </div>

          <div>
            <Label htmlFor="arquivo">Arquivo (.xlsx) *</Label>
            <label
              htmlFor="arquivo"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-bg px-3 py-4 text-sm text-text-muted hover:bg-border/10"
            >
              <FileSpreadsheet size={18} className="text-gold" />
              {arquivo ? arquivo.name : "Clique para selecionar o arquivo .xlsx"}
              <input
                id="arquivo"
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {erro && (
            <p className="rounded-md border border-risk-alto/40 bg-risk-alto/10 px-3 py-2 text-sm text-risk-alto">
              {erro}
            </p>
          )}
          {sucesso && (
            <p className="rounded-md border border-risk-baixo/40 bg-risk-baixo/10 px-3 py-2 text-sm text-risk-baixo">
              {sucesso}
            </p>
          )}

          <Button onClick={enviar} disabled={enviando} className="w-fit">
            <Upload size={15} />
            {enviando ? "Enviando..." : "Enviar planilha"}
          </Button>

          {!todasLiberadas && turmas.length > 0 && (
            <p className="text-xs text-text-muted">
              Turmas liberadas para o seu acesso: {turmas.join(", ")}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meus envios</CardTitle>
          <CardSubtitle>Acompanhe o status das planilhas que você enviou.</CardSubtitle>
        </CardHeader>
        <CardContent>
          {carregandoEnvios ? (
            <p className="text-sm text-text-muted">Carregando...</p>
          ) : meusEnvios.length === 0 ? (
            <p className="text-sm text-text-muted">Você ainda não enviou nenhuma planilha.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="py-2 pr-4 font-medium">Arquivo</th>
                    <th className="py-2 pr-4 font-medium">Turma</th>
                    <th className="py-2 pr-4 font-medium">Período</th>
                    <th className="py-2 pr-4 font-medium">Data</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {meusEnvios.map((envio) => (
                    <tr key={envio.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-4">{envio.nome_arquivo}</td>
                      <td className="py-2.5 pr-4">{envio.turma}</td>
                      <td className="py-2.5 pr-4">{envio.periodo}</td>
                      <td className="py-2.5 pr-4">{formatarData(envio.data_envio)}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[envio.status]}`}
                        >
                          {STATUS_LABEL[envio.status]}
                        </span>
                        {envio.status === "rejeitado" && envio.motivo_rejeicao && (
                          <p className="mt-1 text-xs text-text-muted">Motivo: {envio.motivo_rejeicao}</p>
                        )}
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
