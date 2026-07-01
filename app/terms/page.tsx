import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Termos de Serviço — Connex Insights",
  description:
    "Termos de uso da plataforma Connex Insights para clientes da Connex Agência de Marketing.",
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

export default function TermsPage() {
  return (
    <LegalPageShell title="Termos de Serviço" lastUpdated="julho de 2026">
      <Section id="aceitacao" title="1. Aceitação dos Termos">
        <p>
          Ao acessar ou utilizar a plataforma Connex Insights, disponível em{" "}
          <Link href="https://insights.connexmkt.com.br">
            insights.connexmkt.com.br
          </Link>
          , você declara ter lido, compreendido e concordado com estes Termos de
          Serviço e com nossa{" "}
          <Link href="/privacy">Política de Privacidade</Link>.
        </p>
        <p>
          Caso não concorde com qualquer disposição destes termos, você não deve
          utilizar a plataforma. O uso continuado da plataforma após alterações
          nos termos constitui aceitação das novas condições.
        </p>
      </Section>

      <Section id="descricao" title="2. Descrição do Serviço">
        <p>
          A Connex Insights é uma plataforma SaaS (Software as a Service) de
          análise de métricas de redes sociais desenvolvida e operada pela
          Connex Agência de Marketing. A plataforma permite que clientes da
          Connex:
        </p>
        <ul>
          <li>Conectem suas contas de redes sociais via OAuth</li>
          <li>
            Visualizem métricas e dados de desempenho em dashboards interativos
          </li>
          <li>
            Recebam relatórios semanais automatizados com análises geradas por
            Inteligência Artificial
          </li>
          <li>
            Acompanhem a evolução histórica do desempenho de suas contas
          </li>
        </ul>
        <p>
          O acesso à plataforma é concedido exclusivamente a clientes da Connex
          Agência de Marketing com contrato ativo de prestação de serviços.
        </p>
      </Section>

      <Section id="elegibilidade" title="3. Elegibilidade e Cadastro">
        <h3>3.1 Requisitos de Acesso</h3>
        <p>Para utilizar a Connex Insights, o usuário deve:</p>
        <ul>
          <li>
            Ser pessoa física maior de 18 anos ou representante legal de pessoa
            jurídica
          </li>
          <li>Ser cliente ativo da Connex Agência de Marketing</li>
          <li>
            Possuir credenciais de acesso válidas (e-mail e senha) fornecidas ou
            ativadas mediante convite
          </li>
          <li>
            Possuir as contas de redes sociais que deseja conectar
          </li>
        </ul>

        <h3>3.2 Responsabilidade pelas Credenciais</h3>
        <p>
          O usuário é inteiramente responsável pela confidencialidade de suas
          credenciais de acesso. É vedado compartilhar login e senha com
          terceiros não autorizados. Em caso de suspeita de acesso não
          autorizado, o usuário deve notificar imediatamente a Connex pelo
          e-mail{" "}
          <a href="mailto:suporte@connexmkt.com.br">suporte@connexmkt.com.br</a>
          .
        </p>
        <p>
          A Connex Insights não se responsabiliza por danos decorrentes do uso
          indevido de credenciais por terceiros em razão de negligência do
          usuário.
        </p>

        <h3>3.3 Organização (Tenant)</h3>
        <p>
          Cada cliente da Connex corresponde a uma organização isolada na
          plataforma. Todos os dados, contas conectadas e métricas estão
          restritos ao escopo da organização do usuário, sem possibilidade de
          acesso entre organizações distintas.
        </p>
      </Section>

      <Section id="uso-permitido" title="4. Uso Permitido">
        <h3>4.1 Licença de Uso</h3>
        <p>
          A Connex Insights concede ao usuário uma licença limitada, não
          exclusiva, intransferível e revogável para acessar e utilizar a
          plataforma exclusivamente para os fins descritos nestes Termos,
          durante a vigência do contrato com a Connex.
        </p>

        <h3>4.2 Usos Permitidos</h3>
        <p>O usuário está autorizado a:</p>
        <ul>
          <li>
            Acessar dashboards e relatórios das contas de redes sociais da sua
            organização
          </li>
          <li>
            Conectar e desconectar contas de redes sociais das quais é titular ou
            responsável legal
          </li>
          <li>
            Exportar dados e relatórios de sua organização para uso próprio
          </li>
          <li>
            Utilizar os relatórios gerados para fins internos de gestão e tomada
            de decisão
          </li>
        </ul>

        <h3>4.3 Usos Proibidos</h3>
        <p>É expressamente vedado ao usuário:</p>
        <ul>
          <li>
            Utilizar a plataforma para fins ilícitos ou em desacordo com estes
            Termos
          </li>
          <li>Tentar acessar dados de outras organizações ou usuários</li>
          <li>
            Realizar engenharia reversa, decompilar ou desmontar qualquer parte
            da plataforma
          </li>
          <li>
            Utilizar scripts, bots ou mecanismos automatizados para acessar a
            plataforma de forma não prevista
          </li>
          <li>Transmitir vírus, malware ou qualquer código malicioso</li>
          <li>
            Revender, sublicenciar ou ceder o acesso à plataforma a terceiros sem
            autorização expressa
          </li>
          <li>
            Utilizar os dados obtidos na plataforma para fins publicitários, de
            perfilamento ou comercialização de dados
          </li>
          <li>
            Conectar contas de redes sociais das quais não é titular ou não
            possui autorização expressa para gerenciar
          </li>
        </ul>
      </Section>

      <Section id="integracoes" title="5. Contas de Redes Sociais e Integrações">
        <h3>5.1 Autorização do Usuário</h3>
        <p>Ao conectar uma conta de rede social, o usuário:</p>
        <ul>
          <li>
            Autoriza expressamente a Connex Insights a acessar os dados de
            desempenho da conta via API oficial da plataforma
          </li>
          <li>
            Declara ser titular da conta ou possuir autorização do titular para
            conectá-la
          </li>
          <li>
            Confirma estar ciente das permissões concedidas no momento da
            autorização OAuth
          </li>
        </ul>

        <h3>5.2 Responsabilidade pelas Contas Conectadas</h3>
        <p>
          O usuário é o único responsável pelas contas de redes sociais
          conectadas à plataforma, incluindo o cumprimento dos termos de serviço
          de cada plataforma de origem (Meta, TikTok, YouTube, etc.).
        </p>
        <p>
          A Connex Insights não se responsabiliza por suspensões, restrições ou
          penalidades aplicadas pelas plataformas de redes sociais ao usuário ou
          às suas contas.
        </p>

        <h3>5.3 Disponibilidade das Integrações</h3>
        <p>
          As integrações com plataformas de redes sociais dependem das APIs
          disponibilizadas por terceiros. A Connex Insights não garante
          disponibilidade contínua dessas integrações, uma vez que mudanças nas
          políticas ou APIs das plataformas de origem podem impactar o
          funcionamento da coleta de dados sem aviso prévio.
        </p>
      </Section>

      <Section id="disponibilidade" title="6. Disponibilidade e Suporte">
        <h3>6.1 Disponibilidade da Plataforma</h3>
        <p>
          A Connex Insights empreenderá esforços razoáveis para manter a
          plataforma disponível continuamente. No entanto, não garantimos
          disponibilidade ininterrupta, podendo ocorrer interrupções decorrentes
          de:
        </p>
        <ul>
          <li>
            Manutenção programada (comunicada com antecedência sempre que
            possível)
          </li>
          <li>
            Falhas de infraestrutura de terceiros (Vercel, Supabase, Meta, etc.)
          </li>
          <li>Eventos de força maior ou caso fortuito</li>
          <li>Incidentes de segurança que exijam ação imediata</li>
        </ul>

        <h3>6.2 Suporte</h3>
        <p>
          O suporte à plataforma é prestado pela equipe da Connex por meio do
          canal{" "}
          <a href="mailto:suporte@connexmkt.com.br">suporte@connexmkt.com.br</a>
          . O prazo de resposta padrão é de até 2 dias úteis.
        </p>
      </Section>

      <Section id="propriedade" title="7. Propriedade Intelectual">
        <h3>7.1 Titularidade</h3>
        <p>
          A Connex Insights, incluindo seu código-fonte, design, marca,
          logotipos, interfaces, funcionalidades e conteúdos produzidos pela
          Connex, é de titularidade exclusiva da Connex Agência de Marketing.
          Todos os direitos reservados.
        </p>

        <h3>7.2 Dados do Usuário</h3>
        <p>
          Os dados de desempenho coletados das redes sociais do usuário
          pertencem ao próprio usuário. A Connex Insights não reivindica
          propriedade sobre esses dados e os utiliza exclusivamente para a
          prestação dos serviços descritos nestes Termos e na Política de
          Privacidade.
        </p>

        <h3>7.3 Análises Geradas por IA</h3>
        <p>
          Os relatórios e análises gerados automaticamente pela plataforma,
          incluindo os textos produzidos pela Claude API (Anthropic), são
          disponibilizados ao usuário como parte do serviço contratado. O
          usuário pode utilizá-los livremente para fins internos, sem que isso
          implique transferência de direitos sobre a tecnologia utilizada para
          gerá-los.
        </p>
      </Section>

      <Section id="responsabilidade" title="8. Limitação de Responsabilidade">
        <h3>8.1 Exclusões</h3>
        <p>
          Na máxima extensão permitida pela legislação aplicável, a Connex
          Insights não se responsabiliza por:
        </p>
        <ul>
          <li>
            Decisões tomadas pelo usuário com base nas métricas e análises
            exibidas na plataforma
          </li>
          <li>
            Imprecisões nos dados fornecidos pelas APIs de redes sociais de
            terceiros
          </li>
          <li>
            Perda de dados decorrente de falhas nas plataformas de
            infraestrutura (Vercel, Supabase)
          </li>
          <li>
            Danos indiretos, lucros cessantes ou danos consequenciais de qualquer
            natureza
          </li>
          <li>
            Indisponibilidade temporária da plataforma por fatores fora do
            controle da Connex
          </li>
        </ul>

        <h3>8.2 Precisão dos Dados</h3>
        <p>
          As métricas exibidas na plataforma refletem os dados fornecidos pelas
          APIs oficiais das redes sociais. A Connex Insights não garante que
          esses dados sejam completos, precisos ou atualizados em tempo real,
          uma vez que dependem da disponibilidade e integridade das APIs de
          origem.
        </p>

        <h3>8.3 Análises de IA</h3>
        <p>
          Os textos e análises gerados automaticamente por Inteligência Artificial
          têm caráter informativo e de apoio à decisão. Não constituem
          consultoria de marketing, financeira ou de qualquer outra natureza
          profissional. O usuário é responsável pela interpretação e uso dessas
          análises.
        </p>
      </Section>

      <Section id="vigencia" title="9. Vigência e Rescisão">
        <h3>9.1 Vigência</h3>
        <p>
          Estes Termos vigoram enquanto o usuário mantiver acesso ativo à
          plataforma, vinculado ao contrato de prestação de serviços com a Connex
          Agência de Marketing.
        </p>

        <h3>9.2 Rescisão pela Connex</h3>
        <p>
          A Connex reserva-se o direito de suspender ou encerrar o acesso do
          usuário à plataforma, com ou sem aviso prévio, nos seguintes casos:
        </p>
        <ul>
          <li>Violação de qualquer disposição destes Termos</li>
          <li>
            Encerramento ou inadimplência do contrato de serviços com a Connex
          </li>
          <li>
            Uso da plataforma para fins ilícitos ou prejudiciais a terceiros
          </li>
          <li>Solicitação de autoridades competentes</li>
        </ul>

        <h3>9.3 Rescisão pelo Usuário</h3>
        <p>
          O usuário pode encerrar o uso da plataforma a qualquer momento, desde
          que em conformidade com as condições do contrato de serviços firmado
          com a Connex.
        </p>

        <h3>9.4 Efeitos da Rescisão</h3>
        <p>Ao término do acesso, seja por qual motivo for:</p>
        <ul>
          <li>O acesso à plataforma será imediatamente revogado</li>
          <li>
            Os tokens de acesso das redes sociais conectadas serão invalidados
          </li>
          <li>
            Os dados da organização serão excluídos conforme os prazos
            estabelecidos na{" "}
            <Link href="/privacy">Política de Privacidade</Link>
          </li>
        </ul>
      </Section>

      <Section id="alteracoes" title="10. Alterações nos Termos">
        <p>
          A Connex reserva-se o direito de modificar estes Termos a qualquer
          momento. Alterações relevantes serão comunicadas por e-mail com
          antecedência mínima de 10 dias antes de sua entrada em vigor.
        </p>
        <p>
          O uso continuado da plataforma após a entrada em vigor das alterações
          constitui aceitação dos novos termos. Caso o usuário não concorde com
          as alterações, deverá cessar o uso da plataforma e comunicar a Connex
          pelo e-mail{" "}
          <a href="mailto:suporte@connexmkt.com.br">suporte@connexmkt.com.br</a>
          .
        </p>
        <p>
          A versão sempre vigente estará disponível em{" "}
          <Link href="/terms">insights.connexmkt.com.br/terms</Link>.
        </p>
      </Section>

      <Section id="legislacao" title="11. Legislação Aplicável e Foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil.
          Quaisquer disputas decorrentes ou relacionadas a estes Termos serão
          submetidas ao foro da Comarca de Natal/RN, com renúncia expressa a
          qualquer outro, por mais privilegiado que seja.
        </p>
      </Section>

      <Section id="disposicoes" title="12. Disposições Gerais">
        <ul>
          <li>
            <strong>Integralidade:</strong> Estes Termos, em conjunto com a
            Política de Privacidade, constituem o acordo integral entre o
            usuário e a Connex Insights sobre o uso da plataforma.
          </li>
          <li>
            <strong>Independência das cláusulas:</strong> Caso qualquer
            disposição destes Termos seja considerada inválida ou inexequível,
            as demais disposições permanecerão em pleno vigor e efeito.
          </li>
          <li>
            <strong>Não renúncia:</strong> A omissão da Connex em exigir o
            cumprimento de qualquer disposição destes Termos não constitui
            renúncia ao direito de fazê-lo no futuro.
          </li>
          <li>
            <strong>Cessão:</strong> A Connex pode ceder seus direitos e
            obrigações decorrentes destes Termos a terceiros, mediante
            notificação ao usuário. O usuário não pode ceder seus direitos sem
            autorização prévia e por escrito da Connex.
          </li>
        </ul>
      </Section>

      <Section id="contato" title="13. Contato">
        <p>
          Para dúvidas, solicitações ou notificações relacionadas a estes Termos
          de Serviço:
        </p>
        <DataTable
          headers={["Canal", "Informação"]}
          rows={[
            ["E-mail geral", "suporte@connexmkt.com.br"],
            ["E-mail de privacidade", "privacidade@connexmkt.com.br"],
            ["Plataforma", "insights.connexmkt.com.br"],
            ["Endereço", "Natal/RN e Brasília/DF — Brasil"],
          ]}
        />
      </Section>

      <p className="mt-12 border-t border-border pt-8 text-sm text-muted-foreground">
        Connex Insights — insights.connexmkt.com.br | Versão 1.0 — Julho de
        2026
      </p>
    </LegalPageShell>
  );
}
