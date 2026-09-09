import { Link, useNavigate } from "@/lib/navigation";
import { Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/product";
import { Header } from "@/components/m2/Header";

const SKU = "SHORTS-MOD-4B";
const NAME = "Shorts Modelador Cintura Alta";
const COMPARE_AT = 139.9;
const PRICE = 69.9;
const INSTALLMENTS = 5;

const BENEFITS = [
  "Afina a cintura e realça as curvas com compressão estratégica",
  "4 barbatanas de aço flexível que não enrolam nem descem",
  "Material super elástico, respirável e com toque macio na pele",
  "Ideal para usar sob vestidos, saias e calças sem marcar",
];

const COLORS = [
  { name: "Preto", swatch: "#111111" },
  { name: "Bege", swatch: "#d8be9b" },
];

const SIZES = ["PP", "P", "M", "G", "GG", "XG"];

const IMAGES = [
  "/assets/shorts-modelador-1.jpg",
  "/assets/shorts-modelador-2.jpg",
];

export function MiracleShortsOfferPage({
  onAccept,
  onDecline,
}: {
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const { add, items } = useCart();
  const navigate = useNavigate();
  const [color, setColor] = useState(COLORS[0]!.name);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState("");

  const hasMainProduct = items.length > 0;

  const accept = () => {
    if (!size) {
      setError("Selecione um tamanho para continuar.");
      return;
    }
    setError("");
    add({
      sku: SKU,
      name: NAME,
      color,
      size,
      price: PRICE,
      qty,
      image: IMAGES[0]!,
    });
    if (onAccept) onAccept();
    else navigate({ to: "/checkout" });
  };

  const decline = () => {
    if (onDecline) onDecline();
    else navigate({ to: "/checkout" });
  };

  return (
    <>
      <Header />
      <div className="shell px-4 py-5 pb-28">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-muted-foreground">
            <X className="size-5" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Oferta exclusiva
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-bold leading-snug">
          Que tal Levar também esse Shorts Modelador?
        </h1>

        <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
          <img
            src={IMAGES[activeImage]}
            alt={`${NAME} — ${color}`}
            className="aspect-square w-full object-cover"
          />
          <div className="flex gap-2 p-3">
            {IMAGES.map((src, i) => (
              <button
                key={src}
                onClick={() => setActiveImage(i)}
                className={`overflow-hidden rounded border ${
                  activeImage === i ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
              >
                <img src={src} alt="" className="size-14 object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-primary-light bg-primary-light p-4 text-center">
          <p className="text-sm text-muted-foreground line-through">{brl(COMPARE_AT)}</p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {INSTALLMENTS}x{" "}
            <span className="text-lg font-normal text-foreground">de</span>{" "}
            {brl(PRICE / INSTALLMENTS)}
          </p>
          <p className="mt-2 text-sm font-semibold">ou {brl(PRICE)} à vista</p>
        </div>

        <div className="mt-5 rounded-lg border border-border p-4">
          <p className="text-sm font-bold">Por que levar junto?</p>
          <ul className="mt-3 space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Dimensões da embalagem: 20 x 15 x 5 cm
          </p>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">Cor: {color}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c.name)}
                className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${
                  color === c.name ? "border-primary font-semibold" : "border-border"
                }`}
              >
                <span
                  className="size-4 rounded-full border border-border"
                  style={{ backgroundColor: c.swatch }}
                />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">
            Tamanho: {size ?? "Selecione o tamanho"}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSize(s);
                  setError("");
                }}
                className={`rounded border py-2 text-sm font-bold ${
                  size === s ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-5 flex items-center justify-between rounded border border-border px-4 py-3">
          <span className="text-sm font-semibold">Quantidade</span>
          <div className="flex items-center gap-4">
            <button
              aria-label="Diminuir"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="rounded border border-border p-1"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-6 text-center font-semibold">{qty}</span>
            <button
              aria-label="Aumentar"
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              className="rounded border border-border p-1"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background">
          <div className="shell flex flex-col gap-2 px-4 py-3">
            <button
              onClick={accept}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              <ShoppingBag className="size-4" />
              SIM, QUERO APROVEITAR
            </button>
            <button
              onClick={decline}
              className="w-full py-2 text-xs font-semibold text-muted-foreground underline"
            >
              Não, quero pular esta oferta
            </button>
          </div>
        </div>

        {!hasMainProduct && (
          <div className="mt-6 rounded border border-border bg-muted p-3 text-center text-sm text-muted-foreground">
            Nenhum produto no carrinho. Você ainda pode aproveitar esta oferta ou{" "}
            <Link to="/" className="text-primary underline">
              voltar ao produto principal
            </Link>
            .
          </div>
        )}
      </div>
    </>
  );
}
