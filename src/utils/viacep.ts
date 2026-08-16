export interface ViaCepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  deliveryDays: string;
  carrier: string;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepResult | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) return null;
    const data: ViaCepResult = await response.json();
    if (data.erro) return null;
    return data;
  } catch (err) {
    console.error("Error fetching CEP:", err);
    return null;
  }
}

export function calculateShippingOptions(_address: ViaCepResult): ShippingOption[] {
  return [
    {
      id: "free",
      name: "Frete Grátis",
      price: 0,
      deliveryDays: "8 a 10 dias úteis",
      carrier: "Entrega Padrão",
    },
    {
      id: "express",
      name: "Frete Expresso",
      price: 16.89,
      deliveryDays: "2 a 5 dias úteis",
      carrier: "Transportadora Expressa",
    },
  ];
}
