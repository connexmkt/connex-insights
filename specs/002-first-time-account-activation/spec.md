# Especificação de Feature: Ativação de Conta no Primeiro Acesso

**Branch da Feature**: `002-first-time-account-activation`  
**Criada em**: 2026-06-27  
**Status**: Rascunho  
**Entrada**: Fluxo obrigatório de ativação de conta para usuários recém-cadastrados com senha temporária.  
**Depende de**: [001-user-auth](../001-user-auth/spec.md) — esta feature **altera** o comportamento de login e gestão de sessão definido na feature de autenticação base.

## Nota de atualização (2026-07-22)

Ver [`001-user-auth/spec.md` § Nota de atualização](../001-user-auth/spec.md#nota-de-atualização-2026-07-22): o identificador informado na página de login (usado tanto para login inicial com senha temporária quanto para login normal) passou de e-mail para `login` (`profiles.login`). O comportamento desta feature (login `INACTIVE` → sessão de pré-ativação → `/ativar-conta`) permanece inalterado — apenas o campo usado para identificar a conta na etapa de login mudou; a validação da senha temporária em `POST /api/auth/activate` continua usando o e-mail resolvido internamente a partir da sessão, sem impacto.

## User Scenarios & Testing _(obrigatório)_

### User Story 1 — Login inicial com credenciais temporárias (Prioridade: P1)

Como usuário recém-cadastrado, quero autenticar-me com o e-mail e a senha temporária fornecidos pela equipe da Connex para iniciar a ativação da minha conta.

**Por que esta prioridade**: É o ponto de entrada obrigatório para qualquer conta nova. Sem este fluxo, o usuário não consegue chegar à ativação nem tornar a conta utilizável.

**Teste independente**: Pode ser testado criando um usuário com status `INACTIVE` e senha temporária, acessando a página de login, informando as credenciais e verificando redirecionamento à página de ativação — sem acesso ao dashboard.

**Cenários de aceitação**:

1. **Dado** que possuo uma conta com status `INACTIVE` e credenciais temporárias válidas, **Quando** informo e-mail e senha temporária na página de login e clico em "Entrar", **Então** sou redirecionado à página de Ativação de Conta e **não** tenho acesso ao dashboard.
2. **Dado** que possuo uma conta com status `INACTIVE`, **Quando** informo credenciais inválidas na página de login, **Então** permaneço na página de login e vejo mensagem de erro genérica (sem revelar qual campo está incorreto).
3. **Dado** que possuo uma conta com status `ACTIVE` e credenciais válidas, **Quando** faço login, **Então** minha sessão de aplicação é criada e sou redirecionado ao dashboard (comportamento inalterado para contas já ativas).
4. **Dado** que estou na página de login, **Quando** tento enviar o formulário sem preencher e-mail ou senha, **Então** o envio é bloqueado e os campos obrigatórios são indicados.

---

### User Story 2 — Conclusão da ativação de conta (Prioridade: P1)

Como usuário recém-autenticado com conta inativa, quero validar minha senha temporária e definir uma nova senha pessoal para que minha conta se torne ativa e eu possa acessar a plataforma com segurança.

**Por que esta prioridade**: É o núcleo do valor desta feature — transformar uma conta provisionada em uma conta ativa e segura, de propriedade do usuário.

**Teste independente**: Pode ser testado a partir do estado pós-login de um usuário `INACTIVE`, preenchendo o formulário de ativação com senha temporária correta e nova senha válida, e verificando mudança de status para `ACTIVE`, invalidação da senha temporária e redirecionamento ao dashboard.

**Cenários de aceitação**:

1. **Dado** que fui redirecionado à página de ativação após login com credenciais temporárias válidas, **Quando** informo a senha temporária correta, uma nova senha que atende à política do projeto e a confirmação idêntica, e clico em "Confirmar", **Então** minha senha é atualizada, minha conta passa a `ACTIVE`, a senha temporária deixa de ser válida, minha sessão de aplicação é criada e sou redirecionado ao dashboard.
2. **Dado** que estou na página de ativação, **Quando** deixo qualquer campo em branco e tento confirmar, **Então** o envio é bloqueado e os campos obrigatórios são indicados.
3. **Dado** que estou na página de ativação, **Quando** informo uma senha temporária que não corresponde à senha atual da conta, **Então** vejo mensagem de erro apropriada e a conta permanece `INACTIVE`.
4. **Dado** que estou na página de ativação, **Quando** informo nova senha e confirmação que não coincidem, **Então** vejo mensagem de erro de validação e a conta permanece `INACTIVE`.
5. **Dado** que estou na página de ativação, **Quando** informo uma nova senha que não atende à política de senhas do projeto, **Então** vejo feedback de validação com os critérios não atendidos e a conta permanece `INACTIVE`.
6. **Dado** que estou na página de ativação, **Quando** informo uma nova senha idêntica à senha temporária, **Então** vejo mensagem de erro indicando que a nova senha deve ser diferente da temporária e a conta permanece `INACTIVE`.
7. **Dado** que minha conta já está `ACTIVE`, **Quando** tento acessar a página de ativação, **Então** sou redirecionado ao dashboard (o fluxo de ativação não pode ser repetido).

---

### User Story 3 — Proteção de rotas e prevenção de bypass (Prioridade: P2)

Como administrador da plataforma, quero que usuários com contas inativas nunca acessem páginas protegidas, para garantir que a ativação seja concluída antes de qualquer uso do produto.

**Por que esta prioridade**: Garante a integridade do ciclo de vida da conta e impede acesso não autorizado mesmo que o usuário tente contornar o fluxo por URL direta.

**Teste independente**: Pode ser testado autenticando um usuário `INACTIVE` (sessão de pré-ativação) e tentando acessar diretamente `/dashboard` ou outras rotas protegidas, verificando redirecionamento à ativação ou bloqueio.

**Cenários de aceitação**:

1. **Dado** que possuo sessão de pré-ativação (conta `INACTIVE`), **Quando** tento acessar qualquer rota protegida do dashboard diretamente pela URL, **Então** sou redirecionado à página de ativação de conta.
2. **Dado** que não possuo nenhuma sessão autenticada, **Quando** tento acessar a página de ativação diretamente, **Então** sou redirecionado à página de login.
3. **Dado** que possuo sessão de pré-ativação, **Quando** tento acessar a página de login, **Então** sou redirecionado à página de ativação (evitando login duplicado durante ativação pendente).
4. **Dado** que minha conta está `ACTIVE` com sessão de aplicação válida, **Quando** navego entre páginas protegidas, **Então** tenho acesso normal ao dashboard e demais rotas autorizadas.

---

### Edge Cases

- O que acontece quando o usuário submete o formulário de ativação enquanto a validação está em andamento? → O botão de confirmação deve ser desabilitado e exibir estado de carregamento; submissões duplicadas devem ser ignoradas.
- Como o sistema se comporta se o usuário perder a sessão de pré-ativação antes de concluir a ativação? → Redirecionamento ao login; deve autenticar-se novamente com a senha temporária (se ainda válida) para retomar a ativação.
- O que acontece se dois dispositivos tentarem ativar a mesma conta simultaneamente? → Apenas a primeira ativação bem-sucedida deve prevalecer; a segunda deve falhar com mensagem indicando que a conta já está ativa ou que a senha temporária não é mais válida.
- Como tratar conta com status `SUSPENDED` que tenta login? → Autenticação negada com mensagem genérica de acesso não autorizado (fora do fluxo de ativação; comportamento alinhado à feature 001).
- O que acontece se o usuário tentar reutilizar a senha temporária após ativação bem-sucedida? → Login negado com mensagem genérica de credenciais inválidas.
- Como o sistema responde a tentativas repetidas de ativação com senha temporária incorreta? → Mensagem de erro apropriada sem revelar detalhes de implementação; mecanismo de limitação de tentativas aplicado quando configurado.
- O que acontece se um usuário `INACTIVE` solicitar recuperação de senha ("Esqueci minha senha")? → O fluxo de recuperação segue as regras da feature 001; porém, contas `INACTIVE` devem ser orientadas a concluir a ativação com a senha temporária recebida (comportamento exato da mensagem a definir no planejamento, sem bloquear recuperação se política de negócio permitir).

## Requirements _(obrigatório)_

### Requisitos Funcionais

#### Login inicial

- **FR-001**: O sistema DEVE validar e-mail e senha informados na página de login contra o provedor de autenticação autoritativo.
- **FR-002**: Para credenciais válidas e conta com status `ACTIVE`, o sistema DEVE criar sessão de aplicação e redirecionar ao dashboard.
- **FR-003**: Para credenciais válidas e conta com status `INACTIVE`, o sistema DEVE estabelecer sessão de pré-ativação (identidade autenticada limitada) e redirecionar à página de Ativação de Conta.
- **FR-004**: Para credenciais válidas e conta `INACTIVE`, o sistema NÃO DEVE conceder acesso ao dashboard nem criar sessão de aplicação completa.
- **FR-005**: Para credenciais inválidas, o sistema DEVE negar autenticação e exibir mensagem de erro genérica.

#### Página de ativação

- **FR-006**: O sistema DEVE disponibilizar uma página de Ativação de Conta acessível somente a usuários com sessão de pré-ativação (conta `INACTIVE`).
- **FR-007**: A página de ativação DEVE conter os campos: senha temporária, nova senha, confirmação de nova senha e botão "Confirmar".
- **FR-008**: Todos os campos do formulário de ativação DEVEM ser obrigatórios.
- **FR-009**: O sistema DEVE validar no servidor que a senha temporária informada corresponde à senha atual da conta.
- **FR-010**: O sistema DEVE validar no servidor que a nova senha e a confirmação são idênticas.
- **FR-011**: A nova senha DEVE satisfazer a política de senhas do projeto (mínimo 8 caracteres, pelo menos uma letra e pelo menos um número).
- **FR-012**: A nova senha DEVE ser diferente da senha temporária.
- **FR-013**: Após validação bem-sucedida, o sistema DEVE atualizar a senha do usuário no provedor de autenticação.
- **FR-014**: Após validação bem-sucedida, o sistema DEVE alterar o status da conta de `INACTIVE` para `ACTIVE`.
- **FR-015**: Após validação bem-sucedida, a senha temporária DEVE tornar-se imediatamente inválida (não reutilizável para login).
- **FR-016**: Após validação bem-sucedida, o sistema DEVE criar sessão de aplicação completa e redirecionar o usuário ao dashboard.
- **FR-017**: O fluxo de ativação DEVE poder ser concluído exatamente uma vez por conta; tentativas subsequentes por contas já `ACTIVE` DEVEM ser bloqueadas.

#### Status da conta e controle de acesso

- **FR-018**: Todo usuário recém-criado DEVE iniciar com status `INACTIVE`.
- **FR-019**: Usuários `INACTIVE` DEVEM poder autenticar-se exclusivamente para concluir a ativação.
- **FR-020**: Usuários `INACTIVE` NÃO DEVEM acessar páginas ou rotas protegidas da aplicação.
- **FR-021**: Somente usuários `ACTIVE` DEVEM acessar a plataforma (dashboard e rotas protegidas).
- **FR-022**: Nenhum usuário DEVE contornar o fluxo de ativação sob qualquer circunstância (login direto ao dashboard, URL direta, API sem validação de status).

#### Sessão

- **FR-023**: Sessão de aplicação completa (`SessionPayload` / contexto de tenant) DEVE ser estabelecida somente após ativação bem-sucedida (conta `ACTIVE` + senha atualizada).
- **FR-024**: Sessão de pré-ativação DEVE permitir acesso apenas às rotas necessárias para concluir a ativação (página de ativação e endpoints de ativação).
- **FR-025**: Atualização de senha durante a ativação DEVE invalidar tokens de autenticação anteriores associados à senha temporária.

### Regras de Negócio

- **RN-001**: Cadastro de usuários é realizado exclusivamente por administradores ou equipe de suporte da empresa; cadastro público (Sign Up) permanece proibido.
- **RN-002**: Toda conta nova recebe senha temporária no momento da criação.
- **RN-003**: A conta permanece `INACTIVE` até que o usuário conclua o fluxo de ativação.
- **RN-004**: Senhas temporárias são válidas somente até a primeira ativação bem-sucedida.
- **RN-005**: Após a ativação, a senha temporária torna-se inválida imediatamente.
- **RN-006**: O fluxo de ativação é de uso único e não pode ser repetido.
- **RN-007**: Autenticação bem-sucedida por si só não concede acesso à plataforma; apenas contas `ACTIVE` com sessão de aplicação válida têm acesso.

### Requisitos de Segurança

- **RS-001**: Senhas temporárias NUNCA DEVEM ser armazenadas em texto plano; apenas hash seguro no provedor de autenticação.
- **RS-002**: Validação de senha (temporária, nova e confirmação) DEVE ocorrer no servidor; validação no cliente é complementar, não substitutiva.
- **RS-003**: Mensagens de erro sensíveis NÃO DEVEM revelar detalhes de implementação (stack traces, estados internos, existência de outros usuários ou tenants).
- **RS-004**: O processo de ativação DEVE exigir identidade autenticada estabelecida pelas credenciais temporárias (sessão de pré-ativação).
- **RS-005**: Atualização de senha DEVE invalidar tokens de autenticação emitidos antes da troca.

### Requisitos Multi-Tenant

- **RT-001**: O usuário autenticado DEVE pertencer a exatamente um tenant.
- **RT-002**: Durante a ativação, o contexto de tenant DEVE ser resolvido a partir do usuário autenticado (não informado pelo cliente).
- **RT-003**: Usuários DEVEM ativar somente a própria conta; não é permitido ativar contas de terceiros.
- **RT-004**: O fluxo de ativação NÃO DEVE expor informações sobre outros tenants ou usuários.

### Requisitos Não Funcionais

- **RNF-001**: O fluxo de ativação deve seguir práticas de segurança reconhecidas (OWASP ASVS nível aplicável para autenticação e gestão de credenciais).
- **RNF-002**: Interface da página de ativação deve ser responsiva, acessível via teclado e com textos em português (pt-BR).
- **RNF-003**: Formulários devem usar HTML semântico e validação no cliente para campos obrigatórios e critérios de senha.
- **RNF-004**: Todos os fluxos de ativação (login inicial inativo, ativação, proteção de rotas, bypass) DEVEM ser cobertos por testes unitários, de integração e de autenticação conforme a Constituição de Engenharia do projeto.

### Key Entities

- **Usuário / Perfil**: Representa o cliente cadastrado manualmente. Atributos relevantes: identificador único, e-mail, senha (hash no provedor de autenticação), `status` (`INACTIVE` | `ACTIVE` | `SUSPENDED`), `tenant_id`, papel (`role`). Relacionamento: pertence a exatamente um tenant.
- **Sessão de pré-ativação**: Estado autenticado limitado após login com conta `INACTIVE`. Permite apenas rotas de ativação. Não concede `TenantContext` de aplicação completo para rotas protegidas.
- **Sessão de aplicação**: Estado autenticado completo após ativação bem-sucedida. Atributos: usuário, tenant, papel. Concede acesso ao dashboard e rotas protegidas.
- **Senha temporária**: Credencial inicial provisionada pela equipe administrativa. Válida para login e ativação até a primeira troca bem-sucedida; posteriormente inválida.

## Success Criteria _(obrigatório)_

### Resultados Mensuráveis

- **SC-001**: 100% dos usuários recém-criados iniciam com status `INACTIVE`.
- **SC-002**: 100% das tentativas de acesso ao dashboard com conta `INACTIVE` (mesmo após login com senha temporária) resultam em redirecionamento à ativação ou bloqueio — nunca em acesso concedido.
- **SC-003**: Usuários com credenciais temporárias válidas e conta `INACTIVE` são redirecionados à página de ativação em até 10 segundos após submeter o login.
- **SC-004**: 100% das ativações bem-sucedidas resultam em conta `ACTIVE`, senha temporária inválida e redirecionamento ao dashboard.
- **SC-005**: 100% das tentativas de bypass do fluxo de ativação (URL direta ao dashboard, API sem status `ACTIVE`) são negadas.
- **SC-006**: Após ativação, tentativas de login com a senha temporária anterior falham em 100% dos casos.
- **SC-007**: Todos os fluxos de ativação possuem cobertura de testes unitários, de integração e de autenticação antes da entrega.

## Assumptions

- O provedor de autenticação (Supabase Auth) continua sendo a fonte autoritativa para credenciais; senhas são armazenadas exclusivamente como hash no provedor.
- O status `INACTIVE` vs `ACTIVE` reside no perfil de aplicação (`profiles.status`); a transição ocorre atomicamente com a atualização de senha durante a ativação.
- A política de senhas vigente é a mesma do fluxo de redefinição de senha da feature 001: mínimo 8 caracteres, pelo menos uma letra e pelo menos um número.
- Contas com status `SUSPENDED` não participam do fluxo de ativação e continuam bloqueadas conforme feature 001.
- A criação manual de contas por administradores/suporte (com senha temporária e status inicial `INACTIVE`) será implementada nesta feature ou em feature complementar de provisionamento; esta especificação cobre o fluxo do lado do usuário final.
- A rota da página de ativação será `/ativar-conta` (ou equivalente em pt-BR); o nome final será confirmado no planejamento.
- A distinção entre sessão de pré-ativação (identidade no provedor, sem contexto de aplicação completo) e sessão de aplicação (com `TenantContext` e acesso ao dashboard) será implementada na camada de auth/middleware, sem expor essa distinção ao usuário.
- Textos de interface permanecem em português (pt-BR), conforme Constituição de Engenharia.

## Impacto na Feature 001-user-auth

Esta feature **substitui** os seguintes comportamentos e premissas da especificação 001:

| Item em 001 | Comportamento anterior | Novo comportamento (002) |
|-------------|------------------------|--------------------------|
| FR-006 (001) | Login bem-sucedido sempre cria sessão e redireciona ao dashboard | Login com conta `INACTIVE` redireciona à ativação, sem sessão de aplicação |
| RN-003 (001) | Senha temporária + alteração opcional via "Esqueci minha senha" | Ativação obrigatória no primeiro acesso com troca de senha |
| Assumption (001) | Troca de senha no primeiro acesso não é obrigatória | Troca de senha no primeiro acesso é **obrigatória** |
| data-model (001) | Usuários `INACTIVE` não devem autenticar | Usuários `INACTIVE` autenticam para ativação, mas não acessam a plataforma |
| Login API (001) | Conta `INACTIVE` retorna 403 e encerra sessão | Conta `INACTIVE` retorna sucesso com redirecionamento à ativação |

A implementação da feature 002 DEVE atualizar a especificação, contratos de API e testes da feature 001 para refletir estes comportamentos.

**Status de implementação (002)**: Endereçado — ver tasks T015–T036 e `quickstart.md`.

| Item | Status |
|------|--------|
| Login INACTIVE → ativação | ✅ `app/api/auth/login/route.ts` |
| RN-003 ativação obrigatória | ✅ `app/ativar-conta/`, `app/api/auth/activate/route.ts` |
| data-model INACTIVE auth | ✅ `specs/001-user-auth/data-model.md` |
| Contrato API | ✅ `specs/001-user-auth/contracts/auth-api.yaml` |

## Conformidade com a Constituição

Esta especificação atende aos seguintes princípios de `.speckit/CONSTITUTION.md`:

| Princípio | Como esta feature satisfaz |
|-----------|---------------------------|
| **1 — Qualidade de Código** | Fluxos bem delimitados (login condicional, ativação, proteção de rotas) com responsabilidades separadas e testáveis. |
| **2 — Segurança de Tipos** | Status de conta como enum tipado (`UserStatus`); contratos de sessão de pré-ativação vs aplicação como tipos dedicados. |
| **3 — Padrões de Testes** | RNF-004 e SC-007 exigem testes unitários, de integração e de autenticação (Vitest + Testing Library). |
| **4 — Consistência de UX** | Reutilização de componentes existentes (`components/ui/`, `components/auth/`), HTML semântico, pt-BR, acessibilidade WCAG AA. |
| **5 — Performance** | SC-003 define expectativa de tempo perceptível para redirecionamento pós-login. |
| **6 — Manutenibilidade** | Escopo focado em ativação; extensão do domínio `lib/auth/` e rotas em `app/` sem duplicar lógica de autenticação. |

**Exceções documentadas**: Nenhuma exceção à constituição é necessária para esta feature.

## Out of Scope

- Interface de criação ou provisionamento de contas por administradores (backoffice) — pode ser feature separada, mas deve criar contas com status `INACTIVE` e senha temporária.
- Reenvio ou regeneração de senha temporária pela equipe de suporte.
- Autenticação multifator (MFA/2FA) no fluxo de ativação.
- Políticas avançadas de complexidade de senha além dos critérios mínimos já adotados.
- Notificações por e-mail de boas-vindas ou confirmação de ativação.
- Auditoria detalhada de eventos de ativação (logs estruturados) — pode ser feature futura.
- Fluxo de ativação para contas `SUSPENDED`.
