import React from "react";
import { Star } from "lucide-react";
import "./ReviewSummary.css";

interface ReviewSummaryProps {
  rating: number;
  reviewCount: number;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({ rating, reviewCount }) => {
  const ratingDistribution = [
    { stars: 5, percentage: 92, count: 353 },
    { stars: 4, percentage: 6, count: 23 },
    { stars: 3, percentage: 1, count: 5 },
    { stars: 2, percentage: 1, count: 2 },
    { stars: 1, percentage: 0, count: 1 },
  ];

  return (
    <div className="review-summary">
      {/* Big Rating Score */}
      <div className="review-summary__score-box">
        <span className="review-summary__big-number">{rating.toFixed(1)}</span>
        <div className="review-summary__stars-row">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={18} fill="#FFB800" color="#FFB800" />
          ))}
        </div>
        <span className="review-summary__count-text">
          Baseado em {reviewCount} avaliações de clientes reais
        </span>
      </div>

      {/* Star Progress Bars Breakdown */}
      <div className="review-summary__bars-box">
        {ratingDistribution.map((row) => (
          <div key={row.stars} className="review-summary__bar-row">
            <span className="review-summary__star-label">{row.stars} ★</span>
            <div className="review-summary__progress-track">
              <div
                className="review-summary__progress-fill"
                style={{ width: `${row.percentage}%` }}
              />
            </div>
            <span className="review-summary__percentage-label">{row.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
