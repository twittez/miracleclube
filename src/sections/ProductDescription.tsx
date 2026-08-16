import React from "react";
import { CheckCircle2 } from "lucide-react";
import { product } from "../data/product";
import "./ProductDescription.css";

export const ProductDescription: React.FC = () => {
  return (
    <section className="product-description" id="descricao">
      <div className="container">
        {product.visualSections.map((sec) => {
          const isRight = sec.imagePosition === "right";
          return (
            <div
              key={sec.id}
              className={`product-description__row ${
                isRight ? "product-description__row--reverse" : ""
              } ${sec.bgStyle === "light" ? "product-description__row--light" : ""}`}
            >
              {/* Image Block */}
              <div className="product-description__image-col">
                <img
                  src={sec.image}
                  alt={sec.title}
                  className="product-description__img"
                  loading="lazy"
                />
              </div>

              {/* Text Content Block */}
              <div className="product-description__text-col">
                {sec.tag && <span className="product-description__tag">{sec.tag}</span>}
                <h3 className="product-description__title">{sec.title}</h3>
                {sec.subtitle && <h4 className="product-description__subtitle">{sec.subtitle}</h4>}
                <p className="product-description__text">{sec.description}</p>

                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="product-description__bullets">
                    {sec.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="product-description__bullet-item">
                        <CheckCircle2 size={18} className="product-description__bullet-icon" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
