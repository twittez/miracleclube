import React from "react";
import { Phone, MessageSquare, Mail } from "lucide-react";
import { brand } from "../config/brand";
import "./Footer.css";

const FacebookIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.89h-2.34V21.88C18.34 21.12 22 16.99 22 12z"/>
  </svg>
);

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

interface FooterProps {
  onOpenExchanges?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTracking?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenExchanges,
  onOpenPrivacy,
  onOpenTracking
}) => {
  return (
    <footer className="site-footer">
      {/* Upper Footer Columns */}
      <div className="site-footer__top">
        <div className="container site-footer__grid">
          {/* Column 1: Brand Info (Logo image removed as requested) */}
          <div className="site-footer__col">
            <h3 className="site-footer__brand-title">MIRACLE</h3>
            <p className="site-footer__about-text">
              Especialistas em modeladores femininos de alta compressão. Desenvolvidos para proporcionar contorno anatômico, postura firme e conforto absoluto no seu dia a dia.
            </p>
            <div className="site-footer__social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="site-footer__social-btn">
                <FacebookIcon size={16} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="site-footer__social-btn">
                <InstagramIcon size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div className="site-footer__col">
            <h4 className="site-footer__col-title">Categorias</h4>
            <ul className="site-footer__links-list">
              <li><a href="#product-section">Cinta Body Modelador</a></li>
              <li><a href="#product-section">Combos Promocionais</a></li>
              <li><a href="#product-section">Linha Plus Size</a></li>
              <li><a href="#product-section">Nossos Queridinhos</a></li>
            </ul>
          </div>

          {/* Column 3: Institutional & Links */}
          <div className="site-footer__col">
            <h4 className="site-footer__col-title">Institucional</h4>
            <ul className="site-footer__links-list">
              <li>
                <button type="button" onClick={onOpenTracking} className="site-footer__text-btn">
                  Rastreio de Pedido
                </button>
              </li>
              <li>
                <button type="button" onClick={onOpenExchanges} className="site-footer__text-btn">
                  Política de Devolução e Reembolso
                </button>
              </li>
              <li>
                <button type="button" onClick={onOpenPrivacy} className="site-footer__text-btn">
                  Política de Privacidade
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info (Full address removed as requested) */}
          <div className="site-footer__col">
            <h4 className="site-footer__col-title">Atendimento</h4>
            <div className="site-footer__contact-box">
              <a href={`https://wa.me/${brand.company.whatsappLink}`} className="site-footer__contact-row" style={{textDecoration: 'none', color: 'inherit'}}>
                <MessageSquare size={16} className="site-footer__contact-icon" />
                <span>WhatsApp: {brand.company.whatsapp}</span>
              </a>
              <div className="site-footer__contact-row">
                <Phone size={16} className="site-footer__contact-icon" />
                <span>Telefone: {brand.company.phone}</span>
              </div>
              <div className="site-footer__contact-row">
                <Mail size={16} className="site-footer__contact-icon" />
                <span>E-mail: {brand.company.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Lower Footer: Copyright & CNPJ Only */}
      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p className="site-footer__copyright">
            MIRACLE - CNPJ: {brand.company.cnpj} | Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
