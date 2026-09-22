# Sistema de Gestão de Educação Especial — SEDUC-PA (DRE Altamira)

Sistema integrado desenvolvido para o **Núcleo de Educação Especial da Diretoria Regional de Ensino de Altamira (DRE Altamira)** em articulação com a **Secretaria de Estado de Educação do Pará (SEDUC-PA)** e a **Coordenação de Educação Especial (COEES)**.

O sistema centraliza o controle regional do **Atendimento Educacional Especializado (AEE)**, o semáforo de conformidade de atendimento, elaboração e vigência do **PDI (Plano de Desenvolvimento Individual)**, acompanhamento de laudos e estudos de caso, gestão de recursos humanos (professores de AEE e cuidadores/acompanhantes), emissão de ofícios à SEDUC e análise estatística abrangente dos 8 municípios da região da Transamazônica e Xingu.

---

## 📑 Sumário

1. [Visão Geral e Arquitetura](#-visão-geral-e-arquitetura)
2. [Funcionalidades Principais](#-funcionalidades-principais)
3. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
4. [Estrutura do Projeto](#-estrutura-do-projeto)
5. [Passo a Passo: Como Instalar e Rodar o Projeto](#-passo-a-passo-como-instalar-e-rodar-o-projeto)
6. [Passo a Passo: Configuração do Banco de Dados (PostgreSQL / Supabase)](#-passo-a-passo-configuração-do-banco-de-dados-postgresql--supabase)
7. [Guia de Utilização do Sistema (Passo a Passo)](#-guia-de-utilização-do-sistema-passo-a-passo)
8. [Regras de Negócio e Semáforo de Atendimento](#-regras-de-negócio-e-semáforo-de-atendimento)
9. [Declaração de Autoria e Direitos de Uso](#-declaração-de-autoria-e-direitos-de-uso)

---

## 🏛️ Visão Geral e Arquitetura

O sistema atende a duas esferas de atuação educacional:
- **Núcleo Regional (DRE Altamira):** Gestão macro de todos os 8 polos municipais (*Altamira, Brasil Novo, Vitória do Xingu, Porto de Moz, Senador José Porfírio, Medicilândia, Anapu e Uruará*), com autoridade para emissão de ofícios institucionais à sede da SEDUC-PA, gestão de lotação de docentes/cuidadores, auditoria completa e análise de relatórios executivos.
- **Unidade Escolar (Direção e Secretaria):** Visão restrita à própria escola, com cadastro e acompanhamento individual de cada estudante, vinculação às turmas e acompanhamento da elaboração dos planos pedagógicos (PDI/PEI).

---

## 🚀 Funcionalidades Principais

1. **Dashboard Estatístico Completo (Métricas Panorâmicas):**
   - **Semáforo de Atendimento em Tempo Real:** Distribuição visual em 6 status regulamentares (Regular/OK, Sem Nenhum Profissional, Falta Professor AEE, Falta Cuidador, Contrato Pendente, Sem Demanda Direta).
   - **Painel Clínico de Diagnósticos & CIDs:** Gráficos empilhados por patologia (*TEA, Deficiência Intelectual, Deficiência Física/Paralisia, Deficiência Visual, Deficiência Auditiva, Síndrome de Down, TDAH e Múltiplas*).
   - **Comparativo dos 8 Municípios da DRE:** Métricas de matrículas, cobertura regular e salas de recursos multifuncionais (SRM) ativas.
   - **Recursos Humanos:** Balanço de demanda vs. profissionais alocados e controle de vigência dos contratos de apoio.
   - **Controle Documental & PDI 2026:** Percentual de laudos médicos homologados, estudos de caso em andamento e cobertura de PDIs vigentes.
   - **Ciclos, Turnos e Pirâmide Etária:** Estratificação por Ensino Fundamental, Ensino Médio, EJA e faixas de idade.

2. **Gestão de Estudantes (Cadastro e Prontuário AEE):**
   - Cadastro detalhado com CID, número de processo administrativo na SEDUC, ciclo e série.
   - Vinculação a Professor Especialista de AEE e Acompanhante/Cuidador.
   - Sinalização automática de conformidade pelo Semáforo de Atendimento.
   - Exportação completa da listagem de alunos para planilhas Excel (`.xlsx`).

3. **PDI (Plano de Desenvolvimento Individual) & PEI:**
   - Formulário estruturado com áreas de desenvolvimento: Comunicação e Linguagem, Cognitivo, Motor/Sensorial, Socialização e Habilidades Acadêmicas.
   - Definição de objetivos pedagógicos, recursos de tecnologia assistiva, adaptações curriculares e critérios de avaliação.
   - Controle de versões e status: Rascunho, Vigente e Encerrado.

4. **Estudos de Caso e Documentos do Estudante:**
   - Registro de histórico familiar, anamnese, barreiras de aprendizagem e justificativas pedagógicas.
   - Upload e arquivamento de laudos periciais, relatórios multidisciplinares e declarações.

5. **Módulo de Escolas e Salas de Recursos Multifuncionais (SRM):**
   - Cadastro de todas as unidades estaduais da DRE Altamira com endereços, contatos e dados da gestão.
   - Monitoramento do status da SRM: Ativa, Inativa, Sem SRM ou regime SOME/CEMEP.

6. **Ofícios e Encaminhamentos Institucionais:**
   - Numeração sequencial automática de ofícios por ano (`Ofício nº 001/2026 - DRE/ALTAMIRA`).
   - Pré-seleção automática de estudantes com déficits de profissionais para anexar ao documento.
   - Registro de protocolos de envio, respostas da SEDUC-PA e exportação em documento oficial para impressão/assinatura.

7. **Documentos Oficiais COEES / SEDUC-PA:**
   - Visualização e geração dos modelos padronizados de instrumentais da Secretaria de Educação.

8. **Carga em Lote (Importador de Planilhas):**
   - Importação em massa de alunos, turmas, escolas e profissionais a partir de arquivos `.xlsx` e `.csv`.

9. **Segurança e Auditoria (LGPD):**
   - Trilha de auditoria permanente (`audit_log`) registrando data/hora, operador e alterações em registros de alunos.

---

## 🛠️ Tecnologias Utilizadas

- **Front-end:** React 19, TypeScript, Tailwind CSS v4, Motion.
- **Gráficos e Visualizações:** Recharts.
- **Ícones e UI:** Lucide React, Canvas Confetti.
- **Manipulação de Dados e Arquivos:** SheetJS (xlsx), docx, date-fns, zod.
- **Build Tool:** Vite 8.
- **Banco de Dados Relacional:** PostgreSQL / Supabase com extensões pgcrypto e Row Level Security (RLS).

---

## 📁 Estrutura do Projeto

```text
├── src/
│   ├── components/                # Componentes da Interface de Usuário
│   │   ├── AlunoModal.tsx         # Cadastro e edição de estudantes
│   │   ├── AlunosView.tsx         # Listagem e filtros do AEE
│   │   ├── DashboardView.tsx      # Central panorâmica de gráficos
│   │   ├── DocumentosCoeesView.tsx# Repositório de minutas e normas COEES
│   │   ├── EscolasView.tsx        # Gestão das unidades escolares e SRM
│   │   ├── EstudoDeCasoModal.tsx  # Registro de estudo de caso
│   │   ├── ImportarView.tsx       # Importador de dados em lote
│   │   ├── LegendaSemaforo.tsx    # Guia explicativo das cores do semáforo
│   │   ├── LoginView.tsx          # Tela de login institucional
│   │   ├── OficiosView.tsx        # Emissão e controle de ofícios à SEDUC
│   │   ├── PEIModal.tsx           # Plano Educacional Individualizado
│   │   ├── PendenciasView.tsx     # Alerta de carências e déficits
│   │   ├── Sidebar.tsx            # Navegação lateral e menus
│   │   ├── TurmasView.tsx         # Gestão de turmas e anos letivos
│   │   └── UsuariosView.tsx       # Controle de acessos e permissões
│   ├── lib/                       # Lógica de Negócio e Estado
│   │   ├── mockData.ts            # Base de dados oficial da DRE Altamira
│   │   ├── status.ts              # Regras de cálculo do semáforo
│   │   └── store.tsx              # Context API e gerenciamento global
│   ├── types/                     # Tipagens estritas do TypeScript
│   │   └── index.ts               # Modelos de dados e enums
│   ├── App.tsx                    # Roteamento principal do sistema
│   └── main.tsx                   # Ponto de entrada do React
├── supabase/
│   └── migrations/
│       ├── 0001_initial_schema.sql# Estrutura completa do banco de dados (DDL)
│       └── 0002_seed.sql          # Carga de dados iniciais das escolas e perfis
├── package.json                   # Dependências e scripts
├── vite.config.ts                 # Configuração do Vite
└── tsconfig.json                  # Configuração do TypeScript
```

---

## 💻 Passo a Passo: Como Instalar e Rodar o Projeto

### Pré-requisitos:
- **Node.js** (versão 18 ou superior instalada).
- Gerenciador de pacotes **npm**, **bun** ou **yarn**.

### Passo 1: Clonar ou Baixar o Repositório
Abra o terminal no diretório onde deseja instalar a aplicação:
```bash
git clone <URL_DO_REPOSITORIO>
cd <NOME_DA_PASTA>
```

### Passo 2: Instalar as Dependências
Execute o comando para instalar todas as bibliotecas do projeto:
```bash
npm install
```

### Passo 3: Executar o Servidor de Desenvolvimento
Inicie a aplicação localmente:
```bash
npm run dev
```

O terminal exibirá o endereço de acesso local:
```text
  VITE v8.3.0  ready in 350 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
```

Abra o navegador e acesse `http://localhost:3000`.

### Passo 4: Compilar para Produção (Build)
Para gerar a versão otimizada pronta para publicação:
```bash
npm run build
```
Os arquivos finais serão gerados na pasta `dist/`.

---

## 🗄️ Passo a Passo: Configuração do Banco de Dados (PostgreSQL / Supabase)

Caso deseje conectar o sistema diretamente a uma instância PostgreSQL ou Supabase:

1. Acesse o painel do seu banco PostgreSQL (Supabase, Neon, Cloud SQL, etc.).
2. Abra o editor de consultas SQL (**SQL Editor**).
3. Execute o arquivo `/supabase/migrations/0001_initial_schema.sql`:
   - Cria os tipos enums (`papel_usuario`, `sexo_tipo`, `situacao_doc`, etc.).
   - Cria as tabelas `escolas`, `profiles`, `profissionais`, `turmas`, `alunos`, `pdis`, `documentos_aluno`, `oficios` e `audit_log`.
   - Cria a view de semáforo `vw_alunos_status`.
4. Em seguida, execute o arquivo `/supabase/migrations/0002_seed.sql`:
   - Popula as escolas da região de Altamira e usuários iniciais de teste.
5. Crie um arquivo `.env` na raiz do projeto com as chaves de conexão:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

---

## 📖 Guia de Utilização do Sistema (Passo a Passo)

### 1. Acesso ao Sistema (Login)
- Na tela de login, insira seu e-mail institucional e senha de acesso.
- **Credenciais padrão pré-cadastradas para testes:**
  - *Diretoria do Núcleo Regional (DRE):* `valter.mendonca@seduc.pa.gov.br` | Senha: `seduc@dre2026`
  - *Técnica de Referência Regional:* `regina.vasconcelos@seduc.pa.gov.br` | Senha: `seduc@dre2026`
  - *Diretora Escolar (EEEM Polivalente):* `maria.santos@seduc.pa.gov.br` | Senha: `seduc@dre2026`
  - *Secretaria Escolar:* `marcos.lima@seduc.pa.gov.br` | Senha: `seduc@dre2026`

### 2. Navegação no Dashboard
- Ao autenticar, você verá o painel com as métricas do semáforo.
- Utilize a barra superior de abas para alternar entre:
  - **Semáforo de Atendimento:** Gráfico de rosca e quantitativos absolutos.
  - **Diagnósticos & CIDs:** Visualização das condições de saúde dos alunos.
  - **Polos Regionais:** Comparativo dos 8 municípios da região.
  - **Recursos Humanos:** Relação de carências de professores e acompanhantes.
  - **Laudos & PDI 2026:** Indicadores de documentação e cumprimento de planos.
  - **Ciclos, Turnos & Idades:** Distribuição por turnos e faixas etárias.
- É possível clicar diretamente em qualquer card numérico do semáforo para ir à listagem de estudantes filtrada automaticamente por aquele status.

### 3. Gerenciando Estudantes (Módulo Alunos)
1. Clique em **Alunos** no menu lateral.
2. Utilize o botão **Novo Aluno** no topo direito para registrar um novo estudante.
3. Preencha os dados de identificação, turma, laudo médico/CID e assinale se ele necessita de Professor de AEE e/ou Acompanhante.
4. Ao salvar, o sistema calcula em tempo real o status de atendimento e insere o registro na trilha de auditoria.
5. Para exportar os dados para auditoria externa, clique em **Exportar Excel**.

### 4. Criando e Acompanhando o PDI / PEI
1. Na lista de alunos, localize o estudante desejado.
2. Clique no ícone de **PDI** ou abra as opções do aluno.
3. Preencha as metas pedagógicas, adaptações e cronograma de atendimentos na SRM.
4. Altere o status para **Vigente** para regularizar a conformidade pedagógica do estudante perante a DRE.

### 5. Emitindo Ofícios de Solicitação à SEDUC-PA (Apenas Núcleo)
1. Acesse o menu **Ofícios à SEDUC**.
2. Clique em **Novo Ofício**.
3. O sistema carrega automaticamente a lista de estudantes que estão nas situações *Sem Nenhum Profissional*, *Falta Professor AEE* ou *Falta Cuidador*.
4. Selecione os alunos cujas vagas devem ser pleiteadas na folha de pagamento da SEDUC.
5. O sistema redige o documento oficial com preâmbulo padrão, quadro demonstrativo dos estudantes, justificativa fundamentada e campo para assinatura da diretoria.
6. Clique em **Exportar DOCX** ou **Imprimir** para formalizar o documento.

---

## 🚦 Regras de Negócio e Semáforo de Atendimento

O semáforo do AEE avalia a conformidade de atendimento com base no cruzamento das necessidades diagnosticadas versus os recursos humanos alocados:

| Cor / Status | Significado | Condição no Sistema |
| :--- | :--- | :--- |
| 🟢 **OK (Atendimento Regular)** | Conformidade total | Todos os profissionais necessários (professor AEE e/ou acompanhante) estão alocados e contratos ativos. |
| 🔴 **Sem Nenhum** | Déficit grave e prioridade máxima | Aluno necessita de professor e cuidador, porém não possui nenhum profissional designado. |
| 🟣 **Falta Professor de AEE** | Carência docente especializada | Possui cuidador (ou não necessita), mas está desprovido de docente para atendimento na SRM. |
| 🟠 **Falta Acompanhante** | Carência de apoio individual | Possui professor de AEE (ou não necessita), mas não possui cuidador/acompanhante para auxílio nas atividades diárias. |
| 🟡 **Contrato Pendente** | Risco de descontinuidade | Possui acompanhante alocado, porém o contrato temporário está pendente de renovação ou comprovação documental. |
| ⚪ **Sem Demanda Direta** | Registro regular em acompanhamento | Estudante com diagnóstico que não demanda atendimento contínuo na SRM nem acompanhante diário. |

---

## ⚖️ Declaração de Autoria e Direitos de Uso

> **AVISO LEGAL E DIREITOS AUTORAIS:**  
> **Este sistema tem autoria e não pode ser usado sem autorização.**  
> Todos os direitos sobre a concepção, código-fonte, arquitetura de dados, design de interface e regras de negócio pertencem exclusivamente ao seu autor. É expressamente vedada qualquer reprodução, distribuição, modificação, engenharia reversa, comercialização ou utilização não autorizada, total ou parcial, sem a prévia e expressa autorização por escrito do detentor dos direitos autorais.
