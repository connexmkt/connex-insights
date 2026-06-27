# Constituição de Engenharia — Connex Insights

> **Documento imutável.** Toda especificação, plano e implementação futura deve estar em conformidade com estes princípios. Qualquer violação exige justificativa técnica explícita documentada na especificação ou pull request correspondente. Em caso de conflito, a constituição prevalece.

---

## Stack Canônica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.x |
| Runtime UI | React | 19.x |
| Linguagem | TypeScript | 5.7.x |
| Estilização | Tailwind CSS v4 (via CSS) | 4.x |
| Componentes UI | shadcn/ui + Base UI | — |
| Ícones | lucide-react | — |
| Gráficos | recharts | — |
| Animações | motion (Framer Motion v12) | — |
| Gerenciador de pacotes | pnpm | — |
| Deploy | Vercel | — |

Adicionar dependências fora desta lista exige justificativa documentada no PR.

---

## Princípio 1 — Qualidade de Código

> Legibilidade é mais importante do que escrever menos linhas.

### 1.1 Nomenclatura

- Nomes de variáveis devem ser proporcionais ao seu escopo:
  - Escopo pequeno (loop interno, closure local) → nomes curtos são aceitáveis (`i`, `el`, `acc`).
  - Escopo amplo (função exportada, módulo, contexto compartilhado) → nomes descritivos são obrigatórios.
- Nomes devem descrever claramente o propósito, não a implementação.
- Abreviações são proibidas, exceto quando universalmente aceitas no domínio (ex.: `URL`, `API`, `id`, `ctx`, `req`, `res`).

### 1.2 Funções

Toda função deve:

- Ter nome com verbo (ex.: `fetchMetrics`, `formatDate`, `renderCard`).
- Executar **uma única responsabilidade**.
- Ser pequena e focada; lógica complexa deve ser extraída em funções auxiliares privadas.
- Ser legível de cima para baixo sem exigir contexto externo.
- Seguir **Command Query Separation (CQS)**:
  - Ou executa uma ação (comando) → retorna `void` ou `Promise<void>`.
  - Ou retorna dados (consulta) → não produz efeitos colaterais.
  - As duas responsabilidades nunca coexistem na mesma função.

### 1.3 Redução de Aninhamento

Evite aninhamento desnecessário usando:

- Retornos antecipados (*early returns*).
- Cláusulas de guarda (*guard clauses*).
- Extração de blocos em funções privadas.

```typescript
// Errado — aninhamento desnecessário
function processUser(user: User | null) {
  if (user) {
    if (user.isActive) {
      // lógica principal
    }
  }
}

// Correto — guard clauses
function processUser(user: User | null) {
  if (!user) return;
  if (!user.isActive) return;
  // lógica principal
}
```

### 1.4 Parâmetros de Saída

Parâmetros de saída (output parameters) são proibidos. Quando o estado deve mudar, o objeto responsável por aquele estado deve se modificar, não receber uma referência mutável externa.

### 1.5 Composição vs. Duplicação

Composição tem prioridade sobre lógica duplicada. Antes de criar uma nova função ou componente, verificar se existe algo reutilizável.

---

## Princípio 2 — Segurança de Tipos (TypeScript)

> `any` é proibido. Sem exceção documentada, o build deve falhar.

### 2.1 Regras Imutáveis

| Regra | Status |
|-------|--------|
| `any` proibido | **Imutável** |
| `strict: true` no `tsconfig.json` | **Imutável** |
| `typescript.ignoreBuildErrors: true` no `next.config` | **Temporário — deve ser removido** |
| Toda função declara tipos de parâmetros e retorno | **Obrigatório** |
| Modelos compartilhados têm tipos dedicados em arquivo próprio | **Obrigatório** |
| Type assertions (`as`) sem comentário justificando | **Proibido** |

### 2.2 Preferências de Tipos

Preferir, nesta ordem:

1. `interface` para contratos de objetos e props de componentes.
2. `type` para unions, intersections e aliases simples.
3. Generics para lógica reutilizável.
4. Utility types (`Partial`, `Pick`, `Omit`, `Record`, etc.) antes de criar tipos manualmente.

### 2.3 Padrão para Componentes React

```typescript
// Props sempre tipadas via interface
interface MetricCardProps {
  title: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
  className?: string;
}

// Retorno explícito em componentes complexos
export function MetricCard({ title, value, trend, className }: MetricCardProps): React.JSX.Element {
  // ...
}
```

### 2.4 Switch Exaustivo

Em switches sobre unions discriminadas ou enums, usar verificação `never` no `default`:

```typescript
function getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up': return 'TrendingUp';
    case 'down': return 'TrendingDown';
    case 'neutral': return 'Minus';
    default: {
      const _exhaustive: never = trend;
      throw new Error(`Trend não tratado: ${_exhaustive}`);
    }
  }
}
```

---

## Princípio 3 — Padrões de Testes

> Uma funcionalidade não está completa sem seus testes correspondentes.

### 3.1 Cobertura Mínima

| Tipo | Escopo | Obrigatório |
|------|--------|-------------|
| Testes unitários | Lógica de negócio (`lib/`, funções puras) | Sim |
| Testes de integração | Interações entre módulos (componentes + dados) | Sim |
| Testes end-to-end | Fluxos críticos do usuário (login, dashboard principal) | Quando aplicável |

### 3.2 Stack de Testes Adotada

- **Unitário / Integração:** Vitest + Testing Library (React)
- **End-to-end:** Playwright

### 3.3 Regras para Testes

- Testes devem ser **determinísticos** — sem resultados aleatórios ou dependentes de horário.
- Mocks devem ser mínimos — testar comportamento real sempre que possível.
- Testar **comportamento**, não detalhes de implementação interna.
- Testes são mantidos junto com o código de produção; PR sem testes para nova feature é bloqueado.

### 3.4 Convenção de Nomenclatura

```
components/dashboard/metric-cards.tsx
components/dashboard/metric-cards.test.tsx   ← mesmo diretório

lib/connex-data.ts
lib/connex-data.test.ts

e2e/login.spec.ts
e2e/dashboard.spec.ts
```

---

## Princípio 4 — Consistência de Experiência do Usuário

> Reutilizar é obrigatório. Criar duplicata é proibido.

### 4.1 Componentes

- Usar os componentes existentes em `components/ui/` antes de criar novos.
- Novos componentes primitivos devem ser adicionados a `components/ui/`.
- Componentes de feature ficam em `components/<domínio>/`.
- Criar um componente que não é utilizado é proibido.

### 4.2 Biblioteca UI

A biblioteca de UI canônica é **shadcn/ui com Base UI** (`@base-ui/react`).

- Não misturar com Radix UI diretamente.
- Variantes são criadas via `class-variance-authority` (CVA).
- Classes de Tailwind são compostas com `cn()` de `@/lib/utils`.

### 4.3 HTML Semântico e Acessibilidade

- Usar elementos HTML semânticos: `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<button>`, `<a>`, etc.
- Todo controle interativo deve ser acessível via teclado.
- Imagens informativas devem ter `alt` descritivo. Imagens decorativas devem ter `alt=""`.
- Contraste de cores deve respeitar WCAG AA (4.5:1 para texto normal).

### 4.4 Consistência Visual

- Espaçamento, tipografia e cores devem usar exclusivamente os tokens definidos em `app/globals.css`.
- Não usar valores mágicos de cor, tamanho ou espaçamento fora do sistema de design.
- Textos da interface em **português (pt-BR)**.
- Suporte a modo escuro via variáveis CSS (`:root` / `.dark`) já definidas.

### 4.5 Servidor vs. Cliente

| Tipo | Uso |
|------|-----|
| Server Components (padrão) | Páginas, layouts, componentes sem interatividade |
| `"use client"` | Componentes com estado, hooks ou eventos do browser |

Evitar `"use client"` desnecessário — mover a fronteira server/client o mais abaixo possível na árvore.

---

## Princípio 5 — Performance

> Otimizações não podem reduzir legibilidade sem benefício mensurável.

### 5.1 Renderização

- Evitar re-renders desnecessários com `memo`, `useCallback` e `useMemo` **somente quando há problema identificado**.
- Não aplicar memoization prematuramente.
- Lazy load de módulos pesados com `dynamic()` do Next.js.

### 5.2 Assets

- Imagens devem usar o componente `<Image>` do Next.js (quando `unoptimized: true` for removido).
- Assets públicos devem ser otimizados antes de entrar no repositório.
- `next.config.mjs` tem `images.unoptimized: true` — **isso deve ser revertido antes do deploy em produção**.

### 5.3 Requisições de Rede

- Evitar requisições desnecessárias ou duplicadas.
- Dados compartilhados entre componentes devem ser buscados no componente ancestral comum.
- Implementar cache de dados custosos quando apropriado (React Cache, `unstable_cache` do Next.js).

### 5.4 Bundle

- Monitorar o bundle size antes de adicionar novas dependências.
- Importar apenas o que é usado (tree-shaking).
- Evitar importar bibliotecas inteiras quando apenas uma função é necessária.

---

## Princípio 6 — Manutenibilidade

> O código deve ser fácil de evoluir por qualquer membro do time.

### 6.1 Arquitetura

```
app/                  ← rotas Next.js (App Router)
  layout.tsx          ← layouts de segmento
  page.tsx            ← páginas (Server Components por padrão)
  globals.css         ← tema e tokens de design

components/
  ui/                 ← primitivos shadcn (Base UI)
  <domínio>/          ← componentes de feature por domínio
  connex-logo.tsx     ← componentes globais isolados

lib/
  connex-data.ts      ← fonte de dados (mock → real no futuro)
  utils.ts            ← utilitários compartilhados

hooks/                ← custom hooks (criar quando necessário)
types/                ← tipos compartilhados entre módulos (criar quando necessário)
```

### 6.2 Acoplamento e Coesão

- Módulos devem ser **fracamente acoplados** e **altamente coesos**.
- Dependências entre domínios devem ser minimizadas.
- Dados globais passam por contexto React ou estado de servidor, não por prop drilling além de 2 níveis.

### 6.3 Código Morto

- Código não utilizado deve ser removido imediatamente.
- Comentários de código desativado (`// código antigo`) são proibidos — use o histórico do Git.
- Imports não utilizados devem ser removidos.

### 6.4 Abstrações

- Evitar abstrações prematuras.
- Abstrair somente quando o padrão se repete 3 ou mais vezes.
- Preferir código explícito a código "esperto".

### 6.5 Imports

- Todos os imports ficam no topo do arquivo.
- Imports inline em corpos de função são proibidos (exceto quando há razão de dependência circular documentada).
- Usar o alias `@/` para imports internos.

```typescript
// Correto
import { cn } from '@/lib/utils';
import { MetricCard } from '@/components/dashboard/metric-cards';

// Errado
import { cn } from '../../../lib/utils';
```

### 6.6 Refatoração

Refatoração é incentivada quando melhora a legibilidade sem alterar o comportamento. Deve ser feita em commit separado do commit de feature.

---

## Itens Pendentes de Conformidade

Os itens abaixo estão em violação com esta constituição e devem ser corrigidos:

| Item | Violação | Prioridade |
|------|----------|------------|
| `name: "my-project"` em `package.json` | Deve ser `connex-insights` | Alta |
| `typescript.ignoreBuildErrors: true` em `next.config.mjs` | Mascara erros TypeScript | Alta |
| `images.unoptimized: true` em `next.config.mjs` | Desabilita otimização de imagens | Média |
| Ausência de ESLint configurado | Script `lint` sem dependência | Alta |
| Ausência de Prettier | Formatação inconsistente | Média |
| Ausência de testes (unitários, integração, e2e) | Princípio 3 violado | Alta |
| Autenticação mock (`/dashboard` após timeout) | Sem auth real | Alta |
| Pasta `hooks/` referenciada em `components.json` mas inexistente | Inconsistência de estrutura | Baixa |

---

## Enforcement

### Por Pull Request

Todo PR deve ser validado contra esta constituição. O revisor deve verificar:

- [ ] Nenhum `any` introduzido sem documentação.
- [ ] Toda função nova tem tipos de parâmetro e retorno.
- [ ] Nenhum componente duplicado criado sem justificativa.
- [ ] Testes criados para a nova funcionalidade.
- [ ] HTML semântico e acessibilidade respeitados.
- [ ] Nenhum import inline em corpo de função.
- [ ] Switch statements sobre unions têm verificação `never`.

### Por Especificação

Toda especificação futura deve referenciar os princípios desta constituição que ela satisfaz e documentar explicitamente qualquer exceção.

### Exceções

Exceções são permitidas somente quando:

1. Existe limitação técnica comprovada.
2. A razão está documentada no PR ou na especificação.
3. A exceção é revisada e aprovada pelo time.

---

*Versão 1.0 — Jun 2026*
*Qualquer alteração a este documento requer PR dedicado com aprovação explícita.*
