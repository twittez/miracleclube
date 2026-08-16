import React from "react";
import { Sparkles, ShieldCheck, Feather, Zap } from "lucide-react";
import { product } from "../data/product";
import "./BenefitsSection.css";

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles size={24} />,
  ShieldCheck: <ShieldCheck size={24} />,
  Feather: <Feather size={24} />,
  Zap: <Zap size={24} />,
};

export const BenefitsSection: React.FC = () => {
  return (
    <section className="benefits-section">
      <div className="container">
        <div className="benefits-section__header">
          <span className="benefits-section__tag">DIFERENCIAIS EXCLUSIVOS</span>
          <h2 className="benefits-section__title">Por que escolher o nosso Body Modelador?</h2>
        </div>

        <div className="benefits-section__grid">
          {product.features.map((item) => (
            <div key={item.id} className="benefits-section__card">
              <div className="benefits-section__icon-wrap">
                {iconMap[item.iconName] || <Sparkles size={24} />}
              </div>
              <h3 className="benefits-section__card-title">{item.title}</h3>
              <p className="benefits-section__card-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
