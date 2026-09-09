import { Link } from "@/lib/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";

const CATEGORIES = ["Cinta Body", "Combos", "Linha Plus Size", "Nossos Queridinhos"];

const MARQUEE = [
  "GANHE 10% OFF COM O CUPOM PRIMEIRACOMPRA",
  "FRETE GRÁTIS DISPONÍVEL",
  "5X DE R$ 19,98 SEM JUROS",
  "OFERTA POR R$ 99,90",
];

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="overflow-hidden bg-primary py-2 text-[11px] font-semibold tracking-wide text-primary-foreground">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <span key={k} className="flex shrink-0 items-center">
              {MARQUEE.map((m) => (
                <span key={m} className="flex items-center">
                  <span className="px-3">{m}</span>
                  <span aria-hidden>•</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="shell flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-4">
          <button aria-label="Abrir menu" onClick={() => setOpen(true)}>
            <Menu className="size-6" />
          </button>
          <button aria-label="Buscar">
            <Search className="size-5" />
          </button>
        </div>
        <Link to="/" aria-label="Página inicial">
          <img
            src="/assets/logo.png"
            alt="Logotipo Miracle"
            className="h-10 w-auto object-contain"
            style={{ height: "40px", maxHeight: "40px", width: "auto", objectFit: "contain" }}
          />
        </Link>
        <div className="flex items-center gap-4">
          <button aria-label="Minha conta">
            <User className="size-5" />
          </button>
          <Link to="/carrinho" aria-label="Carrinho" className="relative">
            <ShoppingBag className="size-5" />
            <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          </Link>
        </div>
      </div>

      <nav className="shell no-scrollbar flex gap-6 overflow-x-auto border-b border-border-light px-4 pb-2 text-sm font-semibold">
        {CATEGORIES.map((c) => (
          <span key={c} className="whitespace-nowrap">
            {c}
          </span>
        ))}
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="h-full w-72 bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <img
                src="/assets/logo.png"
                alt="Miracle"
                className="h-9 w-auto"
                style={{ height: "36px", maxHeight: "36px", width: "auto", objectFit: "contain" }}
              />
              <button aria-label="Fechar menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <ul className="space-y-4 text-sm font-semibold">
              {CATEGORIES.map((c) => (
                <li key={c}>{c}</li>
              ))}
              <li>
                <Link to="/rastreio" onClick={() => setOpen(false)}>
                  Rastreio de Pedido
                </Link>
              </li>
              <li>
                <Link to="/carrinho" onClick={() => setOpen(false)}>
                  Meu Carrinho
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
