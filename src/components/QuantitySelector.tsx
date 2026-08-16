import React from "react";
import { Minus, Plus } from "lucide-react";
import "./QuantitySelector.css";

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrement,
  onDecrement,
}) => {
  return (
    <div className="quantity-selector">
      <button
        type="button"
        className="quantity-selector__btn"
        onClick={onDecrement}
        disabled={quantity <= 1}
        aria-label="Diminuir quantidade"
      >
        <Minus size={14} />
      </button>
      <span className="quantity-selector__value">{quantity}</span>
      <button
        type="button"
        className="quantity-selector__btn"
        onClick={onIncrement}
        aria-label="Aumentar quantidade"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
