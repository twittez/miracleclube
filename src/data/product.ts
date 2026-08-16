export interface ProductVariation {
  id: string;
  name: string;
  colorCode: string;
  imageIndex: number;
}

export interface ProductSize {
  id: string;
  label: string;
  subtext?: string;
  available: boolean;
}

export interface SizeGuideItem {
  tam: string;
  busto: string;
  cintura: string;
  quadril: string;
  peso: string;
}

export interface ProductFeature {
  id: string;
  iconName: string;
  title: string;
  description: string;
}

export interface ProductVisualSection {
  id: string;
  tag?: string;
  title: string;
  subtitle?: string;
  description: string;
  bullets?: string[];
  image: string;
  imagePosition: 'left' | 'right';
  bgStyle?: 'light' | 'white';
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  verified: boolean;
  size: string;
  color: string;
  title?: string;
  comment: string;
  likes: number;
  avatarUrl?: string;
  photos?: string[];
  video?: string;
}

export interface ProductData {
  id: string;
  name: string;
  subtitle: string;
  sku: string;
  category: string;
  breadcrumb: string[];
  originalPrice: number;
  price: number;
  pixPrice: number;
  pixDiscountPercent: number;
  installmentsMax: number;
  installmentValue: number;
  rating: number;
  reviewCount: number;
  images: string[];
  variations: ProductVariation[];
  sizes: ProductSize[];
  sizeGuide: {
    title: string;
    instructions: string[];
    table: SizeGuideItem[];
  };
  features: ProductFeature[];
  visualSections: ProductVisualSection[];
  faqs: FAQItem[];
  reviews: ReviewItem[];
}

export const product: ProductData = {
  id: "CMFBPM001-bfpp2",
  name: "Body Modelador Feminino Pré-Moldado",
  subtitle: "Alta compressão com toque macio, modelagem anatômica e sustentação total",
  sku: "CMFBPM001-BFPP",
  category: "Modeladores",
  breadcrumb: ["Início", "Modeladores", "Body Modelador"],
  originalPrice: 199.90,
  price: 79.90,
  pixPrice: 71.91,
  pixDiscountPercent: 10,
  installmentsMax: 5,
  installmentValue: 15.98,
  rating: 4.9,
  reviewCount: 384,
  images: [
    "/images/product/ref_02.png",
    "/images/product/ref_01.png",
    "/images/product/ref_03.png",
    "/images/product/ref_04.png",
    "/images/product/ref_05.png",
    "/images/product/ref_06.png",
    "/images/product/ref_07.png",
    "/images/product/ref_08.png",
    "/images/product/ref_09.png",
    "/images/product/ref_10.png"
  ],
  variations: [
    { id: "preto", name: "Preto", colorCode: "#111111", imageIndex: 0 },
    { id: "nude", name: "Nude (Akaroa)", colorCode: "#D8C4B6", imageIndex: 1 },
    { id: "rosa", name: "Rosa", colorCode: "#E8B4B8", imageIndex: 2 }
  ],
  sizes: [
    { id: "pp", label: "PP", subtext: "34 - 36", available: true },
    { id: "p", label: "P", subtext: "38 - 40", available: true },
    { id: "m", label: "M", subtext: "40 - 42", available: true },
    { id: "g", label: "G", subtext: "44 - 46", available: true },
    { id: "gg", label: "GG", subtext: "48 - 50", available: true },
    { id: "xg", label: "XG", subtext: "52 - 54", available: true }
  ],
  sizeGuide: {
    title: "Tabela & Guia de Medidas",
    instructions: [
      "Use uma fita métrica sem apertar no corpo.",
      "Meça o busto na altura dos mamilos com sutiã sem bojo.",
      "Meça a cintura no ponto mais fino, cerca de 2 dedos acima do umbigo.",
      "Meça o quadril na parte mais volumosa dos glúteos."
    ],
    table: [
      { tam: "PP", busto: "78 - 84 cm", cintura: "60 - 66 cm", quadril: "86 - 92 cm", peso: "45 - 52 kg" },
      { tam: "P", busto: "85 - 91 cm", cintura: "67 - 73 cm", quadril: "93 - 99 cm", peso: "53 - 62 kg" },
      { tam: "M", busto: "92 - 98 cm", cintura: "74 - 80 cm", quadril: "100 - 106 cm", peso: "63 - 72 kg" },
      { tam: "G", busto: "99 - 105 cm", cintura: "81 - 87 cm", quadril: "107 - 113 cm", peso: "73 - 82 kg" },
      { tam: "GG", busto: "106 - 112 cm", cintura: "88 - 94 cm", quadril: "114 - 120 cm", peso: "83 - 92 kg" },
      { tam: "XG", busto: "113 - 120 cm", cintura: "95 - 102 cm", quadril: "121 - 128 cm", peso: "93 - 105 kg" }
    ]
  },
  features: [
    {
      id: "f1",
      iconName: "Sparkles",
      title: "Design Pré-Moldado",
      description: "Modela a silhueta sem achatar, valorizando o desenho natural das curvas."
    },
    {
      id: "f2",
      iconName: "ShieldCheck",
      title: "Alta Cobertura Total",
      description: "Suaviza flancos laterais, marcas nas costas e região abdominal com firmeza."
    },
    {
      id: "f3",
      iconName: "Feather",
      title: "Tecido Respirável Macio",
      description: "Compressão na medida exata com Toque de Seda para uso durante todo o dia."
    },
    {
      id: "f4",
      iconName: "Zap",
      title: "Ajuste & Fecho Prático",
      description: "Colchetes reforçados em dupla regulagem e fecho inferior higiênico."
    }
  ],
  visualSections: [
    {
      id: "section1",
      tag: "COMPRESSÃO ELEGANTE",
      title: "Silhueta Definida com Conforto Incomparável",
      subtitle: "Projetado com tecnologia de ponta para se ajustar perfeitamente ao seu corpo",
      description: "O Body Modelador Pré-Moldado combina alta compressão estruturada com fios cirúrgicos de toque suave. Desenvolvido para modelar o abdômen, afinar a cintura e sustentar a postura sem restringir seus movimentos diários.",
      bullets: [
        "Tecido térmico respirável que não esquenta nem enrola",
        "Costuras ultra planas imperceptíveis sob vestidos e calças",
        "Reforço duplo no abdômen e sustentação anatômica no busto"
      ],
      image: "/images/product/ref_01.png",
      imagePosition: "right",
      bgStyle: "white"
    },
    {
      id: "section2",
      tag: "DETALHES PREMIUM",
      title: "Acabamento Reforçado e Funcionalidade Prática",
      subtitle: "Pensado para o ritmo da mulher moderna",
      description: "Com alças reguláveis e reforçadas, nosso modelador garante máxima sustentação com distribuição equilibrada de peso nos ombros. O fecho inferior prático permite utilizar o banheiro com facilidade sem precisar retirar a peça.",
      bullets: [
        "Alças de sustentação ajustáveis com fecho seguro",
        "Abertura higiênica inferior com toque suave",
        "Não marca e valoriza o caimento das roupas mais sofisticadas"
      ],
      image: "/images/product/ref_03.png",
      imagePosition: "left",
      bgStyle: "light"
    },
    {
      id: "section3",
      tag: "PARA TODOS OS MOMENTOS",
      title: "Do Trabalho ao Evento Especial com Total Autoconfiança",
      subtitle: "A combinação perfeita entre modelagem estratégica e elegância diária",
      description: "Seja para trabalhar, usar com um vestido de festa ou para a rotina diária de autocuidado, a peça proporciona segurança visual instantânea e postura ereta com zero desconforto.",
      bullets: [
        "Modela instantaneamente até 2 tamanhos na cintura",
        "Excelente sustentação lombar para quem passa horas sentada",
        "Durabilidade extrema após dezenas de lavagens"
      ],
      image: "/images/product/ref_04.png",
      imagePosition: "right",
      bgStyle: "white"
    }
  ],
  faqs: [
    {
      id: "faq1",
      question: "Como escolher o tamanho correto do Body Modelador?",
      answer: "Recomendamos que você consulte a nossa Tabela de Medidas disponível ao lado do seletor de tamanhos. Utilize uma fita métrica para medir cintura e busto. Caso suas medidas fiquem entre dois tamanhos, para maior conforto diário opte pelo tamanho maior."
    },
    {
      id: "faq2",
      question: "O body modelador enrola durante o uso?",
      answer: "Não! Nosso modelo possui estrutura anatômica pré-moldada com barretas flexíveis e modelagem alongada que se fixa firmemente ao corpo, impedindo que a peça dobre ou enrole."
    },
    {
      id: "faq3",
      question: "Posso usar a peça por baixo de roupas justas sem marcar?",
      answer: "Sim, com certeza. O acabamento de costuras planas extra finas foi desenvolvido especificamente para não marcar sob vestidos de festa, legging, jeans ou blusas finas."
    },
    {
      id: "faq4",
      question: "Qual é o tempo de entrega e como funciona a troca?",
      answer: "O prazo de entrega varia de acordo com o seu CEP (você pode calcular na página). Oferecemos a 1ª Troca Grátis no prazo de até 7 dias após o recebimento, caso precise ajustar o tamanho."
    },
    {
      id: "faq5",
      question: "Como devo lavar meu Body Modelador?",
      answer: "Recomendamos a lavagem à mão com sabão neutro e secagem à sombra. Evite usar máquina de lavar no modo pesado, secadoras ou água quente para preservar a elasticidade do tecido."
    }
  ],
  reviews: [
    {
      id: "r1",
      author: "Mariana S.",
      rating: 5,
      date: "Há 2 dias",
      verified: true,
      size: "M",
      color: "Preto",
      title: "Maravilhoso! Modela perfeitamente",
      comment: "Comprei para usar em um casamento e fiquei impressionada. O vestido ficou impecável no corpo, afina muito a cintura e é surpreendentemente confortável!",
      likes: 24,
      photos: [
        "https://down-br.img.susercontent.com/file/br-11134103-81zuk-mkslh66qa3urc2.webp",
        "https://down-br.img.susercontent.com/file/br-11134103-7r98o-m815qmkpc3xt4d.webp"
      ]
    },
    {
      id: "r2",
      author: "Camila R.",
      rating: 5,
      date: "Há 4 dias",
      verified: true,
      size: "P",
      color: "Nude (Akaroa)",
      title: "Vídeo mostrando a qualidade e o caimento!",
      comment: "Gente, gravei esse vídeo curto pra mostrar como o tecido é encorpado e o fecho inferior super forte. Fica perfeito no corpo!",
      likes: 38,
      video: "https://down-zl-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6v6x6-mo020o7idn2a5d.16000051778263444.mp4"
    },
    {
      id: "r3",
      author: "Patrícia M.",
      rating: 5,
      date: "Há 1 semana",
      verified: true,
      size: "G",
      color: "Preto",
      title: "Fotos reais da peça ao chegar!",
      comment: "Chegou super rápido aqui em SP. O acabamento das costuras é perfeito e a sustentação nas costas é incrível.",
      likes: 31,
      photos: [
        "https://down-br.img.susercontent.com/file/br-11134103-820m1-mnpvsw7nbbwif2.webp",
        "https://down-br.img.susercontent.com/file/br-11134103-820mb-mnpvsw7pcdfl2d.webp",
        "https://down-br.img.susercontent.com/file/br-11134103-820lz-mnpvsw82q6848b.webp"
      ]
    },
    {
      id: "r4",
      author: "Fernanda L.",
      rating: 5,
      date: "Há 2 semanas",
      verified: true,
      size: "GG",
      color: "Preto",
      title: "Vale cada centavo",
      comment: "Superou todas as minhas expectativas. O fecho embaixo é prático e a entrega foi super rápida em SP.",
      likes: 14
    }
  ]
};
