import React, { useState, useEffect } from "react";
import { productSutia, type ProductVariation, type ProductSize } from "../data/product";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { Header } from "../components/Header";
import { Breadcrumb } from "../components/Breadcrumb";
import { ProductMainSection } from "../sections/ProductMainSection";
import { BenefitsSection } from "../sections/BenefitsSection";
import { ProductDescription } from "../sections/ProductDescription";
import { ReviewsSection } from "../sections/ReviewsSection";
import { FAQ } from "../sections/FAQ";
import { Newsletter } from "../sections/Newsletter";
import { Footer } from "../sections/Footer";
import { MobileStickyCTA } from "../components/MobileStickyCTA";
import { CartDrawer } from "../components/CartDrawer";
import { AuthModal } from "../components/AuthModal";
import { InstitutionalModal, type InstitutionalTab } from "../components/InstitutionalModal";
import { useCart } from "../contexts/CartContext";
import { trackViewContent, trackAddToCart } from "../services/metaPixel";
import { trackTikTokViewContent, trackTikTokAddToCart } from "../services/tiktokPixel";
import "./ProductLandingPage.css";

interface SutiaSustentacaoPageProps {
  onNavigateToCheckout?: () => void;
  onNavigateToTracking?: () => void;
}

export const SutiaSustentacaoPage: React.FC<SutiaSustentacaoPageProps> = ({
  onNavigateToCheckout,
  onNavigateToTracking,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [instModalTab, setInstModalTab] = useState<InstitutionalTab>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariation>(productSutia.variations[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedVariant2, setSelectedVariant2] = useState<ProductVariation>(productSutia.variations[0]);
  const [selectedSize2, setSelectedSize2] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeError, setShowSizeError] = useState<boolean>(false);
  const [showSize2Error, setShowSize2Error] = useState<boolean>(false);
  const { addItem } = useCart();

  useEffect(() => {
    try {
      sessionStorage.removeItem("miracle_flow");
      localStorage.removeItem("miracle_flow");
    } catch {}

    trackViewContent({
      id: productSutia.sku,
      name: productSutia.name,
      price: productSutia.price,
    });
    trackTikTokViewContent({
      id: productSutia.sku,
      name: productSutia.name,
      price: productSutia.price,
    });
  }, []);

  const handleAddToCart = (qty: number, variation: ProductVariation, size: ProductSize) => {
    try {
      sessionStorage.removeItem("miracle_flow");
      localStorage.removeItem("miracle_flow");
    } catch {}

    addItem({
      productId: productSutia.id,
      name: productSutia.name,
      size: size.label,
      color: variation.name,
      quantity: qty,
      price: productSutia.price,
      image: productSutia.images[variation.imageIndex],
      pixDiscountPercent: productSutia.pixDiscountPercent,
    });

    trackAddToCart({
      id: productSutia.sku,
      name: productSutia.name,
      price: productSutia.price,
      quantity: qty,
    });
    trackTikTokAddToCart({
      id: productSutia.sku,
      name: productSutia.name,
      price: productSutia.price,
      quantity: qty,
    });

    setToastMessage(`Adicionado: ${qty}x ${productSutia.name} (${variation.name} | Tam: ${size.label})`);
    setCartDrawerOpen(true);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleMobileStickyBuy = () => {
    if (selectedSize && selectedSize2) {
      const combinedVariation: ProductVariation = {
        ...selectedVariant,
        name: `1º ${selectedVariant.name} / 2º ${selectedVariant2.name}`,
      };
      const combinedSize: ProductSize = {
        ...selectedSize,
        label: `1º ${selectedSize.label} / 2º ${selectedSize2.label}`,
      };
      handleAddToCart(quantity, combinedVariation, combinedSize);
    } else {
      if (!selectedSize) setShowSizeError(true);
      if (!selectedSize2) setShowSize2Error(true);
      const targetId = !selectedSize ? "#bundle-unit-1" : "#bundle-unit-2";
      const elem = document.querySelector(targetId) || document.querySelector(".size-selector") || document.querySelector(".product-main-section");
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return (
    <div className="mobile-store">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar & Header */}
      <AnnouncementBar
        installmentText="5X DE R$ 13,98 SEM JUROS"
        offerText="2 UNIDADES POR R$ 69,90"
      />
      <Header
        onCartClick={() => setCartDrawerOpen(true)}
        onAuthClick={() => setAuthModalOpen(true)}
        onTrackingClick={onNavigateToTracking}
      />

      {/* Breadcrumb Path */}
      <Breadcrumb items={productSutia.breadcrumb} />

      {/* Primary Main Product Section (Gallery + Right Column) */}
      <main>
        <div id="product-section">
          <ProductMainSection
            product={productSutia}
            selectedVariant={selectedVariant}
            selectedSize={selectedSize}
            selectedVariant2={selectedVariant2}
            selectedSize2={selectedSize2}
            quantity={quantity}
            showSizeError={showSizeError}
            showSize2Error={showSize2Error}
            onVariantChange={setSelectedVariant}
            onSizeChange={(s) => {
              setSelectedSize(s);
              setShowSizeError(false);
            }}
            onVariant2Change={setSelectedVariant2}
            onSize2Change={(s) => {
              setSelectedSize2(s);
              setShowSize2Error(false);
            }}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Feature Highlights Grid */}
        <BenefitsSection
          product={productSutia}
          title="Por que escolher o Sutiã Premium Sustentação?"
        />

        {/* Rich Visual Alternating Story Sections */}
        <ProductDescription product={productSutia} />

        {/* Reviews Section */}
        <ReviewsSection product={productSutia} />

        {/* FAQ Accordion Section */}
        <FAQ product={productSutia} />

        {/* Email Newsletter Box */}
        <Newsletter />
      </main>

      {/* Footer */}
      <Footer
        onOpenExchanges={() => setInstModalTab("exchanges")}
        onOpenPrivacy={() => setInstModalTab("privacy")}
        onOpenTracking={() => {
          if (onNavigateToTracking) {
            onNavigateToTracking();
          } else {
            setInstModalTab("tracking");
          }
        }}
      />

      {/* Mobile Sticky CTA Bar */}
      <MobileStickyCTA
        product={productSutia}
        onBuyClick={handleMobileStickyBuy}
      />

      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onCheckout={onNavigateToCheckout}
      />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <InstitutionalModal activeTab={instModalTab} onClose={() => setInstModalTab(null)} />
    </div>
  );
};
