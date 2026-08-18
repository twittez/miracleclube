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
            {activeTab === "exchanges" && "Trocas e Devoluções"}
            {activeTab === "privacy" && "Política de Privacidade"}
            {activeTab === "tracking" && "Rastreio de Pedido"}
          </h2>
          <button className="inst-modal__close" onClick={onClose} aria-label="Fechar">
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="inst-modal__content">
          {/* TAB 1: TROCAS E DEVOLUÇÕES */}
          {activeTab === "exchanges" && (
            <div className="inst-modal__body">
              <div className="inst-modal__hero-badge">
                <RefreshCw size={24} color="#E54E88" />
                <div>
                  <strong>Garantia Incondicional de 7 Dias</strong>
                  <p>Sua satisfação é nossa prioridade absoluta.</p>
                </div>
              </div>

              <h3>1. Direito de Arrependimento (CDC Art. 49)</h3>
              <p>
                Você tem até <strong>7 (sete) dias corridos</strong> após o recebimento do seu produto para solicitar a troca ou devolução por qualquer motivo. A primeira troca é 100% gratuita!
              </p>

              <h3>2. Condições Gerais para Troca ou Devolução</h3>
              <ul>
                <li>O produto deve estar com as etiquetas e lacres originais intactos.</li>
                <li>Não deve conter indícios de uso, lavagem, odores ou modificações no tecido.</li>
                <li>Deve ser enviado na embalagem original acompanhado do comprovante de compra.</li>
              </ul>

              <h3>3. Como Solicitar</h3>
              <p>
                Entre em contato com nossa equipe de suporte pelo WhatsApp <strong>(37) 99155-0358</strong> ou pelo e-mail <strong>suporte@miracle.com</strong> informando o número do pedido e o motivo da troca.
              </p>

              <h3>4. Prazos de Restituição</h3>
              <p>
                Em caso de devolução, o reembolso é efetuado em até <strong>2 dias úteis</strong> após o recebimento do produto no nosso centro de distribuição (para Pix/Boleto) ou estorno imediato na fatura do seu cartão de crédito.
              </p>
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
                <label htmlFor="trackingInput">Digite seu Código de Rastreio ou CPF:</label>
                <div className="inst-modal__track-input-group">
                  <input
                    id="trackingInput"
                    type="text"
                    placeholder="Ex: MB987654321BR ou 000.000.000-00"
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
