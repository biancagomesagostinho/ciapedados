-- Radar Acadêmico — dados de exemplo
-- Edite os e-mails abaixo se necessário antes de rodar.

insert into public.usuarios_autorizados (email, papel, ativo, criado_por, acesso_turmas, turmas_autorizadas)
values
  ('bianca.gomes.agostinho@gmail.com', 'coordenador', true, 'sistema', 'todas', '{}'),
  ('bagostinho145@gmail.com', 'professor', true, 'sistema', 'restrito', '{}')
on conflict (email) do update
  set papel = excluded.papel,
      ativo = true,
      acesso_turmas = excluded.acesso_turmas;

-- Envio de exemplo (já aprovado) para não deixar o dashboard vazio.
with novo_envio as (
  insert into public.envios (autor_id, autor_papel, nome_arquivo, data_envio, turma, periodo, status)
  values (null, 'coordenador', 'planilha_exemplo.xlsx', now(), 'Turmas Mistas (Exemplo)', 'Período Inicial', 'aprovado')
  returning id
),
dados (nome_aluno, turma, nota, frequencia, status_risco, plano_acao) as (
  values
    ('Ana Beatriz Souza', '1º Ano A', 4.5, 72.0, 'Alto', 'Atendimento individual imediato com aluno e responsáveis, reforço escolar nas disciplinas críticas e monitoramento semanal de frequência e notas.'),
    ('Bruno Carvalho Lima', '1º Ano A', 5.2, 88.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Carla Mendes Rocha', '1º Ano A', 7.5, 78.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Daniel Ferreira Alves', '1º Ano A', 6.4, 91.0, 'Risco Futuro', 'Acompanhamento preventivo mensal, incentivo à participação em atividades de reforço e observação da evolução das notas no próximo período.'),
    ('Elisa Martins Costa', '1º Ano A', 8.6, 96.0, 'Baixo', 'Manter acompanhamento regular. Nenhuma ação prioritária necessária neste momento.'),

    ('Felipe Nogueira Dias', '1º Ano B', 3.8, 65.0, 'Alto', 'Atendimento individual imediato com aluno e responsáveis, reforço escolar nas disciplinas críticas e monitoramento semanal de frequência e notas.'),
    ('Gabriela Pires Ramos', '1º Ano B', 4.9, 90.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Henrique Batista Cunha', '1º Ano B', 7.1, 80.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Isabela Correia Teixeira', '1º Ano B', 6.8, 89.0, 'Risco Futuro', 'Acompanhamento preventivo mensal, incentivo à participação em atividades de reforço e observação da evolução das notas no próximo período.'),
    ('João Vitor Barros', '1º Ano B', 9.0, 97.0, 'Baixo', 'Manter acompanhamento regular. Nenhuma ação prioritária necessária neste momento.'),

    ('Karina Duarte Moreira', '2º Ano A', 5.0, 68.0, 'Alto', 'Atendimento individual imediato com aluno e responsáveis, reforço escolar nas disciplinas críticas e monitoramento semanal de frequência e notas.'),
    ('Lucas Andrade Farias', '2º Ano A', 5.6, 92.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Mariana Vasconcelos Melo', '2º Ano A', 8.1, 76.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Nicolas Xavier Guimarães', '2º Ano A', 6.2, 88.0, 'Risco Futuro', 'Acompanhamento preventivo mensal, incentivo à participação em atividades de reforço e observação da evolução das notas no próximo período.'),
    ('Olivia Ribeiro Castro', '2º Ano A', 7.9, 94.0, 'Baixo', 'Manter acompanhamento regular. Nenhuma ação prioritária necessária neste momento.'),

    ('Pedro Henrique Sales', '2º Ano B', 4.2, 79.0, 'Alto', 'Atendimento individual imediato com aluno e responsáveis, reforço escolar nas disciplinas críticas e monitoramento semanal de frequência e notas.'),
    ('Quezia Almeida Franco', '2º Ano B', 5.4, 87.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Rafael Monteiro Pinto', '2º Ano B', 7.3, 81.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Sofia Cardoso Lopes', '2º Ano B', 6.6, 90.0, 'Risco Futuro', 'Acompanhamento preventivo mensal, incentivo à participação em atividades de reforço e observação da evolução das notas no próximo período.'),
    ('Thiago Nascimento Reis', '2º Ano B', 9.2, 98.0, 'Baixo', 'Manter acompanhamento regular. Nenhuma ação prioritária necessária neste momento.'),

    ('Ursula Peixoto Brandão', '3º Ano A', 3.5, 70.0, 'Alto', 'Atendimento individual imediato com aluno e responsáveis, reforço escolar nas disciplinas críticas e monitoramento semanal de frequência e notas.'),
    ('Victor Hugo Cavalcanti', '3º Ano A', 5.8, 86.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Wesley Tavares Moura', '3º Ano A', 7.7, 77.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Yasmin Fonseca Prado', '3º Ano A', 6.9, 93.0, 'Risco Futuro', 'Acompanhamento preventivo mensal, incentivo à participação em atividades de reforço e observação da evolução das notas no próximo período.'),
    ('Zoe Amaral Siqueira', '3º Ano A', 8.4, 95.0, 'Baixo', 'Manter acompanhamento regular. Nenhuma ação prioritária necessária neste momento.'),

    ('Arthur Bezerra Nunes', '3º Ano B', 4.7, 82.0, 'Alto', 'Atendimento individual imediato com aluno e responsáveis, reforço escolar nas disciplinas críticas e monitoramento semanal de frequência e notas.'),
    ('Beatriz Lacerda Viana', '3º Ano B', 5.1, 91.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Caio Rezende Junqueira', '3º Ano B', 7.0, 83.0, 'Médio', 'Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.'),
    ('Débora Sampaio Leal', '3º Ano B', 6.1, 89.0, 'Risco Futuro', 'Acompanhamento preventivo mensal, incentivo à participação em atividades de reforço e observação da evolução das notas no próximo período.')
)
insert into public.alunos_dados (
  envio_id, nome_aluno, turma, periodo, nota, frequencia, status_risco, plano_acao, plano_acao_final, aprovado, status_acao
)
select
  novo_envio.id,
  dados.nome_aluno,
  dados.turma,
  'Período Inicial',
  dados.nota,
  dados.frequencia,
  dados.status_risco,
  dados.plano_acao,
  dados.plano_acao,
  true,
  'pendente'
from novo_envio, dados;

-- Catálogo de ações inicial, para não deixar a página de Catálogo vazia.
insert into public.planos_acao_catalogo (texto, niveis_risco_aplicaveis, ativo, criado_por)
values
  ('Atendimento individual imediato com aluno e responsáveis, reforço escolar nas disciplinas críticas e monitoramento semanal de frequência e notas.', array['Alto'], true, null),
  ('Encaminhamento para acompanhamento psicopedagógico e reunião com a coordenação em até 5 dias úteis.', array['Alto'], true, null),
  ('Conversa com aluno e responsáveis para identificar a causa (nota ou frequência), acompanhamento quinzenal e reforço pontual na disciplina afetada.', array['Médio'], true, null),
  ('Plano de estudos dirigido com monitor, revisado a cada 15 dias.', array['Médio', 'Risco Futuro'], true, null),
  ('Acompanhamento preventivo mensal, incentivo à participação em atividades de reforço e observação da evolução das notas no próximo período.', array['Risco Futuro'], true, null),
  ('Manter acompanhamento regular. Nenhuma ação prioritária necessária neste momento.', array['Alto', 'Médio', 'Risco Futuro'], true, null);
