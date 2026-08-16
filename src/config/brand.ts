export interface BrandConfig {
  name: string;
  tagline: string;
  logoText: string;
  logoSubtext: string;
  logoUrl?: string;
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    dark: string;
    text: string;
    textMuted: string;
    background: string;
    backgroundSoft: string;
    border: string;
    badge: string;
    stars: string;
  };
  company: {
    cnpj: string;
    email: string;
    whatsapp: string;
    whatsappLink: string;
    phone: string;
    address: string;
    copyright: string;
  };
}

export const brand: BrandConfig = {
  name: "MIRACLE",
  tagline: "Modeladores de Alta Compressão & Conforto",
  logoText: "MIRACLE",
  logoSubtext: "BELT",
  colors: {
    primary: "#E54E88",        // Signature Rose/Pink from reference page
    primaryHover: "#D63B76",
    primaryLight: "#FDF2F6",
    secondary: "#1A1A1A",
    dark: "#111111",
    text: "#2B2B2B",
    textMuted: "#666666",
    background: "#FFFFFF",
    backgroundSoft: "#F9F9F9",
    border: "#E0E0E0",
    badge: "#25D366",
    stars: "#FFB800",
  },
  company: {
    cnpj: "59.291.162/0001-79",
    email: "atendimento@miraclebelt.com.br",
    whatsapp: "(37) 99155-0358",
    phone: "(37) 99155-0358",
    whatsappLink: "5537991550358",
    address: "",
    copyright: "MIRACLE - CNPJ: 59.291.162/0001-79 | Todos os direitos reservados.",
  },
};
