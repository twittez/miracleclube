import React, { useState } from "react";
import { Star, CheckCircle, ThumbsUp, X } from "lucide-react";
import type { ReviewItem } from "../data/product";
import "./ReviewCard.css";

interface ReviewCardProps {
  review: ReviewItem;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const [likes, setLikes] = useState(review.likes);
  const [liked, setLiked] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const handleLike = () => {
    if (liked) {
      setLikes((l) => l - 1);
      setLiked(false);
    } else {
      setLikes((l) => l + 1);
      setLiked(true);
    }
  };

  return (
    <div className="review-card">
      <div className="review-card__header">
        <div className="review-card__user-info">
          <span className="review-card__author">{review.author}</span>
          {review.verified && (
            <span className="badge-verified">
              <CheckCircle size={12} />
              Compra Verificada
            </span>
          )}
        </div>
        <span className="review-card__date">{review.date}</span>
      </div>

      {/* Stars & Details Badges */}
      <div className="review-card__meta-row">
        <div className="stars-rating">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={14}
              fill={s <= review.rating ? "#FFB800" : "none"}
              color="#FFB800"
            />
          ))}
        </div>
        <span className="review-card__variant-badge">
          Tam: {review.size} | Cor: {review.color}
        </span>
      </div>

      {review.title && <h4 className="review-card__title">{review.title}</h4>}
      <p className="review-card__comment">{review.comment}</p>

      {/* Photos Media Gallery */}
      {review.photos && review.photos.length > 0 && (
        <div className="review-card__media-grid">
          {review.photos.map((photoUrl, idx) => (
            <button
              key={idx}
              type="button"
              className="review-card__photo-thumb-btn"
              onClick={() => setActiveImage(photoUrl)}
              aria-label={`Ver foto ${idx + 1}`}
            >
              <img src={photoUrl} alt={`Foto cliente ${idx + 1}`} className="review-card__photo-thumb" />
            </button>
          ))}
        </div>
      )}

      {/* Video Player */}
      {review.video && (
        <div className="review-card__video-wrapper">
          <video
            src={review.video}
            controls
            playsInline
            preload="metadata"
            className="review-card__video"
          />
        </div>
      )}

      <div className="review-card__footer">
        <button
          type="button"
          className={`review-card__like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          <ThumbsUp size={13} />
          <span>Útil ({likes})</span>
        </button>
      </div>

      {/* Photo Lightbox Modal */}
      {activeImage && (
        <div className="review-card__lightbox-overlay" onClick={() => setActiveImage(null)}>
          <button
            type="button"
            className="review-card__lightbox-close"
            onClick={() => setActiveImage(null)}
            aria-label="Fechar imagem"
          >
            <X size={24} />
          </button>
          <img
            src={activeImage}
            alt="Foto em tamanho grande"
            className="review-card__lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
