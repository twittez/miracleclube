import React, { useState } from "react";
import { Check } from "lucide-react";
import "./BuyButton.css";

interface BuyButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export const BuyButton: React.FC<BuyButtonProps> = ({ onClick, loading = false }) => {
  const [purchased, setPurchased] = useState(false);

  const handleClick = () => {
    onClick();
    setPurchased(true);
    setTimeout(() => setPurchased(false), 2500);
  };

  return (
    <button
      type="button"
      className={`buy-button ${purchased ? "buy-button--success" : ""}`}
      onClick={handleClick}
      disabled={loading}
    >
      {purchased ? (
        <>
          <Check size={20} />
          <span>ADICIONADO!</span>
        </>
      ) : (
        <span>Comprar</span>
      )}
    </button>
  );
};
