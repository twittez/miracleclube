import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { product } from "../data/product";
import "./FAQ.css";

export const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(product.faqs[0]?.id || null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <div className="faq-section__header">
          <span className="faq-section__tag">DÚVIDAS FREQUENTES</span>
          <h2 className="faq-section__title">Perguntas Frequentes</h2>
          <p className="faq-section__subtitle">
            Tire suas dúvidas sobre o produto, envio e formas de pagamento.
          </p>
        </div>

        <div className="faq-section__accordion">
          {product.faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="faq-item__trigger"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-item__question">{faq.question}</span>
                  <ChevronDown size={18} className="faq-item__chevron" />
                </button>

                <div className="faq-item__content">
                  <div className="faq-item__answer">{faq.answer}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
