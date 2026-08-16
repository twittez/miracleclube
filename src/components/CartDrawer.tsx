import React from 'react';
import { X, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/formatters';
import { trackInitiateCheckout } from '../services/metaPixel';
import { product } from '../data/product';
import './CartDrawer.css';

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
    trackInitiateCheckout({
      id: "CMFBPM001-BFPP",
      name: product.name,
      price: 159.90,
      quantity: totalQty
    });

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
