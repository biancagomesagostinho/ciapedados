import { useEffect, useState } from "react";
import { UserPlus, Pencil, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatarData } from "@/lib/utils";
import type { AcessoTurmas, Papel, Profile, UsuarioAutorizado } from "@/types";

interface LinhaUsuario extends UsuarioAutorizado {
  nome: string | null;
  ultimo_acesso: string | null;
  quantidade_acessos: number;
}

export default function GestaoUsuarios() {
  const { profile: profileLogado } = useAuth();
  const [linhas, setLinhas] = useState<LinhaUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [turmasExistentes, setTurmasExistentes] = useState<string[]>([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<LinhaUsuario | null>(null);
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("professor");
  const [acessoTurmas, setAcessoTurmas] = useState<AcessoTurmas>("restrito");
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    const { data: usuarios } = await supabase
      .from("usuarios_autorizados")
      .select("*")
      .order("criado_em", { ascending: false });

    const { data: perfis } = await supabase.from("profiles").select("*");
    const { data: alunos } = await supabase.from("alunos_dados").select("turma").eq("aprovado", true);
    setTurmasExistentes(Array.from(new Set((alunos ?? []).map((a) => a.turma))).sort());

    const mapaPerfis = new Map<string, Profile>((perfis as Profile[] | null ?? []).map((p) => [p.email, p]));

    const combinadas: LinhaUsuario[] = ((usuarios as UsuarioAutorizado[] | null) ?? []).map((u) => {
      const perfil = mapaPerfis.get(u.email);
      return {
        ...u,
        nome: perfil?.nome ?? null,
        ultimo_acesso: perfil?.ultimo_acesso ?? null,
        quantidade_acessos: perfil?.quantidade_acessos ?? 0,
      };
    });

    combinadas.sort((a, b) => {
      if (!a.ultimo_acesso && !b.ultimo_acesso) return 0;
      if (!a.ultimo_acesso) return 1;
      if (!b.ultimo_acesso) return -1;
      return new Date(b.ultimo_acesso).getTime() - new Date(a.ultimo_acesso).getTime();
    });

    setLinhas(combinadas);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirCadastro() {
    setEditando(null);
    setEmail("");
    setPapel("professor");
    setAcessoTurmas("restrito");
    setTurmasSelecionadas([]);
    setErro(null);
    setModalAberto(true);
  }

  function abrirEdicao(linha: LinhaUsuario) {
    setEditando(linha);
    setEmail(linha.email);
    setPapel(linha.papel);
    setAcessoTurmas(linha.acesso_turmas);
    setTurmasSelecionadas(linha.turmas_autorizadas ?? []);
    setErro(null);
    setModalAberto(true);
  }

  function alternarTurmaSelecionada(turma: string) {
    setTurmasSelecionadas((prev) => (prev.includes(turma) ? prev.filter((t) => t !== turma) : [...prev, turma]));
  }

  async function salvar() {
    setErro(null);
    if (!email.trim()) {
      setErro("Informe o e-mail.");
      return;
    }
    setSalvando(true);

    const payload = {
      email: email.trim().toLowerCase(),
      papel,
      acesso_turmas: papel === "coordenador" ? "todas" : acessoTurmas,
      turmas_autorizadas: papel === "coordenador" || acessoTurmas !== "selecionadas" ? [] : turmasSelecionadas,
    };

    let mensagemErro: string | null = null;

    if (editando) {
      const { error } = await supabase.from("usuarios_autorizados").update(payload).eq("id", editando.id);
      if (error) {
        mensagemErro = error.message.includes("própria conta")
          ? error.message
          : "Não foi possível salvar as alterações.";
      }
    } else {
      const { error } = await supabase
        .from("usuarios_autorizados")
        .insert({ ...payload, ativo: true, criado_por: profileLogado?.email });
      if (error) mensagemErro = "Não foi possível cadastrar o usuário. Verifique se o e-mail já existe.";
    }

    setSalvando(false);
    if (mensagemErro) {
      setErro(mensagemErro);
    } else {
      setModalAberto(false);
      await carregar();
    }
  }

  async function alternarAtivo(linha: LinhaUsuario) {
    await supabase.from("usuarios_autorizados").update({ ativo: !linha.ativo }).eq("id", linha.id);
    await carregar();
  }

  const ehProprioUsuario = (linha: LinhaUsuario) => linha.email === profileLogado?.email;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-text">Gestão de Usuários</h2>
        <Button onClick={abrirCadastro}>
          <UserPlus size={16} />
          Cadastrar usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários autorizados</CardTitle>
          <CardSubtitle>Ordenado por último acesso.</CardSubtitle>
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
                    <th className="py-2 pr-4 font-medium">E-mail</th>
                    <th className="py-2 pr-4 font-medium">Papel</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Último acesso</th>
                    <th className="py-2 pr-4 font-medium">Acessos</th>
                    <th className="py-2 pr-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha) => (
                    <tr key={linha.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-4">{linha.nome ?? "—"}</td>
                      <td className="py-2.5 pr-4">{linha.email}</td>
                      <td className="py-2.5 pr-4 capitalize">{linha.papel}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                            linha.ativo
                              ? "border-risk-baixo/40 bg-risk-baixo/10 text-risk-baixo"
                              : "border-risk-alto/40 bg-risk-alto/10 text-risk-alto"
                          }`}
                        >
                          {linha.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">{formatarData(linha.ultimo_acesso)}</td>
                      <td className="py-2.5 pr-4">{linha.quantidade_acessos}</td>
                      <td className="py-2.5 pr-4">
                        {!ehProprioUsuario(linha) && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => abrirEdicao(linha)}>
                              <Pencil size={13} />
                              Editar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => alternarAtivo(linha)}>
                              <Power size={13} />
                              {linha.ativo ? "Desativar" : "Ativar"}
                            </Button>
                          </div>
                        )}
                        {ehProprioUsuario(linha) && (
                          <span className="text-xs text-text-muted">Sua conta</span>
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

      <Modal aberto={modalAberto} onFechar={() => setModalAberto(false)} titulo={editando ? "Editar usuário" : "Cadastrar usuário"}>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!editando}
              placeholder="usuario@escola.com"
            />
          </div>

          <div>
            <Label htmlFor="papel">Papel *</Label>
            <Select id="papel" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
              <option value="professor">Professor</option>
              <option value="coordenador">Coordenador</option>
            </Select>
          </div>

          {papel === "professor" && (
            <div>
              <Label htmlFor="acesso">Acesso a turmas</Label>
              <Select
                id="acesso"
                value={acessoTurmas}
                onChange={(e) => setAcessoTurmas(e.target.value as AcessoTurmas)}
              >
                <option value="restrito">Acesso restrito</option>
                <option value="selecionadas">Turmas selecionadas</option>
                <option value="todas">Todas as turmas</option>
              </Select>

              {acessoTurmas === "selecionadas" && (
                <div className="mt-3 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border p-3">
                  {turmasExistentes.length === 0 && (
                    <p className="col-span-2 text-xs text-text-muted">Nenhuma turma cadastrada ainda.</p>
                  )}
                  {turmasExistentes.map((turma) => (
                    <label key={turma} className="flex items-center gap-2 text-sm text-text">
                      <Checkbox
                        checked={turmasSelecionadas.includes(turma)}
                        onChange={() => alternarTurmaSelecionada(turma)}
                      />
                      {turma}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

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
