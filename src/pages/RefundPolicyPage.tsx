import React from "react";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";
import "../styles/checkout.css";

interface RefundPolicyPageProps {
  onNavigateHome: () => void;
}

export const RefundPolicyPage: React.FC<RefundPolicyPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="checkout-container">
      <header className="checkout-header" style={{ position: "relative" }}>
        <button
          type="button"
          onClick={onNavigateHome}
          style={{
            position: "absolute",
            left: "16px",
            background: "none",
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.8rem",
            fontWeight: 600
          }}
        >
          <ArrowLeft size={18} /> Loja
        </button>
        <img src="/images/checkout/logo.png" alt="MIRACLE" className="checkout-header__logo" />
      </header>

      <main className="checkout-body">
        <div className="checkout-card" style={{ padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <FileText size={24} color="#d8158a" />
            <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111", margin: 0 }}>
              Política de Devolução e Reembolso
            </h1>
          </div>

          <div style={{
            backgroundColor: "#FDF2F6",
            border: "1px solid #F9D0E0",
            borderRadius: "8px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px"
          }}>
            <ShieldCheck size={22} color="#d8158a" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: "0.82rem", color: "#831843", margin: 0, lineHeight: 1.45 }}>
              Ao realizar qualquer compra em nosso site: <strong>miraclebrasil.com</strong>, você concorda automaticamente com as disposições descritas neste regulamento.
            </p>
          </div>

          <div style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ margin: 0 }}>
              Caro Cliente, aqui você encontrará informações importantes sobre seus direitos e responsabilidades, bem como os procedimentos que precisam ser seguidos. Recomendamos que leia com atenção todas as orientações abaixo.
            </p>
            <p style={{ margin: 0 }}>
              Caso tenha qualquer dúvida, entre em contato conosco através dos canais de atendimento disponíveis em nosso site (E-mail: <strong>suporte@miracle.com</strong> | WhatsApp: <strong>(12) 98289-0411</strong>).
            </p>

            {/* SEÇÃO 1: PEDIDO */}
            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "14px" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111", margin: "0 0 8px 0", textTransform: "uppercase" }}>
                1. Pedido
              </h2>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>1.1)</strong> Os pedidos só serão considerados válidos se forem feitos através do nosso site oficial <strong>miraclebrasil.com</strong>. A Miracle não se responsabiliza por compras feitas em sites de terceiros ou por quaisquer modificações ou fraudes que possam ocorrer nos dispositivos usados para acessar a internet.
              </p>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>1.2)</strong> Após a conclusão do pedido, você receberá um e-mail com a confirmação da compra e o número do pedido.
              </p>
              <p style={{ margin: 0 }}>
                <strong>1.3)</strong> É importante que o cliente verifique o e-mail de confirmação para garantir que o pedido esteja correto. Se houver qualquer discrepância, entre em contato com a nossa central de atendimento para correção.
              </p>
            </div>

            {/* SEÇÃO 2: FORMAS DE PAGAMENTO */}
            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "14px" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111", margin: "0 0 8px 0", textTransform: "uppercase" }}>
                2. Formas de Pagamento
              </h2>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>2.1)</strong> As opções de pagamento disponíveis são: boleto bancário (à vista), cartão de crédito e Pix. Os detalhes sobre taxas e juros estarão disponíveis no momento da compra.
              </p>

              <div style={{ paddingLeft: "12px", borderLeft: "2px solid #E5E7EB", display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                <div>
                  <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#111", margin: "0 0 4px 0" }}>2.1.1) Boleto Bancário</h3>
                  <p style={{ margin: "0 0 4px 0" }}><strong>2.1.1.1)</strong> Para pagar via boleto bancário, o Cliente deve entrar em contato com nossa equipe para que possamos emitir o boleto.</p>
                  <p style={{ margin: 0 }}><strong>2.1.1.2)</strong> O boleto será enviado por e-mail após a finalização da compra. Ele também será enviado via WhatsApp para o número informado no momento da compra.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#111", margin: "0 0 4px 0" }}>2.1.2) Cartão de Crédito</h3>
                  <p style={{ margin: "0 0 4px 0" }}><strong>2.1.2.1)</strong> Para pagamentos com cartão de crédito, o Cliente deve utilizar um cartão de sua própria titularidade, responsabilizando-se pelo uso correto. Caso utilize o cartão de outra pessoa, será necessário obter autorização prévia do titular para realizar a compra no nosso site.</p>
                  <p style={{ margin: "0 0 4px 0" }}><strong>2.1.2.2)</strong> A Miracle se reserva no direito de solicitar informações adicionais para validar a autorização do titular do cartão.</p>
                  <p style={{ margin: "0 0 4px 0" }}><strong>2.1.2.3)</strong> O Cliente que utilizar o cartão de crédito de outra pessoa sem a devida autorização será responsável por quaisquer danos causados à Miracle e a terceiros, sujeitando-se às sanções legais.</p>
                  <p style={{ margin: 0 }}><strong>2.1.2.4)</strong> Fique atento ao limite do seu cartão de crédito, estabelecido pela administradora.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#111", margin: "0 0 4px 0" }}>2.1.3) Pix</h3>
                  <p style={{ margin: "0 0 4px 0" }}><strong>2.1.3.1)</strong> Para pagamentos por Pix, o Cliente pode utilizar o QR Code disponível no checkout para efetuar o pagamento diretamente.</p>
                  <p style={{ margin: 0 }}><strong>2.1.3.2)</strong> O Pix será enviado por e-mail após a finalização da compra. Ele também será enviado via WhatsApp para o número informado no momento da compra.</p>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: CONFIRMAÇÃO DE PAGAMENTO */}
            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "14px" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111", margin: "0 0 8px 0", textTransform: "uppercase" }}>
                3. Confirmação de Pagamento
              </h2>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>3.1)</strong> O pedido só será processado após a confirmação do pagamento pela instituição financeira. Caso o pagamento não seja confirmado, o pedido será automaticamente cancelado.
              </p>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>3.2)</strong> A Miracle pode solicitar uma validação prévia de dados ou comprovantes de pagamento antes de confirmar o pedido, para evitar fraudes.
              </p>
              <p style={{ margin: 0 }}>
                <strong>3.3)</strong> A Miracle reserva-se o direito de cancelar uma compra e suspender a entrega do produto em caso de suspeita de fraude, comunicada pela operadora de cartão de crédito ou por outros meios legais. Nesse caso, não nos responsabilizamos por qualquer inconveniente gerado ao Cliente.
              </p>
            </div>

            {/* SEÇÃO 4: ENTREGA */}
            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "14px" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111", margin: "0 0 8px 0", textTransform: "uppercase" }}>
                4. Entrega
              </h2>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>4.1)</strong> O prazo de entrega informado no momento da compra é apenas uma estimativa e pode ser alterado devido a fatores fora do controle da Miracle.
              </p>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>4.2)</strong> Não nos responsabilizamos por falhas no cumprimento dos prazos de entrega causadas por informações incorretas ou incompletas no endereço de entrega, problemas com a transportadora ou eventos fora de nosso controle, como força maior.
              </p>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>4.3)</strong> Em caso de áreas de risco ou zonas de difícil acesso, o prazo de entrega pode ser afetado. O Cliente deve verificar se reside em uma dessas áreas antes de finalizar a compra.
              </p>
              <p style={{ margin: 0 }}>
                <strong>4.4)</strong> Caso o Cliente se recuse a receber o produto ou forneça um endereço incorreto, será responsável pelo custo do reenvio do pedido.
              </p>
            </div>

            {/* SEÇÃO 5: TROCAS E DEVOLUÇÕES */}
            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "14px" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111", margin: "0 0 8px 0", textTransform: "uppercase" }}>
                5. Trocas e Devoluções
              </h2>
              <p style={{ margin: "0 0 8px 0" }}>
                Para realizar uma troca ou devolução, siga o procedimento informado no nosso site.
              </p>

              <div style={{ paddingLeft: "12px", borderLeft: "2px solid #d8158a", display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#d8158a", margin: 0 }}>
                  5.1) Direito de Arrependimento
                </h3>
                <p style={{ margin: 0 }}>
                  <strong>5.1.1)</strong> O Cliente pode exercer o Direito de Arrependimento em até <strong>7 dias corridos</strong> a partir da data de recebimento do produto, conforme o artigo 49 do Código de Defesa do Consumidor. Não realizamos estornos de pedidos que ainda estejam em trânsito.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>5.1.2)</strong> Para solicitar a devolução, entre em contato por e-mail através de <strong>suporte@miracle.com</strong>. Se a devolução for rejeitada, os valores pagos não serão reembolsados.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>5.1.3)</strong> O produto deve ser devolvido na embalagem original, sem danos, com todos os acessórios e manuais.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>5.1.4)</strong> Após o recebimento da solicitação, enviaremos um código para postagem reversa, válido por <strong>7 dias corridos</strong>, para que o Cliente envie o produto de volta sem custos. Em algumas regiões, o Cliente pode precisar arcar com o custo de envio, mas será reembolsado posteriormente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="checkout-footer">
        <p className="checkout-footer__text">MIRACLE - CNPJ: 59.291.162/0001-79 | Todos os direitos reservados</p>
      </footer>
    </div>
  );
};
