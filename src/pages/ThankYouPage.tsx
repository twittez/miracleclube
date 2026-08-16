import React, { useState, useEffect } from "react";
import { CheckCircle2, Copy, Check, QrCode, Lock, MessageSquare, Truck, ExternalLink } from "lucide-react";
import "../styles/checkout.css";

interface ThankYouPageProps {
  orderId: string;
  onNavigateToTracking?: (code: string) => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ orderId, onNavigateToTracking }) => {
  const [order, setOrder] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem("miracle_order_" + orderId) || sessionStorage.getItem("miracle_latest_order");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  const [loading, setLoading] = useState(!order);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    let intervalId: any = null;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/orders/" + orderId + "/status");
        if (res.ok) {
          const data = await res.json();
          setOrder((prev: any) => ({
            ...prev,
            ...data,
            pix: data.pix || data.pixResult || prev?.pix
          }));
        }
      } catch (err) {
        console.error("Error fetching order status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId]);

  const handleCopyPix = () => {
    const copyText = order?.pix?.copyPaste || order?.pix?.copy_paste || order?.pix?.qrCode;
    if (copyText) {
      navigator.clipboard.writeText(copyText);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  const handleCopyTracking = () => {
    const trackingCode = order?.trackingReference || order?.tracking_reference;
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="checkout-container" style={{ justifyContent: "center", alignItems: "center", minHeight: "80dvh" }}>
        <div className="checkout-loading-spinner" />
        <p style={{ marginTop: "16px", fontWeight: 600 }}>Carregando dados do pedido...</p>
      </div>
    );
  }

  const isPaid = order?.status === "paid" || order?.orderStatus === "paid";
  const pixData = order?.pix;
  const qrCodeUrl = pixData?.qrCode || pixData?.qrcode || pixData?.qrCodeUrl;
  const copyPasteText = pixData?.copyPaste || pixData?.copy_paste;

  return (
    <div className="checkout-container">
      <header className="checkout-header">
        <img src="/images/checkout/logo.png" alt="MIRACLE" className="checkout-header__logo" />
      </header>

      <main className="checkout-body">
        <div className="checkout-card" style={{ textAlign: "center", alignItems: "center" }}>
          <div className={isPaid ? "ty-status-icon paid" : "ty-status-icon pending"}>
            <CheckCircle2 size={32} />
          </div>

          <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111", margin: 0 }}>
            {isPaid ? "PAGAMENTO CONFIRMADO!" : "PEDIDO RECEBIDO!"}
          </h1>

          <p style={{ fontSize: "0.85rem", color: "#4B5563", margin: 0 }}>
            {isPaid
              ? "Seu pagamento foi confirmado com sucesso. Estamos preparando seu pedido!"
              : "Seu pedido foi registrado. Realize o pagamento Pix abaixo para envio imediato."}
          </p>

          <div className="ty-order-badge">
            <span>Pedido: #{orderId}</span>
            <span>•</span>
            <span style={{ color: isPaid ? "#16A34A" : "#D97706" }}>
              {isPaid ? "PAGAMENTO CONFIRMADO" : "AGUARDANDO PAGAMENTO"}
            </span>
          </div>
        </div>

        {/* PIX QR CODE & COPY-PASTE BLOCK */}
        {!isPaid && (pixData || copyPasteText || qrCodeUrl) && (
          <div className="checkout-card" style={{ textAlign: "center", alignItems: "center" }}>
            <h2 className="checkout-card__title" style={{ justifyContent: "center", width: "100%" }}>
              <QrCode size={20} color="#d8158a" />
              Pague com Pix para Liberar a Entrega
            </h2>

            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="QR Code Pix"
                style={{
                  maxWidth: "240px",
                  width: "75%",
                  height: "auto",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  padding: "8px",
                  backgroundColor: "#FFFFFF"
                }}
              />
            )}

            {copyPasteText && (
              <div style={{ width: "100%", textAlign: "left" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "4px" }}>
                  Pix Copia e Cola:
                </label>
                <div className="ty-copypaste-box">
                  {copyPasteText}
                </div>
              </div>
            )}

            <button
              type="button"
              className="checkout-submit-btn"
              onClick={handleCopyPix}
              style={{ backgroundColor: copiedPix ? "#16A34A" : "#d8158a" }}
            >
              {copiedPix ? (
                <>
                  <Check size={18} />
                  <span>Código PIX Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span>COPIAR CÓDIGO PIX</span>
                </>
              )}
            </button>

            <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
              Após o pagamento, esta página atualiza automaticamente em poucos segundos.
            </span>
          </div>
        )}

        {/* TRACKING CODE BLOCK */}
        <div className="checkout-card">
          <h2 className="checkout-card__title">
            <Truck size={18} color="#d8158a" />
            Código de Acompanhamento do Pedido
          </h2>

          <div className="ty-tracking-box">
            <div>
              <span style={{ fontSize: "0.72rem", color: "#6B7280", display: "block", textTransform: "uppercase" }}>
                Código de Acompanhamento
              </span>
              <strong style={{ fontSize: "1.1rem", color: "#d8158a", letterSpacing: "1px" }}>
                {order?.trackingReference || order?.tracking_reference || "MB-8F3K92"}
              </strong>
            </div>

            <button
              type="button"
              className="ty-copy-btn"
              onClick={handleCopyTracking}
            >
              {copiedTracking ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedTracking ? "Copiado!" : "Copiar"}</span>
            </button>
          </div>

          <p style={{ fontSize: "0.78rem", color: "#4B5563", margin: 0 }}>
            Você pode acompanhar o andamento do seu pedido a qualquer momento digitando este código na nossa{" "}
            {onNavigateToTracking && (
              <button
                type="button"
                onClick={() => onNavigateToTracking(order?.trackingReference || order?.tracking_reference || "MB-8F3K92")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#d8158a",
                  fontWeight: 700,
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Página de Rastreio <ExternalLink size={12} style={{ display: "inline" }} />
              </button>
            )}
          </p>
        </div>

        {/* SUPPORT BLOCK */}
        <div className="checkout-card" style={{ backgroundColor: "#F9FAFB" }}>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <MessageSquare size={16} color="#25D366" />
            Precisa de ajuda com o seu pedido?
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#4B5563", margin: 0 }}>
            Nossa equipe de atendimento no WhatsApp está disponível para tirar qualquer dúvida:
          </p>
          <a
            href="https://wa.me/5537991550358?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20meu%20pedido."
            target="_blank"
            rel="noopener noreferrer"
            className="ty-whatsapp-btn"
          >
            <MessageSquare size={16} />
            Falar com Suporte no WhatsApp (37) 99155-0358
          </a>
        </div>
      </main>

      <footer className="checkout-footer">
        <p className="checkout-footer__text">MIRACLE - CNPJ: 59.291.162/0001-79 | Todos os direitos reservados</p>
        <div className="checkout-footer__security">
          <Lock size={14} color="#000" />
          <span>PAGAMENTO 100% SEGURO</span>
        </div>
      </footer>
    </div>
  );
};
