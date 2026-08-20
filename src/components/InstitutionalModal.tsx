import React, { useState } from "react";
import { X, ShieldCheck, RefreshCw, Truck, Search, PackageCheck, CheckCircle2 } from "lucide-react";
import "./InstitutionalModal.css";

export type InstitutionalTab = "exchanges" | "privacy" | "tracking" | null;

interface InstitutionalModalProps {
  activeTab: InstitutionalTab;
  onClose: () => void;
}

export const InstitutionalModal: React.FC<InstitutionalModalProps> = ({ activeTab, onClose }) => {
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState<boolean | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (!activeTab) return null;

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setTrackingResult(true);
    }, 800);
  };

  return (
    <div className="inst-modal__backdrop" onClick={onClose}>
      <div className="inst-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="inst-modal__header">
          <h2>
            {activeTab === "exchanges" && "Política de Devolução e Reembolso"}
            {activeTab === "privacy" && "Política de Privacidade"}
            {activeTab === "tracking" && "Rastreio de Pedido"}
          </h2>
          <button className="inst-modal__close" onClick={onClose} aria-label="Fechar">
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="inst-modal__content">
          {/* TAB 1: TROCAS E DEVOLUÇÕES / POLÍTICA DE REEMBOLSO */}
          {activeTab === "exchanges" && (
            <div className="inst-modal__body">
              <div className="inst-modal__hero-badge">
                <RefreshCw size={24} color="#E54E88" />
                <div>
                  <strong>Política de Devolução e Reembolso</strong>
                  <p>Ao comprar em miraclebrasil.com, você concorda com este regulamento.</p>
                </div>
              </div>

              <p style={{ fontSize: "0.82rem", color: "#444", marginBottom: "12px" }}>
                Caro Cliente, aqui você encontrará informações importantes sobre seus direitos e responsabilidades. Caso tenha dúvidas, fale conosco em <strong>suporte@miracle.com</strong> ou WhatsApp <strong>(12) 98289-0411</strong>.
              </p>

              <h3>1. Pedido</h3>
              <p><strong>1.1)</strong> Os pedidos só serão válidos se realizados através do site oficial <strong>miraclebrasil.com</strong>. A Miracle não se responsabiliza por compras feitas em sites de terceiros.</p>
              <p><strong>1.2)</strong> Após a conclusão do pedido, você receberá um e-mail com a confirmação da compra e o número do pedido.</p>
              <p><strong>1.3)</strong> Verifique o e-mail de confirmação para garantir a exatidão do pedido e notifique qualquer discrepância imediatamente.</p>

              <h3>2. Formas de Pagamento</h3>
              <p><strong>2.1)</strong> Opções: boleto bancário (à vista), cartão de crédito e Pix.</p>
              <p><strong>2.1.1) Boleto:</strong> Entre em contato com nossa equipe para emissão. O boleto será enviado por e-mail e WhatsApp.</p>
              <p><strong>2.1.2) Cartão de Crédito:</strong> O Cliente deve utilizar cartão de sua titularidade ou com autorização expressa do titular.</p>
              <p><strong>2.1.3) Pix:</strong> Pagamento direto via QR Code no checkout ou enviado por e-mail e WhatsApp.</p>

              <h3>3. Confirmação de Pagamento</h3>
              <p><strong>3.1)</strong> O pedido só é processado após confirmação bancária. Pagamentos não confirmados acarretam cancelamento automático.</p>
              <p><strong>3.2/3.3)</strong> A Miracle reserva-se o direito de validação prévia de dados ou cancelamento em caso de suspeita de fraude comunicada pelas operadoras.</p>

              <h3>4. Entrega</h3>
              <p><strong>4.1)</strong> O prazo de entrega informado é uma estimativa sujeita a fatores externos.</p>
              <p><strong>4.2)</strong> Não nos responsabilizamos por prazos afetados por dados de entrega incorretos ou incompletos.</p>
              <p><strong>4.3/4.4)</strong> Em caso de recusa ou endereço incorreto fornecido pelo Cliente, o custo do reenvio será de responsabilidade do comprador.</p>

              <h3>5. Trocas e Devoluções</h3>
              <p><strong>5.1.1) Direito de Arrependimento:</strong> O Cliente pode exercer o direito de arrependimento em até <strong>7 dias corridos</strong> a partir do recebimento (Art. 49 do CDC). Não realizamos estornos de pedidos ainda em trânsito.</p>
              <p><strong>5.1.2)</strong> Solicitação via e-mail <strong>suporte@miracle.com</strong>.</p>
              <p><strong>5.1.3)</strong> O produto deve ser devolvido na embalagem original, sem danos, com todos os acessórios e manuais.</p>
              <p><strong>5.1.4)</strong> Enviaremos código de postagem reversa válido por 7 dias corridos para envio sem custos.</p>
            </div>
          )}

          {/* TAB 2: POLÍTICA DE PRIVACIDADE */}
          {activeTab === "privacy" && (
            <div className="inst-modal__body">
              <div className="inst-modal__hero-badge">
                <ShieldCheck size={24} color="#15803D" />
                <div>
                  <strong>Seus Dados 100% Protegidos</strong>
                  <p>Em conformidade rigorosa com a LGPD (Lei 13.709/2018).</p>
                </div>
              </div>

              <h3>1. Coleta e Uso de Informações</h3>
              <p>
                A <strong>MIRACLE</strong> coleta apenas as informações estritamente necessárias para processar seu pedido, efetuar a entrega e prestar suporte pós-venda.
              </p>

              <h3>2. Criptografia SSL e Segurança nos Pagamentos</h3>
              <p>
                Todas as transações bancárias e de cartão são processadas em ambiente seguro criptografado com tecnologia <strong>SSL 256-bit</strong>. A MIRACLE não armazena os dados do seu cartão de crédito.
              </p>

              <h3>3. Não Compartilhamento</h3>
              <p>
                Seus dados pessoais (nome, CPF, endereço, telefone e e-mail) <strong>jamais serão vendidos, alugados ou compartilhados</strong> com terceiros para fins publicitários.
              </p>

              <h3>4. Seus Direitos</h3>
              <p>
                A qualquer momento, você pode solicitar a alteração ou remoção completa de seus dados pessoais do nosso cadastro entrando em contato pelo suporte oficial.
              </p>
            </div>
          )}

          {/* TAB 3: RASTREIO DE PEDIDO */}
          {activeTab === "tracking" && (
            <div className="inst-modal__body">
              <div className="inst-modal__hero-badge">
                <Truck size={24} color="#E54E88" />
                <div>
                  <strong>Rastreamento em Tempo Real</strong>
                  <p>Acompanhe a entrega do seu produto MIRACLE.</p>
                </div>
              </div>

              <form onSubmit={handleTrackSubmit} className="inst-modal__track-form">
                <label htmlFor="trackingInput">Digite seu CPF:</label>
                <div className="inst-modal__track-input-group">
                  <input
                    id="trackingInput"
                    type="text"
                    placeholder="Ex: 000.000.000-00"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                  />
                  <button type="submit" disabled={isSearching}>
                    {isSearching ? "Buscando..." : <><Search size={16} /> Rastrear</>}
                  </button>
                </div>
              </form>

              {trackingResult && (
                <div className="inst-modal__track-timeline">
                  <h4>Status do Pedido: <span className="status-highlight">Em Transporte</span></h4>
                  
                  <div className="timeline-item completed">
                    <div className="timeline-icon"><CheckCircle2 size={18} /></div>
                    <div className="timeline-content">
                      <strong>Pedido Realizado & Aprovado</strong>
                      <small>Pagamento confirmado via Pix/Cartão</small>
                    </div>
                  </div>

                  <div className="timeline-item completed">
                    <div className="timeline-icon"><PackageCheck size={18} /></div>
                    <div className="timeline-content">
                      <strong>Separação & Embalagem Concluída</strong>
                      <small>Produto conferido pelo controle de qualidade</small>
                    </div>
                  </div>

                  <div className="timeline-item active">
                    <div className="timeline-icon"><Truck size={18} /></div>
                    <div className="timeline-content">
                      <strong>Em Transporte para sua Cidade</strong>
                      <small>Objeto em trânsito com código rastreável Correios/J&T</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
