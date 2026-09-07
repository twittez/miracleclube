import React, { useState, useEffect } from 'react';
import { Check, Truck, ShieldCheck, Minus, Plus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/formatters';
import { trackPageView } from '../services/metaPixel';
import { trackTikTokPageView } from '../services/tiktokPixel';
import { trackLiveEvent } from '../services/liveTracker';
import './PreCheckoutOfferPage.css';

interface PreCheckoutOfferPageProps {
  onAccept: () => void;
  onDecline: () => void;
}

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

const COLORS = [
  { id: 'Preto', label: 'Preto', hex: '#111111' },
  { id: 'Bege', label: 'Bege', hex: '#c8ab8a' },
];

const UNIT_PRICE = 69.90;

export const PreCheckoutOfferPage: React.FC<PreCheckoutOfferPageProps> = ({
  onAccept,
  onDecline,
}) => {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColor, setSelectedColor] = useState<string>('Preto');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    document.title = 'Oferta especial: Shorts Modelador — Miracle';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Adicione o Shorts Modelador com 4 barbatanas ao seu pedido: afina a cintura, realça as curvas e é super elástico.'
    );

    window.scrollTo(0, 0);
    trackPageView('/oferta-especial');
    trackTikTokPageView('/oferta-especial');
    trackLiveEvent('precheckout_offer_view', { path: '/oferta-especial' });
  }, []);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < 20) {
      setQuantity((prev) => prev + 1);
    }
  };

  const totalPrice = UNIT_PRICE * quantity;

  const handleAcceptOffer = () => {
    addItem({
      productId: 'SHORTS-MOD-4B',
      name: 'Shorts Modelador com 4 Barbatanas',
      price: UNIT_PRICE,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      image: '/images/product/shorts-modelador-1.jpg',
    });

    trackLiveEvent('precheckout_offer_accepted', {
      sku: 'SHORTS-MOD-4B',
      size: selectedSize,
      color: selectedColor,
      quantity,
      total: totalPrice,
    });

    onAccept();
  };

  const handleDeclineOffer = () => {
    trackLiveEvent('precheckout_offer_declined', {
      sku: 'SHORTS-MOD-4B',
    });

    onDecline();
  };

  return (
    <div className="precheckout-offer">
      <div className="precheckout-offer__container">
        {/* 1. Selo superior */}
        <div className="precheckout-offer__badge-wrapper">
          <span className="precheckout-offer__badge">
            OFERTA EXCLUSIVA DESTE PEDIDO
          </span>
        </div>

        {/* 2. Título H1 */}
        <h1 className="precheckout-offer__title">
          Que tal Levar também esse Shorts Modelador?
        </h1>

        {/* 3. Grade de 2 imagens lado a lado */}
        <div className="precheckout-offer__gallery">
          <div className="precheckout-offer__image-item">
            <img
              src="/images/product/shorts-modelador-1.jpg"
              alt="Shorts Modelador com 4 Barbatanas - Vista frontal"
              className="precheckout-offer__image"
              loading="eager"
            />
          </div>
          <div className="precheckout-offer__image-item">
            <img
              src="/images/product/shorts-modelador-2.jpg"
              alt="Shorts Modelador com 4 Barbatanas - Detalhe suporte"
              className="precheckout-offer__image"
              loading="eager"
            />
          </div>
        </div>

        {/* 4. Lista de benefícios com ícone de check verde */}
        <ul className="precheckout-offer__benefits">
          <li className="precheckout-offer__benefit-item">
            <span className="precheckout-offer__check-icon" aria-hidden="true">
              <Check size={18} strokeWidth={2.8} />
            </span>
            <span>Afina a cintura e realça as curvas</span>
          </li>
          <li className="precheckout-offer__benefit-item">
            <span className="precheckout-offer__check-icon" aria-hidden="true">
              <Check size={18} strokeWidth={2.8} />
            </span>
            <span>Com 4 barbatanas que não enrolam</span>
          </li>
          <li className="precheckout-offer__benefit-item">
            <span className="precheckout-offer__check-icon" aria-hidden="true">
              <Check size={18} strokeWidth={2.8} />
            </span>
            <span>Material macio e super elástico</span>
          </li>
          <li className="precheckout-offer__benefit-item">
            <span className="precheckout-offer__check-icon" aria-hidden="true">
              <Check size={18} strokeWidth={2.8} />
            </span>
            <span>Disponível nas cores Preto e Bege</span>
          </li>
        </ul>

        {/* 5. Dimensões */}
        <p className="precheckout-offer__dimensions">
          Dimensões da embalagem: 20 x 15 x 5 cm
        </p>

        {/* 6. Bloco de preço centralizado */}
        <div className="precheckout-offer__price-block">
          <span className="precheckout-offer__price-old">R$ 139,90</span>
          <div className="precheckout-offer__price-installment">
            5x de R$ 13,98
          </div>
          <span className="precheckout-offer__price-cash">
            ou R$ 69,90 à vista
          </span>
        </div>

        {/* 7. Seletor de tamanho */}
        <div className="precheckout-offer__option-group">
          <label className="precheckout-offer__option-label">
            Escolha o tamanho: <strong>{selectedSize}</strong>
          </label>
          <div className="precheckout-offer__sizes-grid">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className={`precheckout-offer__size-btn ${
                  selectedSize === size ? 'active' : ''
                }`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* 8. Seletor de cor com bolinha de amostra */}
        <div className="precheckout-offer__option-group">
          <label className="precheckout-offer__option-label">
            Escolha a cor: <strong>{selectedColor}</strong>
          </label>
          <div className="precheckout-offer__colors-row">
            {COLORS.map((col) => (
              <button
                key={col.id}
                type="button"
                className={`precheckout-offer__color-btn ${
                  selectedColor === col.id ? 'active' : ''
                }`}
                onClick={() => setSelectedColor(col.id)}
              >
                <span
                  className="precheckout-offer__color-swatch"
                  style={{ backgroundColor: col.hex }}
                />
                <span className="precheckout-offer__color-name">
                  {col.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 9. Seletor de quantidade */}
        <div className="precheckout-offer__quantity-group">
          <label className="precheckout-offer__option-label">Quantidade:</label>
          <div className="precheckout-offer__quantity-control">
            <button
              type="button"
              className="precheckout-offer__qty-btn"
              onClick={handleDecrease}
              disabled={quantity <= 1}
              aria-label="Diminuir quantidade"
            >
              <Minus size={18} />
            </button>
            <span className="precheckout-offer__qty-number">{quantity}</span>
            <button
              type="button"
              className="precheckout-offer__qty-btn"
              onClick={handleIncrease}
              disabled={quantity >= 20}
              aria-label="Aumentar quantidade"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* 10. Botão principal */}
        <button
          type="button"
          className="precheckout-offer__btn-primary"
          onClick={handleAcceptOffer}
        >
          Sim, quero adicionar por {formatCurrency(totalPrice)}
        </button>

        {/* 11. Botão secundário */}
        <button
          type="button"
          className="precheckout-offer__btn-secondary"
          onClick={handleDeclineOffer}
        >
          Não, obrigada. Continuar sem o shorts
        </button>

        {/* 12. Rodapé com 2 selos de confiança */}
        <div className="precheckout-offer__trust-footer">
          <div className="precheckout-offer__trust-item">
            <Truck size={20} className="precheckout-offer__trust-icon" />
            <span>Frete grátis</span>
          </div>
          <div className="precheckout-offer__trust-item">
            <ShieldCheck size={20} className="precheckout-offer__trust-icon" />
            <span>Compra segura</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreCheckoutOfferPage;
