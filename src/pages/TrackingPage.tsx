import React, { useState, useEffect } from "react";
import { Search, Truck, CheckCircle2, Package, MapPin, Clock, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
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
  const [separationResult, setSeparationResult] = useState<{ cpf: string } | null>(null);
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
    setSeparationResult(null);

    try {
      const res = await fetch("/api/orders/track/" + encodeURIComponent(searchTerm));
      setLoading(false);

      if (res.ok) {
        // Pedido real encontrado no sistema
        const data = await res.json();
        setOrderResult(data);
      } else {
        // Não encontrado — verifica se é CPF
        if (looksLikeCPF(searchTerm)) {
          // CPF sem pedido registrado → mostra tela de "Em Separação"
          setSeparationResult({ cpf: searchTerm });
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(errData.error || "Nenhum pedido encontrado com os dados informados.");
        }
      }
    } catch (err) {
      setLoading(false);
      console.error("Tracking search error:", err);
      // Erro de rede com CPF → também mostra separação
      if (looksLikeCPF(searchTerm)) {
        setSeparationResult({ cpf: searchTerm });
      } else {
        setErrorMsg("Erro de conexão ao buscar rastreio. Tente novamente.");
      }
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

        {/* ── TELA DE SEPARAÇÃO (CPF digitado, sem pedido registrado) ── */}
        {separationResult && (
          <div className="checkout-card">
            {/* Cabeçalho */}
            <div style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: "12px" }}>
              <span style={{ fontSize: "0.72rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Pedido Identificado
              </span>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111", margin: "2px 0 4px 0" }}>
                CPF: <span style={{ color: "#d8158a" }}>{maskCPF(separationResult.cpf)}</span>
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
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>Separação &amp; Embalagem</strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>Conferência de qualidade em andamento</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", opacity: 0.4 }}>
                <div className="tracking-step-icon" style={{ backgroundColor: "#E5E7EB", color: "#9CA3AF" }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>Em Transporte para sua Região</strong>
                  <span style={{ fontSize: "0.78rem", color: "#666" }}>Previsão de entrega em <strong>8 a 12 dias úteis</strong></span>
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
