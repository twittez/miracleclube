import React, { useState } from "react";
import { Ruler, AlertCircle } from "lucide-react";
import type { ProductSize } from "../data/product";
import { SizeGuideModal } from "./SizeGuideModal";
import "./SizeSelector.css";

interface SizeSelectorProps {
  sizes: ProductSize[];
  selectedSize: ProductSize | null;
  onSelect: (size: ProductSize) => void;
  showError?: boolean;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onSelect,
  showError = false,
}) => {
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  return (
    <div className={`size-selector ${showError ? "size-selector--error" : ""}`}>
      <div className="size-selector__header">
        <span className="size-selector__label">
          Tamanho: <strong>{selectedSize ? selectedSize.label : "Selecione o tamanho"}</strong>
        </span>

        <button
          type="button"
          className="size-selector__guide-trigger"
          onClick={() => setGuideModalOpen(true)}
        >
          <Ruler size={14} />
          <span>Guia de Medidas</span>
        </button>
      </div>

      <div className="size-selector__grid">
        {sizes.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`size-selector__btn ${selectedSize?.id === s.id ? "active" : ""} ${!s.available ? "disabled" : ""}`}
            onClick={() => s.available && onSelect(s)}
            disabled={!s.available}
            aria-label={`Tamanho ${s.label}`}
          >
            <span className="size-selector__btn-label">{s.label}</span>
            {s.subtext && <span className="size-selector__btn-sub">{s.subtext}</span>}
          </button>
        ))}
      </div>

      {showError && (
        <div className="size-selector__error-msg">
          <AlertCircle size={14} />
          <span>Por favor, selecione um tamanho antes de comprar.</span>
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={guideModalOpen} onClose={() => setGuideModalOpen(false)} />
    </div>
  );
};
