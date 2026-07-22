# Especificação de Feature: Autenticação de Usuários

**Branch da Feature**: `001-user-auth`  
**Criada em**: 2026-06-27  
**Status**: Rascunho  
**Entrada**: Descrição do usuário — fluxo de autenticação com login e recuperação de senha, sem auto-cadastro.

## Nota de atualização (2026-07-22)

O identificador de acesso do formulário de login **deixou de ser o e-mail de
contato e passou a ser um campo `login` dedicado**, armazenado em
`profiles.login` (`String @unique`), distinto do e-mail em `auth.users`.
Motivo: dependência cross-repo introduzida pela feature
[`connex-crm/specs/002-provisionamento-usuarios-insights`](../../../connex-crm/specs/002-provisionamento-usuarios-insights/spec.md),
que provisiona contas a partir do CRM com nome, e-mail de contato, `login` e
tenant — o `login` sendo o identificador que o usuário final efetivamente usa
para autenticar-se aqui.

Impacto nesta especificação:

- FR-002/FR-003: o formulário de login agora tem campos **login** e senha
  (não mais e-mail e senha); e-mail continua existindo apenas como atributo
  interno do `auth.users`, usado para autenticar contra o Supabase Auth
  internamente (resolução `login → email` feita no servidor via Admin API,
  nunca exposta ao cliente).
- FR-007: a mensagem de erro genérica passa a ser "Login ou senha
  incorretos.".
- Key Entities → **Usuário**: adiciona o atributo `login` (identificador de
  acesso público, único), mantendo e-mail como atributo interno/contato.
- O fluxo de recuperação de senha (User Story 2, FR-008 a FR-011) **não foi
  alterado** e continua baseado em e-mail — está fora do escopo desta
  atualização.
- Migration aplicada: `prisma/migrations/20260722210000_add_profile_login`.

## User Scenarios & Testing _(obrigatório)_

### User Story 1 — Login com credenciais fornecidas pela empresa (Prioridade: P1)

Como cliente cadastrado, quero autenticar-me com o e-mail e a senha fornecidos pela equipe da Connex para acessar meu dashboard com segurança.

**Por que esta prioridade**: Sem login funcional, nenhum usuário consegue acessar a plataforma. É o fluxo crítico que desbloqueia todo o valor do produto.

**Teste independente**: Pode ser testado isoladamente acessando a página de login, informando credenciais válidas de um usuário previamente criado pela equipe administrativa e verificando redirecionamento ao dashboard.

**Cenários de aceitação**:

1. **Dado** que sou um usuário cadastrado na página de login, **Quando** informo e-mail e senha válidos e clico em "Entrar", **Então** minha sessão é criada e sou redirecionado ao dashboard.
2. **Dado** que estou na página de login, **Quando** informo credenciais inválidas (e-mail inexistente ou senha incorreta) e clico em "Entrar", **Então** permaneço na página de login e vejo uma mensagem de erro genérica que não revela qual campo está incorreto.
3. **Dado** que estou na página de login, **Quando** tento enviar o formulário sem preencher e-mail ou senha, **Então** o envio é bloqueado e os campos obrigatórios são indicados ao usuário.
4. **Dado** que estou na página de login, **Quando** informo um e-mail em formato inválido, **Então** o envio é bloqueado e recebo feedback de validação antes da submissão.

---

### User Story 2 — Recuperação de senha (Prioridade: P2)

Como cliente cadastrado que esqueceu ou precisa alterar sua senha, quero solicitar a redefinição por e-mail para recuperar o acesso sem depender do suporte.

**Por que esta prioridade**: Complementa o login e reduz dependência operacional da equipe de suporte para reset manual de senhas.

**Teste independente**: Pode ser testado a partir da página de login, acionando "Esqueci minha senha", informando um e-mail cadastrado, recebendo o link por e-mail e concluindo a redefinição em uma nova senha válida.

**Cenários de aceitação**:

1. **Dado** que estou na página de login, **Quando** clico em "Esqueci minha senha", **Então** sou direcionado ao fluxo de recuperação onde posso informar meu e-mail cadastrado.
2. **Dado** que informo um e-mail cadastrado no fluxo de recuperação, **Quando** confirmo a solicitação, **Então** recebo um e-mail com link seguro de redefinição e vejo uma mensagem de confirmação de sucesso na interface.
3. **Dado** que informo um e-mail não cadastrado no fluxo de recuperação, **Quando** confirmo a solicitação, **Então** vejo a mesma mensagem de confirmação de sucesso exibida para e-mails válidos (sem revelar se a conta existe).
4. **Dado** que recebi um link de redefinição válido e não expirado, **Quando** defino uma nova senha que atende aos critérios mínimos, **Então** a senha é atualizada e posso autenticar-me com a nova credencial.
5. **Dado** que recebi um link de redefinição expirado ou já utilizado, **Quando** tento redefinir minha senha, **Então** vejo uma mensagem clara de que o link é inválido e sou orientado a solicitar um novo.

---

### User Story 3 — Gestão de sessão e encerramento (Prioridade: P3)

Como usuário autenticado, quero permanecer logado durante meu uso normal e encerrar minha sessão quando desejar, para manter segurança em dispositivos compartilhados.

**Por que esta prioridade**: Garante continuidade de uso e controle explícito sobre o acesso, complementando login e recuperação.

**Teste independente**: Pode ser testado autenticando-se, navegando no dashboard, encerrando sessão via ação explícita e verificando redirecionamento ao login; também testando acesso ao dashboard após expiração de sessão.

**Cenários de aceitação**:

1. **Dado** que estou autenticado, **Quando** navego entre páginas protegidas do dashboard, **Então** permaneço autenticado sem precisar informar credenciais novamente.
2. **Dado** que estou autenticado, **Quando** escolho encerrar sessão (logout), **Então** minha sessão é invalidada e sou redirecionado à página de login.
3. **Dado** que minha sessão expirou, **Quando** tento acessar qualquer página protegida, **Então** sou redirecionado à página de login.
4. **Dado** que já estou autenticado, **Quando** acesso a página de login, **Então** sou redirecionado ao dashboard (evitando login duplicado).

---

### Edge Cases

- O que acontece quando o usuário submete o formulário de login enquanto a validação de credenciais está em andamento? → O botão de envio deve ser desabilitado e exibir estado de carregamento; submissões duplicadas devem ser ignoradas.
- Como o sistema se comporta quando o e-mail de recuperação não pode ser entregue (falha de envio)? → O usuário ainda vê a mensagem genérica de confirmação; a falha é registrada internamente para diagnóstico, sem expor detalhes ao usuário.
- O que acontece se o usuário tentar acessar uma URL protegida diretamente sem sessão? → Redirecionamento à página de login, preservando a intenção de navegação quando aplicável (retorno pós-login).
- Como tratar múltiplas solicitações de recuperação de senha em sequência? → Apenas o link mais recente permanece válido, ou links anteriores são invalidados ao emitir um novo (comportamento consistente documentado).
- O que acontece se o usuário tentar acessar qualquer rota de cadastro (Sign Up)? → A rota não existe; requisições a endpoints de criação de conta pública retornam erro apropriado.
- Como o sistema responde a tentativas repetidas de login com credenciais inválidas? → Mensagem genérica persistente; mecanismo de limitação de tentativas aplicado para mitigar ataques de força bruta (sem revelar bloqueio específico por e-mail).

## Requirements _(obrigatório)_

### Requisitos Funcionais

- **FR-001**: O sistema DEVE disponibilizar uma página de login acessível como ponto de entrada para usuários não autenticados.
- **FR-002**: A página de login DEVE conter campos de e-mail e senha, botão "Entrar" e link "Esqueci minha senha".
- **FR-003**: E-mail e senha DEVEM ser campos obrigatórios no formulário de login.
- **FR-004**: O sistema DEVE validar o formato do e-mail no cliente antes da submissão.
- **FR-005**: O sistema DEVE validar credenciais contra o provedor de autenticação autoritativo.
- **FR-006**: Após autenticação bem-sucedida, o sistema DEVE criar uma sessão de usuário e redirecionar ao dashboard.
- **FR-007**: Após falha de autenticação, o sistema DEVE exibir mensagem de erro genérica (ex.: "E-mail ou senha incorretos") sem indicar qual campo falhou.
- **FR-008**: O sistema DEVE disponibilizar fluxo de recuperação de senha acessível a partir da página de login.
- **FR-009**: No fluxo de recuperação, o usuário DEVE informar o e-mail cadastrado para solicitar redefinição.
- **FR-010**: Para e-mails cadastrados, o sistema DEVE enviar e-mail contendo link seguro de redefinição de senha.
- **FR-011**: Para e-mails cadastrados e não cadastrados, o sistema DEVE exibir a mesma mensagem de confirmação de solicitação enviada.
- **FR-012**: Links de redefinição de senha DEVEM expirar após período configurável.
- **FR-013**: O usuário DEVE poder definir uma nova senha por meio do link de redefinição válido.
- **FR-014**: Senhas DEVEM ser armazenadas exclusivamente de forma segura (hash com algoritmo adequado); texto plano é proibido.
- **FR-015**: Usuários autenticados DEVEM permanecer logados até logout explícito ou expiração de sessão.
- **FR-016**: Sessões expiradas DEVEM redirecionar usuários à página de login ao tentar acessar áreas protegidas.
- **FR-017**: O sistema DEVE oferecer ação explícita de logout que invalida a sessão atual.
- **FR-018**: Páginas e rotas do dashboard DEVEM ser acessíveis somente a usuários autenticados.
- **FR-019**: O sistema NÃO DEVE disponibilizar página, link ou fluxo de auto-cadastro (Sign Up).
- **FR-020**: O sistema NÃO DEVE expor endpoint público que permita criação de contas por usuários finais.
- **FR-021**: Apenas equipe administrativa ou de suporte autorizada pode criar contas de usuário (fora do escopo desta feature, mas como restrição do produto).
- **FR-022**: Formulários de autenticação DEVEM usar HTML semântico e validação no cliente para campos obrigatórios e formato de e-mail.
- **FR-023**: A interface de autenticação DEVE ser responsiva e acessível via teclado, com textos em português (pt-BR).

### Regras de Negócio

- **RN-001**: Cadastro público (Sign Up) é estritamente proibido em toda a aplicação.
- **RN-002**: Toda conta de usuário é criada manualmente pela equipe de suporte ou administrativa da empresa.
- **RN-003**: Usuários recebem e-mail e senha temporária para primeiro acesso; a alteração de senha é responsabilidade do usuário via fluxo de recuperação.
- **RN-004**: Apenas usuários previamente cadastrados podem autenticar-se.
- **RN-005**: Recuperação de senha está disponível somente para contas existentes, mas a interface nunca confirma existência ou inexistência de conta.

### Requisitos Não Funcionais

- **RNF-001**: Autenticação deve seguir práticas de segurança reconhecidas (OWASP ASVS nível aplicável para autenticação).
- **RNF-002**: Mensagens de erro não devem expor informações sensíveis (existência de conta, detalhes de stack trace, estado interno).
- **RNF-003**: Comunicação de credenciais e tokens deve ocorrer exclusivamente sobre conexão segura (HTTPS).
- **RNF-004**: Interface deve atender WCAG AA para contraste e navegação por teclado.
- **RNF-005**: Todos os fluxos de autenticação devem ser cobertos por testes unitários e de integração conforme a Constituição de Engenharia do projeto.

### Key Entities

- **Usuário**: Representa um cliente cadastrado manualmente pela equipe da Connex. Atributos relevantes: identificador único, e-mail (usado como login), senha (armazenada de forma segura), status da conta (ativo/inativo). Relacionamento: possui uma ou mais sessões ativas.
- **Sessão**: Representa o estado autenticado de um usuário após login bem-sucedido. Atributos relevantes: identificador, usuário associado, data de criação, data de expiração. Relacionamento: pertence a um usuário.
- **Token de redefinição de senha**: Representa autorização temporária para alterar senha. Atributos relevantes: identificador, usuário associado, data de emissão, data de expiração, status (válido/utilizado/expirado). Relacionamento: pertence a um usuário.

## Success Criteria _(obrigatório)_

### Resultados Mensuráveis

- **SC-001**: Usuários com credenciais válidas conseguem acessar o dashboard em até 10 segundos após submeter o formulário de login (incluindo validação e redirecionamento).
- **SC-002**: 100% das tentativas de login com credenciais inválidas exibem mensagem genérica, sem revelar se o e-mail existe ou se a senha está incorreta.
- **SC-003**: Usuários cadastrados recebem e-mail de redefinição em até 2 minutos após solicitar recuperação de senha (em condições normais de operação).
- **SC-004**: 95% dos usuários conseguem concluir a redefinição de senha com link válido na primeira tentativa.
- **SC-005**: Usuários com sessão expirada são redirecionados ao login em 100% dos acessos a rotas protegidas.
- **SC-006**: Nenhuma página, rota ou endpoint de auto-cadastro (Sign Up) existe ou é acessível na aplicação.
- **SC-007**: Todos os fluxos de autenticação (login, recuperação, redefinição, logout, proteção de rotas) possuem cobertura de testes unitários e de integração antes da entrega.

## Assumptions

- O provedor de autenticação será configurado centralmente pela equipe de engenharia; esta especificação não prescreve qual tecnologia utilizar.
- Senhas temporárias fornecidas pela equipe administrativa permitem login imediato; o usuário pode alterá-las via fluxo "Esqueci minha senha" sem exigência obrigatória de troca no primeiro acesso (a menos que política futura determine o contrário).
- O período padrão de expiração de links de redefinição será de 24 horas, configurável pela equipe de operações.
- O período padrão de expiração de sessão seguirá prática comum de aplicações web corporativas (sessão persistente com expiração por inatividade ou tempo máximo), configurável pela equipe de operações.
- A criação manual de contas por administradores/suporte será implementada em feature separada ou processo operacional externo; esta especificação cobre exclusivamente login, recuperação e gestão de sessão do lado do cliente.
- A página de login existente (`/`) será evoluída para suportar autenticação real, substituindo o comportamento mock atual.
- Textos de interface permanecem em português (pt-BR), conforme Constituição de Engenharia.

## Conformidade com a Constituição

Esta especificação atende aos seguintes princípios de `.speckit/CONSTITUTION.md`:

| Princípio | Como esta feature satisfaz |
|-----------|---------------------------|
| **1 — Qualidade de Código** | Requisitos testáveis e fluxos bem delimitados facilitam implementação modular (formulários, serviços de auth, proteção de rotas). |
| **2 — Segurança de Tipos** | Contratos de dados (Usuário, Sessão, Token) definidos como entidades tipáveis; implementação futura exigirá tipos dedicados. |
| **3 — Padrões de Testes** | RNF-005 e SC-007 exigem testes unitários, de integração e e2e para fluxo de login conforme stack Vitest + Testing Library + Playwright. |
| **4 — Consistência de UX** | Reutilização de componentes existentes (`components/ui/`, `components/auth/`), HTML semântico, pt-BR, acessibilidade WCAG AA. |
| **5 — Performance** | SC-001 define expectativa de tempo de login perceptível ao usuário. |
| **6 — Manutenibilidade** | Escopo delimitado (sem Sign Up), arquitetura por domínio (`components/auth/`, rotas protegidas em `app/dashboard/`). |

**Exceções documentadas**: Nenhuma exceção à constituição é necessária para esta feature.

## Out of Scope

- Criação, edição ou desativação de contas por administradores (backoffice).
- Autenticação social (Google, Microsoft, etc.).
- Autenticação multifator (MFA/2FA).
- Single Sign-On (SSO) corporativo.
- Políticas avançadas de complexidade de senha além de critérios mínimos razoáveis.
- Auditoria detalhada de eventos de segurança (logs estruturados de auth) — pode ser feature futura.
