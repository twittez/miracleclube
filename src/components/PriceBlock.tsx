import React from "react";
import { CreditCard } from "lucide-react";
import { formatCurrency } from "../utils/formatters";
import "./PriceBlock.css";

interface PriceBlockProps {
  originalPrice: number;
  price: number;
  pixPrice: number;
  pixDiscountPercent?: number;
  installmentsMax?: number;
  installmentValue?: number;
}

export const PriceBlock: React.FC<PriceBlockProps> = ({
  originalPrice = 299.90,
  price = 159.90,
  pixPrice = 143.91,
}) => {
  // 5x installment calculation matching reference image style
  const instCount = 5;
  const instVal = price / instCount; // 159.90 / 5 = 31.98

  return (
    <div className="price-block">
      {/* Top Highlighted Installment Line */}
      <div className="price-block__installment-highlight">
        <span className="inst-num">{instCount}x</span> <span className="inst-de">de</span> <span className="inst-val">{formatCurrency(instVal)}</span>
      </div>

      {/* Normal & Struck Price Row */}
      <div className="price-block__prices-row">
        {originalPrice > price && (
          <span className="price-block__struck">{formatCurrency(originalPrice)}</span>
        )}
        <span className="price-block__final">{formatCurrency(price)}</span>
      </div>

      {/* Pix Discount Box */}
      <div className="price-block__pix-pill">
        <span className="pix-diamond">❖</span>
        <span className="pix-text">
          <strong>{formatCurrency(pixPrice)} no pix</strong> com 10% de desconto
        </span>
      </div>

      {/* More Payment Methods Link */}
      <a href="#payment-methods" className="price-block__more-payments" onClick={(e) => {
        e.preventDefault();
        const elem = document.querySelector(".shipping-calc");
        if (elem) elem.scrollIntoView({ behavior: "smooth" });
      }}>
        <CreditCard size={15} />
        <span>mais formas de pagamento</span>
      </a>
    </div>
  );
};
