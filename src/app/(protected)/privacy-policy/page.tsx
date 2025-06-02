import { Metadata } from "next";

import { PageContainer } from "@/components/ui/page-container";

export const metadata: Metadata = {
  title: "Política de Privacidade | Doutor Agenda",
  description: "Política de Privacidade em conformidade com a LGPD",
};

const PrivacyPolicyPage = () => {
  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            📄 Política de Privacidade
          </h1>
          <p className="mt-2 text-lg text-gray-600">Doutor Agenda</p>
          <p className="mt-1 text-sm text-gray-500">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="prose prose-gray max-w-none">
          <div className="rounded-lg border bg-blue-50 p-6">
            <p className="text-sm leading-relaxed text-gray-700">
              A <strong>Doutor Agenda</strong>, pessoa jurídica de direito
              privado, comprometida com a transparência e a segurança dos dados,
              apresenta sua Política de Privacidade em conformidade com a{" "}
              <strong>
                Lei Geral de Proteção de Dados Pessoais (LGPD) – Lei nº
                13.709/2018
              </strong>
              .
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              1. Coleta de Dados
            </h2>
            <p className="text-gray-700">
              Coletamos os seguintes dados pessoais, quando necessários:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• Nome, e-mail, telefone e dados de identificação;</li>
              <li>• Informações médicas e de agendamentos;</li>
              <li>• Dados de acesso como IP, logs e preferências;</li>
              <li>• Fotos de perfil (quando fornecidas voluntariamente).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              2. Finalidade do Tratamento
            </h2>
            <p className="text-gray-700">
              Os dados coletados são utilizados para:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• Prestação adequada dos serviços de agenda médica;</li>
              <li>• Gerenciamento de consultas e prontuários;</li>
              <li>• Suporte ao cliente e comunicações transacionais;</li>
              <li>• Cumprimento de obrigações legais e regulatórias;</li>
              <li>
                • Segurança, prevenção à fraude e melhoria contínua da
                experiência.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              3. Compartilhamento de Dados
            </h2>
            <p className="text-gray-700">
              Seus dados <strong>não são vendidos</strong>, mas poderão ser
              compartilhados com:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>
                • Subprocessadores tecnológicos (ex.: serviços de nuvem e
                análise);
              </li>
              <li>• Autoridades públicas, mediante ordem legal ou judicial.</li>
            </ul>
            <p className="text-gray-700">
              Todos os terceiros seguem padrões de segurança compatíveis com a
              LGPD.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              4. Direitos do Titular
            </h2>
            <p className="text-gray-700">Você pode, a qualquer momento:</p>
            <ul className="space-y-2 text-gray-700">
              <li>• Confirmar a existência de tratamento de dados;</li>
              <li>
                • Solicitar acesso, correção, anonimização, portabilidade ou
                exclusão;
              </li>
              <li>• Revogar consentimentos concedidos.</li>
            </ul>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                📧 Para exercer seus direitos, entre em contato:
              </p>
              <p className="text-sm text-green-700">
                E-mail: <strong>dpo@doutoragenda.com.br</strong>
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              5. Segurança da Informação
            </h2>
            <p className="text-gray-700">
              Adotamos medidas técnicas e administrativas rigorosas para
              proteger seus dados pessoais contra acessos não autorizados,
              perda, alteração ou destruição, incluindo:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• Criptografia em trânsito e em repouso;</li>
              <li>• Controle de acesso baseado em funções;</li>
              <li>• Logs de segurança e monitoramento;</li>
              <li>• Backups regulares e seguros.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              6. Transferência Internacional
            </h2>
            <p className="text-gray-700">
              Caso seus dados sejam processados fora do Brasil, garantimos que o
              tratamento seguirá os requisitos da LGPD, incluindo cláusulas
              contratuais adequadas e países com grau de proteção equivalente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              7. Cookies e Tecnologias de Rastreamento
            </h2>
            <p className="text-gray-700">
              Utilizamos cookies essenciais e de análise para melhorar o
              desempenho e a personalização da plataforma. Você pode gerenciar
              suas preferências de cookies no painel de configurações do
              navegador.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              8. Retenção de Dados
            </h2>
            <p className="text-gray-700">
              Mantemos seus dados pelo tempo necessário para cumprir as
              finalidades descritas nesta política ou conforme exigido por lei.
              Dados médicos são mantidos conforme determinações do Conselho
              Federal de Medicina.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              9. Encarregado pelo Tratamento de Dados (DPO)
            </h2>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">
                <strong>Responsável:</strong> Encarregado de Dados - Doutor
                Agenda
              </p>
              <p className="text-sm text-blue-700">
                <strong>Contato:</strong> 📧 dpo@doutoragenda.com.br
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              10. Alterações nesta Política
            </h2>
            <p className="text-gray-700">
              Esta política pode ser atualizada periodicamente. Notificaremos
              sobre mudanças significativas através dos canais de comunicação da
              plataforma.
            </p>
          </section>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              📌 Referências Legais
            </h3>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <p>
                <strong>Lei Geral de Proteção de Dados (LGPD):</strong>
                <br />
                <a
                  href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm
                </a>
              </p>
              <p>
                <strong>
                  Autoridade Nacional de Proteção de Dados (ANPD):
                </strong>
                <br />
                <a
                  href="https://www.gov.br/anpd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://www.gov.br/anpd/
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default PrivacyPolicyPage;
