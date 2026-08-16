import React from "react";
import type { ProductVariation } from "../data/product";
import "./VariantSelector.css";

interface VariantSelectorProps {
  variations: ProductVariation[];
  selectedVariation: ProductVariation;
  onSelect: (variation: ProductVariation) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variations,
  selectedVariation,
  onSelect,
}) => {
  return (
    <div className="variant-selector">
      <div className="variant-selector__header">
        <span className="variant-selector__label">
          Cor: <strong>{selectedVariation.name}</strong>
        </span>
      </div>

      <div className="variant-selector__list">
        {variations.map((v) => (
          <button
            key={v.id}
            className={`variant-selector__swatch ${v.id === selectedVariation.id ? "active" : ""}`}
            onClick={() => onSelect(v)}
            title={v.name}
            aria-label={`Cor ${v.name}`}
          >
            <span className="variant-selector__color-circle" style={{ backgroundColor: v.colorCode }} />
            <span className="variant-selector__name">{v.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
