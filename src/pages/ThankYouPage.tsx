import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Lock,
  MessageSquare,
  Truck,
  ExternalLink,
  UploadCloud,
  FileText,
  Camera,
  Loader2,
  Eye,
  RefreshCw
} from "lucide-react";
import { trackLiveEvent } from "../services/liveTracker";
import { trackPurchase } from "../services/metaPixel";
import { trackTikTokCompletePayment } from "../services/tiktokPixel";
import "../styles/checkout.css";

interface ThankYouPageProps {
  orderId: string;
  onNavigateToTracking?: (code: string) => void;
}

const DEMO_ORDER = {
  id: "ORD-2026-DEMO",
  trackingReference: "MB-8F3K92",
  status: "pending_payment",
  amount: 350.46,
  pix: {
    copyPaste: "00020126580014br.gov.bcb.pix0136a8d9f123-4567-89ab-cdef-0123456789ab5204000053039865405350.465802BR5915MIRACLE STORE6009SAO PAULO62070503***6304",
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020126580014br.gov.bcb.pix0136a8d9f123-4567-89ab-cdef-0123456789ab5204000053039865405350.465802BR5915MIRACLE STORE6009SAO PAULO62070503***6304"
  }
};

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ orderId, onNavigateToTracking }) => {
  const [order, setOrder] = useState<any>(() => {
    if (typeof window === "undefined") return DEMO_ORDER;
    try {
      const stored = sessionStorage.getItem("miracle_order_" + orderId) || sessionStorage.getItem("miracle_latest_order");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          id: parsed.id || parsed.orderId || orderId || DEMO_ORDER.id,
          pix: parsed.pix || parsed.pixResult
        };
      }
    } catch (e) {}
    return { ...DEMO_ORDER, id: orderId || DEMO_ORDER.id };
  });

  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Receipt upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("O arquivo é muito grande. O tamanho máximo permitido é 15MB.");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSendReceipt = async () => {
    if (!selectedFile) return;
    const currentOrderId = order?.id || order?.orderId || orderId;
    if (!currentOrderId) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch(`/api/orders/${currentOrderId}/receipt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: currentOrderId,
              fileData: base64Data,
              fileName: selectedFile.name,
              fileType: selectedFile.type,
              fileSize: selectedFile.size
            })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setUploadSuccess(true);
            setOrder((prev: any) => ({
              ...prev,
              receipt: data.receipt
            }));
          } else {
            setUploadError(data.error || "Não foi possível enviar o comprovante. Tente novamente.");
          }
        } catch (err) {
          setUploadError("Erro de conexão ao enviar comprovante.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setIsUploading(false);
        setUploadError("Erro ao ler o arquivo selecionado.");
      };
    } catch (err) {
      setIsUploading(false);
      setUploadError("Erro ao processar envio do arquivo.");
    }
  };

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
            id: data.id || data.orderId || prev?.id || orderId,
            pix: data.pix || data.pixResult || prev?.pix,
            receipt: data.receipt || prev?.receipt
          }));
        }
      } catch (err) {
        // Silently keep demo/storage data on direct previews
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId]);

  const isPaid = order?.status === "paid" || order?.orderStatus === "paid";

  // Dispara eventos de conversão (Meta Purchase e TikTok CompletePayment) APENAS SE ESTIVER PAGO
  useEffect(() => {
    if (isPaid && order?.id && order.id !== "ORD-2026-DEMO") {
      const sessionKey = `purchase_tracked_${order.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "true");
        const eventId = `purchase_${order.id}`;
        const total = Number(order.amount || 0);

        // 1. Meta Pixel Standard Purchase Event (Browser)
        trackPurchase({ id: order.id, total }, eventId);

        // 2. TikTok Pixel Standard CompletePayment Event (Browser)
        trackTikTokCompletePayment({ id: order.id, total }, eventId);

        console.log("[Conversion] Fired Purchase & CompletePayment because order is PAID:", order.id);
      }
    }
  }, [isPaid, order?.id, order?.amount]);

  const handleCopyPix = async () => {
    const currentOrderId = order?.id || order?.orderId || orderId;
    const pixData = order?.pix || order?.pixResult;
    const copyText = pixData?.copyPaste || pixData?.copy_paste || pixData?.qrcode || pixData?.qrCode || "";

    if (copyText) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(copyText);
        } else {
          throw new Error("Clipboard API unavailable");
        }
      } catch (clipErr) {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = copyText;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
        } catch (e) {
          console.warn("Fallback copy failed", e);
        }
      }

      setCopiedPix(true);
      trackLiveEvent('pix_copied', { orderId: currentOrderId, path: window.location.pathname });

      if (currentOrderId) {
        try {
          fetch(`/api/orders/${currentOrderId}/pix-copied`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: currentOrderId,
              sessionId: sessionStorage.getItem('miracle_session_id') || ''
            })
          }).catch(() => {});
        } catch (apiErr) {
          console.error("Erro ao registrar pix copiado:", apiErr);
        }
      }

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

  if (!order) {
    return (
      <div className="checkout-container" style={{ justifyContent: "center", alignItems: "center", minHeight: "80dvh" }}>
        <div className="checkout-loading-spinner" />
        <p style={{ marginTop: "16px", fontWeight: 600 }}>Carregando dados do pedido...</p>
      </div>
    );
  }

  const pixData = order?.pix;
  const copyPasteText = pixData?.copyPaste || pixData?.copy_paste;
  let rawQr = pixData?.qrCode || pixData?.qrcode || pixData?.qrCodeUrl || copyPasteText;
  let qrCodeUrl = "";

  if (rawQr && typeof rawQr === "string") {
    if (rawQr.startsWith("http://") || rawQr.startsWith("https://") || rawQr.startsWith("data:image/")) {
      qrCodeUrl = rawQr;
    } else {
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(rawQr)}`;
    }
  }

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
                <div
                  className="ty-copypaste-box"
                  onClick={handleCopyPix}
                  style={{ cursor: "pointer" }}
                  title="Clique para copiar o código Pix"
                >
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

        {/* COMPROVANTE DE PAGAMENTO BLOCK */}
        {!isPaid && (
          <div
            className="checkout-card"
            style={{
              border: (order?.receipt || uploadSuccess) ? "1.5px solid #10b981" : "1.5px dashed #d8158a",
              backgroundColor: (order?.receipt || uploadSuccess) ? "#f0fdf4" : "#fdf2f8"
            }}
          >
            <h2
              className="checkout-card__title"
              style={{
                color: (order?.receipt || uploadSuccess) ? "#166534" : "#9d174d",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: 0
              }}
            >
              <UploadCloud size={20} color={(order?.receipt || uploadSuccess) ? "#10b981" : "#d8158a"} />
              {(order?.receipt || uploadSuccess) ? "Comprovante Pix Anexado!" : "Já pagou? Anexe seu Comprovante"}
            </h2>

            <p style={{ fontSize: "0.82rem", color: "#4b5563", margin: "4px 0 12px" }}>
              {(order?.receipt || uploadSuccess)
                ? "Recebemos o comprovante do seu pagamento! Nossa equipe já está validando para liberar seu envio com prioridade máxima."
                : "Envie a foto ou arquivo do comprovante do seu banco para acelerar a conferência e liberação imediata do seu envio."}
            </p>

            {(order?.receipt || uploadSuccess) ? (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #d1fae5"
                  }}
                >
                  {(order?.receipt?.fileType?.includes("pdf") || selectedFile?.type?.includes("pdf")) ? (
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "6px",
                        backgroundColor: "#fee2e2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <FileText size={24} color="#ef4444" />
                    </div>
                  ) : (
                    <img
                      src={filePreview || order?.receipt?.url || "/images/placeholder.png"}
                      alt="Comprovante"
                      style={{
                        width: "48px",
                        height: "48px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                        flexShrink: 0
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <strong
                      style={{
                        fontSize: "0.82rem",
                        color: "#111827",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {order?.receipt?.fileName || selectedFile?.name || "comprovante_pix.png"}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#059669",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "2px"
                      }}
                    >
                      <CheckCircle2 size={13} /> Aguardando liberação do envio
                    </span>
                  </div>
                  {order?.receipt?.url && (
                    <a
                      href={order.receipt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#10b981",
                        color: "#fff",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Eye size={14} /> Ver
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUploadSuccess(false);
                    setSelectedFile(null);
                    setFilePreview(null);
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    textDecoration: "underline",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    marginTop: "4px"
                  }}
                >
                  <RefreshCw size={12} /> Deseja trocar ou reenviar outro comprovante?
                </button>
              </div>
            ) : (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "20px 16px",
                      borderRadius: "10px",
                      border: "2px dashed #f472b6",
                      backgroundColor: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        backgroundColor: "#fdf2f8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Camera size={22} color="#d8158a" />
                    </div>
                    <strong style={{ fontSize: "0.88rem", color: "#1f2937" }}>
                      Tirar foto ou escolher comprovante
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      Formatos aceitos: Foto (JPG, PNG, WEBP) ou PDF do banco (máx. 15MB)
                    </span>
                  </div>
                ) : (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px",
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb"
                      }}
                    >
                      {filePreview ? (
                        <img
                          src={filePreview}
                          alt="Preview do comprovante"
                          style={{
                            width: "52px",
                            height: "52px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb"
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "6px",
                            backgroundColor: "#fee2e2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <FileText size={26} color="#ef4444" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <strong
                          style={{
                            fontSize: "0.82rem",
                            color: "#111827",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {selectedFile.name}
                        </strong>
                        <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        style={{
                          padding: "4px 8px",
                          background: "none",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "0.72rem",
                          color: "#6b7280",
                          cursor: "pointer"
                        }}
                      >
                        Trocar
                      </button>
                    </div>

                    {uploadError && (
                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          backgroundColor: "#fef2f2",
                          border: "1px solid #fecaca",
                          color: "#b91c1c",
                          fontSize: "0.78rem",
                          textAlign: "left"
                        }}
                      >
                        {uploadError}
                      </div>
                    )}

                    <button
                      type="button"
                      className="checkout-submit-btn"
                      onClick={handleSendReceipt}
                      disabled={isUploading}
                      style={{
                        backgroundColor: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        fontWeight: 700,
                        fontSize: "0.95rem"
                      }}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                          <span>Enviando Comprovante...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <span>ENVIAR COMPROVANTE AGORA</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
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
            href="https://wa.me/5512982890411?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20meu%20pedido."
            target="_blank"
            rel="noopener noreferrer"
            className="ty-whatsapp-btn"
          >
            <MessageSquare size={16} />
            Falar com Suporte no WhatsApp (12) 98289-0411
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
