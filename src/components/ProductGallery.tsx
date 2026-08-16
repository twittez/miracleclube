import React, { useState, useRef, useEffect, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import "./ProductGallery.css";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  selectedIndex?: number;
  onSelectImage?: (index: number) => void;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  selectedIndex = 0,
  onSelectImage,
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(selectedIndex);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  const currentIndex = onSelectImage !== undefined ? selectedIndex : activeIdx;

  const handleSelect = (index: number) => {
    setActiveIdx(index);
    if (onSelectImage) onSelectImage(index);
  };

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + images.length) % images.length;
    handleSelect(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % images.length;
    handleSelect(nextIdx);
  };

  // Touch Swipe state for mobile main image
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipeLeft = distance > 40;
    const isSwipeRight = distance < -40;

    if (isSwipeLeft) handleNext();
    if (isSwipeRight) handlePrev();

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Lightbox handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxOpen) {
        setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  // Touch Swipe state for lightbox
  const lbTouchStartX = useRef<number | null>(null);
  const lbTouchEndX = useRef<number | null>(null);

  const lbHandleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    lbTouchStartX.current = e.targetTouches[0].clientX;
  };

  const lbHandleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    lbTouchEndX.current = e.targetTouches[0].clientX;
  };

  const lbHandleTouchEnd = () => {
    if (!lbTouchStartX.current || !lbTouchEndX.current) return;
    const distance = lbTouchStartX.current - lbTouchEndX.current;
    if (distance > 40) handleNext();
    if (distance < -40) handlePrev();
    lbTouchStartX.current = null;
    lbTouchEndX.current = null;
  };

  return (
    <div className="product-gallery">
      {/* Desktop Thumbnails Sidebar */}
      <div className="product-gallery__thumbnails desktop-only">
        {images.map((img, idx) => (
          <button
            key={idx}
            className={`product-gallery__thumb-btn ${idx === currentIndex ? "active" : ""}`}
            onClick={() => handleSelect(idx)}
            aria-label={`Ver imagem ${idx + 1}`}
          >
            <img src={img} alt={`${productName} thumbnail ${idx + 1}`} className="product-gallery__thumb-img" />
          </button>
        ))}
      </div>

      {/* Main Image Viewport */}
      <div className="product-gallery__main-wrap">
        <div
          className="product-gallery__main-viewport"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={images[currentIndex]}
            alt={productName}
            className="product-gallery__main-img"
            loading={currentIndex === 0 ? "eager" : "lazy"}
            fetchPriority={currentIndex === 0 ? "high" : "low"}
          />

          {/* Navigation Arrows */}
          <button
            className="product-gallery__nav-btn product-gallery__nav-btn--prev"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            className="product-gallery__nav-btn product-gallery__nav-btn--next"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            aria-label="Próxima imagem"
          >
            <ChevronRight size={20} />
          </button>

          {/* Mobile Image Counter Badge */}
          <div className="product-gallery__mobile-counter mobile-only">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Mobile Horizontal Thumbnails Strip */}
        <div className="product-gallery__mobile-thumbs mobile-only">
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`product-gallery__mobile-thumb-btn ${idx === currentIndex ? "active" : ""}`}
              onClick={() => handleSelect(idx)}
              aria-label={`Ver imagem ${idx + 1}`}
            >
              <img src={img} alt={`${productName} thumbnail ${idx + 1}`} className="product-gallery__thumb-img" />
            </button>
          ))}
        </div>

        {/* Mobile Swipe Pagination Dots */}
        <div className="product-gallery__dots mobile-only">
          {images.map((_, idx) => (
            <button
              key={idx}
              className={`product-gallery__dot ${idx === currentIndex ? "active" : ""}`}
              onClick={() => handleSelect(idx)}
              aria-label={`Ir para imagem ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="product-gallery__lightbox"
          onClick={() => setLightboxOpen(false)}
          onTouchStart={lbHandleTouchStart}
          onTouchMove={lbHandleTouchMove}
          onTouchEnd={lbHandleTouchEnd}
        >
          <button
            className="product-gallery__lightbox-close"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Fechar"
          >
            <X size={28} />
          </button>
          
          <div className="product-gallery__lightbox-counter">
            {currentIndex + 1} / {images.length}
          </div>

          <button
            className="product-gallery__nav-btn product-gallery__lightbox-prev"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={24} />
          </button>

          <img
            src={images[currentIndex]}
            alt={productName}
            className="product-gallery__lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="product-gallery__nav-btn product-gallery__lightbox-next"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            aria-label="Próxima imagem"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
};
