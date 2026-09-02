import React, { useState } from 'react';
import { X, Minus, Plus, Trash2, ArrowRight, Sparkles, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/formatters';
import { trackInitiateCheckout } from '../services/metaPixel';
import { trackTikTokInitiateCheckout } from '../services/tiktokPixel';
import { product } from '../data/product';
import './CartDrawer.css';

const BUMP_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
const BUMP_PRODUCT = {
  productId: 'sutia-renda-pos-preto',
  name: 'Sutiã com Renda Pós Preto',
  color: 'Preto',
  price: 34.90,
  originalPrice: 89.90,
  image: '/images/product/sutia-renda-preto.png'
};

const CartOrderBump: React.FC = () => {
  const { cartItems, addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [justAdded, setJustAdded] = useState(false);

  // Check if this bump item is already in cart with the selected size
  const isInCart = cartItems.some(
    item => item.productId === BUMP_PRODUCT.productId && item.size === selectedSize && item.color === BUMP_PRODUCT.color
  );

  const handleAddBump = () => {
    addItem({
      productId: BUMP_PRODUCT.productId,
      name: BUMP_PRODUCT.name,
      size: selectedSize,
      color: BUMP_PRODUCT.color,
      price: BUMP_PRODUCT.price,
      quantity: 1,
      image: BUMP_PRODUCT.image,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="cart-orderbump">
      <div className="cart-orderbump__header">
        <span className="cart-orderbump__tag">
          <Sparkles size={13} /> OFERTA EXCLUSIVA
        </span>
        <span className="cart-orderbump__discount">61% OFF</span>
      </div>

      <div className="cart-orderbump__body">
        <img
          src={BUMP_PRODUCT.image}
          alt={BUMP_PRODUCT.name}
          className="cart-orderbump__img"
        />
        <div className="cart-orderbump__info">
          <h4 className="cart-orderbump__title">{BUMP_PRODUCT.name}</h4>
          <p className="cart-orderbump__subtitle">Cor: Preto | Compressão & Conforto</p>

          <div className="cart-orderbump__prices">
            <span className="cart-orderbump__price-orig">
              {formatCurrency(BUMP_PRODUCT.originalPrice)}
            </span>
            <span className="cart-orderbump__price-promo">
              {formatCurrency(BUMP_PRODUCT.price)}
            </span>
          </div>

          <div className="cart-orderbump__size-section">
            <span className="cart-orderbump__size-label">Escolha seu tamanho:</span>
            <div className="cart-orderbump__sizes">
              {BUMP_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  className={`cart-orderbump__size-btn ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={`cart-orderbump__add-btn ${isInCart || justAdded ? 'added' : ''}`}
            onClick={handleAddBump}
          >
            {justAdded || isInCart ? (
              <>
                <Check size={16} /> ADICIONADO ({selectedSize})
              </>
            ) : (
              <>
                <Plus size={16} /> RESGATAR POR {formatCurrency(BUMP_PRODUCT.price)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const { cartItems, removeItem, updateQuantity, getTotal } = useCart();

  if (!isOpen) return null;

  const handleFinalizeCheckout = () => {
    // Single Point of Dispatch for InitiateCheckout
    const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0) || 1;
    const checkoutEventId = trackInitiateCheckout({
      id: "CMFBPM001-BFPP",
      name: product.name,
      price: product.price,
      quantity: totalQty
    });
    trackTikTokInitiateCheckout({
      id: "CMFBPM001-BFPP",
      name: product.name,
      price: product.price,
      quantity: totalQty
    }, checkoutEventId);

    onClose();
    if (onCheckout) onCheckout();
  };

  return (
    <>
      <div className="cart-drawer__backdrop" onClick={onClose} aria-hidden="true" />
      <div className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''}`} role="dialog" aria-modal="true">
        <div className="cart-drawer__header">
          <h2>Seu Carrinho</h2>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Fechar carrinho">
            <X size={24} />
          </button>
        </div>

        <div className="cart-drawer__content">
          {cartItems.length === 0 ? (
            <div className="cart-drawer__empty">
              <p>Seu carrinho está vazio</p>
              <button className="cart-drawer__continue-btn" onClick={onClose}>
                Continuar comprando
              </button>
            </div>
          ) : (
            <>
              <ul className="cart-drawer__list">
                {cartItems.map((item, idx) => (
                  <li key={`${item.productId}-${item.size}-${item.color}-${idx}`} className="cart-drawer__item">
                    <img src={item.image} alt={item.name} className="cart-drawer__item-img" />
                    <div className="cart-drawer__item-details">
                      <h3 className="cart-drawer__item-name">{item.name}</h3>
                      <p className="cart-drawer__item-variant">Cor: {item.color} | Tam: {item.size}</p>
                      <div className="cart-drawer__item-actions">
                        <div className="cart-drawer__qty-controls">
                          <button 
                            className="cart-drawer__qty-btn"
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="cart-drawer__qty">{item.quantity}</span>
                          <button 
                            className="cart-drawer__qty-btn"
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="cart-drawer__item-price">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button 
                      className="cart-drawer__remove-btn"
                      onClick={() => removeItem(item.productId, item.size, item.color)}
                      aria-label="Remover item"
                    >
                      <Trash2 size={20} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* ORDER BUMP SECTION */}
              <CartOrderBump />
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__subtotal">
              <span>Subtotal</span>
              <span>{formatCurrency(getTotal())}</span>
            </div>
            <button className="cart-drawer__checkout-btn" onClick={handleFinalizeCheckout}>
              FINALIZAR COMPRA
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
