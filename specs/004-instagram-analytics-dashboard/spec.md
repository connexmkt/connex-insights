# Especificação de Feature: Dashboard de Analytics Instagram

**Branch da Feature**: `004-instagram-analytics-dashboard`  
**Criada em**: 2026-07-07  
**Status**: Rascunho  
**Entrada**: Usuários autenticados com conta Instagram Professional conectada e integração válida devem visualizar Insights do Instagram por meio de um dashboard analítico interativo com KPIs, gráficos históricos, desempenho de conteúdo e métricas de audiência.  
**Depende de**: [001-user-auth](../001-user-auth/spec.md), [002-first-time-account-activation](../002-first-time-account-activation/spec.md), [003-instagram-account-connection](../003-instagram-account-connection/spec.md) — requer usuário `ACTIVE`, integração Instagram existente e pipeline de sincronização operacional definido na feature 003.

## User Scenarios & Testing _(obrigatório)_

### User Story 1 — Acessar o Dashboard de Analytics Instagram (Prioridade: P1)

Como usuário autenticado com conta Instagram Professional conectada, quero acessar o dashboard de analytics para visualizar o desempenho da minha conta em um único lugar.

**Por que esta prioridade**: Sem acesso controlado ao dashboard, nenhuma métrica sincronizada entrega valor ao usuário. É o ponto de entrada de toda a feature.

**Teste independente**: Pode ser testado autenticando um usuário `ACTIVE` com integração **Conectada** e sync concluída, navegando até o dashboard Instagram e verificando renderização da visão analítica; repetir com usuário sem integração e verificar empty state com CTA de conexão.

**Cenários de aceitação**:

1. **Dado** que sou um usuário autenticado com conta `ACTIVE`, integração Instagram **Conectada** e sincronização concluída, **Quando** acesso o Dashboard de Analytics Instagram, **Então** vejo a interface analítica com dados do meu tenant.
2. **Dado** que sou um usuário autenticado com conta `ACTIVE` sem conta Instagram conectada, **Quando** acesso o dashboard Instagram, **Então** vejo um empty state claro com call-to-action para conectar minha conta.
3. **Dado** que não estou autenticado ou minha conta não está `ACTIVE`, **Quando** tento acessar o dashboard Instagram, **Então** o acesso é bloqueado conforme regras das features 001 e 002.
4. **Dado** que minha integração está **Desconectada** ou **Requer reconexão**, **Quando** acesso o dashboard, **Então** vejo dados históricos disponíveis (quando existirem) e orientação clara sobre o status da conexão, sem expor detalhes técnicos.
5. **Dado** que pertenço ao tenant A, **Quando** acesso o dashboard, **Então** vejo exclusivamente analytics associados ao tenant A.

---

### User Story 2 — Visualizar KPIs e visão geral da conta (Prioridade: P1)

Como usuário com integração Instagram sincronizada, quero ver cards de KPI com os indicadores mais relevantes da minha conta para entender rapidamente minha performance atual.

**Por que esta prioridade**: Os KPIs são a primeira camada de valor — resumo executivo antes de análises detalhadas.

**Teste independente**: Pode ser testado acessando o dashboard com dados sincronizados e verificando exibição de cards com valores atuais, indicadores de crescimento e distinção visual entre métricas atuais e tendências.

**Cenários de aceitação**:

1. **Dado** que possuo dados sincronizados, **Quando** visualizo a seção de KPIs, **Então** vejo métricas de conta disponíveis pela Instagram Graph API, incluindo quando aplicável: seguidores, novos seguidores, crescimento de seguidores, contas alcançadas, contas engajadas, visitas ao perfil, visualizações de perfil, impressões, interações totais e taxa de engajamento.
2. **Dado** que possuo dados de períodos anteriores, **Quando** visualizo os KPIs, **Então** vejo indicadores de crescimento (positivo, negativo ou neutro) em relação ao período selecionado.
3. **Dado** que uma métrica não está disponível pela API para minha conta ou período, **Quando** visualizo o dashboard, **Então** a interface indica indisponibilidade de forma clara, sem valores fictícios.
4. **Dado** que os dados estão sendo carregados, **Quando** acesso o dashboard, **Então** vejo skeletons de carregamento até os KPIs estarem prontos.
5. **Dado** que a Meta introduz novas métricas de conta suportadas tecnicamente, **Quando** a sincronização as importa, **Então** o dashboard deve incorporá-las automaticamente sempre que viável, sem exigir alteração de interface para cada métrica individual.

---

### User Story 3 — Analisar tendências históricas com filtros de período (Prioridade: P1)

Como usuário com dados históricos sincronizados, quero visualizar gráficos interativos da evolução das métricas ao longo do tempo e filtrar por intervalos de datas para acompanhar crescimento e performance.

**Por que esta prioridade**: Tendências históricas transformam snapshots pontuais em inteligência acionável para decisões de marketing.

**Teste independente**: Pode ser testado selecionando cada intervalo predefinido (7, 30, 90 dias, 6 e 12 meses), verificando atualização de gráficos e KPIs, e confirmando que séries temporais refletem dados persistidos do tenant.

**Cenários de aceitação**:

1. **Dado** que possuo dados históricos sincronizados, **Quando** visualizo a seção de gráficos, **Então** vejo evolução temporal de métricas disponíveis, incluindo quando aplicável: crescimento de seguidores, alcance, engajamento, visitas ao perfil, impressões, visualizações e desempenho de conteúdo.
2. **Dado** que estou no dashboard, **Quando** seleciono um intervalo predefinido (últimos 7 dias, 30 dias, 90 dias, 6 meses ou 12 meses), **Então** KPIs, gráficos e tabelas de conteúdo são recalculados para o período escolhido.
3. **Dado** que seleciono um período sem dados suficientes, **Quando** visualizo os gráficos, **Então** vejo empty state ou indicação de dados insuficientes, sem erros ou valores inventados.
4. **Dado** que possuo dados de múltiplas sincronizações, **Quando** visualizo gráficos históricos, **Então** as séries refletem dados preservados após cada sincronização, não apenas o snapshot mais recente.
5. **Dado** que altero o período selecionado, **Quando** a interface recarrega os dados, **Então** vejo feedback de carregamento (skeleton ou indicador) durante a transição.

---

### User Story 4 — Explorar desempenho de conteúdo publicado (Prioridade: P1)

Como usuário com mídias sincronizadas, quero ver métricas de desempenho por publicação, ordenar e filtrar conteúdos para identificar o que performa melhor.

**Por que esta prioridade**: Análise por conteúdo é essencial para otimizar estratégia editorial e priorizar formatos de maior retorno.

**Teste independente**: Pode ser testado acessando a seção de conteúdo com mídias sincronizadas, verificando exibição de thumbnail, legenda, tipo, data e métricas; em seguida ordenando por alcance, engajamento e demais critérios suportados.

**Cenários de aceitação**:

1. **Dado** que possuo mídias publicadas sincronizadas, **Quando** visualizo a seção de desempenho de conteúdo, **Então** vejo para cada publicação suportada: curtidas, comentários, compartilhamentos, salvamentos, visualizações, alcance, impressões, engajamento, taxa de engajamento, data de publicação, tipo de conteúdo, legenda e miniatura.
2. **Dado** que possuo múltiplas publicações, **Quando** ordeno por data, alcance, engajamento, curtidas, comentários, compartilhamentos, salvamentos ou visualizações, **Então** a lista é reordenada corretamente conforme o critério escolhido.
3. **Dado** que seleciono um intervalo de datas no dashboard, **Quando** visualizo a seção de conteúdo, **Então** apenas publicações dentro do período (ou com métricas referentes ao período, conforme disponibilidade da API) são exibidas ou claramente contextualizadas.
4. **Dado** que uma publicação não possui determinada métrica disponível pela API, **Quando** visualizo sua linha/card, **Então** a métrica aparece como indisponível, não como zero fictício.
5. **Dado** que não possuo mídias sincronizadas, **Quando** visualizo a seção de conteúdo, **Então** vejo empty state informativo.

---

### User Story 5 — Visualizar insights de audiência (Prioridade: P2)

Como usuário cuja conta disponibiliza dados demográficos e comportamentais pela API, quero ver informações sobre minha audiência para entender quem me segue e quando está mais ativa.

**Por que esta prioridade**: Audiência complementa métricas de conta e conteúdo, mas depende de disponibilidade variável na API Meta.

**Teste independente**: Pode ser testado com conta que retorna demographics na API, verificando exibição de faixas etárias, gênero, país, cidade, horários e dias de maior atividade; repetir com conta sem demographics e verificar indicação de indisponibilidade.

**Cenários de aceitação**:

1. **Dado** que a Instagram Graph API disponibiliza dados demográficos para minha conta, **Quando** visualizo a seção de audiência, **Então** vejo quando aplicável: crescimento de audiência, tendência de seguidores, faixas etárias, gênero, país, cidade, horários ativos e dias ativos.
2. **Dado** que dados demográficos não estão disponíveis para minha conta, **Quando** visualizo a seção de audiência, **Então** vejo mensagem clara de indisponibilidade, sem dados estimados.
3. **Dado** que altero o período selecionado no dashboard, **Quando** dados de audiência forem sensíveis ao período, **Então** a seção reflete o intervalo escolhido.
4. **Dado** que possuo dados de audiência sincronizados, **Quando** visualizo gráficos demográficos, **Então** os gráficos são responsivos e legíveis em dispositivos móveis e desktop.

---

### User Story 6 — Comparar desempenho entre períodos (Prioridade: P2)

Como usuário analítico, quero comparar métricas entre períodos diferentes para avaliar se minha performance melhorou ou piorou.

**Por que esta prioridade**: Comparação temporal amplia o valor dos KPIs e gráficos, mas depende da base de dados históricos já funcional.

**Teste independente**: Pode ser testado selecionando um período principal e ativando comparação com período anterior equivalente, verificando exibição side-by-side ou overlay de variação percentual nos KPIs e gráficos suportados.

**Cenários de aceitação**:

1. **Dado** que possuo dados históricos suficientes, **Quando** ativo comparação de períodos, **Então** vejo métricas do período selecionado comparadas ao período anterior de mesma duração.
2. **Dado** que comparo períodos, **Quando** visualizo KPIs e gráficos compatíveis, **Então** variações positivas e negativas são destacadas visualmente (crescimento/queda).
3. **Dado** que não há dados suficientes para o período de comparação, **Quando** tento comparar, **Então** vejo indicação clara de comparação indisponível.
4. **Dado** que desativo a comparação, **Quando** visualizo o dashboard, **Então** retorno à visão single-period sem resíduos visuais da comparação.

---

### User Story 7 — Monitorar status de sincronização e frescor dos dados (Prioridade: P2)

Como usuário do dashboard, quero saber quando os dados foram atualizados pela última vez e se a sincronização está saudável para confiar nas métricas exibidas.

**Por que esta prioridade**: Transparência sobre frescor dos dados aumenta confiança e orienta ação quando sync falha.

**Teste independente**: Pode ser testado acessando o dashboard com integração em estados distintos (sync concluída, em andamento, falhou) e verificando timestamp, status e indicador de frescor; simular falha de sync e confirmar notificação não técnica.

**Cenários de aceitação**:

1. **Dado** que possuo integração Instagram, **Quando** visualizo o dashboard, **Então** vejo data/hora da última sincronização bem-sucedida, status atual da sincronização e indicador de frescor dos dados.
2. **Dado** que a sincronização está em andamento, **Quando** visualizo o dashboard, **Então** vejo estado de sincronização em progresso e dados históricos permanecem visíveis.
3. **Dado** que a última sincronização falhou, **Quando** visualizo o dashboard, **Então** recebo notificação clara e acionável, sem expor detalhes técnicos, stack traces ou tokens.
4. **Dado** que possuo dados históricos de syncs anteriores, **Quando** ocorre falha temporária da API, **Então** dados previamente sincronizados permanecem disponíveis no dashboard.

---

### Edge Cases

- O que acontece quando o usuário acessa o dashboard durante a sincronização inicial? → Skeletons e indicador de sync em andamento; dados parciais exibidos conforme disponíveis; sem bloqueio total da página.
- Como o dashboard se comporta com integração **Requer reconexão**? → Dados históricos visíveis; banner de reconexão; KPIs refletem último snapshot conhecido com indicador de dados desatualizados.
- O que acontece quando não há dados no período selecionado? → Empty state contextual; sugestão de ampliar intervalo; sem gráficos vazios enganosos.
- Como tratar métricas com granularidade diária indisponível para intervalos longos (ex.: 12 meses)? → Agregação conforme dados persistidos; mensagem se resolução for insuficiente.
- O que acontece em tentativa de acesso cross-tenant via API ou URL? → Negado em todas as camadas; nenhum dado de outro tenant exposto.
- Como o dashboard responde a falha parcial de sync (algumas métricas importadas, outras não)? → Exibir métricas disponíveis; indicar parcialidade quando relevante; preservar dados anteriores para métricas não atualizadas.
- O que acontece quando o usuário alterna rapidamente entre intervalos de data? → Debounce ou cancelamento de requisições obsoletas; última seleção prevalece; sem flicker inconsistente.
- Como tratar contas com volume muito alto de mídias? → Paginação ou lazy load na seção de conteúdo; ordenação server-side; performance perceptível (ver SC-005).

## Requirements _(obrigatório)_

### Requisitos Funcionais

#### Acesso e elegibilidade

- **FR-001**: Apenas usuários autenticados com conta `ACTIVE` DEVEM acessar o Dashboard de Analytics Instagram.
- **FR-002**: O usuário DEVE possuir integração Instagram válida (status **Conectado**, **Desconectado** ou **Requer reconexão**) associada ao seu tenant para visualizar analytics históricos.
- **FR-003**: Usuários sem integração Instagram DEVEM ver empty state com call-to-action para conectar conta (fluxo da feature 003).
- **FR-004**: Usuários `INACTIVE`, `SUSPENDED` ou não autenticados NÃO DEVEM acessar analytics Instagram.
- **FR-005**: O contexto de tenant DEVE ser resolvido no servidor; nenhuma query DEVE aceitar `tenantId` do cliente sem validação de ownership.

#### Visão geral e KPIs

- **FR-006**: O dashboard DEVE exibir cards de KPI com métricas de conta disponíveis pela Instagram Graph API, incluindo quando aplicável: seguidores, novos seguidores, crescimento de seguidores, seguindo, contas alcançadas, contas engajadas, visitas ao perfil, visualizações de perfil, impressões, interações totais, taxa de engajamento e crescimento de audiência.
- **FR-007**: Cada KPI DEVE distinguir valor atual do indicador de tendência/crescimento quando dados comparativos existirem.
- **FR-008**: KPIs DEVEM refletir o período selecionado pelo usuário.
- **FR-009**: Métricas indisponíveis NÃO DEVEM ser exibidas com valores fictícios; indisponibilidade DEVE ser indicada explicitamente.
- **FR-010**: O dashboard DEVE exibir informações da conta conectada: foto de perfil, username (@) e status da integração.

#### Filtros de período

- **FR-011**: O dashboard DEVE suportar intervalos predefinidos: últimos 7 dias, 30 dias, 90 dias, 6 meses e 12 meses.
- **FR-012**: A seleção de período DEVE atualizar KPIs, gráficos históricos e seção de conteúdo de forma consistente.
- **FR-013**: Período personalizado (custom range) é reservado para suporte futuro e NÃO faz parte desta entrega.

#### Gráficos e tendências históricas

- **FR-014**: O dashboard DEVE exibir gráficos interativos de evolução temporal para métricas disponíveis, incluindo quando aplicável: crescimento de seguidores, tendência de alcance, tendência de engajamento, visitas ao perfil, impressões, visualizações, desempenho de conteúdo e crescimento de audiência.
- **FR-015**: Gráficos DEVEM ser responsivos e utilizáveis em viewports mobile e desktop.
- **FR-016**: Séries históricas DEVEM ser construídas a partir de dados persistidos após sincronizações, preservando histórico acumulado.
- **FR-017**: O dashboard DEVE permitir comparação entre o período selecionado e o período anterior de mesma duração, quando dados suficientes existirem.

#### Desempenho de conteúdo

- **FR-018**: Para cada publicação suportada pela API, o dashboard DEVE exibir: curtidas, comentários, compartilhamentos, salvamentos, visualizações, alcance, impressões, engajamento, taxa de engajamento, data de publicação, tipo de conteúdo, legenda e miniatura da mídia.
- **FR-019**: O usuário DEVE poder ordenar conteúdo por: data, alcance, engajamento, curtidas, comentários, compartilhamentos, salvamentos e visualizações.
- **FR-020**: A seção de conteúdo DEVE respeitar o filtro de período global do dashboard.
- **FR-021**: Publicações sem determinada métrica DEVEM indicar indisponibilidade em vez de zero implícito.

#### Insights de audiência

- **FR-022**: Quando disponíveis pela Instagram Graph API, o dashboard DEVE exibir: crescimento de audiência, tendência de seguidores, demografia (faixa etária, gênero), localização (país, cidade), horários ativos e dias ativos.
- **FR-023**: Dados de audiência indisponíveis DEVEM ser apresentados com empty state ou mensagem de indisponibilidade, sem estimativas.

#### Sincronização e frescor

- **FR-024**: O dashboard DEVE exibir data/hora da última sincronização bem-sucedida.
- **FR-025**: O dashboard DEVE exibir status atual da sincronização (ex.: pendente, em andamento, concluída, falhou).
- **FR-026**: O dashboard DEVE exibir indicador de frescor dos dados (ex.: "Atualizado há X minutos" ou equivalente).
- **FR-027**: Falhas de sincronização DEVEM gerar notificação clara ao usuário, sem expor detalhes técnicos.
- **FR-028**: Dados previamente sincronizados DEVEM permanecer disponíveis durante falhas temporárias da API.

#### Extensibilidade de métricas

- **FR-029**: O modelo de dados e camada de apresentação DEVEM ser capazes de incorporar novas métricas de conta, conteúdo e audiência introduzidas pela Meta sempre que tecnicamente viável, preferencialmente sem alteração estrutural por métrica.

### Regras de Negócio

- **RN-001**: Apenas contas Instagram Professional (Business ou Creator) são suportadas; dados originam exclusivamente da Instagram Graph API.
- **RN-002**: Dados históricos DEVEM ser preservados após cada sincronização bem-sucedida.
- **RN-003**: Dados previamente sincronizados DEVEM permanecer disponíveis mesmo durante falhas temporárias da API ou estado de reconexão.
- **RN-004**: Métricas indisponíveis para determinada conta, tipo de mídia ou período NÃO DEVEM ser inventadas ou estimadas.
- **RN-005**: Taxa de engajamento e métricas derivadas DEVEM seguir definições consistentes documentadas no planejamento técnico, alinhadas aos dados fornecidos pela API.
- **RN-006**: Retenção de dados históricos segue a política de privacidade da plataforma (até 90 dias para métricas Meta, salvo alteração futura de política).

### Requisitos de Segurança

- **RS-001**: Dados analíticos NUNCA DEVEM expor tokens de acesso OAuth ou credenciais Meta.
- **RS-002**: Todas as requisições à Instagram Graph API DEVEM ocorrer exclusivamente server-side.
- **RS-003**: Cache de analytics DEVEM respeitar isolamento por tenant.
- **RS-004**: Acesso a dados analíticos DEVE ser protegido por Row Level Security (RLS) na camada de banco.
- **RS-005**: Endpoints de analytics NÃO DEVEM aceitar identificadores de integração ou tenant do cliente sem validação de ownership.
- **RS-006**: Mensagens de erro ao usuário DEVEM ser não técnicas e não revelar stack traces, tokens ou estados internos sensíveis.

### Requisitos Multi-Tenant

- **RT-001**: Todo dataset analítico DEVE pertencer a exatamente um tenant.
- **RT-002**: Usuários DEVEM visualizar apenas analytics associados ao próprio tenant.
- **RT-003**: Acesso cross-tenant é estritamente proibido em consultas, cache e APIs de analytics.
- **RT-004**: Toda query de analytics DEVE filtrar por `tenant_id`; RLS deve reforçar isolamento na camada de banco.

### Requisitos de Experiência do Usuário

- **RUX-001**: O dashboard DEVE carregar progressivamente, exibindo skeletons durante recuperação de dados.
- **RUX-002**: Gráficos DEVEM ser responsivos e legíveis em mobile e desktop.
- **RUX-003**: A interface DEVE distinguir claramente valores atuais de tendências históricas.
- **RUX-004**: Crescimento positivo e negativo DEVEM ser destacados visualmente (cor, ícone ou ambos), respeitando contraste WCAG AA.
- **RUX-005**: Empty states e erros de sincronização DEVEM ser tratados de forma graceful, com orientação acionável ao usuário.
- **RUX-006**: Textos da interface DEVEM estar em português (pt-BR).

### Requisitos Não Funcionais

- **RNF-001**: A feature DEVE seguir a stack canônica de gráficos (recharts) e componentes UI existentes conforme Constituição de Engenharia.
- **RNF-002**: Todos os fluxos do dashboard (acesso, KPIs, gráficos, conteúdo, audiência, comparação, sync status, isolamento tenant) DEVEM ser cobertos por testes unitários, de integração e de autorização conforme a Constituição de Engenharia.
- **RNF-003**: Alterações de período NÃO DEVEM causar bloqueio perceptível da interface além de feedback de carregamento breve em condições normais de rede.

### Tratamento de Erros

- **TE-001**: Ausência de integração Instagram DEVE resultar em empty state com CTA de conexão, não em erro genérico.
- **TE-002**: Falha de sincronização DEVE preservar dados anteriores, registrar falha internamente e exibir notificação acionável ao usuário.
- **TE-003**: Métricas indisponíveis pela API DEVEM ser tratadas como indisponíveis, nunca como zero.
- **TE-004**: Período sem dados suficientes DEVE exibir empty state contextual, não erro 500.
- **TE-005**: Tentativas cross-tenant DEVEM retornar acesso negado sem vazamento de existência de dados.

### Key Entities

- **Snapshot de Métrica de Conta**: Valor pontual ou agregado de uma métrica de conta em um instante ou intervalo. Atributos relevantes: tipo de métrica, valor, período de referência, granularidade (dia/semana/mês), `tenant_id`, integração associada, timestamp de coleta. Relacionamento: pertence a uma integração Instagram e tenant.
- **Série Temporal de Métrica**: Sequência ordenada de snapshots para visualização em gráficos. Atributos relevantes: tipo de métrica, pontos `(data, valor)`, período coberto, `tenant_id`. Relacionamento: derivada de snapshots de métrica de conta ou conteúdo.
- **Métricas de Mídia**: Métricas de desempenho associadas a uma publicação. Atributos relevantes: identificador da mídia, curtidas, comentários, compartilhamentos, salvamentos, visualizações, alcance, impressões, engajamento, taxa de engajamento, período de referência, `tenant_id`. Relacionamento: pertence a um registro de mídia Instagram e tenant.
- **Snapshot Demográfico de Audiência**: Distribuição demográfica e comportamental da audiência. Atributos relevantes: dimensão (idade, gênero, país, cidade, hora, dia), segmento, valor ou percentual, período de referência, `tenant_id`. Relacionamento: pertence a uma integração Instagram e tenant.
- **Seleção de Período do Dashboard**: Preferência de intervalo analítico na sessão. Atributos relevantes: preset (7d, 30d, 90d, 6m, 12m), flag de comparação com período anterior, timestamps de início/fim derivados. Relacionamento: escopo da sessão do usuário (estado client-side ou query params).

## Success Criteria _(obrigatório)_

### Resultados Mensuráveis

- **SC-001**: 100% das tentativas de acesso ao dashboard por usuários não autenticados ou com conta não `ACTIVE` são bloqueadas.
- **SC-002**: 100% das consultas de analytics retornam exclusivamente dados do tenant do usuário autenticado.
- **SC-003**: Usuários com integração conectada e sync concluída visualizam KPIs com valores da última sincronização em 100% dos acessos bem-sucedidos ao dashboard.
- **SC-004**: Usuários sem integração veem empty state com CTA de conexão em 100% dos acessos, sem erro não tratado.
- **SC-005**: Alteração de intervalo de datas atualiza KPIs e gráficos em até 3 segundos em condições normais de rede e volume de dados esperado.
- **SC-006**: Gráficos históricos refletem dados persistidos de múltiplas sincronizações, verificável por testes de integração com fixtures temporais.
- **SC-007**: Seção de conteúdo exibe métricas por publicação para 100% das mídias sincronizadas com dados disponíveis na API.
- **SC-008**: Ordenação de conteúdo por cada critério suportado produz ordem correta em 100% dos casos de teste automatizados.
- **SC-009**: Status de sincronização, timestamp da última sync e indicador de frescor são visíveis em 100% dos acessos com integração existente.
- **SC-010**: Nenhum token OAuth ou credencial Meta é exposto em respostas de API, HTML renderizado ou bundles client-side.
- **SC-011**: Falhas de sincronização exibem notificação ao usuário preservando dados históricos em 100% dos cenários de teste simulados.
- **SC-012**: Todos os fluxos do dashboard possuem cobertura de testes unitários, de integração e de autorização antes da entrega.

## Assumptions

- A infraestrutura de conexão OAuth, sincronização inicial e persistência base de integração/mídia está implementada ou em implementação pela feature 003.
- Esta feature estende o dashboard existente (`/dashboard` com aba/foco Instagram) substituindo dados mock (`lib/connex-data.ts`) por dados reais sincronizados.
- Novas tabelas ou estruturas para séries temporais de métricas, métricas por mídia e snapshots demográficos serão definidas no planejamento técnico (`data-model.md`); a feature 003 cobre integração, credenciais, mídia base e jobs de sync.
- Gráficos utilizarão **recharts**, conforme stack canônica; componentes existentes em `components/dashboard/` serão evoluídos ou reutilizados quando aplicável.
- Intervalos de 6 e 12 meses dependem de retenção e granularidade dos dados sincronizados; lacunas serão indicadas na UI em vez de interpoladas.
- Comparação entre períodos utiliza o período imediatamente anterior de mesma duração (ex.: últimos 30 dias vs. 30 dias anteriores).
- Sincronização automática periódica é responsabilidade da feature 003; este dashboard consome dados já sincronizados e exibe status/frescor.
- Apenas a rede Instagram está no escopo deste dashboard; abas de outras redes permanecem mock ou ocultas até features futuras.
- Permissões de acesso seguem papéis do tenant (`MEMBER`, `TENANT_ADMIN`, `PLATFORM_ADMIN`) com visualização permitida a todos os papéis autenticados do tenant; restrições granulares por papel serão detalhadas no planejamento se necessário.
- Textos de interface permanecem em português (pt-BR), conforme Constituição de Engenharia.

## Conformidade com a Constituição

Esta especificação atende aos seguintes princípios de `.speckit/CONSTITUTION.md`:

| Princípio | Como esta feature satisfaz |
|-----------|---------------------------|
| **1 — Qualidade de Código** | Domínio analítico separado (consultas, agregações, apresentação) com responsabilidades testáveis e funções focadas. |
| **2 — Segurança de Tipos** | Métricas, períodos, status de sync e entidades analíticas como tipos/enums dedicados em `types/`. |
| **3 — Padrões de Testes** | RNF-002 e SC-012 exigem testes unitários, de integração e de autorização (Vitest + Testing Library + Playwright quando aplicável). |
| **4 — Consistência de UX** | Reutilização de `components/ui/` e `components/dashboard/`; skeletons, empty states, pt-BR, WCAG AA. |
| **5 — Performance** | SC-005 define expectativa de tempo; carregamento progressivo e paginação de conteúdo evitam bloqueio. |
| **6 — Manutenibilidade** | Domínio isolado (`lib/instagram/analytics/` ou equivalente); consumo server-side de dados; sem tokens no cliente. |

**Exceções documentadas**: Nenhuma exceção à constituição é necessária para esta feature.

## Out of Scope

- Conexão, reconexão e desconexão de conta Instagram (feature 003).
- Pipeline de sincronização e jobs de importação (feature 003); este escopo consome e exibe dados sincronizados.
- Período personalizado (custom date range) — suporte futuro explícito.
- Sincronização manual sob demanda pelo usuário.
- Exportação de relatórios (PDF, CSV).
- Insights gerados por IA (`AiInsights` mock permanece out of scope ou feature futura separada).
- Analytics de redes sociais além do Instagram (Facebook, TikTok, etc.).
- Publicação de conteúdo ou ações de escrita na Meta.
- Notificações por e-mail de falha de sincronização.
- Backoffice administrativo cross-tenant.
- Alertas configuráveis ou metas de KPI.
- Exclusão explícita de dados históricos pelo usuário.
