import React from "react";
import { RefreshCw, ShieldCheck, CreditCard, Lock } from "lucide-react";
import "./TrustBenefits.css";

export const TrustBenefits: React.FC = () => {
  const benefits = [
    {
      icon: <RefreshCw size={16} />,
      title: "1ª Troca Grátis",
      sub: "Em até 7 dias após o recebimento",
    },
    {
      icon: <ShieldCheck size={16} />,
      title: "Garantia de Qualidade",
      sub: "Tecido cirúrgico reforçado",
    },
    {
      icon: <CreditCard size={16} />,
      title: "Até 10x Sem Juros",
      sub: "Aceitamos todos os cartões",
    },
    {
      icon: <Lock size={16} />,
      title: "Compra 100% Segura",
      sub: "Dados totalmente protegidos",
    },
  ];

  return (
    <div className="trust-benefits">
      <div className="trust-benefits__grid">
        {benefits.map((item, idx) => (
          <div key={idx} className="trust-benefits__item">
            <div className="trust-benefits__icon-wrap">{item.icon}</div>
            <div className="trust-benefits__text-box">
              <span className="trust-benefits__title">{item.title}</span>
              <span className="trust-benefits__sub">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
