import React from "react";
import { Check } from "lucide-react";
import "./BuyButton.css";

interface BuyButtonProps {
  onClick: () => void;
  loading?: boolean;
  success?: boolean;
}

export const BuyButton: React.FC<BuyButtonProps> = ({ onClick, loading = false, success = false }) => {
  return (
    <button
      type="button"
      className={`buy-button ${success ? "buy-button--success" : ""}`}
      onClick={onClick}
      disabled={loading}
    >
      {success ? (
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
