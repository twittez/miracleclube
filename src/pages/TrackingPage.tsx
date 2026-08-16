import React, { useState, useEffect } from "react";
import { Search, Truck, CheckCircle2, Package, MapPin, Clock, ArrowLeft, Loader2 } from "lucide-react";
import "../styles/checkout.css";

interface TrackingPageProps {
  initialCode?: string;
  onNavigateHome: () => void;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({ initialCode = "", onNavigateHome }) => {
  const [query, setQuery] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (codeToSearch?: string) => {
    const searchTerm = (codeToSearch || query).trim();
    if (!searchTerm) {
      setErrorMsg("Digite um código de acompanhamento (ex: MB-8F3K92) ou CPF.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setOrderResult(null);

    try {
      const res = await fetch("/api/orders/track/" + encodeURIComponent(searchTerm));
      setLoading(false);

      if (res.ok) {
        const data = await res.json();
        setOrderResult(data);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Nenhum pedido encontrado com os dados informados.");
      }
    } catch (err) {
      setLoading(false);
      console.error("Tracking search error:", err);
      setErrorMsg("Erro de conexão ao buscar rastreio. Tente novamente.");
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

  const isPaid = orderResult?.status === "paid";

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

        {orderResult && (
          <div className="checkout-card">
            <div style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: "12px" }}>
              <span style={{ fontSize: "0.72rem", color: "#666", textTransform: "uppercase" }}>Pedido Identificado</span>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111", margin: "2px 0 4px 0" }}>
                Código: <span style={{ color: "#d8158a" }}>{orderResult.trackingReference}</span>
              </h2>
              {orderResult.customerName && (
                <span style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600 }}>
                  Cliente: {orderResult.customerName}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div className="tracking-step-icon" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>Pedido Recebido</strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>Registrado no sistema</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div className="tracking-step-icon" style={{ backgroundColor: isPaid ? "#DCFCE7" : "#FEF3C7", color: isPaid ? "#16A34A" : "#D97706" }}>
                  {isPaid ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                </div>
                <div>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>
                    {isPaid ? "Pagamento Confirmado" : "Aguardando Pagamento Pix"}
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>
                    {isPaid ? "Pagamento aprovado instantaneamente" : "Aguardando envio do comprovante Pix"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", opacity: isPaid ? 1 : 0.4 }}>
                <div className="tracking-step-icon" style={{ backgroundColor: isPaid ? "#DBEAFE" : "#E5E7EB", color: isPaid ? "#2563EB" : "#9CA3AF" }}>
                  <Package size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>Separação & Embalagem</strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>Conferência de qualidade em andamento</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", opacity: 0.4 }}>
                <div className="tracking-step-icon" style={{ backgroundColor: "#E5E7EB", color: "#9CA3AF" }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>Em Transporte para sua Região</strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>Previsão de entrega em 8 a 10 dias úteis</span>
                </div>
              </div>
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
