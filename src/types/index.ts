export type Papel = "professor" | "coordenador";

export type AcessoTurmas = "restrito" | "selecionadas" | "todas";

export type StatusRisco = "Alto" | "Médio" | "Risco Futuro" | "Baixo";

export type StatusEnvio = "pendente" | "aprovado" | "rejeitado";

export type StatusAcao = "pendente" | "em_andamento" | "concluido";

export type Tema = "claro" | "escuro";

export interface UsuarioAutorizado {
  id: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  criado_em: string;
  criado_por: string | null;
  acesso_turmas: AcessoTurmas;
  turmas_autorizadas: string[];
}

export interface Profile {
  id: string;
  email: string;
  nome: string;
  papel: Papel;
  ultimo_acesso: string | null;
  quantidade_acessos: number;
  tema: Tema;
}

export interface Envio {
  id: string;
  autor_id: string;
  autor_papel: Papel;
  nome_arquivo: string;
  data_envio: string;
  turma: string;
  periodo: string;
  status: StatusEnvio;
  motivo_rejeicao: string | null;
}

export interface AlunoDado {
  id: string;
  envio_id: string;
  nome_aluno: string;
  turma: string;
  periodo: string;
  nota: number;
  frequencia: number;
  status_risco: StatusRisco;
  plano_acao: string;
  plano_acao_final: string;
  plano_acao_editado_por: string | null;
  plano_acao_editado_em: string | null;
  aprovado: boolean;
  status_acao: StatusAcao;
}

export interface PlanoAcaoCatalogo {
  id: string;
  texto: string;
  niveis_risco_aplicaveis: StatusRisco[];
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
}

export interface SugestaoIA {
  id: string;
  aluno_dado_id: string;
  contexto_enviado: string;
  sugestao_texto: string;
  criado_em: string;
  criado_por: string | null;
  usada: boolean;
}

export interface Intervencao {
  id: string;
  aluno_dado_id: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  status: StatusAcao;
  criado_por: string | null;
  criado_em: string;
}

export interface LeituraIA {
  id: string;
  escopo_turma: string;
  periodo: string;
  contexto_enviado: string;
  texto_gerado: string;
  criado_por: string | null;
  criado_em: string;
}

export interface LinhaPlanilhaAluno {
  "Nome do Aluno": string;
  Turma: string;
  Nota: number;
  Frequência: number;
}
