import React, { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "../utils/formatters";
import { product } from "../data/product";
import "./MobileStickyCTA.css";

interface MobileStickyCTAProps {
  onBuyClick: () => void;
}

export const MobileStickyCTA: React.FC<MobileStickyCTAProps> = ({ onBuyClick }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA when scrolled past 400px
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="mobile-sticky-cta mobile-only">
      <div className="mobile-sticky-cta__inner">
        <div className="mobile-sticky-cta__price-info">
          <span className="mobile-sticky-cta__price">{formatCurrency(product.price)}</span>
          <span className="mobile-sticky-cta__installment">
            em até {product.installmentsMax}x de {formatCurrency(product.installmentValue)}
          </span>
        </div>

        <button type="button" className="mobile-sticky-cta__btn" onClick={onBuyClick}>
          <ShoppingBag size={18} />
          <span>COMPRAR AGORA</span>
        </button>
      </div>
    </div>
  );
};
