import React, { useState } from "react";
import { product, type ProductVariation, type ProductSize } from "../data/product";
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
  onBuySuccess?: (qty: number, variation: ProductVariation, size: ProductSize) => void;
  onVariantChange?: (variation: ProductVariation) => void;
}

export const ProductInformation: React.FC<ProductInformationProps> = ({
  onBuySuccess,
  onVariantChange,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariation>(product.variations[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeError, setShowSizeError] = useState<boolean>(false);

  const handleVariantSelect = (v: ProductVariation) => {
    setSelectedVariant(v);
    if (onVariantChange) onVariantChange(v);
  };

  const handleSizeSelect = (s: ProductSize) => {
    setSelectedSize(s);
    setShowSizeError(false);
  };

  const handleBuyClick = () => {
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }

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
      />

      {/* Action Row: Quantity + Buy CTA */}
      <div className="product-info__action-row">
        <QuantitySelector
          quantity={quantity}
          onIncrement={() => setQuantity((q) => q + 1)}
          onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
        />

        <div className="product-info__buttons">
          <BuyButton onClick={handleBuyClick} />
          <a 
            href={`https://wa.me/${brand.company.whatsappLink}?text=Ol%C3%A1!%20Gostaria%20de%20comprar%20o%20Body%20Modelador`}
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
