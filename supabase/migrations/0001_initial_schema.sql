-- Migration 0001: Initial Schema for SEDUC-PA DRE Altamira Núcleo de Educação Especial
-- Database: PostgreSQL / Supabase with Row Level Security (RLS)

create extension if not exists "pgcrypto";

-- Enums
create type papel_usuario as enum ('nucleo_diretor', 'nucleo_tecnico', 'diretor_escola', 'secretaria_escola');
create type sexo_tipo as enum ('M', 'F');
create type situacao_doc as enum ('com_laudo', 'estudo_de_caso', 'sem_laudo');
create type tipo_profissional as enum ('professor_aee', 'acompanhante');
create type status_pdi as enum ('rascunho', 'vigente', 'encerrado');
create type status_oficio as enum ('rascunho', 'emitido', 'enviado', 'respondido');
create type tipo_documento as enum ('laudo', 'estudo_de_caso', 'pdi', 'contrato', 'outro');

-- Escolas da Regional DRE Altamira
create table escolas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  municipio text not null default 'Altamira',
  diretor_nome text,
  endereco text,
  telefone text,
  email text,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

-- Perfis de Usuários
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text,
  cargo text,                                  -- ex.: "Diretor do Núcleo/DRE", "Técnico de Referência", "Diretor Escolar"
  papel papel_usuario not null,
  escola_id uuid references escolas(id),       -- obrigatório para usuários de escola; nulo para o Núcleo
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint escola_ou_nucleo check (
    (papel in ('diretor_escola', 'secretaria_escola') and escola_id is not null) or
    (papel in ('nucleo_diretor', 'nucleo_tecnico') and escola_id is null)
  )
);

-- Profissionais (Professor AEE e Acompanhante)
create table profissionais (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id),
  nome text not null,
  tipo tipo_profissional not null,
  documento_ou_matricula text,
  telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Turmas
create table turmas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id),
  codigo text not null,
  nome text not null,
  turno text,
  ano_letivo int not null,
  created_at timestamptz not null default now(),
  unique (escola_id, codigo, ano_letivo)
);

-- Alunos
create table alunos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  data_nascimento date,
  idade_informada int,                       -- usado quando a planilha traz só a idade
  sexo sexo_tipo,
  endereco text,
  escola_id uuid not null references escolas(id),  -- desnormalizado para RLS simples
  turma_id uuid references turmas(id),
  ciclo smallint check (ciclo in (1, 2, 3)),
  serie text,
  situacao_doc situacao_doc not null default 'sem_laudo',
  cid text,
  numero_processo text,
  contrato_acompanhante boolean not null default false,
  necessita_professor_aee boolean not null default true,
  necessita_acompanhante boolean not null default false,
  professor_aee_id uuid references profissionais(id),
  acompanhante_id uuid references profissionais(id),
  observacoes text,
  ativo boolean not null default true,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_alunos_escola_id on alunos (escola_id);
create index idx_alunos_turma_id on alunos (turma_id);

-- PDI (Plano de Desenvolvimento Individual)
create table pdis (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  escola_id uuid not null references escolas(id),
  ano_letivo int not null,
  status status_pdi not null default 'rascunho',
  conteudo jsonb not null default '{}'::jsonb,
  elaborado_por text,
  data_elaboracao date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Restrição: Apenas 1 PDI 'vigente' por aluno no mesmo ano letivo
create unique index idx_pdi_vigente_unico on pdis(aluno_id, ano_letivo) where (status = 'vigente');

-- Documentos do Aluno (Laudo, Estudo de Caso, PDI escaneado, etc.)
create table documentos_aluno (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  escola_id uuid not null references escolas(id),
  tipo tipo_documento not null,
  titulo text not null,
  storage_path text not null,               -- bucket privado "documentos-alunos"
  mime_type text,
  tamanho_bytes bigint,
  enviado_por uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Ofícios à SEDUC
create table oficios (
  id uuid primary key default gen_random_uuid(),
  ano int not null,
  numero int not null,
  assunto text not null,
  destinatario text not null default 'SEDUC/PA',
  corpo text not null,
  status status_oficio not null default 'rascunho',
  escola_id uuid references escolas(id),     -- null = ofício geral da regional
  pdf_path text,
  criado_por uuid references profiles(id),
  emitido_em timestamptz,
  resposta_recebida_em timestamptz,
  resposta_resumo text,
  created_at timestamptz not null default now(),
  unique (ano, numero)
);

-- Alunos vinculados ao Ofício com snapshot de status
create table oficio_alunos (
  oficio_id uuid references oficios(id) on delete cascade,
  aluno_id uuid references alunos(id),
  status_no_momento text not null,
  primary key (oficio_id, aluno_id)
);

-- Registro de Auditoria (LGPD)
create table audit_log (
  id bigserial primary key,
  user_id uuid,
  acao text not null,
  tabela text not null,
  registro_id text,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

-- Numeração sequencial de ofícios por ano
create or replace function proximo_numero_oficio(p_ano int) returns int
language plpgsql as $$
declare n int;
begin
  perform pg_advisory_xact_lock(hashtext('oficio_' || p_ano));
  select coalesce(max(numero), 0) + 1 into n from oficios where ano = p_ano;
  return n;
end $$;

-- Helpers de Segurança RLS
create or replace function meu_papel() returns papel_usuario
language sql stable security definer set search_path = public as
$$ select papel from profiles where id = auth.uid() and ativo limit 1 $$;

create or replace function minha_escola() returns uuid
language sql stable security definer set search_path = public as
$$ select escola_id from profiles where id = auth.uid() and ativo limit 1 $$;

create or replace function eh_nucleo() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(
     (select papel in ('nucleo_diretor', 'nucleo_tecnico')
        from profiles where id = auth.uid() and ativo limit 1), false) $$;

-- View do Semáforo (respeita RLS de quem consulta)
create or replace view vw_alunos_status with (security_invoker = true) as
select
  a.*,
  (a.professor_aee_id is not null) as tem_professor,
  (a.acompanhante_id is not null)  as tem_acompanhante,
  case
    when not a.necessita_professor_aee and not a.necessita_acompanhante then 'nao_se_aplica'
    when a.necessita_professor_aee and a.professor_aee_id is null
     and a.necessita_acompanhante and a.acompanhante_id is null            then 'sem_nenhum'
    when a.necessita_professor_aee and a.professor_aee_id is null          then 'sem_professor'
    when a.necessita_acompanhante and a.acompanhante_id is null            then 'sem_acompanhante'
    when a.acompanhante_id is not null and not a.contrato_acompanhante     then 'contrato_pendente'
    else 'ok'
  end as status_atendimento,
  (a.situacao_doc <> 'sem_laudo' and not exists (
      select 1 from pdis p
      where p.aluno_id = a.id and p.status = 'vigente'
        and p.ano_letivo = extract(year from now())::int
  )) as pdi_pendente
from alunos a
where a.ativo;

-- Trigger para updated_at automático
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_alunos_updated_at
  before update on alunos
  for each row execute function set_updated_at();

create trigger trg_pdis_updated_at
  before update on pdis
  for each row execute function set_updated_at();

-- Habilitação de RLS em todas as tabelas
alter table escolas enable row level security;
alter table profiles enable row level security;
alter table profissionais enable row level security;
alter table turmas enable row level security;
alter table alunos enable row level security;
alter table pdis enable row level security;
alter table documentos_aluno enable row level security;
alter table oficios enable row level security;
alter table oficio_alunos enable row level security;
alter table audit_log enable row level security;

-- Políticas de RLS: Escolas
create policy escolas_select on escolas for select
  using (eh_nucleo() or id = minha_escola());

create policy escolas_insert on escolas for insert
  with check (eh_nucleo());

create policy escolas_update on escolas for update
  using (eh_nucleo() or id = minha_escola())
  with check (eh_nucleo() or id = minha_escola());

create policy escolas_delete on escolas for delete
  using (eh_nucleo());

-- Políticas de RLS: Profiles
create policy profiles_select on profiles for select
  using (eh_nucleo() or id = auth.uid());

create policy profiles_write on profiles for all
  using (eh_nucleo());

-- Políticas de RLS: Profissionais
create policy profissionais_select on profissionais for select
  using (eh_nucleo() or escola_id = minha_escola());

create policy profissionais_write on profissionais for all
  using (eh_nucleo() or escola_id = minha_escola())
  with check (eh_nucleo() or escola_id = minha_escola());

-- Políticas de RLS: Turmas
create policy turmas_select on turmas for select
  using (eh_nucleo() or escola_id = minha_escola());

create policy turmas_write on turmas for all
  using (eh_nucleo() or escola_id = minha_escola())
  with check (eh_nucleo() or escola_id = minha_escola());

-- Políticas de RLS: Alunos
create policy alunos_select on alunos for select
  using (eh_nucleo() or escola_id = minha_escola());

create policy alunos_write on alunos for all
  using (eh_nucleo() or escola_id = minha_escola())
  with check (eh_nucleo() or escola_id = minha_escola());

-- Políticas de RLS: PDIs
create policy pdis_select on pdis for select
  using (eh_nucleo() or escola_id = minha_escola());

create policy pdis_write on pdis for all
  using (eh_nucleo() or escola_id = minha_escola())
  with check (eh_nucleo() or escola_id = minha_escola());

-- Políticas de RLS: Documentos do Aluno
create policy documentos_select on documentos_aluno for select
  using (eh_nucleo() or escola_id = minha_escola());

create policy documentos_write on documentos_aluno for all
  using (eh_nucleo() or escola_id = minha_escola())
  with check (eh_nucleo() or escola_id = minha_escola());

-- Políticas de RLS: Ofícios (Apenas Núcleo)
create policy oficios_nucleo on oficios for all
  using (eh_nucleo())
  with check (eh_nucleo());

create policy oficio_alunos_nucleo on oficio_alunos for all
  using (eh_nucleo())
  with check (eh_nucleo());

-- Políticas de RLS: Audit Log
create policy audit_insert on audit_log for insert
  with check (true);

create policy audit_select on audit_log for select
  using (eh_nucleo());
