import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Política de Privacidade — Connex Insights",
  description:
    "Saiba como a Connex Insights coleta, utiliza e protege seus dados pessoais e métricas de redes sociais.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: [string, string];
  rows: [string, string][];
}) {
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-foreground">
              {headers[0]}
            </th>
            <th className="px-4 py-3 text-left font-medium text-foreground">
              {headers[1]}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([left, right]) => (
            <tr key={left} className="border-b border-border last:border-0">
              <td className="px-4 py-3 align-top font-medium text-foreground">
                {left}
              </td>
              <td className="px-4 py-3 align-top text-muted-foreground">
                {right}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Política de Privacidade" lastUpdated="julho de 2026">
      <Section id="introducao" title="1. Introdução">
        <p>
          A Connex Insights é uma plataforma SaaS de análise de redes sociais
          desenvolvida e operada pela Connex Agência de Marketing. Esta Política
          de Privacidade descreve como coletamos, utilizamos, armazenamos,
          compartilhamos e protegemos as informações pessoais e os dados de
          desempenho das contas de redes sociais de nossos usuários.
        </p>
        <p>
          Ao utilizar a plataforma Connex Insights, acessível em{" "}
          <Link href="https://insights.connexmkt.com.br">
            insights.connexmkt.com.br
          </Link>
          , você concorda com os termos descritos nesta política. Caso não
          concorde com alguma disposição, recomendamos que interrompa o uso da
          plataforma e entre em contato conosco para esclarecimentos.
        </p>
        <p>
          Esta política está em conformidade com a Lei Geral de Proteção de
          Dados (LGPD — Lei nº 13.709/2018), com os requisitos de uso de dados
          da Meta Platforms, Inc. (incluindo Instagram e Facebook), e com as
          boas práticas internacionais de proteção de dados.
        </p>
      </Section>

      <Section id="controladora" title="2. Controladora dos Dados">
        <p>
          A controladora responsável pelo tratamento dos seus dados pessoais é:
        </p>
        <DataTable
          headers={["Campo", "Informação"]}
          rows={[
            ["Razão Social", "Connex Agência de Marketing"],
            [
              "Plataforma",
              "Connex Insights — insights.connexmkt.com.br",
            ],
            [
              "Contato para assuntos de privacidade",
              "agenciaconnex@gmail.com",
            ],
          ]}
        />
      </Section>

      <Section id="dados-coletados" title="3. Dados que Coletamos">
        <h3>3.1 Dados de Cadastro e Autenticação</h3>
        <p>
          Para criar e manter sua conta na plataforma, coletamos e tratamos:
        </p>
        <ul>
          <li>Nome de exibição</li>
          <li>Endereço de e-mail</li>
          <li>
            Senha (armazenada de forma criptografada via Supabase Auth; nunca
            acessível em texto legível)
          </li>
          <li>
            Workspace (organização/tenant) ao qual o usuário pertence, incluindo
            nome e identificador interno
          </li>
          <li>Papel na organização (por exemplo, membro ou administrador)</li>
          <li>Status da conta (ativa, inativa ou suspensa)</li>
          <li>Data e hora de criação da conta e último acesso</li>
        </ul>

        <h3>3.2 Dados de Redes Sociais Conectadas</h3>
        <p>
          Atualmente, a plataforma suporta a conexão de contas Instagram
          Professional (Business ou Creator). Quando você autoriza essa conexão,
          coletamos os seguintes dados por meio das APIs oficiais da Meta:
        </p>
        <ul>
          <li>Identificador público da conta (ID de usuário ou página)</li>
          <li>Nome de usuário, nome de exibição e foto de perfil</li>
          <li>Tipo de conta (Business ou Creator)</li>
          <li>
            Token de acesso OAuth (armazenado exclusivamente no servidor, de
            forma criptografada)
          </li>
          <li>Escopo das permissões concedidas pelo usuário</li>
          <li>Data de validade e status do token de acesso</li>
        </ul>

        <h3>3.3 Métricas de Desempenho</h3>
        <p>
          A plataforma coleta periodicamente, por meio de chamadas às APIs
          oficiais, métricas de desempenho das contas conectadas, incluindo:
        </p>
        <ul>
          <li>Número de seguidores e variação diária</li>
          <li>Alcance orgânico e pago</li>
          <li>Impressões totais</li>
          <li>Taxa de engajamento</li>
          <li>Curtidas, comentários, compartilhamentos e salvamentos</li>
          <li>Visualizações de stories, reels e vídeos</li>
          <li>Cliques no perfil e no link da bio</li>
        </ul>
        <p>
          Esses dados são associados ao workspace do usuário e armazenados com
          isolamento por tenant via Row Level Security (RLS) no banco de dados
          PostgreSQL hospedado no Supabase.
        </p>

        <h3>3.4 Dados de Uso da Plataforma</h3>
        <p>
          Coletamos automaticamente informações sobre a utilização da
          plataforma, como:
        </p>
        <ul>
          <li>Endereço IP e localização aproximada</li>
          <li>Tipo e versão do navegador e sistema operacional</li>
          <li>Páginas acessadas, tempo de sessão e ações realizadas</li>
          <li>Logs de erros e eventos técnicos</li>
          <li>
            Métricas agregadas de uso via Vercel Analytics (somente em produção)
          </li>
        </ul>
      </Section>

      <Section id="como-utilizamos" title="4. Como Utilizamos os Dados">
        <h3>4.1 Finalidades do Tratamento</h3>
        <p>
          Os dados coletados são utilizados exclusivamente para as seguintes
          finalidades:
        </p>
        <ul>
          <li>
            Autenticar usuários e manter sessões seguras na plataforma
          </li>
          <li>
            Coletar métricas de desempenho das redes sociais conectadas de forma
            automatizada
          </li>
          <li>
            Exibir dashboards e relatórios de analytics para o usuário
            autenticado
          </li>
          <li>
            Gerar análises de desempenho com uso de Inteligência Artificial
            (Claude API da Anthropic), quando essa funcionalidade estiver
            habilitada
          </li>
          <li>
            Enviar relatórios e notificações por e-mail via Resend, conforme as
            preferências configuradas em{" "}
            <strong>Configurações &gt; Notificações</strong>
          </li>
          <li>
            Manter a segurança, integridade e disponibilidade da plataforma
          </li>
          <li>Cumprir obrigações legais e regulatórias</li>
        </ul>

        <h3>4.2 Base Legal (LGPD)</h3>
        <p>
          O tratamento dos dados é fundamentado nas seguintes bases legais
          previstas no Art. 7º da LGPD:
        </p>
        <ul>
          <li>
            <strong>Execução de contrato:</strong> necessário para prestação dos
            serviços contratados
          </li>
          <li>
            <strong>Legítimo interesse:</strong> para garantir a segurança e
            melhoria da plataforma
          </li>
          <li>
            <strong>Consentimento:</strong> para coleta de métricas via OAuth das
            redes sociais
          </li>
        </ul>
      </Section>

      <Section id="meta" title="5. Integração com a Meta (Instagram e Facebook)">
        <h3>5.1 Uso da Meta Graph API</h3>
        <p>
          A Connex Insights utiliza a Meta Graph API para coletar métricas de
          contas Instagram Professional conectadas pelos usuários. O acesso é
          realizado exclusivamente mediante autorização explícita do usuário por
          meio do fluxo OAuth 2.0 da Meta.
        </p>

        <h3>5.2 Permissões Solicitadas</h3>
        <p>
          Durante o processo de conexão da conta Instagram, solicitamos as
          permissões configuradas no Business Login do App Meta:
        </p>
        <ul>
          <li>
            <code>instagram_business_basic</code> — acesso a informações básicas do perfil
          </li>
          <li>
            <code>instagram_business_manage_messages</code> — gestão de mensagens
            diretas
          </li>
          <li>
            <code>instagram_business_manage_comments</code> — gestão de comentários
          </li>
          <li>
            <code>instagram_business_content_publish</code> — publicação de conteúdo
          </li>
          <li>
            <code>instagram_business_manage_insights</code> — acesso às métricas de
            alcance, impressões e engajamento
          </li>
        </ul>
        <p>
          Não solicitamos acesso a dados de usuários que não sejam os do próprio
          titular da conta conectada, nem permissões além das listadas acima.
        </p>

        <h3>5.3 Uso Restrito dos Dados da Meta</h3>
        <p>
          Em conformidade com a Política de Dados da Meta e os Termos de Serviço
          da Plataforma (Meta Platform Terms), declaramos que:
        </p>
        <ul>
          <li>
            Os dados obtidos via Meta Graph API são utilizados exclusivamente
            para exibir métricas ao próprio usuário titular da conta conectada
          </li>
          <li>
            Não compartilhamos, vendemos ou utilizamos dados da Meta para fins
            publicitários, de segmentação ou perfilamento de terceiros
          </li>
          <li>
            Não utilizamos os dados para treinar modelos de machine learning ou
            inteligência artificial proprietários
          </li>
          <li>
            Os tokens de acesso são armazenados de forma segura no servidor e
            utilizados somente para as finalidades autorizadas
          </li>
          <li>
            O acesso às APIs da Meta é encerrado imediatamente mediante
            revogação do consentimento pelo usuário
          </li>
          <li>
            Credenciais OAuth e dados de integração são excluídos dentro do
            prazo de 30 dias após a desconexão da conta ou exclusão do workspace
          </li>
        </ul>

        <h3>5.4 Retenção de Dados da Meta</h3>
        <p>
          As métricas históricas coletadas via Meta Graph API são retidas por
          até 90 dias. Após esse período, os dados são automaticamente
          excluídos. O usuário pode solicitar a exclusão antecipada a qualquer
          momento.
        </p>
        <p>
          Após a desconexão de uma conta Instagram, a coleta de novos dados cessa
          imediatamente, mas as métricas já sincronizadas podem permanecer
          disponíveis no painel até o fim do período de retenção aplicável,
          salvo solicitação de exclusão pelo titular.
        </p>

        <h3>5.5 Revogação de Acesso</h3>
        <p>
          O usuário pode revogar as permissões concedidas à Connex Insights a
          qualquer momento, tanto pela interface da plataforma em{" "}
          <strong>Configurações &gt; Redes conectadas</strong> quanto
          diretamente pelas configurações de aplicativos do
          Facebook/Instagram. Após a revogação, a coleta de novos dados cessa
          imediatamente.
        </p>
      </Section>

      <Section id="terceiros" title="6. Compartilhamento de Dados com Terceiros">
        <p>
          A Connex Insights não vende, aluga ou comercializa dados pessoais de
          seus usuários. Os dados são compartilhados apenas com os seguintes
          prestadores de serviço, estritamente no limite necessário para a
          operação da plataforma:
        </p>
        <DataTable
          headers={["Prestador", "Finalidade"]}
          rows={[
            [
              "Supabase",
              "Infraestrutura de banco de dados PostgreSQL, autenticação e políticas de isolamento (RLS)",
            ],
            [
              "Vercel",
              "Hospedagem da aplicação, execução de rotas server-side e analytics agregado de uso",
            ],
            [
              "Anthropic (Claude API)",
              "Geração de análises textuais de desempenho no painel",
            ],
            [
              "Resend",
              "Envio de e-mails transacionais, recuperação de senha e relatórios",
            ],
            [
              "Meta Platforms, Inc.",
              "Fonte dos dados via API, mediante autorização do usuário",
            ],
          ]}
        />
        <p>
          Todos os prestadores são selecionados com base em suas políticas de
          privacidade e segurança, e operam sob acordos de processamento de dados
          compatíveis com as legislações aplicáveis.
        </p>
      </Section>

      <Section id="seguranca" title="7. Segurança dos Dados">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger os dados
          pessoais dos usuários contra acesso não autorizado, perda, alteração
          ou divulgação indevida:
        </p>
        <ul>
          <li>
            Isolamento de dados por workspace via Row Level Security (RLS) no
            Supabase Postgres
          </li>
          <li>
            Tokens de acesso OAuth armazenados exclusivamente no servidor, com
            criptografia em repouso
          </li>
          <li>Comunicações realizadas exclusivamente via HTTPS/TLS</li>
          <li>
            Autenticação gerenciada via Supabase Auth com hashing seguro de
            senhas
          </li>
          <li>
            Acesso à base de dados restrito por permissões baseadas em função
            (RBAC)
          </li>
          <li>
            Logs de acesso e auditoria para monitoramento de atividades
            suspeitas
          </li>
        </ul>
        <p>
          Em caso de incidente de segurança que possa comprometer dados pessoais,
          notificaremos os usuários afetados e a Autoridade Nacional de
          Proteção de Dados (ANPD) dentro dos prazos estabelecidos pela LGPD.
        </p>
      </Section>

      <Section id="direitos" title="8. Direitos do Titular dos Dados">
        <p>
          Em conformidade com a LGPD, o titular dos dados tem os seguintes
          direitos, que podem ser exercidos a qualquer momento mediante
          solicitação:
        </p>
        <ul>
          <li>
            <strong>Confirmação:</strong> saber se tratamos dados pessoais seus
          </li>
          <li>
            <strong>Acesso:</strong> obter cópia dos dados que temos sobre você
          </li>
          <li>
            <strong>Correção:</strong> solicitar a atualização de dados
            incompletos ou incorretos
          </li>
          <li>
            <strong>Anonimização, bloqueio ou eliminação:</strong> de dados
            desnecessários ou tratados em desconformidade
          </li>
          <li>
            <strong>Portabilidade:</strong> receber seus dados em formato
            estruturado e legível
          </li>
          <li>
            <strong>Eliminação:</strong> solicitar a exclusão de dados tratados
            com base em consentimento
          </li>
          <li>
            <strong>Informação sobre compartilhamento:</strong> saber com quais
            entidades compartilhamos seus dados
          </li>
          <li>
            <strong>Revogação do consentimento:</strong> retirar o consentimento
            dado anteriormente
          </li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, entre em contato pelo e-mail{" "}
          <a href="mailto:agenciaconnex@gmail.com">
            agenciaconnex@gmail.com
          </a>
          . Responderemos às solicitações em até 15 dias úteis.
        </p>
      </Section>

      <Section id="retencao" title="9. Retenção e Exclusão de Dados">
        <p>
          Os dados são retidos pelo tempo necessário para a prestação dos
          serviços contratados, observando os seguintes critérios:
        </p>
        <DataTable
          headers={["Categoria", "Prazo de Retenção"]}
          rows={[
            ["Dados de cadastro", "Enquanto a conta estiver ativa"],
            ["Métricas de desempenho", "Até 90 dias"],
            ["Logs de acesso", "Até 12 meses"],
            [
              "Credenciais de contas desconectadas",
              "Até 30 dias após a desconexão",
            ],
            [
              "Dados de workspaces encerrados",
              "Até 30 dias após o encerramento do contrato",
            ],
          ]}
        />
        <p>
          Após o encerramento do período de retenção, os dados são
          permanentemente excluídos ou anonimizados de forma irreversível.
        </p>
      </Section>

      <Section id="cookies" title="10. Cookies e Tecnologias Semelhantes">
        <p>
          A Connex Insights utiliza cookies e tecnologias semelhantes para
          manter sessões de usuário autenticadas, garantir o funcionamento
          correto da plataforma e coletar dados de uso para melhoria contínua do
          serviço.
        </p>
        <p>
          Não utilizamos cookies para fins publicitários ou rastreamento de
          comportamento fora da plataforma. O usuário pode gerenciar as
          preferências de cookies nas configurações do seu navegador, embora a
          desativação de cookies essenciais possa comprometer o funcionamento da
          plataforma.
        </p>
      </Section>

      <Section id="menores" title="11. Menores de Idade">
        <p>
          A Connex Insights é destinada exclusivamente a usuários maiores de 18
          anos. Não coletamos intencionalmente dados pessoais de menores de
          idade. Caso identifiquemos que um usuário menor de 18 anos criou uma
          conta, excluiremos os dados associados imediatamente.
        </p>
      </Section>

      <Section id="alteracoes" title="12. Alterações nesta Política">
        <p>
          Esta Política de Privacidade pode ser atualizada periodicamente para
          refletir mudanças na legislação aplicável, nos serviços oferecidos ou
          nas práticas de tratamento de dados. Alterações relevantes serão
          comunicadas por e-mail aos usuários cadastrados com antecedência
          mínima de 10 dias antes de sua entrada em vigor.
        </p>
        <p>
          A versão sempre vigente estará disponível em{" "}
          <Link href="/privacy">insights.connexmkt.com.br/privacy</Link>.
          Recomendamos a revisão periódica deste documento.
        </p>
      </Section>

      <Section id="contato" title="13. Contato e Encarregado de Dados (DPO)">
        <p>
          Para dúvidas, solicitações ou reclamações relacionadas ao tratamento
          de dados pessoais, entre em contato com nosso canal de privacidade:
        </p>
        <DataTable
          headers={["Canal", "Informação"]}
          rows={[
            ["E-mail", "agenciaconnex@gmail.com"],
            ["Plataforma", "insights.connexmkt.com.br"],
            ["Endereço", "Natal/RN e Brasília/DF — Brasil"],
          ]}
        />
        <p>
          Caso não obtenha resposta satisfatória, você poderá registrar
          reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD):{" "}
          <Link href="https://www.gov.br/anpd">www.gov.br/anpd</Link>
        </p>
      </Section>

      <p className="mt-12 border-t border-border pt-8 text-sm text-muted-foreground">
        Connex Insights — insights.connexmkt.com.br | Versão 1.0 — Julho de
        2026
      </p>
    </LegalPageShell>
  );
}
