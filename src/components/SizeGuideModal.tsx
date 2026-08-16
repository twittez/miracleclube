import React from "react";
import { X, Ruler, CheckCircle2 } from "lucide-react";
import { product } from "../data/product";
import "./SizeGuideModal.css";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content size-guide-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="size-guide-modal__header">
          <div className="size-guide-modal__title-box">
            <Ruler className="size-guide-modal__icon" size={22} />
            <h3 className="size-guide-modal__title">{product.sizeGuide.title}</h3>
          </div>
          <button className="size-guide-modal__close" onClick={onClose} aria-label="Fechar guia de medidas">
            <X size={22} />
          </button>
        </div>

        {/* How to measure instructions */}
        <div className="size-guide-modal__instructions">
          <h4 className="size-guide-modal__section-subtitle">Como medir o seu corpo:</h4>
          <ul className="size-guide-modal__steps-list">
            {product.sizeGuide.instructions.map((step, idx) => (
              <li key={idx} className="size-guide-modal__step-item">
                <CheckCircle2 size={16} className="size-guide-modal__check-icon" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Size Chart Table */}
        <div className="size-guide-modal__table-wrap">
          <table className="size-guide-modal__table">
            <thead>
              <tr>
                <th>Tamanho</th>
                <th>Busto</th>
                <th>Cintura</th>
                <th>Quadril</th>
                <th>Peso Aprox.</th>
              </tr>
            </thead>
            <tbody>
              {product.sizeGuide.table.map((row, idx) => (
                <tr key={idx}>
                  <td className="size-guide-modal__tam-cell">{row.tam}</td>
                  <td>{row.busto}</td>
                  <td>{row.cintura}</td>
                  <td>{row.quadril}</td>
                  <td>{row.peso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer Note */}
        <div className="size-guide-modal__footer-note">
          <p>
            💡 <strong>Dica de especialista:</strong> Se você estiver em dúvida entre dois tamanhos, escolha o maior para garantir máximo conforto durante o uso diário.
          </p>
        </div>
      </div>
    </div>
  );
};
