import React, { useState } from "react";
import { Truck, MapPin, Loader2, AlertCircle } from "lucide-react";
import { formatCEP, formatCurrency } from "../utils/formatters";
import { fetchAddressByCep, calculateShippingOptions, type ShippingOption, type ViaCepResult } from "../utils/viacep";
import "./ShippingCalculator.css";

export const ShippingCalculator: React.FC = () => {
  const [cepInput, setCepInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<ViaCepResult | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCepInput(formatted);
    setErrorMsg("");
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = cepInput.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      setErrorMsg("Digite um CEP válido com 8 dígitos.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setAddress(null);
    setShippingOptions([]);

    const res = await fetchAddressByCep(cleanCep);
    setLoading(false);

    if (!res) {
      setErrorMsg("CEP não encontrado. Verifique o número digitado.");
      return;
    }

    setAddress(res);
    const options = calculateShippingOptions(res);
    setShippingOptions(options);
  };

  return (
    <div className="shipping-calc">
      <div className="shipping-calc__header">
        <Truck size={18} className="shipping-calc__icon" />
        <span className="shipping-calc__title">Simular frete e prazo de entrega:</span>
      </div>

      <form className="shipping-calc__form" onSubmit={handleCalculate}>
        <div className="shipping-calc__input-wrap">
          <input
            type="text"
            placeholder="00000-000"
            value={cepInput}
            onChange={handleInputChange}
            maxLength={9}
            className="shipping-calc__input"
          />
          <button type="submit" className="shipping-calc__btn" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "CALCULAR"}
          </button>
        </div>

        <a
          href="https://buscacepinter.correios.com.br/app/cep/index.php"
          target="_blank"
          rel="noopener noreferrer"
          className="shipping-calc__search-link"
        >
          Não sei meu CEP
        </a>
      </form>

      {errorMsg && (
        <div className="shipping-calc__error">
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {address && (
        <div className="shipping-calc__results">
          <div className="shipping-calc__address-info">
            <MapPin size={14} className="shipping-calc__pin" />
            <span>
              <strong>{address.localidade}/{address.uf}</strong>
              {address.logradouro ? ` - ${address.logradouro}, ${address.bairro}` : ""}
            </span>
          </div>

          <div className="shipping-calc__options-list">
            {shippingOptions.map((opt) => (
              <div key={opt.id} className="shipping-calc__option-item">
                <div className="shipping-calc__option-details">
                  <span className="shipping-calc__option-name">{opt.name}</span>
                  <span className="shipping-calc__option-time">{opt.deliveryDays}</span>
                </div>
                <span className="shipping-calc__option-price">{formatCurrency(opt.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
