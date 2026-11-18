import React, { useState, useEffect } from "react";
import { productCinta4Fechos, type ProductVariation, type ProductSize } from "../data/product";
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

interface CintaQuatroFechosPageProps {
  onNavigateToCheckout?: () => void;
  onNavigateToTracking?: () => void;
}

export const CintaQuatroFechosPage: React.FC<CintaQuatroFechosPageProps> = ({
  onNavigateToCheckout,
  onNavigateToTracking,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [instModalTab, setInstModalTab] = useState<InstitutionalTab>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariation>(productCinta4Fechos.variations[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeError, setShowSizeError] = useState<boolean>(false);
  const { addItem } = useCart();

  useEffect(() => {
    try {
      sessionStorage.removeItem("miracle_flow");
      localStorage.removeItem("miracle_flow");
    } catch {}

    trackViewContent({
      id: productCinta4Fechos.sku,
      name: productCinta4Fechos.name,
      price: productCinta4Fechos.price,
    });
    trackTikTokViewContent({
      id: productCinta4Fechos.sku,
      name: productCinta4Fechos.name,
      price: productCinta4Fechos.price,
    });
  }, []);

  const handleAddToCart = (qty: number, variation: ProductVariation, size: ProductSize) => {
    try {
      sessionStorage.removeItem("miracle_flow");
      localStorage.removeItem("miracle_flow");
    } catch {}

    addItem({
      productId: productCinta4Fechos.id,
      name: productCinta4Fechos.name,
      size: size.label,
      color: variation.name,
      quantity: qty,
      price: productCinta4Fechos.price,
      image: productCinta4Fechos.images[variation.imageIndex],
      pixDiscountPercent: productCinta4Fechos.pixDiscountPercent,
    });

    trackAddToCart({
      id: productCinta4Fechos.sku,
      name: productCinta4Fechos.name,
      price: productCinta4Fechos.price,
      quantity: qty,
    });
    trackTikTokAddToCart({
      id: productCinta4Fechos.sku,
      name: productCinta4Fechos.name,
      price: productCinta4Fechos.price,
      quantity: qty,
    });

    setToastMessage(`Adicionado: ${qty}x ${productCinta4Fechos.name} (${variation.name}, Tam: ${size.label})`);
    setCartDrawerOpen(true);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleMobileStickyBuy = () => {
    if (selectedSize) {
      handleAddToCart(quantity, selectedVariant, selectedSize);
    } else {
      setShowSizeError(true);
      const elem = document.querySelector(".size-selector") || document.querySelector(".product-main-section");
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
        installmentText="5X DE R$ 11,98 SEM JUROS"
        offerText="OFERTA POR R$ 59,90"
      />
      <Header
        onCartClick={() => setCartDrawerOpen(true)}
        onAuthClick={() => setAuthModalOpen(true)}
        onTrackingClick={onNavigateToTracking}
      />

      {/* Breadcrumb Path */}
      <Breadcrumb items={productCinta4Fechos.breadcrumb} />

      {/* Primary Main Product Section (Gallery + Right Column) */}
      <main>
        <div id="product-section">
          <ProductMainSection
            product={productCinta4Fechos}
            selectedVariant={selectedVariant}
            selectedSize={selectedSize}
            quantity={quantity}
            showSizeError={showSizeError}
            onVariantChange={setSelectedVariant}
            onSizeChange={(s) => {
              setSelectedSize(s);
              setShowSizeError(false);
            }}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Feature Highlights Grid */}
        <BenefitsSection
          product={productCinta4Fechos}
          title="Por que escolher a Cinta Modeladora 4 Regulagens?"
        />

        {/* Rich Visual Alternating Story Sections */}
        <ProductDescription product={productCinta4Fechos} />

        {/* Reviews Section */}
        <ReviewsSection product={productCinta4Fechos} />

        {/* FAQ Accordion Section */}
        <FAQ product={productCinta4Fechos} />

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
        product={productCinta4Fechos}
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
