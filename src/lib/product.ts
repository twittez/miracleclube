export type Variant = { name: string; swatch: string; images: string[] };

export const BRAND = {
  name: "MIRACLE",
  phone: "(12) 98289-0411",
  whatsapp: "5512982890411",
  email: "suporte@miracle.com",
  cnpj: "59.291.162/0001-79",
};

export const PRODUCT = {
  sku: "CMFBPM001-BFPP",
  name: "Body Modelador Feminino Pré-Moldado",
  subtitle:
    "Alta compressão com toque macio, modelagem anatômica e sustentação total",
  price: 87.9,
  compareAt: 199.9,
  installments: 5,
  rating: 4.9,
  reviewCount: 384,
  images: [
    "/images/product/01.webp",
    "/images/product/02.webp",
    "/images/product/03.webp",
    "/images/product/04.webp",
    "/images/product/05.webp",
    "/images/product/06.webp",
    "/images/product/07.webp",
    "/images/product/08.webp",
    "/images/product/09.webp",
    "/images/product/10.webp",
  ],
  colors: [
    {
      name: "Preto",
      swatch: "#111111",
      images: [
        "/images/product/02.webp",
        "/images/product/04.webp",
        "/images/product/03.webp",
        "/images/product/10.webp",
        "/images/product/01.webp",
      ],
    },
    {
      name: "Nude (Akaroa)",
      swatch: "#c8ab8a",
      images: [
        "/images/product/05.webp",
        "/images/product/07.webp",
        "/images/product/06.webp",
        "/images/product/01.webp",
      ],
    },
    {
      name: "Rosa",
      swatch: "#e8a3bb",
      images: [
        "/images/product/08.webp",
        "/images/product/09.webp",
        "/images/product/01.webp",
      ],
    },
  ] as Variant[],
  sizes: [
    { label: "PP", range: "34 - 36" },
    { label: "P", range: "38 - 40" },
    { label: "M", range: "40 - 42" },
    { label: "G", range: "44 - 46" },
    { label: "GG", range: "48 - 50" },
    { label: "XG", range: "52 - 54" },
  ],
};

export const PIX_DISCOUNT = 0;

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
