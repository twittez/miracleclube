import { Link } from "@/lib/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { BRAND } from "@/lib/product";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-dark px-6 py-10 text-sm text-white/70">
      <div className="shell">
        <h2 className="text-lg font-bold tracking-[0.2em] text-white">{BRAND.name}</h2>
        <p className="mt-4 leading-relaxed">
          Especialistas em modeladores femininos de alta compressão. Desenvolvidos para
          proporcionar contorno anatômico, postura firme e conforto absoluto no seu dia a
          dia.
        </p>

        <div className="mt-6 flex gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-white/20">
            <FacebookIcon className="size-4" />
          </span>
          <span className="grid size-9 place-items-center rounded-full border border-white/20">
            <InstagramIcon className="size-4" />
          </span>
        </div>

        <h3 className="mt-8 text-xs font-bold tracking-[0.18em] text-white">CATEGORIAS</h3>
        <ul className="mt-4 space-y-5">
          <li>Cinta Body Modelador</li>
          <li>Combos Promocionais</li>
          <li>Linha Plus Size</li>
          <li>Nossos Queridinhos</li>
        </ul>

        <h3 className="mt-8 text-xs font-bold tracking-[0.18em] text-white">
          INSTITUCIONAL
        </h3>
        <ul className="mt-4 space-y-5">
          <li>
            <Link to="/rastreio">Rastreio de Pedido</Link>
          </li>
          <li>
            <Link to="/politica-de-devolucao">Política de Devolução e Reembolso</Link>
          </li>
          <li>
            <Link to="/politica-de-privacidade">Política de Privacidade</Link>
          </li>
        </ul>

        <h3 className="mt-8 text-xs font-bold tracking-[0.18em] text-white">
          ATENDIMENTO
        </h3>
        <ul className="mt-4 space-y-4">
          <li className="flex items-center gap-3">
            <MessageCircle className="size-4 text-primary" /> WhatsApp: {BRAND.phone}
          </li>
          <li className="flex items-center gap-3">
            <Phone className="size-4 text-primary" /> Telefone: {BRAND.phone}
          </li>
          <li className="flex items-center gap-3">
            <Mail className="size-4 text-primary" /> E-mail: {BRAND.email}
          </li>
        </ul>

        <p className="mt-8 border-t border-white/10 pt-6 text-xs">
          {BRAND.name} - CNPJ: {BRAND.cnpj} | Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
