# Suposições Adotadas — Sistema de Gestão do Atendimento em Educação Especial
**SEDUC-PA · DRE Altamira · Núcleo de Educação Especial**

Este documento registra todas as suposições e definições adotadas na implementação do sistema em conformidade com as diretrizes do Núcleo de Educação Especial e da DRE Altamira.

---

### 1. Situação Documental do Aluno e CID
- A situação documental divide-se em 3 estados mutuamente exclusivos:
  1. `com_laudo` — Aluno que já possui laudo médico/psicológico homologado;
  2. `estudo_de_caso` — Aluno em processo de avaliação psicopedagógica / estudo de caso pedagógico;
  3. `sem_laudo` — Aluno identificado com necessidades educacionais especiais, mas sem laudo ou estudo de caso formalizado.
- **CID (Classificação Internacional de Doenças)**: O campo é opcional para todos os 3 estados, pois alunos em triagem ou estudo de caso podem ainda não ter o código médico definitivo. O sistema aceita formatos válidos (ex.: F84.0, G80, F70) e armazena em caixa alta.
- Para alunos `com_laudo` e `estudo_de_caso`, os campos adicionais exibidos e gerenciados são: **Nº do Processo Administrativo** e **Contrato do Acompanhante (Sim/Não)**.

---

### 2. Necessidades de Atendimento e Profissionais Vinculados
- Cada aluno tem dois flags de necessidade:
  - `necessita_professor_aee` (booleano, padrão `true`);
  - `necessita_acompanhante` (booleano, padrão `false`).
- O atendimento efetivo é dado pelos vínculos `professor_aee_id` e `acompanhante_id`.
- Os profissionais são alocados nas escolas e podem atender múltiplos alunos daquela escola.

---

### 3. Matriz do Semáforo de Atendimento (`vw_alunos_status`)
O status é avaliado automaticamente segundo a combinação das necessidades e dos vínculos:
1. `ok` (**Verde**): Aluno possui todos os profissionais dos quais necessita (e se tiver acompanhante com necessidade, o contrato está ativo).
2. `sem_nenhum` (**Vermelho**): Necessita de Professor AEE E de Acompanhante, mas não possui nenhum dos dois.
3. `sem_professor` (**Roxo**): Necessita de Professor AEE, mas não possui professor alocado.
4. `sem_acompanhante` (**Laranja**): Necessita de Acompanhante, mas não possui acompanhante alocado.
5. `contrato_pendente` (**Amarelo**): Possui acompanhante vinculado, mas `contrato_acompanhante = false`.
6. `nao_se_aplica` (**Cinza**): Não necessita nem de professor AEE nem de acompanhante no momento.

Selo extra: **"PDI Pendente"** exibido quando o aluno com laudo ou estudo de caso não possui PDI com status `vigente` no ano letivo atual.

---

### 4. Perfis, Papéis e Matriz de Permissões
- **Equipe do Núcleo (`nucleo_diretor`, `nucleo_tecnico`)**:
  - Acesso irrestrito a todas as escolas da regional DRE Altamira;
  - Visualização de estatísticas consolidadas da regional e por escola;
  - Emissão, edição e exportação de Ofícios à SEDUC/PA;
  - Importação de planilhas de carga inicial / atualização;
  - Gestão e auditoria de usuários.
- **Equipe da Escola (`diretor_escola`, `secretaria_escola`)**:
  - Escopo estritamente restrito à sua própria escola (`escola_id`);
  - Inclusão, alteração e acompanhamento exclusivo de seus alunos, turmas, profissionais, PDIs e documentos;
  - Dashboard e relatórios mostram apenas números da sua escola (sem ranking ou comparativos inter-escolares);
  - Não possuem acesso ao gerador de ofícios nem à gestão de usuários de outras unidades.

---

### 5. Idade e Data de Nascimento
- Se a data de nascimento estiver preenchida, a idade é calculada dinamicamente com base na data de referência;
- Quando a planilha ou cadastro trouxer apenas a idade em anos (comum em listagens históricas), utiliza-se o campo `idade_informada`.

---

### 6. Armazenamento e Execução em Ambiente Híbrido
- A arquitetura disponibiliza as migrations SQL completas para PostgreSQL / Supabase com RLS ativado em `supabase/migrations/`;
- Na camada web (preview imediato e modo standalone), o sistema opera com repositório reativo integrado e persistência no `localStorage` com seed rica de escolas da DRE Altamira (Altamira, Brasil Novo, Medicilândia, Senador José Porfírio, Anapu, Vitória do Xingu), alternador de perfis para homologação imediata, gerador de PDF/DOCX e parser de planilhas Excel reais.
