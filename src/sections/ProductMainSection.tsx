import React, { useState } from "react";
import { product, type ProductVariation, type ProductSize } from "../data/product";
import { ProductGallery } from "../components/ProductGallery";
import { ProductInformation } from "../components/ProductInformation";
import "./ProductMainSection.css";

interface ProductMainSectionProps {
  onAddToCart?: (qty: number, variation: ProductVariation, size: ProductSize) => void;
}

export const ProductMainSection: React.FC<ProductMainSectionProps> = ({ onAddToCart }) => {
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);

  const handleVariantChange = (variant: ProductVariation) => {
    setSelectedGalleryIdx(variant.imageIndex);
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
            onVariantChange={handleVariantChange}
            onBuySuccess={(qty, varObj, sizeObj) => {
              if (onAddToCart) onAddToCart(qty, varObj, sizeObj);
            }}
          />
        </div>
      </div>
    </section>
  );
};
