import React, { useState } from "react";
import { product as defaultProduct, type ProductVariation, type ProductSize, type ProductData } from "../data/product";
import { brand } from "../config/brand";
import { RatingHeader } from "./RatingHeader";
import { PriceBlock } from "./PriceBlock";
import { VariantSelector } from "./VariantSelector";
import { SizeSelector } from "./SizeSelector";
import { QuantitySelector } from "./QuantitySelector";
import { BuyButton } from "./BuyButton";
import { ShippingCalculator } from "./ShippingCalculator";
import { TrustBenefits } from "./TrustBenefits";
import "./ProductInformation.css";

interface ProductInformationProps {
  product?: ProductData;
  onBuySuccess?: (qty: number, variation: ProductVariation, size: ProductSize) => void;
  onVariantChange?: (variation: ProductVariation) => void;
  onSizeChange?: (size: ProductSize | null) => void;
  onVariant2Change?: (variation: ProductVariation) => void;
  onSize2Change?: (size: ProductSize | null) => void;
  onQuantityChange?: (qty: number) => void;
  selectedVariant?: ProductVariation;
  selectedSize?: ProductSize | null;
  selectedVariant2?: ProductVariation;
  selectedSize2?: ProductSize | null;
  quantity?: number;
  showSizeError?: boolean;
  showSize2Error?: boolean;
}

export const ProductInformation: React.FC<ProductInformationProps> = ({
  product: propProduct,
  onBuySuccess,
  onVariantChange,
  onSizeChange,
  onVariant2Change,
  onSize2Change,
  onQuantityChange,
  selectedVariant: propVariant,
  selectedSize: propSize,
  selectedVariant2: propVariant2,
  selectedSize2: propSize2,
  quantity: propQuantity,
  showSizeError: propShowSizeError,
  showSize2Error: propShowSize2Error,
}) => {
  const product = propProduct || defaultProduct;
  const isTwoUnitBundle = product.bundleUnits === 2;
  const [internalVariant, setInternalVariant] = useState<ProductVariation>(product.variations[0]);
  const [internalSize, setInternalSize] = useState<ProductSize | null>(null);
  const [internalVariant2, setInternalVariant2] = useState<ProductVariation>(
    product.variations[1] || product.variations[0]
  );
  const [internalSize2, setInternalSize2] = useState<ProductSize | null>(null);
  const [internalQuantity, setInternalQuantity] = useState<number>(1);
  const [internalShowSizeError, setInternalShowSizeError] = useState<boolean>(false);
  const [internalShowSize2Error, setInternalShowSize2Error] = useState<boolean>(false);
  const [justPurchased, setJustPurchased] = useState<boolean>(false);

  const selectedVariant = propVariant !== undefined ? propVariant : internalVariant;
  const selectedSize = propSize !== undefined ? propSize : internalSize;
  const selectedVariant2 = propVariant2 !== undefined ? propVariant2 : internalVariant2;
  const selectedSize2 = propSize2 !== undefined ? propSize2 : internalSize2;
  const quantity = propQuantity !== undefined ? propQuantity : internalQuantity;
  const showSizeError = propShowSizeError !== undefined ? propShowSizeError : internalShowSizeError;
  const showSize2Error = propShowSize2Error !== undefined ? propShowSize2Error : internalShowSize2Error;

  const handleVariantSelect = (v: ProductVariation) => {
    setInternalVariant(v);
    if (onVariantChange) onVariantChange(v);
  };

  const handleSizeSelect = (s: ProductSize) => {
    setInternalSize(s);
    setInternalShowSizeError(false);
    if (onSizeChange) onSizeChange(s);
  };

  const handleVariant2Select = (v: ProductVariation) => {
    setInternalVariant2(v);
    if (onVariant2Change) onVariant2Change(v);
    if (onVariantChange) onVariantChange(v);
  };

  const handleSize2Select = (s: ProductSize) => {
    setInternalSize2(s);
    setInternalShowSize2Error(false);
    if (onSize2Change) onSize2Change(s);
  };

  const handleQuantityChange = (newQty: number) => {
    setInternalQuantity(newQty);
    if (onQuantityChange) onQuantityChange(newQty);
  };

  const handleBuyClick = () => {
    if (isTwoUnitBundle) {
      const missingUnit1 = !selectedSize;
      const missingUnit2 = !selectedSize2;
      if (missingUnit1 || missingUnit2) {
        if (missingUnit1) setInternalShowSizeError(true);
        if (missingUnit2) setInternalShowSize2Error(true);
        const targetSelector = missingUnit1 ? "#bundle-unit-1" : "#bundle-unit-2";
        const elem = document.querySelector(targetSelector) || document.querySelector(".size-selector");
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      setJustPurchased(true);
      setTimeout(() => setJustPurchased(false), 2500);

      if (onBuySuccess && selectedSize && selectedSize2) {
        const combinedVariation: ProductVariation = {
          ...selectedVariant,
          name: `1º ${selectedVariant.name} / 2º ${selectedVariant2.name}`,
        };
        const combinedSize: ProductSize = {
          ...selectedSize,
          label: `1º ${selectedSize.label} / 2º ${selectedSize2.label}`,
        };
        onBuySuccess(quantity, combinedVariation, combinedSize);
      }
      return;
    }

    if (!selectedSize) {
      setInternalShowSizeError(true);
      const elem = document.querySelector(".size-selector");
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setJustPurchased(true);
    setTimeout(() => setJustPurchased(false), 2500);

    if (onBuySuccess) {
      onBuySuccess(quantity, selectedVariant, selectedSize);
    }
  };

  return (
    <div className="product-info">
      {/* Category Tag & Title */}
      <span className="product-info__sku">SKU: {product.sku}</span>
      <h1 className="product-info__title">{product.name}</h1>
      <p className="product-info__subtitle">{product.subtitle}</p>

      {/* Star Rating Block */}
      <RatingHeader rating={product.rating} reviewCount={product.reviewCount} />

      {/* Price & Installments Block */}
      <PriceBlock
        originalPrice={product.originalPrice}
        price={product.price}
        pixPrice={product.pixPrice}
        pixDiscountPercent={product.pixDiscountPercent}
        installmentsMax={product.installmentsMax}
        installmentValue={product.installmentValue}
      />

      {isTwoUnitBundle ? (
        <div className="bundle-units-container">
          <div className="bundle-units-header">
            <span className="bundle-units-badge">OFERTA LEVE 2 UNIDADES</span>
            <p className="bundle-units-subtitle">
              Personalize seu kit: escolha a <strong>cor</strong> e o <strong>tamanho</strong> de cada sutiã abaixo:
            </p>
          </div>

          {/* 1º Sutiã */}
          <div
            id="bundle-unit-1"
            className={`bundle-unit-card ${showSizeError ? "bundle-unit-card--error" : ""} ${selectedSize ? "bundle-unit-card--ready" : ""}`}
          >
            <div className="bundle-unit-card__header">
              <div className="bundle-unit-card__title-group">
                <span className="bundle-unit-card__number">1</span>
                <span className="bundle-unit-card__title">1º Sutiã (Unidade 1)</span>
              </div>
              <span className="bundle-unit-card__summary">
                {selectedVariant.name} • {selectedSize ? `Tam. ${selectedSize.label}` : "Escolha o tam."}
              </span>
            </div>

            <VariantSelector
              variations={product.variations}
              selectedVariation={selectedVariant}
              onSelect={handleVariantSelect}
            />

            <SizeSelector
              sizes={product.sizes}
              selectedSize={selectedSize}
              onSelect={handleSizeSelect}
              showError={showSizeError}
              sizeGuide={product.sizeGuide}
            />
          </div>

          {/* 2º Sutiã */}
          <div
            id="bundle-unit-2"
            className={`bundle-unit-card ${showSize2Error ? "bundle-unit-card--error" : ""} ${selectedSize2 ? "bundle-unit-card--ready" : ""}`}
          >
            <div className="bundle-unit-card__header">
              <div className="bundle-unit-card__title-group">
                <span className="bundle-unit-card__number">2</span>
                <span className="bundle-unit-card__title">2º Sutiã (Unidade 2)</span>
              </div>
              <span className="bundle-unit-card__summary">
                {selectedVariant2.name} • {selectedSize2 ? `Tam. ${selectedSize2.label}` : "Escolha o tam."}
              </span>
            </div>

            <VariantSelector
              variations={product.variations}
              selectedVariation={selectedVariant2}
              onSelect={handleVariant2Select}
            />

            <SizeSelector
              sizes={product.sizes}
              selectedSize={selectedSize2}
              onSelect={handleSize2Select}
              showError={showSize2Error}
              sizeGuide={product.sizeGuide}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Variation Color Selector */}
          <VariantSelector
            variations={product.variations}
            selectedVariation={selectedVariant}
            onSelect={handleVariantSelect}
          />

          {/* Size Selector */}
          <SizeSelector
            sizes={product.sizes}
            selectedSize={selectedSize}
            onSelect={handleSizeSelect}
            showError={showSizeError}
            sizeGuide={product.sizeGuide}
          />
        </>
      )}

      {/* Action Row: Quantity + Buy CTA */}
      <div className="product-info__action-row">
        <QuantitySelector
          quantity={quantity}
          onIncrement={() => handleQuantityChange(quantity + 1)}
          onDecrement={() => handleQuantityChange(Math.max(1, quantity - 1))}
        />

        <div className="product-info__buttons">
          <BuyButton onClick={handleBuyClick} success={justPurchased} />
          <a 
            href={`https://wa.me/${brand.company.whatsappLink}?text=${encodeURIComponent(`Olá! Gostaria de comprar o ${product.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="product-info__whatsapp-btn"
          >
            <span>Comprar pelo whatsapp</span>
            <span className="wa-icon-emoji">💬</span>
          </a>
        </div>
      </div>

      {/* Shipping CEP Calculator */}
      <ShippingCalculator />

      {/* Trust Badges */}
      <TrustBenefits />
    </div>
  );
};
