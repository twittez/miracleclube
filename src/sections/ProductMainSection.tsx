import React, { useState } from "react";
import { product as defaultProduct, type ProductVariation, type ProductSize, type ProductData } from "../data/product";
import { ProductGallery } from "../components/ProductGallery";
import { ProductInformation } from "../components/ProductInformation";
import "./ProductMainSection.css";

interface ProductMainSectionProps {
  product?: ProductData;
  onAddToCart?: (qty: number, variation: ProductVariation, size: ProductSize) => void;
  selectedVariant?: ProductVariation;
  selectedSize?: ProductSize | null;
  selectedVariant2?: ProductVariation;
  selectedSize2?: ProductSize | null;
  quantity?: number;
  showSizeError?: boolean;
  showSize2Error?: boolean;
  onVariantChange?: (variation: ProductVariation) => void;
  onSizeChange?: (size: ProductSize | null) => void;
  onVariant2Change?: (variation: ProductVariation) => void;
  onSize2Change?: (size: ProductSize | null) => void;
  onQuantityChange?: (qty: number) => void;
}

export const ProductMainSection: React.FC<ProductMainSectionProps> = ({ 
  product: propProduct,
  onAddToCart,
  selectedVariant,
  selectedSize,
  selectedVariant2,
  selectedSize2,
  quantity,
  showSizeError,
  showSize2Error,
  onVariantChange,
  onSizeChange,
  onVariant2Change,
  onSize2Change,
  onQuantityChange,
}) => {
  const product = propProduct || defaultProduct;
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);

  const handleVariantChange = (variant: ProductVariation) => {
    setSelectedGalleryIdx(variant.imageIndex);
    if (onVariantChange) onVariantChange(variant);
  };

  const handleVariant2Change = (variant: ProductVariation) => {
    setSelectedGalleryIdx(variant.imageIndex);
    if (onVariant2Change) onVariant2Change(variant);
  };

  return (
    <section className="product-main-section">
      <div className="container product-main-section__grid">
        {/* Left Column: Product Gallery */}
        <div className="product-main-section__gallery-col">
          <ProductGallery
            images={product.images}
            productName={product.name}
            selectedIndex={selectedGalleryIdx}
            onSelectImage={(idx) => setSelectedGalleryIdx(idx)}
          />
        </div>

        {/* Right Column: Product Information */}
        <div className="product-main-section__info-col">
          <ProductInformation
            product={product}
            selectedVariant={selectedVariant}
            selectedSize={selectedSize}
            selectedVariant2={selectedVariant2}
            selectedSize2={selectedSize2}
            quantity={quantity}
            showSizeError={showSizeError}
            showSize2Error={showSize2Error}
            onVariantChange={handleVariantChange}
            onSizeChange={onSizeChange}
            onVariant2Change={handleVariant2Change}
            onSize2Change={onSize2Change}
            onQuantityChange={onQuantityChange}
            onBuySuccess={(qty, varObj, sizeObj) => {
              if (onAddToCart) onAddToCart(qty, varObj, sizeObj);
            }}
          />
        </div>
      </div>
    </section>
  );
};
