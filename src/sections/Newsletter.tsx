import React, { useState } from "react";
import { Mail, Check } from "lucide-react";
import "./Newsletter.css";

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 4000);
  };

  return (
    <section className="newsletter-section">
      <div className="container">
        <div className="newsletter-section__card">
          <div className="newsletter-section__text">
            <Mail className="newsletter-section__icon" size={28} />
            <div>
              <h3 className="newsletter-section__title">Receba Ofertas Exclusivas no seu E-mail</h3>
              <p className="newsletter-section__desc">
                Cadastre-se e ganhe 10% de desconto na sua primeira compra + cupons secretos.
              </p>
            </div>
          </div>

          <form className="newsletter-section__form" onSubmit={handleSubmit}>
            {submitted ? (
              <div className="newsletter-section__success">
                <Check size={18} />
                <span>Inscrição realizada com sucesso! Verifique sua caixa de entrada.</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Digite seu melhor e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="newsletter-section__input"
                  required
                />
                <button type="submit" className="newsletter-section__btn">
                  CADASTRAR
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
