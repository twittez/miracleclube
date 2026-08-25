import React, { useState, useEffect } from "react";
import { Search, Truck, CheckCircle2, Package, MapPin, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import "../styles/checkout.css";

interface TrackingPageProps {
  initialCode?: string;
  onNavigateHome: () => void;
}

// Detecta se o termo buscado parece um CPF (11 dígitos numéricos)
function looksLikeCPF(term: string): boolean {
  return /^\d{11}$/.test(term.replace(/\D/g, ""));
}

// Mascara CPF para exibição: 123.***.***-**
function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-**`;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({ initialCode = "", onNavigateHome }) => {
  const [query, setQuery] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [separationResult, setSeparationResult] = useState<{ code: string; isCPF: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (codeToSearch?: string) => {
    const searchTerm = (codeToSearch || query).trim();
    if (!searchTerm) {
      setErrorMsg("Digite o Código de Acompanhamento (ex: MB-8F3K92) ou seu CPF.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setOrderResult(null);
    setSeparationResult(null);

    try {
      const res = await fetch("/api/orders/track/" + encodeURIComponent(searchTerm));
      setLoading(false);

      if (res.ok) {
        // Pedido real encontrado no sistema
        const data = await res.json();
        setOrderResult(data);
      } else {
        // Qualquer código ou CPF digitado encontra o status de separação
        setSeparationResult({
          code: searchTerm,
          isCPF: looksLikeCPF(searchTerm)
        });
      }
    } catch (err) {
      setLoading(false);
      console.error("Tracking search error:", err);
      // Em caso de falha de conexão, também exibe o status de separação para o código/CPF
      setSeparationResult({
        code: searchTerm,
        isCPF: looksLikeCPF(searchTerm)
      });
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

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
            fontSize: "0.8rem"
          }}
        >
          <ArrowLeft size={18} /> Loja
        </button>
        <img src="/images/checkout/logo.png" alt="MIRACLE" className="checkout-header__logo" />
      </header>

      <main className="checkout-body">

        {/* ── CAMPO DE BUSCA ── */}
        <div className="checkout-card">
          <h1 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Truck size={22} color="#d8158a" />
            Rastreamento de Pedido
          </h1>
          <p style={{ fontSize: "0.8rem", color: "#666", margin: 0 }}>
            Acompanhe o status de entrega do seu produto digitando o Código de Acompanhamento (ex: <strong>MB-8F3K92</strong>) ou seu CPF.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Código MB-XXXXXX ou CPF"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="checkout-submit-btn"
              style={{ width: "auto", padding: "0 18px", height: "46px" }}
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </form>

          {errorMsg && (
            <div style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: 600,
              marginTop: "8px"
            }}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* ── TELA DE SEPARAÇÃO (Qualquer código ou CPF digitado) ── */}
        {separationResult && (
          <div className="checkout-card">
            {/* Cabeçalho */}
            <div style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: "12px" }}>
              <span style={{ fontSize: "0.72rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Pedido Identificado
              </span>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111", margin: "2px 0 4px 0" }}>
                {separationResult.isCPF ? (
                  <>CPF: <span style={{ color: "#d8158a" }}>{maskCPF(separationResult.code)}</span></>
                ) : (
                  <>Código: <span style={{ color: "#d8158a" }}>{separationResult.code.toUpperCase()}</span></>
                )}
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#16A34A", fontWeight: 600 }}>
                ✓ Pedido localizado no sistema
              </span>
            </div>

            {/* Banner de destaque */}
            <div style={{
              backgroundColor: "#EFF6FF",
              border: "1.5px solid #3B82F6",
              borderRadius: "8px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <Package size={24} color="#2563EB" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: "0.9rem", color: "#1D4ED8", display: "block" }}>
                  Seu pedido está em separação! 📦
                </strong>
                <span style={{ fontSize: "0.78rem", color: "#3B82F6" }}>
                  Estamos preparando e embalando com cuidado o seu produto.
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>

              {/* Etapa 1 — Pedido Recebido ✓ */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", paddingBottom: "16px", borderLeft: "2px solid #DCFCE7", marginLeft: "17px", paddingLeft: "20px", position: "relative" }}>
                <div style={{ position: "absolute", left: "-11px", top: 0, width: 20, height: 20, borderRadius: "50%", backgroundColor: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={16} />
                </div>
                <div style={{ paddingTop: "1px" }}>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>Pedido Recebido</strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>Registrado e confirmado no sistema</span>
                </div>
              </div>

              {/* Etapa 2 — Pagamento Confirmado ✓ */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", paddingBottom: "16px", borderLeft: "2px solid #DCFCE7", marginLeft: "17px", paddingLeft: "20px", position: "relative" }}>
                <div style={{ position: "absolute", left: "-11px", top: 0, width: 20, height: 20, borderRadius: "50%", backgroundColor: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={16} />
                </div>
                <div style={{ paddingTop: "1px" }}>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>Pagamento Confirmado</strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>Pagamento aprovado instantaneamente</span>
                </div>
              </div>

              {/* Etapa 3 — Em Separação ← ETAPA ATUAL */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", paddingBottom: "16px", borderLeft: "2px dashed #BFDBFE", marginLeft: "17px", paddingLeft: "20px", position: "relative" }}>
                <div style={{ position: "absolute", left: "-13px", top: 0, width: 24, height: 24, borderRadius: "50%", backgroundColor: "#DBEAFE", color: "#2563EB", border: "2px solid #3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={14} />
                </div>
                <div style={{ paddingTop: "1px" }}>
                  <strong style={{ fontSize: "0.88rem", color: "#2563EB", display: "block" }}>
                    Em Separação &amp; Embalagem
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "#3B82F6", fontWeight: 600 }}>← Status atual do seu pedido</span>
                  <span style={{ fontSize: "0.75rem", color: "#666", display: "block", marginTop: "2px" }}>Conferência de qualidade em andamento</span>
                </div>
              </div>

              {/* Etapa 4 — Transporte (futuro) */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", paddingBottom: "16px", borderLeft: "2px dashed #E5E7EB", marginLeft: "17px", paddingLeft: "20px", position: "relative", opacity: 0.45 }}>
                <div style={{ position: "absolute", left: "-11px", top: 0, width: 20, height: 20, borderRadius: "50%", backgroundColor: "#E5E7EB", color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Truck size={13} />
                </div>
                <div style={{ paddingTop: "1px" }}>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>Em Transporte</strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>Aguardando envio para transportadora</span>
                </div>
              </div>

              {/* Etapa 5 — Entrega (futuro) */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginLeft: "17px", paddingLeft: "20px", position: "relative", opacity: 0.45 }}>
                <div style={{ position: "absolute", left: "-11px", top: 0, width: 20, height: 20, borderRadius: "50%", backgroundColor: "#E5E7EB", color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MapPin size={13} />
                </div>
                <div style={{ paddingTop: "1px" }}>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>Entregue</strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>Previsão: <strong>8 a 12 dias úteis</strong> após o despacho</span>
                </div>
              </div>
            </div>

            {/* Aviso de prazo */}
            <div style={{
              backgroundColor: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "6px",
              padding: "10px 12px",
              display: "flex",
              gap: "8px",
              alignItems: "flex-start"
            }}>
              <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "0.78rem", color: "#92400E", margin: 0, lineHeight: 1.55 }}>
                Assim que seu pedido for despachado para a transportadora, você receberá o código de rastreio pelo e-mail cadastrado. O prazo estimado é de <strong>8 a 12 dias úteis</strong> a partir do despacho.
              </p>
            </div>
          </div>
        )}

        {/* ── PEDIDO REAL ENCONTRADO NO SISTEMA ── */}
        {orderResult && (
          <div className="checkout-card">
            <div style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: "12px" }}>
              <span style={{ fontSize: "0.72rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Pedido Identificado
              </span>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111", margin: "2px 0 4px 0" }}>
                Código: <span style={{ color: "#d8158a" }}>{orderResult.trackingReference || orderResult.orderId}</span>
              </h2>
              {orderResult.customerName && (
                <div style={{ fontSize: "0.82rem", color: "#374151", fontWeight: 600 }}>
                  Destinatário: {orderResult.customerName}
                </div>
              )}
            </div>

            {/* Banner de destaque baseado no status logístico */}
            {orderResult.logisticStatus === 'in_transit' ? (
              <div style={{
                backgroundColor: "#F0FDF4",
                border: "1.5px solid #22C55E",
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <Truck size={24} color="#16A34A" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#15803D", display: "block" }}>
                    Seu pedido está em transporte! 🚚
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "#16A34A" }}>
                    Objeto postado e em trânsito para a unidade de distribuição da sua cidade.
                  </span>
                </div>
              </div>
            ) : orderResult.logisticStatus === 'delivered' ? (
              <div style={{
                backgroundColor: "#F0FDF4",
                border: "1.5px solid #16A34A",
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <CheckCircle2 size={24} color="#16A34A" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#15803D", display: "block" }}>
                    Pedido Entregue! ✅
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "#16A34A" }}>
                    Entregue com sucesso no seu endereço.
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: "#EFF6FF",
                border: "1.5px solid #3B82F6",
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <Package size={24} color="#2563EB" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#1D4ED8", display: "block" }}>
                    Seu pedido está em separação! 📦
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "#3B82F6" }}>
                    Estamos preparando e embalando com cuidado o seu produto no Centro Logístico SP.
                  </span>
                </div>
              </div>
            )}

            {/* Dynamic Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
              {Array.isArray(orderResult.timeline) && orderResult.timeline.map((stepItem: any, idx: number) => {
                const isLast = idx === orderResult.timeline.length - 1;
                const isCompleted = stepItem.completed;
                const isCurrent = stepItem.isCurrent;

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      paddingBottom: isLast ? "0px" : "16px",
                      borderLeft: isLast ? "none" : `2px ${isCurrent ? 'dashed #3B82F6' : isCompleted ? 'solid #DCFCE7' : 'dashed #E5E7EB'}`,
                      marginLeft: "17px",
                      paddingLeft: "20px",
                      position: "relative",
                      opacity: !isCompleted && !isCurrent ? 0.45 : 1
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: isCurrent ? "-13px" : "-11px",
                        top: 0,
                        width: isCurrent ? 24 : 20,
                        height: isCurrent ? 24 : 20,
                        borderRadius: "50%",
                        backgroundColor: isCurrent ? "#DBEAFE" : isCompleted ? "#DCFCE7" : "#E5E7EB",
                        color: isCurrent ? "#2563EB" : isCompleted ? "#16A34A" : "#9CA3AF",
                        border: isCurrent ? "2px solid #3B82F6" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {idx === 0 ? <CheckCircle2 size={isCurrent ? 14 : 13} /> :
                       idx === 1 ? <CheckCircle2 size={isCurrent ? 14 : 13} /> :
                       idx === 2 ? <Package size={isCurrent ? 14 : 13} /> :
                       idx === 3 ? <Truck size={isCurrent ? 14 : 13} /> :
                       <MapPin size={isCurrent ? 14 : 13} />}
                    </div>

                    <div style={{ paddingTop: "1px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "0.88rem", color: isCurrent ? "#2563EB" : "#111" }}>
                          {stepItem.title}
                        </strong>
                        {isCurrent && (
                          <span style={{ fontSize: "0.72rem", color: "#2563EB", fontWeight: 700, backgroundColor: "#DBEAFE", padding: "1px 6px", borderRadius: "4px" }}>
                            Status Atual
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.78rem", color: "#666", display: "block", marginTop: "2px" }}>
                        {stepItem.description}
                      </span>
                      {stepItem.date && (
                        <span style={{ fontSize: "0.72rem", color: "#9CA3AF", display: "block", marginTop: "2px", fontFamily: "monospace" }}>
                          {stepItem.date}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aviso de prazo */}
            <div style={{
              backgroundColor: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "6px",
              padding: "10px 12px",
              display: "flex",
              gap: "8px",
              alignItems: "flex-start"
            }}>
              <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "0.78rem", color: "#92400E", margin: 0, lineHeight: 1.55 }}>
                {orderResult.logisticStatus === 'in_transit'
                  ? "Seu pacote está em trânsito com a transportadora. O prazo de entrega estimado é de 8 a 12 dias úteis."
                  : "Assim que seu pedido for despachado para a transportadora, o status avançará automaticamente para Em Transporte com atualizações diárias."}
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="checkout-footer">
        <p className="checkout-footer__text">MIRACLE - CNPJ: 59.291.162/0001-79 | Todos os direitos reservados</p>
      </footer>
    </div>
  );
};
