import type { StatusRisco } from "@/types";

export function calcularStatusRisco(nota: number, frequencia: number): StatusRisco {
  const notaBaixa = nota < 6;
  const frequenciaBaixa = frequencia < 85;

  if (notaBaixa && frequenciaBaixa) return "Alto";
  if (notaBaixa || frequenciaBaixa) return "Médio";
  if (nota >= 6 && nota < 7 && frequencia >= 85) return "Risco Futuro";
  return "Baixo";
}

const PLANOS_PADRAO: Record<StatusRisco, string> = {
  Alto: "Atendimento individual imediato com aluno e responsáveis, reforço escolar nas disciplinas críticas e monitoramento semanal de frequência e notas.",
  Médio:
    "Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.",
  "Risco Futuro":
    "Acompanhamento preventivo mensal, incentivo à participação em atividades de reforço e observação da evolução das notas no próximo período.",
  Baixo: "Manter acompanhamento regular. Nenhuma ação prioritária necessária neste momento.",
};

export function gerarPlanoAcao(statusRisco: StatusRisco): string {
  return PLANOS_PADRAO[statusRisco];
}

export const ORDEM_RISCO: StatusRisco[] = ["Alto", "Médio", "Risco Futuro", "Baixo"];

export const RISK_LABEL_CLASS: Record<StatusRisco, string> = {
  Alto: "text-risk-alto",
  Médio: "text-risk-medio",
  "Risco Futuro": "text-risk-futuro",
  Baixo: "text-risk-baixo",
};

export const RISK_BG_CLASS: Record<StatusRisco, string> = {
  Alto: "bg-risk-alto/15 border-risk-alto/40",
  Médio: "bg-risk-medio/15 border-risk-medio/40",
  "Risco Futuro": "bg-risk-futuro/15 border-risk-futuro/40",
  Baixo: "bg-risk-baixo/15 border-risk-baixo/40",
};
