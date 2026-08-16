import React from "react";
import { Star } from "lucide-react";
import "./RatingHeader.css";

interface RatingHeaderProps {
  rating: number;
  reviewCount: number;
}

export const RatingHeader: React.FC<RatingHeaderProps> = ({ rating, reviewCount }) => {
  return (
    <div className="rating-header">
      <div className="rating-header__stars" aria-label={`Avaliação ${rating} de 5 estrelas`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill="#FFB800"
            color="#FFB800"
          />
        ))}
      </div>
      <span className="rating-header__score">{rating.toFixed(1)}</span>
      <span className="rating-header__divider">|</span>
      <a href="#avaliacoes" className="rating-header__link">
        {reviewCount} avaliações
      </a>
    </div>
  );
};
