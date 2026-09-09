import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

/**
 * Bloqueia o acesso via desktop: a loja é mobile-only.
 * Mostra um aviso em telas maiores que 768px de largura.
 */
export function DesktopBlock({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const update = () => setBlocked(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!blocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Smartphone className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">
        Acesse pelo celular
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Nossa loja está disponível apenas para dispositivos móveis.
        Abra este link no seu celular para continuar comprando.
      </p>
    </div>
  );
}
