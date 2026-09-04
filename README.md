# Radar Acadêmico

Dashboard escolar de gestão de dados educacionais, com login obrigatório via Google, previsão de risco de estudantes e planos de ação prescritivos.

Stack: React + TypeScript + Vite + Tailwind CSS + Supabase (Auth + Postgres + RLS) + Recharts + SheetJS (xlsx).

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Authentication → Providers**, habilite o provedor **Google** e configure o OAuth Client ID/Secret do Google Cloud. Em **Authentication → URL Configuration**, adicione a URL da aplicação (local e de produção) em *Redirect URLs*.
3. Rode as migrações SQL, na ordem, pelo SQL Editor do Supabase (ou `supabase db push` com a CLI):
   - `supabase/migrations/0001_init.sql` — cria tabelas, funções, triggers e políticas de RLS.
   - `supabase/seed.sql` — cadastra os dois usuários de teste e popula dados de exemplo (edite os e-mails no topo do arquivo antes de rodar, se necessário).
4. Copie `.env.example` para `.env` e preencha com a URL e a chave anônima (`anon public`) do seu projeto:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## Rodando localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

## Contas de teste

Cadastradas via `supabase/seed.sql`:

- **Coordenador**: `bianca.gomes.agostinho@gmail.com` — acesso a todas as turmas.
- **Professor**: `bagostinho145@gmail.com` — acesso restrito (sem turmas liberadas até a coordenação configurar em Gestão de Usuários).

O login só funciona para e-mails presentes na tabela `usuarios_autorizados` com `ativo = true`. Qualquer outro e-mail do Google é bloqueado com a mensagem "acesso não autorizado, procure o coordenador".

## Estrutura de dados

Todo o schema (tabelas, RLS, funções e triggers) está em `supabase/migrations/0001_init.sql`. Pontos importantes:

- `registrar_login()`: função RPC chamada a cada login bem-sucedido; valida a autorização, cria/atualiza a linha em `profiles` e incrementa `quantidade_acessos`.
- `is_coordenador()` / `turma_permitida(turma)`: funções auxiliares usadas nas políticas de RLS para aplicar a Regra de Visibilidade por Turma diretamente no banco (não depende apenas do front-end).
- Triggers protegem campos sensíveis: um professor não altera `plano_acao_final`, `aprovado` ou notas diretamente; um usuário não edita a própria conta de coordenador; um usuário comum só altera o próprio `tema` no perfil.
- `envios.autor_id` é opcional (`null` no envio de exemplo do seed, já que ele não está vinculado a nenhuma conta real).

## Observação sobre "Período"

Como o campo `período` é texto livre (ex.: "3º Bimestre 2025"), a ordenação cronológica no card **Evolução dos Indicadores** é feita heuristicamente: o ano é extraído de um padrão de 4 dígitos (19xx/20xx) e o número inicial do texto (ex. "3º") é usado como ordem dentro do ano. Períodos sem ano reconhecido (como o "Período Inicial" do seed) ficam agrupados como ano indefinido.

## Papéis e permissões

| Recurso | Professor | Coordenador |
|---|---|---|
| Enviar Planilha | Sim (fica pendente) | Sim (aprovado automaticamente) |
| Análises (Descritiva/Preditiva/Prescritiva) | Sim, conforme turmas liberadas | Sim, todas as turmas |
| Aprovações | — | Sim |
| Gestão de Usuários | — | Sim |
| Catálogo de Ações | — | Sim |
| Editar plano de ação | — | Sim |
| Criar intervenção manual / atualizar status | Sim | Sim |
