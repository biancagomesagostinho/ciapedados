-- Radar Acadêmico — schema inicial
create extension if not exists pgcrypto;

-- =========================================================================
-- TABELAS
-- =========================================================================

create table if not exists public.usuarios_autorizados (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  papel text not null check (papel in ('professor', 'coordenador')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por text,
  acesso_turmas text not null default 'restrito' check (acesso_turmas in ('restrito', 'selecionadas', 'todas')),
  turmas_autorizadas text[] not null default '{}'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nome text not null default '',
  papel text not null check (papel in ('professor', 'coordenador')),
  ultimo_acesso timestamptz,
  quantidade_acessos integer not null default 0,
  tema text not null default 'escuro' check (tema in ('claro', 'escuro'))
);

create table if not exists public.envios (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid references public.profiles (id) on delete set null,
  autor_papel text not null check (autor_papel in ('professor', 'coordenador')),
  nome_arquivo text not null,
  data_envio timestamptz not null default now(),
  turma text not null,
  periodo text not null,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao text
);

create table if not exists public.alunos_dados (
  id uuid primary key default gen_random_uuid(),
  envio_id uuid not null references public.envios (id) on delete cascade,
  nome_aluno text not null,
  turma text not null,
  periodo text not null,
  nota numeric(4, 2) not null,
  frequencia numeric(5, 2) not null,
  status_risco text not null check (status_risco in ('Alto', 'Médio', 'Risco Futuro', 'Baixo')),
  plano_acao text not null,
  plano_acao_final text not null,
  plano_acao_editado_por uuid references public.profiles (id),
  plano_acao_editado_em timestamptz,
  aprovado boolean not null default false,
  status_acao text not null default 'pendente' check (status_acao in ('pendente', 'em_andamento', 'concluido'))
);

create table if not exists public.planos_acao_catalogo (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  niveis_risco_aplicaveis text[] not null default '{}',
  ativo boolean not null default true,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create table if not exists public.sugestoes_ia (
  id uuid primary key default gen_random_uuid(),
  aluno_dado_id uuid not null references public.alunos_dados (id) on delete cascade,
  contexto_enviado text not null,
  sugestao_texto text not null,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.profiles (id),
  usada boolean not null default false
);

create table if not exists public.intervencoes (
  id uuid primary key default gen_random_uuid(),
  aluno_dado_id uuid not null references public.alunos_dados (id) on delete cascade,
  descricao text not null,
  responsavel text not null,
  prazo date not null,
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create table if not exists public.leituras_ia (
  id uuid primary key default gen_random_uuid(),
  escopo_turma text not null,
  periodo text not null,
  contexto_enviado text not null,
  texto_gerado text not null,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index if not exists idx_alunos_dados_turma on public.alunos_dados (turma);
create index if not exists idx_alunos_dados_status_risco on public.alunos_dados (status_risco);
create index if not exists idx_alunos_dados_periodo on public.alunos_dados (periodo);
create index if not exists idx_alunos_dados_envio on public.alunos_dados (envio_id);
create index if not exists idx_intervencoes_aluno on public.intervencoes (aluno_dado_id);
create index if not exists idx_envios_autor on public.envios (autor_id);

-- =========================================================================
-- FUNÇÕES AUXILIARES (SECURITY DEFINER — evitam recursão de RLS)
-- =========================================================================

create or replace function public.is_coordenador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and papel = 'coordenador'
  );
$$;

create or replace function public.turma_permitida(p_turma text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_acesso text;
  v_turmas text[];
begin
  if public.is_coordenador() then
    return true;
  end if;

  select acesso_turmas, turmas_autorizadas
    into v_acesso, v_turmas
    from public.usuarios_autorizados
    where email = auth.email() and ativo = true;

  if v_acesso is null then
    return false;
  elsif v_acesso = 'todas' then
    return true;
  elsif v_acesso = 'selecionadas' then
    return p_turma = any (v_turmas);
  else
    return false;
  end if;
end;
$$;

-- =========================================================================
-- RPC DE LOGIN — valida autorização, cria/atualiza profile, incrementa acessos
-- =========================================================================

create or replace function public.registrar_login()
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.email();
  v_uid uuid := auth.uid();
  v_auth public.usuarios_autorizados%rowtype;
  v_nome text;
begin
  select * into v_auth
    from public.usuarios_autorizados
    where email = v_email and ativo = true;

  if not found then
    raise exception 'ACESSO_NAO_AUTORIZADO';
  end if;

  select coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', v_email)
    into v_nome
    from auth.users
    where id = v_uid;

  insert into public.profiles (id, email, nome, papel, ultimo_acesso, quantidade_acessos, tema)
  values (v_uid, v_email, coalesce(v_nome, v_email), v_auth.papel, now(), 1, 'escuro')
  on conflict (id) do update
    set ultimo_acesso = now(),
        quantidade_acessos = public.profiles.quantidade_acessos + 1,
        papel = v_auth.papel,
        email = v_email,
        nome = coalesce(v_nome, public.profiles.nome);

  return query select * from public.profiles where id = v_uid;
end;
$$;

grant execute on function public.registrar_login() to authenticated;
grant execute on function public.is_coordenador() to authenticated;
grant execute on function public.turma_permitida(text) to authenticated;

-- =========================================================================
-- TRIGGERS DE PROTEÇÃO DE CAMPOS
-- =========================================================================

create or replace function public.proteger_alunos_dados()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coordenador() then
    if new.plano_acao_final is distinct from old.plano_acao_final
       or new.plano_acao_editado_por is distinct from old.plano_acao_editado_por
       or new.plano_acao_editado_em is distinct from old.plano_acao_editado_em
       or new.aprovado is distinct from old.aprovado
       or new.status_risco is distinct from old.status_risco
       or new.nota is distinct from old.nota
       or new.frequencia is distinct from old.frequencia
       or new.plano_acao is distinct from old.plano_acao
       or new.turma is distinct from old.turma
       or new.periodo is distinct from old.periodo
       or new.nome_aluno is distinct from old.nome_aluno
       or new.envio_id is distinct from old.envio_id
    then
      raise exception 'Apenas o coordenador pode alterar este campo.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_alunos_dados on public.alunos_dados;
create trigger trg_proteger_alunos_dados
  before update on public.alunos_dados
  for each row execute function public.proteger_alunos_dados();

create or replace function public.proteger_intervencoes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.descricao is distinct from old.descricao
     or new.responsavel is distinct from old.responsavel
     or new.prazo is distinct from old.prazo
     or new.aluno_dado_id is distinct from old.aluno_dado_id
     or new.criado_por is distinct from old.criado_por
  then
    raise exception 'Apenas o status da intervenção pode ser alterado.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_intervencoes on public.intervencoes;
create trigger trg_proteger_intervencoes
  before update on public.intervencoes
  for each row execute function public.proteger_intervencoes();

create or replace function public.proteger_autoedicao_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.email = auth.email() then
    raise exception 'Não é possível alterar a própria conta.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_autoedicao_update on public.usuarios_autorizados;
create trigger trg_proteger_autoedicao_update
  before update on public.usuarios_autorizados
  for each row execute function public.proteger_autoedicao_usuario();

create or replace function public.proteger_profiles_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coordenador() then
    if new.email is distinct from old.email
       or new.nome is distinct from old.nome
       or new.papel is distinct from old.papel
       or new.quantidade_acessos is distinct from old.quantidade_acessos
       or new.ultimo_acesso is distinct from old.ultimo_acesso
    then
      raise exception 'Este campo não pode ser alterado pelo próprio usuário.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_profiles_self_update on public.profiles;
create trigger trg_proteger_profiles_self_update
  before update on public.profiles
  for each row execute function public.proteger_profiles_self_update();

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

alter table public.usuarios_autorizados enable row level security;
alter table public.profiles enable row level security;
alter table public.envios enable row level security;
alter table public.alunos_dados enable row level security;
alter table public.planos_acao_catalogo enable row level security;
alter table public.sugestoes_ia enable row level security;
alter table public.intervencoes enable row level security;
alter table public.leituras_ia enable row level security;

-- usuarios_autorizados
create policy "ver proprio registro ou coordenador ve tudo"
  on public.usuarios_autorizados for select
  using (email = auth.email() or public.is_coordenador());

create policy "coordenador cadastra usuarios"
  on public.usuarios_autorizados for insert
  with check (public.is_coordenador());

create policy "coordenador atualiza usuarios"
  on public.usuarios_autorizados for update
  using (public.is_coordenador());

-- profiles
create policy "ver proprio perfil ou coordenador ve tudo"
  on public.profiles for select
  using (id = auth.uid() or public.is_coordenador());

create policy "atualizar proprio perfil"
  on public.profiles for update
  using (id = auth.uid() or public.is_coordenador());

-- envios
create policy "ver proprios envios ou coordenador ve tudo"
  on public.envios for select
  using (autor_id = auth.uid() or public.is_coordenador());

create policy "criar envio proprio"
  on public.envios for insert
  with check (autor_id = auth.uid());

create policy "coordenador aprova ou rejeita envios"
  on public.envios for update
  using (public.is_coordenador());

-- alunos_dados
create policy "ver alunos aprovados de turma permitida ou coordenador ve tudo"
  on public.alunos_dados for select
  using (public.is_coordenador() or (aprovado = true and public.turma_permitida(turma)));

create policy "inserir alunos do proprio envio em turma permitida"
  on public.alunos_dados for insert
  with check (
    public.turma_permitida(turma)
    and exists (select 1 from public.envios e where e.id = envio_id and e.autor_id = auth.uid())
  );

create policy "atualizar alunos visiveis"
  on public.alunos_dados for update
  using (public.is_coordenador() or (aprovado = true and public.turma_permitida(turma)));

-- planos_acao_catalogo (uso restrito ao coordenador)
create policy "coordenador gerencia catalogo select"
  on public.planos_acao_catalogo for select
  using (public.is_coordenador());

create policy "coordenador gerencia catalogo insert"
  on public.planos_acao_catalogo for insert
  with check (public.is_coordenador());

create policy "coordenador gerencia catalogo update"
  on public.planos_acao_catalogo for update
  using (public.is_coordenador());

-- sugestoes_ia
create policy "coordenador ve sugestoes ia"
  on public.sugestoes_ia for select
  using (public.is_coordenador());

create policy "coordenador cria sugestoes ia"
  on public.sugestoes_ia for insert
  with check (public.is_coordenador());

-- intervencoes
create policy "ver intervencoes de alunos visiveis"
  on public.intervencoes for select
  using (
    exists (
      select 1 from public.alunos_dados ad
      where ad.id = aluno_dado_id
        and (public.is_coordenador() or (ad.aprovado = true and public.turma_permitida(ad.turma)))
    )
  );

create policy "criar intervencao para aluno visivel"
  on public.intervencoes for insert
  with check (
    criado_por = auth.uid()
    and exists (
      select 1 from public.alunos_dados ad
      where ad.id = aluno_dado_id
        and (public.is_coordenador() or (ad.aprovado = true and public.turma_permitida(ad.turma)))
    )
  );

create policy "atualizar status de intervencao visivel"
  on public.intervencoes for update
  using (
    exists (
      select 1 from public.alunos_dados ad
      where ad.id = aluno_dado_id
        and (public.is_coordenador() or (ad.aprovado = true and public.turma_permitida(ad.turma)))
    )
  );

-- leituras_ia
create policy "coordenador ve leituras ia"
  on public.leituras_ia for select
  using (public.is_coordenador());

create policy "coordenador cria leituras ia"
  on public.leituras_ia for insert
  with check (public.is_coordenador());
