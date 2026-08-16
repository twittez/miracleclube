import React from "react";
import { X, Phone, MessageSquare, Mail, ChevronRight } from "lucide-react";
import { brand } from "../config/brand";
import "./MobileMenu.css";

interface NavLink {
  label: string;
  href: string;
  highlight?: boolean;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, navLinks }) => {
  if (!isOpen) return null;

  return (
    <div className="mobile-menu-overlay" onClick={onClose}>
      <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-menu-drawer__header">
          <div className="mobile-menu-drawer__logo">
            <img src="/images/logo.png" alt={brand.name} className="mobile-menu-drawer__logo-img" />
          </div>
          <button className="mobile-menu-drawer__close" onClick={onClose} aria-label="Fechar menu">
            <X size={24} />
          </button>
        </div>

        <nav className="mobile-menu-drawer__nav">
          <ul className="mobile-menu-drawer__list">
            {navLinks.map((link, idx) => (
              <li key={idx} className="mobile-menu-drawer__item">
                <a
                  href={link.href}
                  className={`mobile-menu-drawer__link ${link.highlight ? "mobile-menu-drawer__link--highlight" : ""}`}
                  onClick={onClose}
                >
                  <span>{link.label}</span>
                  <ChevronRight size={16} />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mobile-menu-drawer__footer">
          <h4 className="mobile-menu-drawer__footer-title">Atendimento ao Cliente</h4>
          <a href={`https://wa.me/${brand.company.whatsappLink}`} className="mobile-menu-drawer__contact-item">
            <MessageSquare size={16} color="#25D366" />
            <span>WhatsApp: {brand.company.whatsapp}</span>
          </a>
          <a href={`tel:${brand.company.phone.replace(/\D/g, "")}`} className="mobile-menu-drawer__contact-item">
            <Phone size={16} />
            <span>Telefone: {brand.company.phone}</span>
          </a>
          <a href={`mailto:${brand.company.email}`} className="mobile-menu-drawer__contact-item">
            <Mail size={16} />
            <span>{brand.company.email}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
