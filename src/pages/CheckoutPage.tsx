import React, { useState, useEffect } from "react";
import { Lock, QrCode, CreditCard, ArrowRight, ArrowLeft, Loader2, Truck, AlertTriangle } from "lucide-react";
import { product } from "../data/product";
import { useCart } from "../contexts/CartContext";
import { fetchAddressByCep } from "../utils/viacep";
import { formatCurrency, formatCPF, formatPhone, formatCEP } from "../utils/formatters";
import { captureUTMParams } from "../utils/utm";
import { trackPixGenerated } from "../services/metaPixel";
import "../styles/checkout.css";

interface CheckoutPageProps {
  onNavigateToThankYou: (orderId: string) => void;
  onNavigateBack?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigateToThankYou, onNavigateBack }) => {
  const { cartItems } = useCart();
  const [step, setStep] = useState<number>(1); // 1: Identificação, 2: Entrega, 3: Pagamento
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");

  // Urgency Timer (10 minutes)
  const [timeLeft, setTimeLeft] = useState<number>(600);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Form Fields - Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  // Form Fields - Step 2
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [shippingOption, setShippingOption] = useState<"free" | "express">("free");

  // Form Fields - Step 3 (Credit Card)
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState("1");
  const [cardDeclinedAlert, setCardDeclinedAlert] = useState(false);

  const [loadingCep, setLoadingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Real Product data from cart or default product
  const cartItem = cartItems[0];
  const selectedProduct = {
    name: cartItem?.name || product.name,
    color: cartItem?.color || product.variations[0].name,
    size: cartItem?.size || product.sizes[1].label,
    image: cartItem?.image || product.images[0],
    quantity: cartItem?.quantity || 1,
    unitPrice: product.price,
  };

  const basePrice = selectedProduct.unitPrice * selectedProduct.quantity;
  const shippingCost = shippingOption === "express" ? 16.89 : 0.00;
  const pixDiscount = paymentMethod === "pix" ? basePrice * 0.10 : 0;
  const finalPrice = basePrice - pixDiscount + shippingCost;

  useEffect(() => {
    captureUTMParams();
    window.scrollTo(0, 0);
  }, [step]);

  // Credit Card formatting helpers
  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  // Auto-fill address via ViaCEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    const clean = formatted.replace(/\D/g, "");

    if (clean.length === 8) {
      setLoadingCep(true);
      const res = await fetchAddressByCep(clean);
      setLoadingCep(false);
      if (res && !res.erro) {
        setStreet(res.logradouro || "");
        setNeighborhood(res.bairro || "");
        setCity(res.localidade || "");
        setState(res.uf || "");
      }
    }
  };

  // Step 1 Validation
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || name.trim().split(" ").length < 2) {
      setErrorMsg("Digite seu nome e sobrenome completos.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setErrorMsg("Digite um e-mail válido.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Digite um telefone/WhatsApp válido com DDD.");
      return;
    }
    if (cpf.replace(/\D/g, "").length !== 11) {
      setErrorMsg("Digite um CPF válido com 11 dígitos.");
      return;
    }

    setStep(2);
  };

  // Step 2 Validation
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (cep.replace(/\D/g, "").length !== 8) {
      setErrorMsg("Digite um CEP válido.");
      return;
    }
    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
      setErrorMsg("Preencha todos os campos obrigatórios do endereço.");
      return;
    }

    setStep(3);
  };

  // Step 3 Submit (Pix or Card Recusal simulation)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // If payment method is Credit Card, simulate processing & decline (CarTapetes Funnel Flow)
    if (paymentMethod === "card") {
      if (cardNumber.replace(/\D/g, "").length !== 16) {
        setErrorMsg("Digite o número completo do cartão (16 dígitos).");
        return;
      }
      if (!cardName.trim()) {
        setErrorMsg("Digite o nome impresso no cartão.");
        return;
      }
      if (cardExpiry.length !== 5) {
        setErrorMsg("Digite a validade no formato MM/AA.");
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMsg("Digite o código de segurança CVV (3 ou 4 dígitos).");
        return;
      }

      setIsSubmitting(true);

      // Log card decline on backend
      fetch("/api/payments/card-declined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, phone, cpf },
          cardBrand: "card",
          amount: finalPrice,
        }),
      }).catch(() => {});

      // Simulate 1.2s bank processing
      setTimeout(() => {
        setIsSubmitting(false);
        setCardDeclinedAlert(true);
      }, 1200);
      return;
    }

    // Pix Payment Submission
    setIsSubmitting(true);

    try {
      const payload = {
        amount: Number(finalPrice.toFixed(2)),
        customer: {
          name,
          email,
          phone,
          cpf,
        },
        shipping: {
          zipcode: cep,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          option: shippingOption,
        },
        items: [
          {
            title: selectedProduct.name,
            unitPrice: Math.round(selectedProduct.unitPrice * 100),
            quantity: selectedProduct.quantity,
            tangible: true,
          },
        ],
        utm: captureUTMParams(),
      };

      const response = await fetch("/api/payments/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setIsSubmitting(false);

      if (response.ok && data.orderId) {
        try {
          sessionStorage.setItem("miracle_order_" + data.orderId, JSON.stringify(data));
          sessionStorage.setItem("miracle_latest_order", JSON.stringify(data));
        } catch (e) {}

        // Track Custom Event PixGenerated (NO Purchase event at this stage)
        trackPixGenerated({ id: data.orderId, total: finalPrice });

        onNavigateToThankYou(data.orderId);
      } else {
        setErrorMsg(data.error || "Não foi possível gerar a cobrança Pix. Tente novamente.");
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error("Checkout submit error:", err);
      setErrorMsg("Ocorreu um erro de conexão. Tente novamente.");
    }
  };

  return (
    <div className="checkout-container">
      {/* Header */}
      <header className="checkout-header">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
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
              fontSize: "0.85rem",
              fontWeight: 600
            }}
          >
            <ArrowLeft size={18} /> Voltar
          </button>
        ) : (
          onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
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
                fontSize: "0.85rem",
                fontWeight: 600
              }}
            >
              <ArrowLeft size={18} /> Loja
            </button>
          )
        )}
        <img src="/images/checkout/logo.png" alt="MIRACLE" className="checkout-header__logo" />
      </header>

      {/* 10-Minute Urgency Timer Banner */}
      <div className="checkout-banner">
        <p>
          ⚡ Oferta reservada por tempo limitado: <strong>{formatTime(timeLeft)}</strong>
        </p>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="checkout-loading-overlay">
          <div className="checkout-loading-spinner" />
          <p className="checkout-loading-text">
            {paymentMethod === "card" ? "PROCESSANDO JUNTO AO BANCO EMISSOR..." : "PROCESSANDO SEU PEDIDO..."}<br />
            <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "#666" }}>
              {paymentMethod === "card" ? "Aguardando confirmação da operadora." : "Estamos gerando seu pagamento PIX seguro."}
            </span>
          </p>
        </div>
      )}

      {/* Main Body */}
      <main className="checkout-body">
        {/* Step Indicator Header */}
        <div className="checkout-steps-bar">
          <span className="checkout-steps-bar__title">
            {step === 1 && "1. Dados Pessoais"}
            {step === 2 && "2. Endereço de Entrega"}
            {step === 3 && "3. Pagamento"}
          </span>
          <span className="checkout-steps-bar__counter">Passo {step} de 3</span>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "10px 12px",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: 600
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* STEP 1: IDENTIFICAÇÃO */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="checkout-card">
            <h2 className="checkout-card__title">
              <span className="checkout-card__title-badge">1</span>
              Informações Pessoais
            </h2>

            <div className="form-group">
              <label htmlFor="name">Nome completo *</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Ex: Maria Silva Santos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">E-mail para receber a confirmação *</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">WhatsApp com DDD *</label>
                <input
                  id="phone"
                  type="text"
                  className="form-input"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={15}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cpf">CPF *</label>
                <input
                  id="cpf"
                  type="text"
                  className="form-input"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  maxLength={14}
                  required
                />
              </div>
            </div>

            <button type="submit" className="checkout-submit-btn" style={{ marginTop: "8px" }}>
              <span>IR PARA A ENTREGA</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: ENDEREÇO DE ENTREGA & OPÇÕES DE FRETE */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="checkout-card">
            <h2 className="checkout-card__title">
              <span className="checkout-card__title-badge">2</span>
              Endereço para Entrega
            </h2>

            <div className="form-group">
              <label htmlFor="cep">CEP *</label>
              <div style={{ position: "relative" }}>
                <input
                  id="cep"
                  type="text"
                  className="form-input"
                  placeholder="00000-000"
                  value={cep}
                  onChange={handleCepChange}
                  maxLength={9}
                  required
                />
                {loadingCep && (
                  <Loader2 size={16} className="animate-spin" style={{ position: "absolute", right: "12px", top: "14px", color: "#d8158a" }} />
                )}
              </div>
            </div>

            <div className="form-row--3">
              <div className="form-group">
                <label htmlFor="street">Rua / Avenida *</label>
                <input
                  id="street"
                  type="text"
                  className="form-input"
                  placeholder="Nome da rua"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="number">Número *</label>
                <input
                  id="number"
                  type="text"
                  className="form-input"
                  placeholder="123"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="complement">Complemento (opcional)</label>
                <input
                  id="complement"
                  type="text"
                  className="form-input"
                  placeholder="Apto, Bloco..."
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="neighborhood">Bairro *</label>
                <input
                  id="neighborhood"
                  type="text"
                  className="form-input"
                  placeholder="Seu bairro"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row--3">
              <div className="form-group">
                <label htmlFor="city">Cidade *</label>
                <input
                  id="city"
                  type="text"
                  className="form-input"
                  placeholder="Sua cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">UF *</label>
                <input
                  id="state"
                  type="text"
                  className="form-input"
                  placeholder="MG"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  maxLength={2}
                  required
                />
              </div>
            </div>

            {/* Freight Options Selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#374151" }}>Escolha o Frete:</label>
              
              <div
                className={`shipping-option-card ${shippingOption === "free" ? "selected" : ""}`}
                onClick={() => setShippingOption("free")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Truck size={18} color="#d8158a" />
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#111", display: "block" }}>Frete Grátis + Seguro Entrega</strong>
                    <span style={{ fontSize: "0.75rem", color: "#666" }}>Prazo: 8 a 10 dias úteis</span>
                  </div>
                </div>
                <strong style={{ fontSize: "0.85rem", color: "#16A34A" }}>GRÁTIS</strong>
              </div>

              <div
                className={`shipping-option-card ${shippingOption === "express" ? "selected" : ""}`}
                onClick={() => setShippingOption("express")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Truck size={18} color="#d8158a" />
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#111", display: "block" }}>Frete Expresso Prioritário</strong>
                    <span style={{ fontSize: "0.75rem", color: "#666" }}>Prazo: 2 a 5 dias úteis</span>
                  </div>
                </div>
                <strong style={{ fontSize: "0.85rem", color: "#111" }}>R$ 16,89</strong>
              </div>
            </div>

            <button type="submit" className="checkout-submit-btn" style={{ marginTop: "8px" }}>
              <span>IR PARA O PAGAMENTO</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 3: PAGAMENTO (PIX OU CARTÃO) */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="checkout-card">
            <h2 className="checkout-card__title">
              <span className="checkout-card__title-badge">3</span>
              Forma de Pagamento
            </h2>

            {/* Payment Method Tabs */}
            <div className="payment-tabs">
              <button
                type="button"
                className={`payment-tab-btn ${paymentMethod === "pix" ? "active" : ""}`}
                onClick={() => {
                  setPaymentMethod("pix");
                  setCardDeclinedAlert(false);
                }}
              >
                <QrCode size={22} color="#d8158a" />
                <span className="payment-tab-btn__title">PIX</span>
                <span className="payment-tab-btn__badge">10% OFF</span>
              </button>

              <button
                type="button"
                className={`payment-tab-btn ${paymentMethod === "card" ? "active" : ""}`}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard size={22} color="#111" />
                <span className="payment-tab-btn__title">Cartão de Crédito</span>
                <span style={{ fontSize: "0.68rem", color: "#666" }}>Até 10x sem juros</span>
              </button>
            </div>

            {/* Card Decline Recusal Alert (CarTapetes Conversion Mechanism) */}
            {cardDeclinedAlert && paymentMethod === "card" && (
              <div className="card-declined-alert">
                <span className="card-declined-alert__title">
                  <AlertTriangle size={18} /> Transação Recusada pelo Banco Emissor
                </span>
                <p className="card-declined-alert__text">
                  O saldo ou limite no seu cartão pode estar indisponível. Para não perder seu pedido e garantir a promoção, conclua seu pedido via <strong>PIX com 10% OFF instantâneo!</strong>
                </p>
                <button
                  type="button"
                  className="card-declined-alert__cta"
                  onClick={() => {
                    setPaymentMethod("pix");
                    setCardDeclinedAlert(false);
                  }}
                >
                  <QrCode size={18} />
                  <span>CONCLUIR PEDIDO VIA PIX (-10% OFF)</span>
                </button>
              </div>
            )}

            {/* Credit Card Form Fields */}
            {paymentMethod === "card" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                <div className="form-group">
                  <label htmlFor="cardNumber">Número do Cartão *</label>
                  <input
                    id="cardNumber"
                    type="text"
                    className="form-input"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cardName">Nome impresso no cartão *</label>
                  <input
                    id="cardName"
                    type="text"
                    className="form-input"
                    placeholder="NOME COMO ESTÁ NO CARTÃO"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cardExpiry">Validade *</label>
                    <input
                      id="cardExpiry"
                      type="text"
                      className="form-input"
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cardCvv">CVV *</label>
                    <input
                      id="cardCvv"
                      type="password"
                      className="form-input"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="installments">Parcelamento sem juros *</label>
                  <select
                    id="installments"
                    className="form-select"
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                  >
                    <option value="1">1x de {formatCurrency(basePrice + shippingCost)} (à vista)</option>
                    <option value="2">2x de {formatCurrency((basePrice + shippingCost) / 2)} sem juros</option>
                    <option value="3">3x de {formatCurrency((basePrice + shippingCost) / 3)} sem juros</option>
                    <option value="5">5x de {formatCurrency((basePrice + shippingCost) / 5)} sem juros</option>
                    <option value="10">10x de {formatCurrency((basePrice + shippingCost) / 10)} sem juros</option>
                  </select>
                </div>
              </div>
            )}

            {/* Pix Highlights Banner */}
            {paymentMethod === "pix" && (
              <div style={{
                backgroundColor: "#FDF2F6",
                border: "1.5px solid #d8158a",
                borderRadius: "6px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <QrCode size={24} color="#d8158a" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "0.88rem", color: "#111", display: "block" }}>
                    Pix - Aprovação Instantânea (-10% OFF)
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 600 }}>
                    ✓ Desconto de 10% aplicado automaticamente (Economia de {formatCurrency(pixDiscount)})
                  </span>
                </div>
              </div>
            )}

            {/* Product Summary */}
            <div className="checkout-summary">
              <div className="checkout-item-row">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="checkout-item-img" />
                <div className="checkout-item-details">
                  <span className="checkout-item-name">{selectedProduct.name}</span>
                  <span className="checkout-item-variant">Cor: {selectedProduct.color} | Tam: {selectedProduct.size}</span>
                  <span className="checkout-item-price">{formatCurrency(selectedProduct.unitPrice)} x {selectedProduct.quantity}</span>
                </div>
              </div>

              <div className="checkout-totals">
                <div className="checkout-totals-row">
                  <span>Subtotal ({selectedProduct.quantity}x)</span>
                  <span>{formatCurrency(basePrice)}</span>
                </div>
                {paymentMethod === "pix" && (
                  <div className="checkout-totals-row">
                    <span>Desconto Pix (-10%)</span>
                    <span style={{ color: "#16A34A", fontWeight: 600 }}>- {formatCurrency(pixDiscount)}</span>
                  </div>
                )}
                <div className="checkout-totals-row">
                  <span>Frete</span>
                  {shippingCost === 0 ? (
                    <span className="free-shipping-tag">GRÁTIS</span>
                  ) : (
                    <span>{formatCurrency(shippingCost)}</span>
                  )}
                </div>
                <div className="checkout-totals-row total">
                  <span>Total</span>
                  <span>{formatCurrency(finalPrice)}</span>
                </div>
              </div>
            </div>

            <button type="submit" className="checkout-submit-btn" disabled={isSubmitting}>
              <span>{paymentMethod === "pix" ? "FINALIZAR PEDIDO VIA PIX" : "FINALIZAR COMPRA NO CARTÃO"}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </main>

      {/* Footer */}
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
