-- Migration 0002: Seed Data for DRE Altamira
-- Region: DRE Altamira (Altamira, Brasil Novo, Medicilândia, Vitória do Xingu, Anapu, Senador José Porfírio)

-- 1. Inserção de Escolas da DRE Altamira
insert into escolas (id, codigo, nome, municipio, diretor_nome, endereco, telefone, email) values
('e1111111-1111-1111-1111-111111111111', 'ESC001', 'EEEM Polivalente de Altamira', 'Altamira', 'Profª. Maria do Carmo Santos', 'Av. Brigadeiro Eduardo Gomes, s/n - Esplanada do Xingu', '(93) 3515-1101', 'polivalente.altamira@seduc.pa.gov.br'),
('e2222222-2222-2222-2222-222222222222', 'ESC002', 'EEEM Prof. Maria de Lourdes Rocha', 'Altamira', 'Prof. Raimundo Nonato Ferreira', 'Rua Sete de Setembro, 1250 - Sudam I', '(93) 3515-2234', 'lourdes.rocha@seduc.pa.gov.br'),
('e3333333-3333-3333-3333-333333333333', 'ESC003', 'EEEM Ducila Almeida do Nascimento', 'Altamira', 'Profª. Ana Cláudia Silveira', 'Rua Magalhães Barata, 450 - Centro', '(93) 3515-3345', 'ducila.almeida@seduc.pa.gov.br'),
('e4444444-4444-4444-4444-444444444444', 'ESC004', 'EEEM Brigadeiro Fontenelle', 'Brasil Novo', 'Prof. João Bosco Tavares', 'Rodovia Transamazônica, Km 46 - Centro', '(93) 3544-1290', 'fontenelle.bn@seduc.pa.gov.br'),
('e5555555-5555-5555-5555-555555555555', 'ESC005', 'EEEM Jarbas Passarinho', 'Medicilândia', 'Profª. Sandra Regina Mendonça', 'Av. dos Cacauicultores, 800 - Centro', '(93) 3531-1500', 'jarbas.medicilandia@seduc.pa.gov.br')
on conflict (codigo) do nothing;

-- 2. Seed do Primeiro Usuário nucleo_diretor e perfis de demonstração
-- NOTA: Em produção, o usuário correspondente é criado no auth.users via Supabase Auth
insert into profiles (id, nome, email, cargo, papel, escola_id, ativo) values
('u1111111-1111-1111-1111-111111111111', 'Prof. Dr. Valter Mendonça', 'diretor.nucleo@seduc.pa.gov.br', 'Diretor do Núcleo de Ed. Especial / DRE Altamira', 'nucleo_diretor', null, true),
('u2222222-2222-2222-2222-222222222222', 'Regina Helena Vasconcelos', 'tecnico.nucleo@seduc.pa.gov.br', 'Técnica de Referência em Ed. Especial', 'nucleo_tecnico', null, true),
('u3333333-3333-3333-3333-333333333333', 'Profª. Maria do Carmo Santos', 'diretora.polivalente@seduc.pa.gov.br', 'Diretora Escolar', 'diretor_escola', 'e1111111-1111-1111-1111-111111111111', true),
('u4444444-4444-4444-4444-444444444444', 'Marcos Aurélio Lima', 'secretaria.polivalente@seduc.pa.gov.br', 'Secretário Escolar', 'secretaria_escola', 'e1111111-1111-1111-1111-111111111111', true),
('u5555555-5555-5555-5555-555555555555', 'Prof. Raimundo Nonato Ferreira', 'diretor.lourdesrocha@seduc.pa.gov.br', 'Diretor Escolar', 'diretor_escola', 'e2222222-2222-2222-2222-222222222222', true)
on conflict (id) do nothing;

-- 3. Profissionais de Atendimento (Professores AEE e Acompanhantes)
insert into profissionais (id, escola_id, nome, tipo, documento_ou_matricula, telefone, ativo) values
('p1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Profª. Lúcia dos Anjos Ribeiro', 'professor_aee', 'MAT-584920-SEDUC', '(93) 99122-3344', true),
('p2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'Carlos Eduardo da Silva', 'acompanhante', 'CONTRATO-2025/088', '(93) 98411-2299', true),
('p3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'Profª. Beatriz Soares Martins', 'professor_aee', 'MAT-492103-SEDUC', '(93) 99155-8811', true),
('p4444444-4444-4444-4444-444444444444', 'e3333333-3333-3333-3333-333333333333', 'Profª. Elenice Pinheiro Farias', 'professor_aee', 'MAT-601924-SEDUC', '(93) 98844-3322', true)
on conflict do nothing;

-- 4. Turmas
insert into turmas (id, escola_id, codigo, nome, turno, ano_letivo) values
('t1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', '101-M', '1ª Série A - Ensino Médio', 'Manhã', 2026),
('t2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', '201-T', '2ª Série B - Ensino Médio', 'Tarde', 2026),
('t3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', '901-M', '9º Ano Regular - Fundamental', 'Manhã', 2026),
('t4444444-4444-4444-4444-444444444444', 'e3333333-3333-3333-3333-333333333333', '301-N', '3ª Série C - Ensino Médio', 'Noite', 2026)
on conflict do nothing;

-- 5. Alunos de Exemplo Cobrindo todos os status do semáforo
insert into alunos (
  id, codigo, nome, data_nascimento, sexo, endereco, escola_id, turma_id, ciclo, serie,
  situacao_doc, cid, numero_processo, contrato_acompanhante,
  necessita_professor_aee, necessita_acompanhante, professor_aee_id, acompanhante_id, observacoes
) values
-- Aluno 1: Status OK (tem professor e acompanhante, com laudo e contrato ativo)
('a1111111-1111-1111-1111-111111111111', 'ALU2026-001', 'Gabriel Souza Nascimento', '2009-04-12', 'M', 'Rua 7 de Setembro, 340 - Altamira', 'e1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', 2, '1ª Série EM', 'com_laudo', 'F84.0', 'PROC-2025/1192-SEDUC', true, true, true, 'p1111111-1111-1111-1111-111111111111', 'p2222222-2222-2222-2222-222222222222', 'Diagnóstico de Transtorno do Espectro Autista. Atendimento na SRM regular.'),

-- Aluno 2: Status SEM_ACOMPANHANTE (precisa de acompanhante mas não tem)
('a2222222-2222-2222-2222-222222222222', 'ALU2026-002', 'Larissa Vitória de Oliveira', '2010-09-28', 'F', 'Travessa 10, nº 88 - Altamira', 'e1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', 2, '1ª Série EM', 'com_laudo', 'G80', 'PROC-2025/0843-SEDUC', false, true, true, 'p1111111-1111-1111-1111-111111111111', null, 'Paralisia Cerebral com comprometimento motor. Aguardando alocação urgente de cuidador/acompanhante.'),

-- Aluno 3: Status SEM_NENHUM (precisa dos dois e não tem nenhum)
('a3333333-3333-3333-3333-333333333333', 'ALU2026-003', 'Matheus Henrique dos Santos Silva', '2008-11-05', 'M', 'Av. Jader Barbalho, 102 - Brasil Novo', 'e4444444-4444-4444-4444-444444444444', null, 3, '2ª Série EM', 'com_laudo', 'F84.0', 'PROC-2026/0122-SEDUC', false, true, true, null, null, 'Sem sala de recursos e sem profissional designado. Prioridade para emissão de ofício à SEDUC.'),

-- Aluno 4: Status SEM_PROFESSOR (precisa de professor AEE e não tem)
('a4444444-4444-4444-4444-444444444444', 'ALU2026-004', 'Camila Cristina Pinheiro', '2011-02-14', 'F', 'Rua Magalhães Barata, 89 - Altamira', 'e2222222-2222-2222-2222-222222222222', 't3333333-3333-3333-3333-333333333333', 1, '9º Ano', 'estudo_de_caso', 'F70', 'PROC-2026/0401-SEDUC', false, true, false, null, null, 'Estudo de caso em andamento. Deficiência intelectual moderada, aguardando lotação de professor de AEE.'),

-- Aluno 5: Status CONTRATO_PENDENTE (tem acompanhante porém sem contrato assinado)
('a5555555-5555-5555-5555-555555555555', 'ALU2026-005', 'Lucas Emanuel Barbosa', '2010-06-20', 'M', 'Rua B, Quadra 15 - Altamira', 'e1111111-1111-1111-1111-111111111111', 't2222222-2222-2222-2222-222222222222', 2, '2ª Série EM', 'com_laudo', 'H54', 'PROC-2025/1990-SEDUC', false, true, true, 'p1111111-1111-1111-1111-111111111111', 'p2222222-2222-2222-2222-222222222222', 'Baixa visão severa. Acompanhante alocado temporariamente aguardando renovação contratual no sistema.')
on conflict (codigo) do nothing;

-- 6. PDI de Exemplo para o Aluno Gabriel
insert into pdis (id, aluno_id, escola_id, ano_letivo, status, elaborado_por, data_elaboracao, conteudo) values
('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 2026, 'vigente', 'Profª. Lúcia dos Anjos Ribeiro', '2026-02-10', '{
  "potencialidades": "Excelente memória visual, interesse em artes e tecnologia, boa capacidade de concentração em temas de hiperfoco.",
  "dificuldades": "Hipersensibilidade auditiva a ruídos intensos (sirene), necessidade de antecipação de rotinas e suporte em interações em grupo.",
  "objetivos_gerais": "Promover autonomia nas atividades pedagógicas da 1ª série do Ensino Médio e ampliação da interação social positiva.",
  "estrategias_pedagogicas": "Uso de pistas visuais, cronograma diário ilustrado, tempo estendido para avaliações e pausas sensoriais estruturadas.",
  "recursos_acessibilidade": "Abafador de ruídos circum-auricular, prancha de comunicação e notebook para digitação.",
  "metas_bimestre_1": "Adaptação plena à nova rotina escolar e aos professores regentes das disciplinas.",
  "metas_bimestre_2": "Participação colaborativa em pequenos grupos com suporte de acompanhante."
}'::jsonb)
on conflict do nothing;

-- 7. Ofício de Exemplo emitido pelo Núcleo
insert into oficios (id, ano, numero, assunto, destinatario, corpo, status, emitido_em, criado_por) values
('f1111111-1111-1111-1111-111111111111', 2026, 1, 'Solicitação urgente de lotação de Professor de AEE e Acompanhante para a Regional de Altamira', 'SEDUC/PA - Diretoria de Educação Especial', 'Cumprimentando-o cordialmente, dirigimo-nos a Vossa Senhoria por meio do Núcleo de Educação Especial da DRE Altamira para encaminhar a relação consolidada de estudantes da regional que se encontram desprovidos de atendimento educacional especializado, solicitando providências imediatas quanto à lotação de profissionais e formalização contratual.', 'emitido', now() - interval '3 days', 'u1111111-1111-1111-1111-111111111111')
on conflict (ano, numero) do nothing;

insert into oficio_alunos (oficio_id, aluno_id, status_no_momento) values
('f1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'sem_nenhum'),
('f1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'sem_acompanhante')
on conflict do nothing;
