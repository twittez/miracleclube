export const ORDER_BUMPS = [
  {
    id: "compra-protegida",
    name: "Compra Protegida",
    price: 19.9,
    image: "/assets/orderbump-shield.svg",
    description: "Garanta a proteção do seu pedido",
    hasVariants: false,
  },
  {
    id: "sutia-fit-premium",
    name: "Sutiã Fit Premium em Gel Sem aros",
    price: 29.9,
    image: "/assets/orderbump-bra.png",
    description: "Conforto em gel sem aros",
    hasVariants: true,
  },
  {
    id: "calcinha-fitlax",
    name: "Calcinhas FitLax™ - Empina BumBum",
    price: 24.9,
    image: "/assets/orderbump-calcinha.png",
    description: "Modela a cintura e empina o bumbum",
    hasVariants: true,
  },
] as const;
