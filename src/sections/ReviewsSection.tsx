import React, { useState } from "react";
import { product } from "../data/product";
import { ReviewSummary } from "../components/ReviewSummary";
import { ReviewCard } from "../components/ReviewCard";
import "./ReviewsSection.css";

export const ReviewsSection: React.FC = () => {
  const [displayedCount, setDisplayedCount] = useState<number>(3);

  const handleLoadMore = () => {
    setDisplayedCount((prev) => prev + 3);
  };

  const visibleReviews = product.reviews.slice(0, displayedCount);

  return (
    <section className="reviews-section" id="avaliacoes">
      <div className="container">
        <div className="reviews-section__header">
          <span className="reviews-section__tag">DEPOIMENTOS REAIS</span>
          <h2 className="reviews-section__title">Avaliações dos Clientes</h2>
        </div>

        {/* Rating Breakdown Summary */}
        <ReviewSummary rating={product.rating} reviewCount={product.reviewCount} />

        {/* Customer Review Cards Grid */}
        <div className="reviews-section__grid">
          {visibleReviews.map((rev) => (
            <ReviewCard key={rev.id} review={rev} />
          ))}
        </div>

        {/* Load More Button */}
        {displayedCount < product.reviews.length && (
          <div className="reviews-section__load-more">
            <button
              type="button"
              className="btn-secondary reviews-section__btn"
              onClick={handleLoadMore}
            >
              VER MAIS AVALIAÇÕES
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
