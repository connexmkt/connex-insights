# Especificação de Feature: Integração Instagram e Sincronização de Insights

**Branch da Feature**: `003-instagram-account-connection`  
**Criada em**: 2026-07-06  
**Status**: Rascunho  
**Entrada**: Usuários autenticados com conta **Active** devem conectar conta Instagram Professional via OAuth oficial da Meta, sincronizar Insights automaticamente e visualizá-los no dashboard.  
**Depende de**: [001-user-auth](../001-user-auth/spec.md), [002-first-time-account-activation](../002-first-time-account-activation/spec.md) — apenas usuários com `status = ACTIVE` e sessão de aplicação válida podem acessar esta feature.

## User Scenarios & Testing _(obrigatório)_

### User Story 1 — Conectar conta Instagram Professional (Prioridade: P1)

Como usuário autenticado com conta ativa, quero conectar minha conta Instagram Professional pelo fluxo oficial de autenticação da Meta para autorizar o acesso seguro aos meus Insights.

**Por que esta prioridade**: Sem conexão OAuth bem-sucedida, nenhuma métrica pode ser coletada. É o pré-requisito de toda a feature.

**Teste independente**: Pode ser testado acessando a área de integrações (ou dashboard), clicando em "Conectar Instagram", completando o fluxo OAuth da Meta com uma conta Business ou Creator, e verificando que a integração fica associada ao tenant correto com status **Conectado**.

**Cenários de aceitação**:

1. **Dado** que sou um usuário autenticado com conta `ACTIVE` e tenant válido, **Quando** clico em "Conectar Instagram", **Então** sou redirecionado à página oficial de autorização OAuth da Meta.
2. **Dado** que estou na página de autorização da Meta, **Quando** autentico-me e seleciono uma conta Instagram Professional (Business ou Creator) autorizando as permissões solicitadas, **Então** sou redirecionado de volta à aplicação com a integração registrada e status **Conectado**.
3. **Dado** que concluí a autorização com sucesso, **Quando** a aplicação processa o retorno, **Então** as credenciais de acesso são armazenadas de forma segura no servidor, a conta Instagram é associada ao meu tenant e o perfil público da conta é recuperado.
4. **Dado** que concluí a autorização com sucesso, **Quando** o processamento termina, **Então** sou redirecionado ao Dashboard de Insights do Instagram.
5. **Dado** que meu tenant já possui uma conta Instagram conectada, **Quando** tento iniciar uma nova conexão para outra conta, **Então** o sistema impede conexão duplicada e informo que apenas uma conta por tenant é permitida.
6. **Dado** que não estou autenticado ou minha conta não está `ACTIVE`, **Quando** tento iniciar a conexão Instagram, **Então** o fluxo é bloqueado e sou orientado a autenticar-me ou concluir a ativação da conta.

---

### User Story 2 — Sincronização inicial de Insights (Prioridade: P1)

Como usuário que acabou de conectar minha conta Instagram, quero que a plataforma importe automaticamente todas as métricas disponíveis para que eu possa visualizar meus dados sem ação manual adicional.

**Por que esta prioridade**: A conexão só entrega valor quando os Insights são sincronizados e disponibilizados no dashboard.

**Teste independente**: Pode ser testado após uma conexão OAuth bem-sucedida, observando o estado de sincronização na interface, aguardando a conclusão do job inicial e verificando que métricas aparecem no dashboard.

**Cenários de aceitação**:

1. **Dado** que acabei de conectar minha conta Instagram com sucesso, **Quando** retorno à aplicação, **Então** a sincronização inicial é iniciada automaticamente sem exigir ação adicional do usuário.
2. **Dado** que a sincronização inicial está em andamento, **Quando** visualizo o dashboard, **Então** vejo um estado de carregamento ou sincronização informando que as métricas estão sendo importadas.
3. **Dado** que a sincronização inicial está em andamento, **Quando** a importação é concluída com sucesso, **Então** o dashboard é atualizado automaticamente com os dados sincronizados.
4. **Dado** que a sincronização inicial está em andamento, **Quando** consulto o status da integração, **Então** vejo o status de sincronização atual e a data/hora da última sincronização bem-sucedida (quando aplicável).
5. **Dado** que a API da Meta disponibiliza métricas para minha conta, **Quando** a sincronização inicial conclui, **Então** todas as métricas suportadas pela Instagram Graph API para o escopo autorizado são importadas.

---

### User Story 3 — Visualizar Insights no dashboard (Prioridade: P1)

Como usuário com conta Instagram conectada e sincronizada, quero visualizar meus Insights no dashboard para acompanhar o desempenho da minha conta.

**Por que esta prioridade**: É o resultado principal da feature — transformar dados da Meta em informação acionável para o usuário.

**Teste independente**: Pode ser testado acessando o dashboard Instagram com uma integração **Conectada** e sincronização concluída, verificando a exibição de perfil, métricas de conta, desempenho de conteúdo e indicadores de status.

**Cenários de aceitação**:

1. **Dado** que possuo integração **Conectada** com sincronização concluída, **Quando** acesso o dashboard de Insights do Instagram, **Então** vejo informações da conta incluindo foto de perfil e nome de usuário (@username).
2. **Dado** que possuo dados sincronizados, **Quando** visualizo o dashboard, **Então** vejo as métricas disponíveis pela API, incluindo quando aplicável: seguidores, contas alcançadas, contas engajadas, visitas ao perfil, impressões, desempenho de conteúdo e métricas de audiência.
3. **Dado** que possuo integração Instagram, **Quando** visualizo o dashboard, **Então** vejo claramente o status da conexão, a data/hora da última sincronização e o status atual da sincronização.
4. **Dado** que uma métrica específica não está disponível pela API para minha conta ou período, **Quando** visualizo o dashboard, **Então** a interface indica indisponibilidade de forma clara, sem exibir dados incorretos ou inventados.
5. **Dado** que pertenço ao tenant A, **Quando** acesso o dashboard, **Então** vejo exclusivamente dados da integração Instagram associada ao tenant A.

---

### User Story 4 — Reconectar conta quando autorização expira (Prioridade: P2)

Como usuário com integração Instagram cuja autorização expirou ou foi revogada, quero ser notificado e reconectar minha conta para retomar a sincronização sem perder o histórico já importado.

**Por que esta prioridade**: Garante continuidade operacional e recuperação graceful de falhas de token, preservando valor dos dados históricos.

**Teste independente**: Pode ser testado simulando token expirado ou revogado, verificando mudança de status para **Requer reconexão**, exibição de notificação ao usuário e fluxo de reconexão que reutiliza o registro existente sem duplicar integração.

**Cenários de aceitação**:

1. **Dado** que minha autorização OAuth expirou ou foi revogada, **Quando** o sistema detecta a falha (durante sincronização ou validação de token), **Então** a integração é marcada como **Requer reconexão**.
2. **Dado** que minha integração requer reconexão, **Quando** acesso o dashboard ou área de integrações, **Então** vejo notificação clara informando o problema e a ação recomendada (reconectar).
3. **Dado** que minha integração requer reconexão, **Quando** visualizo o dashboard, **Então** os dados históricos previamente sincronizados permanecem disponíveis sempre que possível.
4. **Dado** que minha integração requer reconexão, **Quando** clico em reconectar e completo o fluxo OAuth novamente, **Então** a mesma integração é atualizada (sem registro duplicado) e a sincronização é retomada.
5. **Dado** que reconectei com sucesso, **Quando** a sincronização retoma, **Então** o status da integração volta a **Conectado**.

---

### User Story 5 — Desconectar conta Instagram (Prioridade: P2)

Como usuário com conta Instagram conectada, quero desconectar minha conta quando desejar, interrompendo futuras sincronizações mas mantendo acesso ao histórico já importado.

**Por que esta prioridade**: Dá controle ao usuário sobre seus dados e conformidade com revogação de consentimento, complementando o fluxo de conexão.

**Teste independente**: Pode ser testado a partir da área de integrações ou configurações, acionando "Desconectar", confirmando a ação e verificando que sincronizações futuras cessam, status muda para **Desconectado** e dados históricos permanecem visíveis.

**Cenários de aceitação**:

1. **Dado** que possuo integração Instagram **Conectada**, **Quando** escolho desconectar e confirmo a ação, **Então** a integração passa ao status **Desconectado**.
2. **Dado** que desconectei minha conta, **Quando** o sistema processa a desconexão, **Então** futuras sincronizações são interrompidas e tokens de acesso deixam de ser utilizados.
3. **Dado** que desconectei minha conta, **Quando** acesso o dashboard, **Então** os dados históricos previamente sincronizados permanecem disponíveis, salvo política futura de exclusão explícita.
4. **Dado** que desconectei minha conta, **Quando** visualizo a área de integrações, **Então** vejo opção para reconectar via fluxo OAuth oficial.
5. **Dado** que desconectei e posteriormente reconecto, **Quando** completo o fluxo OAuth, **Então** não é criada integração duplicada para o mesmo tenant.

---

### Edge Cases

- O que acontece quando o usuário cancela a autorização na página da Meta? → Retorno à aplicação sem alteração de estado; mensagem clara de que a conexão não foi concluída; integração existente (se houver) permanece inalterada.
- Como o sistema trata negação explícita de permissões na Meta? → Conexão não é estabelecida; mensagem informando permissões insuficientes e orientando a autorizar os escopos necessários.
- O que acontece quando o usuário tenta conectar conta Instagram pessoal (não Professional)? → Conexão rejeitada com mensagem clara de que apenas contas Business ou Creator são suportadas.
- Como o sistema responde a falha da API da Meta durante sincronização? → Status de sincronização indica falha; dados parciais já importados são preservados; usuário recebe feedback não técnico com opção de tentar novamente.
- O que acontece em interrupção de rede durante OAuth ou sincronização? → Operação pode ser retomada ou repetida sem corromper estado; usuário informado de falha temporária.
- Como tratar tentativa de acesso cross-tenant a integração ou métricas? → Acesso negado em todas as camadas (API, queries, RLS); nenhum dado de outro tenant é exposto.
- O que acontece se dois usuários do mesmo tenant tentam conectar simultaneamente? → Apenas uma integração por tenant é permitida; segunda tentativa bem-sucedida deve falhar ou exigir desconexão prévia (comportamento consistente documentado no planejamento).
- Como o sistema se comporta quando o usuário clica em "Conectar Instagram" durante sincronização em andamento? → Ação bloqueada ou ignorada com feedback adequado; não inicia fluxo OAuth duplicado.

## Requirements _(obrigatório)_

### Requisitos Funcionais

#### Acesso e elegibilidade

- **FR-001**: Apenas usuários autenticados com conta `ACTIVE` DEVEM poder iniciar conexão Instagram.
- **FR-002**: O usuário DEVE pertencer a um tenant válido; o contexto de tenant DEVE ser resolvido no servidor, nunca informado pelo cliente.
- **FR-003**: Apenas uma conta Instagram DEVE poder estar conectada por tenant, salvo especificação futura que defina suporte a múltiplas contas.
- **FR-004**: Usuários `INACTIVE`, `SUSPENDED` ou não autenticados NÃO DEVEM acessar fluxos de conexão, sincronização ou visualização de Insights Instagram.

#### Fluxo de conexão

- **FR-005**: O sistema DEVE disponibilizar ação "Conectar Instagram" na interface (dashboard e/ou configurações de integrações).
- **FR-006**: Ao iniciar conexão, o sistema DEVE redirecionar o usuário à página oficial de autorização OAuth da Meta.
- **FR-007**: O fluxo OAuth DEVE solicitar apenas as permissões mínimas necessárias para leitura de perfil e Insights Instagram (conforme escopos documentados na política de privacidade da plataforma).
- **FR-008**: O fluxo DEVE permitir autenticação na Meta e seleção da conta Instagram Professional a autorizar.
- **FR-009**: Após autorização, o sistema DEVE redirecionar o usuário de volta à aplicação via callback seguro.

#### Pós-autorização bem-sucedida

- **FR-010**: O sistema DEVE validar a resposta de autorização (state, código, integridade do callback).
- **FR-011**: Credenciais de acesso (tokens) DEVEM ser armazenadas de forma segura no servidor, nunca expostas ao frontend.
- **FR-012**: A conta Instagram autorizada DEVE ser associada ao tenant do usuário autenticado.
- **FR-013**: O sistema DEVE recuperar informações do perfil público da conta conectada (incluindo username e foto de perfil).
- **FR-014**: O sistema DEVE iniciar sincronização inicial de Insights imediatamente após conexão bem-sucedida.
- **FR-015**: O status da integração DEVE ser definido como **Conectado** após processamento bem-sucedido.
- **FR-016**: Após conexão bem-sucedida, o usuário DEVE ser redirecionado ao Dashboard de Insights do Instagram.

#### Sincronização

- **FR-017**: A sincronização inicial DEVE importar todas as métricas suportadas pela Instagram Graph API dentro do escopo autorizado.
- **FR-018**: Durante sincronização, a interface DEVE exibir estado de carregamento ou sincronização informando que métricas estão sendo importadas.
- **FR-019**: Ao concluir sincronização, o dashboard DEVE ser atualizado automaticamente com os dados importados.
- **FR-020**: O sistema DEVE registrar data e hora da última sincronização bem-sucedida.
- **FR-021**: O sistema DEVE expor status de sincronização (ex.: em andamento, concluída, falhou).
- **FR-022**: Renovação de tokens de acesso DEVE ocorrer exclusivamente no servidor.

#### Dashboard de Insights

- **FR-023**: O dashboard DEVE exibir informações da conta conectada: foto de perfil, username e status da conexão.
- **FR-024**: O dashboard DEVE exibir métricas disponíveis pela API, incluindo quando aplicável: seguidores, contas alcançadas, contas engajadas, visitas ao perfil, impressões, desempenho de conteúdo e métricas de audiência.
- **FR-025**: O dashboard DEVE exibir data/hora da última sincronização e status atual da sincronização.
- **FR-026**: Métricas indisponíveis pela API NÃO DEVEM ser exibidas com valores fictícios; a interface DEVE indicar indisponibilidade de forma clara.

#### Reconexão

- **FR-027**: Quando autorização expirar ou for invalidada, o sistema DEVE marcar a integração como **Requer reconexão**.
- **FR-028**: O sistema DEVE notificar o usuário quando reconexão for necessária.
- **FR-029**: Dados históricos previamente sincronizados DEVEM ser preservados durante estado de reconexão, sempre que possível.
- **FR-030**: A reconexão DEVE atualizar a integração existente sem criar registro duplicado para o mesmo tenant.

#### Desconexão

- **FR-031**: O usuário DEVE poder desconectar a conta Instagram a qualquer momento.
- **FR-032**: Após desconexão, futuras sincronizações DEVEM cessar imediatamente.
- **FR-033**: Após desconexão, o status da integração DEVE ser **Desconectado**.
- **FR-034**: Dados históricos sincronizados DEVEM permanecer disponíveis após desconexão, salvo especificação futura de exclusão explícita.

### Regras de Negócio

- **RN-001**: Apenas contas Instagram Professional (Business ou Creator) são suportadas; contas pessoais NÃO podem ser conectadas.
- **RN-002**: Apenas o fluxo OAuth oficial da Meta pode ser utilizado para autenticação e autorização.
- **RN-003**: Apenas permissões estritamente necessárias para leitura de perfil e Insights podem ser solicitadas.
- **RN-004**: Não é permitida conexão duplicada de Instagram para o mesmo tenant.
- **RN-005**: Dados obtidos via Meta DEVEM ser utilizados exclusivamente para exibir métricas ao titular da conta conectada, em conformidade com a política de privacidade da plataforma.
- **RN-006**: Credenciais de API da Meta (App ID, App Secret) NÃO DEVEM ser expostas em código client-side.

### Requisitos de Segurança

- **RS-001**: Tokens OAuth NUNCA DEVEM ser expostos ao frontend, logs públicos ou respostas de API ao cliente.
- **RS-002**: Tokens DEVEM ser armazenados de forma segura e criptografada no servidor.
- **RS-003**: Operações de refresh de token DEVEM ocorrer exclusivamente server-side.
- **RS-004**: Callback OAuth DEVE validar parâmetro `state` para prevenir CSRF.
- **RS-005**: Nenhum endpoint DEVE aceitar `tenantId` ou identificadores de integração do cliente sem validação de ownership.
- **RS-006**: Mensagens de erro DEVEM ser não técnicas para o usuário e não revelar tokens, stack traces ou estados internos sensíveis.

### Requisitos Multi-Tenant

- **RT-001**: Toda integração Instagram DEVE pertencer a exatamente um tenant.
- **RT-002**: Usuários DEVEM visualizar e gerenciar apenas integrações do próprio tenant.
- **RT-003**: Jobs de sincronização DEVEM executar no contexto do tenant autenticado/autorizado.
- **RT-004**: Acesso cross-tenant é estritamente proibido em conexão, sincronização, consulta e desconexão.
- **RT-005**: Queries de dados DEVEM filtrar por `tenant_id`; RLS deve reforçar isolamento na camada de banco.

### Requisitos Não Funcionais

- **RNF-001**: Interface de conexão, sincronização e dashboard DEVE ser responsiva, acessível via teclado e com textos em português (pt-BR).
- **RNF-002**: Estados de carregamento e sincronização DEVEM ser perceptíveis ao usuário (feedback visual e textual).
- **RNF-003**: A feature DEVE seguir práticas de segurança reconhecidas para OAuth e armazenamento de tokens.
- **RNF-004**: Todos os fluxos (conexão, callback, sincronização, dashboard, reconexão, desconexão, isolamento de tenant) DEVEM ser cobertos por testes unitários, de integração e de autorização conforme a Constituição de Engenharia.

### Tratamento de Erros

- **TE-001**: Cancelamento de autorização pelo usuário DEVE resultar em retorno seguro à aplicação com mensagem clara de conexão não concluída.
- **TE-002**: Autorização negada DEVE informar permissões insuficientes e orientar nova tentativa.
- **TE-003**: Conta Instagram não Professional DEVE ser rejeitada com mensagem específica sobre tipo de conta não suportado.
- **TE-004**: Token expirado ou revogado DEVE acionar fluxo de reconexão (FR-027 a FR-030).
- **TE-005**: Falhas da API Meta ou de sincronização DEVEM preservar dados parciais, registrar falha internamente e exibir feedback acionável ao usuário.
- **TE-006**: Interrupções de rede DEVEM ser tratadas como falhas recuperáveis, com possibilidade de retry.

### Key Entities

- **Integração Instagram**: Representa a conexão OAuth entre um tenant e uma conta Instagram Professional. Atributos relevantes: identificador único, `tenant_id`, identificador externo da conta Instagram, username, tipo de conta (Business/Creator), status (`CONECTADO` | `DESCONECTADO` | `REQUER_RECONEXAO`), data da última sincronização, status de sincronização (`EM_ANDAMENTO` | `CONCLUIDA` | `FALHOU`), timestamps de criação/atualização. Relacionamento: pertence a exatamente um tenant.
- **Credencial OAuth**: Tokens de acesso e refresh associados à integração. Atributos relevantes: identificador, integração associada, token criptografado, data de expiração, escopos concedidos. Relacionamento: pertence a uma integração Instagram. **Nunca exposto ao cliente.**
- **Snapshot de Perfil Instagram**: Dados públicos do perfil no momento da sincronização. Atributos relevantes: foto de perfil (URL ou referência), username, seguidores, biografia (quando disponível). Relacionamento: associado à integração.
- **Métrica Instagram**: Valor sincronizado de uma métrica da Instagram Graph API. Atributos relevantes: tipo de métrica, valor, período de referência, data de coleta, `tenant_id`, integração associada. Relacionamento: pertence a uma integração e tenant.
- **Job de Sincronização**: Execução de importação de métricas. Atributos relevantes: identificador, integração associada, tipo (inicial, incremental, manual futuro), status, início, fim, mensagem de erro (interna). Relacionamento: pertence a uma integração.

## Success Criteria _(obrigatório)_

### Resultados Mensuráveis

- **SC-001**: 100% das tentativas de conexão por usuários não autenticados ou com conta não `ACTIVE` são bloqueadas.
- **SC-002**: Usuários com conta `ACTIVE` conseguem iniciar o fluxo OAuth e retornar à aplicação em até 60 segundos após autorização na Meta (em condições normais de rede).
- **SC-003**: 100% das integrações bem-sucedidas são associadas ao tenant correto do usuário autenticado.
- **SC-004**: Sincronização inicial é iniciada automaticamente em 100% das conexões bem-sucedidas, sem ação manual do usuário.
- **SC-005**: Usuários visualizam estado de sincronização e data da última sincronização em 100% dos acessos ao dashboard com integração existente.
- **SC-006**: 100% das tentativas de acesso a integrações ou métricas de outro tenant são negadas.
- **SC-007**: Nenhum token OAuth é exposto em respostas de API, HTML renderizado ou bundles client-side (verificável por testes de autorização).
- **SC-008**: Usuários conseguem desconectar e reconectar sem criar integração duplicada para o mesmo tenant.
- **SC-009**: Dados históricos permanecem acessíveis após desconexão, conforme RN-005 e política de retenção vigente.
- **SC-010**: Todos os fluxos da feature possuem cobertura de testes unitários, de integração e de autorização antes da entrega.

## Assumptions

- Credenciais da Meta (App ID, App Secret) serão configuradas como variáveis de ambiente server-side pela equipe de engenharia.
- Os escopos OAuth mínimos estão alinhados à política de privacidade existente (`instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`, `pages_show_list`); escopos adicionais exigem revisão de compliance.
- A Instagram Graph API é a fonte autoritativa de métricas; métricas indisponíveis para determinada conta ou período são exibidas como indisponíveis, não estimadas.
- Sincronizações periódicas automáticas (após a inicial) podem ser definidas no planejamento técnico; esta especificação exige sincronização inicial automática e infraestrutura para jobs de sincronização.
- O dashboard Instagram existente (`/dashboard` com aba Instagram) será evoluído para consumir dados reais em substituição aos mocks atuais (`lib/connex-data.ts`).
- A ação "Conectar Instagram" estará disponível na página de configurações (`/dashboard/configuracoes`) e/ou no dashboard principal; localização final será confirmada no planejamento.
- Retenção de dados históricos segue a política de privacidade da plataforma (até 90 dias para métricas Meta); exclusão antecipada é out of scope desta feature.
- Textos de interface permanecem em português (pt-BR), conforme Constituição de Engenharia.
- Apenas usuários com papel `MEMBER`, `TENANT_ADMIN` ou `PLATFORM_ADMIN` do tenant podem gerenciar integrações; permissões granulares por papel serão detalhadas no planejamento se necessário.

## Conformidade com a Constituição

Esta especificação atende aos seguintes princípios de `.speckit/CONSTITUTION.md`:

| Princípio | Como esta feature satisfaz |
|-----------|---------------------------|
| **1 — Qualidade de Código** | Fluxos delimitados (OAuth, sync, dashboard, reconexão, desconexão) com responsabilidades separadas e testáveis. |
| **2 — Segurança de Tipos** | Status de integração e sincronização como enums tipados; entidades com tipos dedicados em `types/`. |
| **3 — Padrões de Testes** | RNF-004 e SC-010 exigem testes unitários, de integração e de autorização (Vitest + Testing Library + Playwright quando aplicável). |
| **4 — Consistência de UX** | Reutilização de componentes existentes (`components/ui/`, `components/dashboard/`), HTML semântico, pt-BR, acessibilidade WCAG AA. |
| **5 — Performance** | SC-002 define expectativa de tempo perceptível; sincronização assíncrona evita bloqueio da interface. |
| **6 — Manutenibilidade** | Domínio isolado (`lib/instagram/`, `components/instagram/` ou equivalente); sem exposição de tokens ao cliente. |

**Exceções documentadas**: Nenhuma exceção à constituição é necessária para esta feature.

## Out of Scope

- Conexão de múltiplas contas Instagram por tenant.
- Conexão de redes sociais além do Instagram (Facebook, TikTok, etc.).
- Publicação de conteúdo, envio de mensagens ou ações de escrita na Meta.
- Sincronização manual sob demanda pelo usuário (pode ser feature futura).
- Agendamento configurável de frequência de sincronização pelo usuário.
- Exportação de relatórios (PDF, CSV).
- Exclusão explícita de dados históricos pelo usuário.
- Integração via Windsor.ai ou conectores terceiros (usa Meta OAuth direto).
- Backoffice administrativo para gerenciar integrações cross-tenant.
- Notificações por e-mail de falha de sincronização ou expiração de token.
