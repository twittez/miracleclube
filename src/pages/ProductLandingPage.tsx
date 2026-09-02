import React, { useState, useEffect } from "react";
import { product, type ProductVariation, type ProductSize } from "../data/product";
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

interface ProductLandingPageProps {
  onNavigateToCheckout?: () => void;
  onNavigateToTracking?: () => void;
}

export const ProductLandingPage: React.FC<ProductLandingPageProps> = ({
  onNavigateToCheckout,
  onNavigateToTracking,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [instModalTab, setInstModalTab] = useState<InstitutionalTab>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariation>(product.variations[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeError, setShowSizeError] = useState<boolean>(false);
  const { addItem } = useCart();

  useEffect(() => {
    // Track ViewContent on landing page load (Guarded so it fires ONCE per session)
    trackViewContent({
      id: "CMFBPM001-BFPP",
      name: product.name,
      price: product.price,
    });
    trackTikTokViewContent({
      id: "CMFBPM001-BFPP",
      name: product.name,
      price: product.price,
    });
  }, []);

  const handleAddToCart = (qty: number, variation: ProductVariation, size: ProductSize) => {
    addItem({
      productId: product.id,
      name: product.name,
      size: size.label,
      color: variation.name,
      quantity: qty,
      price: product.price,
      image: product.images[variation.imageIndex],
    });

    // Track AddToCart ONLY when product is actually added
    trackAddToCart({
      id: "CMFBPM001-BFPP",
      name: product.name,
      price: product.price,
      quantity: qty,
    });
    trackTikTokAddToCart({
      id: "CMFBPM001-BFPP",
      name: product.name,
      price: product.price,
      quantity: qty,
    });

    setToastMessage(`Adicionado: ${qty}x ${product.name} (${variation.name}, Tam: ${size.label})`);
    setCartDrawerOpen(true);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleMobileStickyBuy = () => {
    if (selectedSize) {
      // JÁ SELECIONOU TAMANHO: Adiciona diretamente ao carrinho e abre a gaveta!
      handleAddToCart(quantity, selectedVariant, selectedSize);
    } else {
      // NÃO SELECIONOU TAMANHO: Rola até o seletor e mostra aviso
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
      <AnnouncementBar />
      <Header 
        onCartClick={() => setCartDrawerOpen(true)} 
        onAuthClick={() => setAuthModalOpen(true)}
        onTrackingClick={onNavigateToTracking}
      />

      {/* Breadcrumb Path */}
      <Breadcrumb items={product.breadcrumb} />

      {/* Primary Main Product Section (Gallery + Right Column) */}
      <main>
        <div id="product-section">
          <ProductMainSection 
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
        <BenefitsSection />

        {/* Rich Visual Alternating Story Sections */}
        <ProductDescription />

        {/* Reviews Section */}
        <ReviewsSection />

        {/* FAQ Accordion Section */}
        <FAQ />

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
      <MobileStickyCTA onBuyClick={handleMobileStickyBuy} />

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
