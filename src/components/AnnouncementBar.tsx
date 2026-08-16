import React from "react";
import { Gift, Truck, CreditCard, Sparkles } from "lucide-react";
import "./AnnouncementBar.css";

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="announcement-bar">
      <div className="announcement-bar__ticker-track">
        <div className="announcement-bar__ticker-group">
          <span className="announcement-bar__item">
            <Gift size={14} /> GANHE 10% OFF COM O CUPOM <strong>PRIMEIRACOMPRA</strong>
          </span>
          <span className="announcement-bar__divider">•</span>
          <span className="announcement-bar__item">
            <Truck size={14} /> FRETE GRÁTIS DISPONÍVEL
          </span>
          <span className="announcement-bar__divider">•</span>
          <span className="announcement-bar__item">
            <CreditCard size={14} /> 10X DE R$ 15,99 SEM JUROS
          </span>
          <span className="announcement-bar__divider">•</span>
          <span className="announcement-bar__item">
            <Sparkles size={14} /> OFERTA POR R$ 159,90
          </span>
          <span className="announcement-bar__divider">•</span>
        </div>

        {/* Duplicate group for seamless infinite loop */}
        <div className="announcement-bar__ticker-group" aria-hidden="true">
          <span className="announcement-bar__item">
            <Gift size={14} /> GANHE 10% OFF COM O CUPOM <strong>PRIMEIRACOMPRA</strong>
          </span>
          <span className="announcement-bar__divider">•</span>
          <span className="announcement-bar__item">
            <Truck size={14} /> FRETE GRÁTIS DISPONÍVEL
          </span>
          <span className="announcement-bar__divider">•</span>
          <span className="announcement-bar__item">
            <CreditCard size={14} /> 10X DE R$ 15,99 SEM JUROS
          </span>
          <span className="announcement-bar__divider">•</span>
          <span className="announcement-bar__item">
            <Sparkles size={14} /> OFERTA POR R$ 159,90
          </span>
          <span className="announcement-bar__divider">•</span>
        </div>
      </div>
    </div>
  );
};
