import { useNavigate, Link } from "@/lib/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { PRODUCT, brl } from "@/lib/product";
import { ProductGallery } from "@/components/m2/ProductGallery";
import { Header } from "@/components/m2/Header";
import { Footer } from "@/components/m2/Footer";

const BENEFITS = [
  {
    icon: RefreshCw,
    title: "1ª Troca Grátis",
    text: "Em até 7 dias após o recebimento",
  },
  {
    icon: ShieldCheck,
    title: "Garantia de Qualidade",
    text: "Tecido cirúrgico reforçado",
  },
  { icon: CreditCard, title: "Até 10x Sem Juros", text: "Aceitamos todos os cartões" },
  { icon: Lock, title: "Compra 100% Segura", text: "Dados totalmente protegidos" },
];

const DIFFERENTIALS = [
  {
    title: "Design Pré-Moldado",
    text: "Modela a silhueta sem achatar, valorizando o desenho natural das curvas.",
  },
  {
    title: "Alta Cobertura Total",
    text: "Suaviza flancos laterais, marcas nas costas e região abdominal com firmeza.",
  },
  {
    title: "Tecido Respirável Macio",
    text: "Compressão na medida exata com Toque de Seda para uso durante todo o dia.",
  },
  {
    title: "Ajuste & Fecho Prático",
    text: "Colchetes reforçados em dupla regulagem e fecho inferior higiênico.",
  },
];

const STORY = [
  {
    image: "/images/product/04.webp",
    eyebrow: "COMPRESSÃO ELEGANTE",
    title: "Silhueta Definida com Conforto Incomparável",
    lead: "Projetado com tecnologia de ponta para se ajustar perfeitamente ao seu corpo",
    body: "O Body Modelador Pré-Moldado combina alta compressão estruturada com fios cirúrgicos de toque suave. Desenvolvido para modelar o abdômen, afinar a cintura e sustentar a postura sem restringir seus movimentos diários.",
    bullets: [
      "Tecido térmico respirável que não esquenta nem enrola",
      "Costuras ultra planas imperceptíveis sob vestidos e calças",
      "Reforço duplo no abdômen e sustentação anatômica no busto",
    ],
  },
  {
    image: "/images/product/06.webp",
    eyebrow: "DETALHES PREMIUM",
    title: "Acabamento Reforçado e Funcionalidade Prática",
    lead: "Pensado para o ritmo da mulher moderna",
    body: "Com alças reguláveis e reforçadas, nosso modelador garante máxima sustentação com distribuição equilibrada de peso nos ombros. O fecho inferior prático permite utilizar o banheiro com facilidade sem precisar retirar a peça.",
    bullets: [
      "Alças de sustentação ajustáveis com fecho seguro",
      "Abertura higiênica inferior com toque suave",
      "Não marca e valoriza o caimento das roupas mais sofisticadas",
    ],
  },
  {
    image: "/images/product/08.webp",
    eyebrow: "PARA TODOS OS MOMENTOS",
    title: "Do Trabalho ao Evento Especial com Total Autoconfiança",
    lead: "A combinação perfeita entre modelagem estratégica e elegância diária",
    body: "Seja para trabalhar, usar com um vestido de festa ou para a rotina diária de autocuidado, a peça proporciona segurança visual instantânea e postura ereta com zero desconforto.",
    bullets: [
      "Modela instantaneamente até 2 tamanhos na cintura",
      "Excelente sustentação lombar para quem passa horas sentada",
      "Durabilidade extrema após dezenas de lavagens",
    ],
  },
];

const REVIEWS = [
  {
    name: "Mariana S.",
    when: "Há 2 dias",
    meta: "Tam: M | Cor: Preto",
    title: "Maravilhoso! Modela perfeitamente",
    text: "Comprei para usar em um casamento e fiquei impressionada. O vestido ficou impecável no corpo, afina muito a cintura e é surpreendentemente confortável!",
    helpful: 24,
    photos: ["/images/product/02.webp", "/images/product/03.webp"],
  },
  {
    name: "Camila R.",
    when: "Há 4 dias",
    meta: "Tam: P | Cor: Nude (Akaroa)",
    title: "Vídeo mostrando a qualidade e o caimento!",
    text: "Gente, gravei esse vídeo curto pra mostrar como o tecido é encorpado e o fecho inferior super forte. Fica perfeito no corpo!",
    helpful: 38,
    photos: ["/images/product/05.webp"],
  },
  {
    name: "Patrícia M.",
    when: "Há 1 semana",
    meta: "Tam: G | Cor: Preto",
    title: "Fotos reais da peça ao chegar!",
    text: "Chegou super rápido aqui em SP. O acabamento das costuras é perfeito e a sustentação nas costas é incrível.",
    helpful: 31,
    photos: ["/images/product/07.webp", "/images/product/09.webp", "/images/product/10.webp"],
  },
];

const FAQ = [
  {
    q: "Como escolher o tamanho correto do Body Modelador?",
    a: "Recomendamos que você consulte a nossa Tabela de Medidas disponível ao lado do seletor de tamanhos. Utilize uma fita métrica para medir cintura e busto. Caso suas medidas fiquem entre dois tamanhos, para maior conforto diário opte pelo tamanho maior.",
  },
  {
    q: "O body modelador enrola durante o uso?",
    a: "Não! Nosso modelo possui estrutura anatômica pré-moldada com barretas flexíveis e modelagem alongada que se fixa firmemente ao corpo, impedindo que a peça dobre ou enrole.",
  },
  {
    q: "Posso usar a peça por baixo de roupas justas sem marcar?",
    a: "Sim, com certeza. O acabamento de costuras planas extra finas foi desenvolvido especificamente para não marcar sob vestidos de festa, legging, jeans ou blusas finas.",
  },
  {
    q: "Qual é o tempo de entrega e como funciona a troca?",
    a: "O prazo de entrega varia de acordo com o seu CEP (você pode calcular na página). Oferecemos a 1ª Troca Grátis no prazo de até 7 dias após o recebimento, caso precise ajustar o tamanho.",
  },
  {
    q: "Como devo lavar meu Body Modelador?",
    a: "Recomendamos a lavagem à mão com sabão neutro e secagem à sombra. Evite usar máquina de lavar no modo pesado, secadoras ou água quente para preservar a elasticidade do tecido.",
  },
];

function Stars({ size = 14 }: { size?: number }) {
  return (
    <span className="flex gap-0.5 text-star">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

export function MiracleHomePage({
  onNavigateToCheckout,
}: {
  onNavigateToCheckout?: () => void;
}) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [color, setColor] = useState(PRODUCT.colors[0]!.name);
  const activeColor =
    PRODUCT.colors.find((c) => c.name === color) ?? PRODUCT.colors[0]!;
  const galleryImages = activeColor.images;
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [cep, setCep] = useState("");
  const [shipping, setShipping] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const unit = PRODUCT.price;

  const requireSize = () => {
    if (!size) {
      setError("Selecione um tamanho para continuar.");
      document.getElementById("tamanhos")?.scrollIntoView({ block: "center" });
      return false;
    }
    setError("");
    return true;
  };

  const payload = () => ({
    sku: PRODUCT.sku,
    name: PRODUCT.name,
    color,
    size: size!,
    price: unit,
    qty,
    image: galleryImages[0]!,
  });

  const addToCart = () => {
    if (!requireSize()) return;
    add(payload());
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const buyNow = () => {
    if (!requireSize()) return;
    add(payload());
    if (onNavigateToCheckout) {
      onNavigateToCheckout();
    } else {
      navigate({ to: "/oferta-shorts" });
    }
  };

  const calcFrete = () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setShipping("Informe um CEP válido com 8 dígitos.");
      return;
    }
    setShipping("Frete Grátis — entrega estimada em 5 a 9 dias úteis.");
  };

  const reviews = showAllReviews ? [...REVIEWS, ...REVIEWS] : REVIEWS;

  return (
    <>
      <Header />
      <div className="shell pb-28">
        <nav className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
          <Link to="/">Início</Link>
          <span>›</span>
          <span>Modeladores</span>
          <span>›</span>
          <span className="text-foreground">Body Modelador</span>
        </nav>

        <section id="product-section">
          <ProductGallery
            key={activeColor.name}
            images={galleryImages}
            alt={`${PRODUCT.name} — ${activeColor.name}`}
          />

          <div className="px-8 pt-5">
            <p className="text-xs text-muted-foreground">SKU: {PRODUCT.sku}</p>
            <h1 className="mt-1 text-xl font-bold leading-tight">{PRODUCT.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{PRODUCT.subtitle}</p>

            <a href="#avaliacoes" className="mt-3 flex items-center gap-2 text-sm">
              <Stars size={16} />
              <strong>{PRODUCT.rating.toFixed(1).replace(".", ",")}</strong>
              <span className="text-muted-foreground">|</span>
              <span className="text-primary underline">
                {PRODUCT.reviewCount} avaliações
              </span>
            </a>

            <div className="mt-5 border-y border-border-light py-5 text-center">
              <p className="text-3xl font-bold text-primary">
                {PRODUCT.installments}x{" "}
                <span className="font-normal text-foreground">de</span>{" "}
                {brl(unit / PRODUCT.installments)}
              </p>
              <p className="mt-2 flex items-center justify-center gap-3">
                <span className="text-sm text-muted-foreground line-through">
                  {brl(PRODUCT.compareAt)}
                </span>
                <span className="text-lg font-bold">{brl(unit)}</span>
              </p>
              <p className="mt-4 rounded bg-muted px-3 py-2 text-sm">
                <span className="font-bold">{brl(unit)} no pix</span> — pague com praticidade
              </p>
              <a
                href="#payment-methods"
                className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground underline"
              >
                <CreditCard className="size-4" /> mais formas de pagamento
              </a>
            </div>

            <div className="mt-5">
              <p className="text-sm">
                Cor: <strong>{color}</strong>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRODUCT.colors.map((c) => (
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

            <div id="tamanhos" className="mt-6">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm">
                  Tamanho:{" "}
                  <strong>{size ? size : "Selecione o tamanho"}</strong>
                </p>
                <button
                  onClick={() => setShowGuide(true)}
                  className="flex items-center gap-1 text-sm text-primary underline"
                >
                  <Ruler className="size-4" /> Guia de Medidas
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {PRODUCT.sizes.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => {
                      setSize(s.label);
                      setError("");
                    }}
                    className={`rounded border py-2 text-center ${
                      size === s.label ? "border-primary bg-primary-light" : "border-border"
                    }`}
                  >
                    <span className="block text-sm font-bold">{s.label}</span>
                    <span className="block text-xs text-muted-foreground">{s.range}</span>
                  </button>
                ))}
              </div>
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>

            <div className="mt-5 flex items-center justify-between rounded border border-border px-4 py-2">
              <button aria-label="Diminuir" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="size-4" />
              </button>
              <span className="font-semibold">{qty}</span>
              <button aria-label="Aumentar" onClick={() => setQty((q) => q + 1)}>
                <Plus className="size-4" />
              </button>
            </div>

            <button
              onClick={buyNow}
              className="mt-3 w-full rounded bg-primary py-3 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Comprar
            </button>
            <button
              onClick={addToCart}
              className="mt-2 w-full rounded border-2 border-primary py-3 text-base font-semibold text-primary"
            >
              {added ? "Adicionado ao carrinho ✓" : "Adicionar ao carrinho"}
            </button>
            <button
              onClick={() =>
                toast.info("Todos os nossos atendentes estão ocupados no momento.", {
                  description: "Por favor, finalize sua compra pelo site. Assim que um atendente ficar livre, entraremos em contato.",
                  duration: 5000,
                })
              }
              className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-whats-bg py-3 text-base font-semibold text-whats"
            >
              Comprar pelo whatsapp 💬
            </button>

            <div className="mt-5 rounded border border-border p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="size-4 text-primary" /> Simular frete e prazo de entrega:
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  inputMode="numeric"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  className="min-w-0 flex-1 rounded border border-border px-3 py-2 text-sm"
                />
                <button
                  onClick={calcFrete}
                  className="rounded bg-secondary px-4 text-sm font-semibold text-secondary-foreground"
                >
                  CALCULAR
                </button>
              </div>
              {shipping && <p className="mt-3 text-sm text-whats">{shipping}</p>}
              <a
                href="https://buscacepinter.correios.com.br/app/cep/index.php"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs underline"
              >
                Não sei meu CEP
              </a>
            </div>

            <ul id="payment-methods" className="mt-6 space-y-4 border-t border-border-light pt-6">
              {BENEFITS.map((b) => (
                <li key={b.title} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                    <b.icon className="size-5 text-primary" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{b.title}</span>
                    <span className="block text-xs text-muted-foreground">{b.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 bg-subtle px-4 py-10">
          <p className="text-center text-xs font-bold tracking-[0.2em] text-primary">
            DIFERENCIAIS EXCLUSIVOS
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold leading-snug">
            Por que escolher o nosso Body Modelador?
          </h2>
          <div className="mt-6 space-y-4">
            {DIFFERENTIALS.map((d) => (
              <article
                key={d.title}
                className="rounded-lg bg-card p-6 text-center shadow-sm"
              >
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-light">
                  <Sparkles className="size-5 text-primary" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{d.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d.text}</p>
              </article>
            ))}
          </div>
        </section>

        {STORY.map((s) => (
          <section key={s.title} className="px-4 py-10">
            <img
              src={s.image}
              alt={s.title}
              loading="lazy"
              className="w-full rounded-lg object-cover"
            />
            <p className="mt-6 text-xs font-bold tracking-[0.2em] text-primary">
              {s.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-snug">{s.title}</h2>
            <p className="mt-2 text-base text-muted-foreground">{s.lead}</p>
            <p className="mt-4 text-sm leading-relaxed">{s.body}</p>
            <ul className="mt-4 space-y-3">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-sm font-semibold">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {b}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section id="avaliacoes" className="border-t border-border-light bg-subtle px-4 py-10">
          <p className="text-center text-xs font-bold tracking-[0.2em] text-primary">
            DEPOIMENTOS REAIS
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold">Avaliações dos Clientes</h2>

          <div className="mt-6 rounded-lg bg-card p-6 text-center">
            <p className="text-5xl font-bold">4.9</p>
            <div className="mt-2 flex justify-center">
              <Stars size={18} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Baseado em {PRODUCT.reviewCount} avaliações de clientes reais
            </p>
            <div className="mt-5 space-y-2">
              {[
                [5, 92],
                [4, 6],
                [3, 1],
                [2, 1],
                [1, 0],
              ].map(([stars, pct]) => (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-left">{stars} ★</span>
                  <span className="h-2 flex-1 rounded-full bg-border">
                    <span
                      className="block h-2 rounded-full bg-star"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-8 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {reviews.map((r, i) => (
              <article key={`${r.name}-${i}`} className="rounded-lg bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">{r.name}</strong>
                  <span className="flex items-center gap-1 rounded bg-whats-bg px-2 py-0.5 text-[11px] font-semibold text-whats">
                    <Check className="size-3" /> Compra Verificada
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.when}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Stars />
                  <span className="rounded bg-muted px-2 py-0.5 text-[11px]">{r.meta}</span>
                </div>
                <h3 className="mt-3 text-sm font-bold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                <div className="mt-3 flex gap-2">
                  {r.photos.map((p) => (
                    <img
                      key={p}
                      src={p}
                      alt=""
                      loading="lazy"
                      className="size-16 rounded object-cover"
                    />
                  ))}
                </div>
                <p className="mt-3 flex justify-end">
                  <span className="flex items-center gap-2 rounded border border-border px-3 py-1 text-xs">
                    <ThumbsUp className="size-3" /> Útil ({r.helpful})
                  </span>
                </p>
              </article>
            ))}
          </div>

          {!showAllReviews && (
            <button
              onClick={() => setShowAllReviews(true)}
              className="mx-auto mt-6 block rounded border-2 border-secondary px-8 py-3 text-sm font-bold"
            >
              VER MAIS AVALIAÇÕES
            </button>
          )}
        </section>

        <section className="px-4 py-10">
          <p className="text-center text-xs font-bold tracking-[0.2em] text-primary">
            DÚVIDAS FREQUENTES
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold">Perguntas Frequentes</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Tire suas dúvidas sobre o produto, envio e formas de pagamento.
          </p>
          <div className="mt-6 space-y-3">
            {FAQ.map((f, i) => (
              <div
                key={f.q}
                className={`rounded border ${openFaq === i ? "border-primary" : "border-border"}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-bold"
                >
                  {f.q}
                  <ChevronDown
                    className={`size-4 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-subtle px-4 py-10 text-center">
          <h2 className="text-xl font-bold">Receba Ofertas Exclusivas no seu E-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre-se e ganhe 10% de desconto na sua primeira compra + cupons secretos.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-4 flex flex-col gap-2"
          >
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="rounded border border-border bg-background px-4 py-3 text-sm"
            />
            <button className="rounded bg-primary py-3 text-sm font-bold text-primary-foreground">
              CADASTRAR
            </button>
          </form>
        </section>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            onClick={() => setShowGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-lg bg-card p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold">Guia de Medidas</h3>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2">Tamanho</th>
                    <th className="py-2">Manequim</th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCT.sizes.map((s) => (
                    <tr key={s.label} className="border-b border-border-light">
                      <td className="py-2 font-semibold">{s.label}</td>
                      <td className="py-2 text-muted-foreground">{s.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => setShowGuide(false)}
                className="mt-5 w-full rounded bg-primary py-3 text-sm font-bold text-primary-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <div className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-border bg-background">
          <div className="shell flex items-center gap-3 px-4 py-3">
            <span className="shrink-0">
              <span className="block text-lg font-bold">{brl(unit)}</span>
              <span className="block text-xs text-muted-foreground">
                em até {PRODUCT.installments}x de {brl(unit / PRODUCT.installments)}
              </span>
            </span>
            <button
              onClick={buyNow}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              <ShoppingBag className="size-4" /> COMPRAR AGORA
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
