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
  bundleUnits?: number;
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
  name: "Cinta Modeladora",
  subtitle: "Alta compressão com toque macio, modelagem anatômica e sustentação total",
  sku: "CMFBPM001-BFPP",
  category: "Modeladores",
  breadcrumb: ["Início", "Modeladores", "Cinta Modeladora"],
  originalPrice: 199.90,
  price: 79.90,
  pixPrice: 77.50,
  pixDiscountPercent: 3,
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

// Versão Clone para Tráfego do TikTok (Ticket R$ 97,90 sem desconto de Pix)
export const productTikTok: ProductData = {
  ...product,
  id: "CMFBPM001-TIKTOK",
  name: "Body Modelador",
  sku: "CMFBPM001-TIKTOK",
  breadcrumb: ["Início", "Modeladores", "Body Modelador"],
  originalPrice: 199.90,
  price: 97.90,
  pixPrice: 97.90,
  pixDiscountPercent: 0,
  installmentsMax: 5,
  installmentValue: 19.58,
};


// Produto: Sutiã Premium Sustentação (https://www.miraclebelt.com.br/sutia-premium-sustentacao)
export const productSutia: ProductData = {
  id: "SUTIA-PREMIUM-SUSTENTACAO",
  name: "Sutiã Premium Sustentação - 2 Unidades",
  subtitle: "Kit com 2 Unidades — Escolha a cor e o tamanho de cada sutiã. Modelagem anatômica em cetinete de alta compressão, sustentação firme sem aro e cobertura ampliada",
  sku: "SPS",
  category: "Modeladores",
  breadcrumb: ["Início", "Modeladores", "Sutiã Premium Sustentação (2 Unidades)"],
  originalPrice: 239.90,
  price: 69.90,
  pixPrice: 67.80,
  pixDiscountPercent: 3,
  installmentsMax: 5,
  installmentValue: 13.98,
  bundleUnits: 2,
  rating: 4.9,
  reviewCount: 296,
  images: [
    "/images/product/sutia-premium/01.jpg",
    "/images/product/sutia-premium/02.png",
    "/images/product/sutia-premium/03.jpg",
    "/images/product/sutia-premium/04.png",
    "/images/product/sutia-premium/05.png",
    "/images/product/sutia-premium/06.png",
    "/images/product/sutia-premium/07.jpg",
    "/images/product/sutia-premium/08.jpg",
    "/images/product/sutia-premium/09-tabela.png"
  ],
  variations: [
    { id: "akaroa", name: "Akaroa", colorCode: "#D4C4A8", imageIndex: 0 },
    { id: "preto", name: "Preto", colorCode: "#111111", imageIndex: 6 }
  ],
  sizes: [
    { id: "pp", label: "PP", subtext: "Veste 40", available: true },
    { id: "p", label: "P", subtext: "42 - 44", available: true },
    { id: "m", label: "M", subtext: "Veste 46", available: true },
    { id: "g", label: "G", subtext: "Veste 48", available: true },
    { id: "gg", label: "GG", subtext: "50 - 52", available: true },
    { id: "xg", label: "XG", subtext: "54 - 56", available: true }
  ],
  sizeGuide: {
    title: "Guia de Medidas – Sutiã Premium Sustentação",
    instructions: [
      "Atenção: O bojo Miracle Belt não segue o tamanho convencional de outras marcas. Compre o tamanho que equivale ao seu busto convencional.",
      "Você que veste 40, compre o nosso PP.",
      "Você que veste 42/44, compre o nosso P.",
      "Você que veste 46, compre o nosso M.",
      "Você que veste 48, compre o nosso G.",
      "Você que usa 50/52, compre o nosso GG.",
      "Você que veste 54/56, compre o nosso XG."
    ],
    table: [
      { tam: "PP", busto: "Veste 40", cintura: "64 - 70 cm", quadril: "-", peso: "45 - 54 kg" },
      { tam: "P", busto: "Veste 42 / 44", cintura: "71 - 78 cm", quadril: "-", peso: "55 - 64 kg" },
      { tam: "M", busto: "Veste 46", cintura: "79 - 86 cm", quadril: "-", peso: "65 - 74 kg" },
      { tam: "G", busto: "Veste 48", cintura: "87 - 94 cm", quadril: "-", peso: "75 - 84 kg" },
      { tam: "GG", busto: "Veste 50 / 52", cintura: "95 - 104 cm", quadril: "-", peso: "85 - 96 kg" },
      { tam: "XG", busto: "Veste 54 / 56", cintura: "105 - 116 cm", quadril: "-", peso: "97 - 112 kg" }
    ]
  },
  features: [
    {
      id: "sf1",
      iconName: "Sparkles",
      title: "Alta Sustentação com Conforto",
      description: "Modelagem anatômica que oferece sustentação firme ao busto sem comprometer o conforto diário."
    },
    {
      id: "sf2",
      iconName: "ShieldCheck",
      title: "Cobertura Ampliada",
      description: "Laterais e costas largas em cetinete de alta compressão que modelam sem enrolar ou marcar."
    },
    {
      id: "sf3",
      iconName: "Feather",
      title: "Alças Largas & Sem Aro",
      description: "Alças largas que distribuem o peso com leveza e estrutura sem aro agradável ao toque."
    },
    {
      id: "sf4",
      iconName: "Zap",
      title: "Fecho Frontal Reforçado",
      description: "Fechamento frontal prático com colchetes em dupla regulagem para ajuste fácil e seguro."
    }
  ],
  visualSections: [
    {
      id: "s-section1",
      tag: "SUSTENTAÇÃO & ELEGÂNCIA",
      title: "Suporte Firme, Conforto e Sofisticação em uma Única Peça",
      subtitle: "Desenvolvido com modelagem anatômica e tecido de alta compressão",
      description: "O Sutiã Premium Sustentação foi desenvolvido para mulheres que buscam suporte, conforto e elegância em uma única peça. Com modelagem anatômica e tecido em cetinete de alta compressão, ele oferece sustentação firme ao busto, além de cobertura ampliada na região das costas e laterais.",
      bullets: [
        "Alta sustentação com conforto para uso durante todo o dia",
        "Cobertura ampliada nas costas e laterais que disfarça gordurinhas",
        "Acabamento delicado em renda que une praticidade e sofisticação"
      ],
      image: "/images/product/sutia-premium/02.png",
      imagePosition: "right",
      bgStyle: "white"
    },
    {
      id: "s-section2",
      tag: "CONFORTO ABSOLUTO",
      title: "Alças Largas e Design Sem Aro para Segurança Total",
      subtitle: "Distribuição ideal do peso sem machucar os ombros",
      description: "Ideal para o uso diário, o sutiã proporciona segurança sem comprometer o conforto, graças às alças largas e ao design sem aro. Sua estrutura reforçada valoriza a silhueta de forma natural e discreta sob qualquer roupa.",
      bullets: [
        "Alças largas que distribuem o peso com leveza e aliviam a tensão nos ombros",
        "Estrutura sem aro, com suporte firme e agradável ao toque",
        "Fecho frontal com regulagem que facilita vestir e retirar a peça"
      ],
      image: "/images/product/sutia-premium/03.jpg",
      imagePosition: "left",
      bgStyle: "light"
    },
    {
      id: "s-section3",
      tag: "DIFERENCIAIS MIRACLE BELT",
      title: "Cetinete de Alta Compressão e Durabilidade Superior",
      subtitle: "Perfeito para o dia a dia ou sob roupas que pedem suporte extra",
      description: "Confeccionado em cetinete de alta compressão, tecido resistente que oferece suporte e ajuste perfeito ao corpo. Mantém a postura alinhada e o busto firme com total liberdade de movimentos.",
      bullets: [
        "Confeccionado em cetinete de alta compressão de alta durabilidade",
        "Modelagem anatômica que se adapta perfeitamente às curvas do corpo",
        "Este produto adverte: não há evidências científicas de que esta peça ofereça benefícios terapêuticos, trate, previna ou cure doenças"
      ],
      image: "/images/product/sutia-premium/07.jpg",
      imagePosition: "right",
      bgStyle: "white"
    }
  ],
  faqs: [
    {
      id: "sfaq1",
      question: "Como escolher o tamanho correto do Sutiã Premium Sustentação?",
      answer: "O bojo Miracle Belt possui modelagem específica: quem veste 40 deve escolher o PP; 42/44 escolha o P; 46 escolha o M; 48 escolha o G; 50/52 escolha o GG; e 54/56 escolha o XG. Consulte também a foto da tabela de medidas na galeria."
    },
    {
      id: "sfaq2",
      question: "O Sutiã Premium Sustentação possui aro metálico?",
      answer: "Não! Ele possui estrutura anatômica reforçada sem aro, garantindo sustentação firme ao busto com total conforto, sem espetar ou incomodar ao longo do dia."
    },
    {
      id: "sfaq3",
      question: "Como funciona o fechamento da peça?",
      answer: "O fechamento é frontal por colchetes reforçados com regulagem, facilitando muito o momento de vestir e proporcionando ajuste firme na região torácica."
    },
    {
      id: "sfaq4",
      question: "Ele ajuda a esconder as gordurinhas das costas e laterais?",
      answer: "Sim! Graças à sua base alongada e cobertura ampliada nas costas e nas laterais em cetinete de alta compressão, ele modela a região de forma uniforme sem marcar sob a roupa."
    },
    {
      id: "sfaq5",
      question: "Qual é o prazo de entrega e como funciona a troca?",
      answer: "Você pode consultar o prazo exato para o seu CEP na calculadora de frete acima. Oferecemos a 1ª Troca Grátis em até 7 dias após o recebimento caso precise trocar o tamanho."
    }
  ],
  reviews: [
    {
      id: "sr1",
      author: "Helena C.",
      rating: 5,
      date: "Há 2 dias",
      verified: true,
      size: "G",
      color: "Akaroa",
      title: "Sustentação maravilhosa e super confortável!",
      comment: "Eu visto 48 e peguei o G seguindo a tabela de medidas. Ficou perfeito! As alças largas não machucam o ombro e o fecho na frente é muito prático.",
      likes: 29
    },
    {
      id: "sr2",
      author: "Rosângela M.",
      rating: 5,
      date: "Há 5 dias",
      verified: true,
      size: "GG",
      color: "Preto",
      title: "O melhor sutiã que já comprei",
      comment: "O tecido é bem firme, segura tudo nas laterais e nas costas sem apertar demais. A renda na frente dá um charme lindo. Já vou pedir o bege também!",
      likes: 21
    },
    {
      id: "sr3",
      author: "Cláudia F.",
      rating: 5,
      date: "Há 1 semana",
      verified: true,
      size: "M",
      color: "Akaroa",
      title: "Não enrola e dá muita segurança",
      comment: "Comprei para usar no dia a dia no trabalho e amei. Não tem aro para incomodar e mesmo assim sustenta super bem. Entrega rápida!",
      likes: 18
    },
    {
      id: "sr4",
      author: "Beatriz T.",
      rating: 5,
      date: "Há 2 semanas",
      verified: true,
      size: "P",
      color: "Preto",
      title: "Qualidade impecável",
      comment: "Acabamento de primeira, costuras reforçadas e veste exatamente como mostra na tabela. Recomendo demais!",
      likes: 15
    }
  ]
};

// Produto: Cinta Modeladora Feminina 4 Regulagens / 4 Fechos (https://www.miraclebelt.com.br/cinta-modeladora-feminina-4-fechos)
export const productCinta4Fechos: ProductData = {
  id: "CMF4F001",
  name: "Cinta Modeladora Feminina 4 Regulagens",
  subtitle: "4 regulagens de fechos e 16 barbatanas siliconadas em cetinete de alta compressão revestido com cotton",
  sku: "CMF4F001",
  category: "Modeladores",
  breadcrumb: ["Início", "Modeladores", "Cinta Modeladora Feminina 4 Regulagens"],
  originalPrice: 399.90,
  price: 59.90,
  pixPrice: 56.91,
  pixDiscountPercent: 5,
  installmentsMax: 5,
  installmentValue: 11.98,
  rating: 4.9,
  reviewCount: 1975,
  images: [
    "/images/product/cinta-4-fechos/08.png",
    "/images/product/cinta-4-fechos/09.png",
    "/images/product/cinta-4-fechos/10.png",
    "/images/product/cinta-4-fechos/05.png",
    "/images/product/cinta-4-fechos/06.png",
    "/images/product/cinta-4-fechos/07.png",
    "/images/product/cinta-4-fechos/01.png",
    "/images/product/cinta-4-fechos/02.png",
    "/images/product/cinta-4-fechos/03.png",
    "/images/product/cinta-4-fechos/04.png",
    "/images/product/cinta-4-fechos/11.png",
    "/images/product/cinta-4-fechos/12-tabela.png"
  ],
  variations: [
    { id: "preto", name: "Preto", colorCode: "#000000", imageIndex: 0 },
    { id: "akaroa", name: "Akaroa", colorCode: "#D4C4A8", imageIndex: 3 },
    { id: "azalea", name: "Azalea", colorCode: "#F7C8DA", imageIndex: 6 }
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
    title: "Guia de Medidas da Faixa Miracle Belt",
    instructions: [
      "Atenção: As costas deste modelo são mais altas devido ao design anatômico.",
      "Meça a circunferência da sua cintura cerca de 2 dedos acima do umbigo.",
      "Com 4 níveis de regulagem nos colchetes frontais, você consegue ajustar a compressão conforme reduz medidas."
    ],
    table: [
      { tam: "PP", busto: "Frente: 29 cm", cintura: "60 - 66 cm", quadril: "Costas: 34,5 cm", peso: "45 - 54 kg" },
      { tam: "P", busto: "Frente: 31 cm", cintura: "67 - 73 cm", quadril: "Costas: 36,5 cm", peso: "55 - 64 kg" },
      { tam: "M", busto: "Frente: 31,5 cm", cintura: "74 - 80 cm", quadril: "Costas: 37 cm", peso: "65 - 74 kg" },
      { tam: "G", busto: "Frente: 32 cm", cintura: "81 - 87 cm", quadril: "Costas: 38 cm", peso: "75 - 84 kg" },
      { tam: "GG", busto: "Frente: 33 cm", cintura: "88 - 94 cm", quadril: "Costas: 39 cm", peso: "85 - 95 kg" },
      { tam: "XG", busto: "Frente: 34,5 cm", cintura: "95 - 104 cm", quadril: "Costas: 41 cm", peso: "96 - 110 kg" }
    ]
  },
  features: [
    {
      id: "c4f1",
      iconName: "Zap",
      title: "4 Regulagens de Fechos",
      description: "Quatro níveis de ajuste frontal que acompanham a evolução das suas medidas com firmeza e praticidade."
    },
    {
      id: "c4f2",
      iconName: "ShieldCheck",
      title: "16 Barbatanas Siliconadas",
      description: "Estrutura reforçada que modela a cintura sem dobrar ou enrolar, garantindo sustentação à região lombar."
    },
    {
      id: "c4f3",
      iconName: "Feather",
      title: "Cetinete Revestido com Cotton",
      description: "Tecido cetinete de alta compressão com revestimento interno em cotton macio para conforto durante todo o dia."
    },
    {
      id: "c4f4",
      iconName: "Sparkles",
      title: "Correção Postural & Silhueta",
      description: "Costas mais altas com design anatômico que auxilia na postura e proporciona redução imediata de medidas."
    }
  ],
  visualSections: [
    {
      id: "c4-section1",
      tag: "4 NÍVEIS DE COMPRESSÃO",
      title: "Redução de Medidas e Silhueta Definida no Dia a Dia",
      subtitle: "Acabamento único e sofisticado projetado para o máximo conforto",
      description: "Nossa Cinta Modeladora Feminina 4 Fechos atende às necessidades do dia a dia de forma confortável e com acabamento único e sofisticado. Adapta-se perfeitamente ao corpo e oferece efeito imediato de redução de medidas, valorizando a silhueta.",
      bullets: [
        "4 regulagens de fechos frontais para ajuste progressivo",
        "Possui 16 barbatanas siliconadas flexíveis que não machucam",
        "Costas mais altas devido ao design anatômico exclusivo"
      ],
      image: "/images/product/cinta-4-fechos/10.png",
      imagePosition: "right",
      bgStyle: "white"
    },
    {
      id: "c4-section2",
      tag: "ESTRUTURA REFORÇADA",
      title: "Sustentação Lombar e Auxílio na Correção Postural",
      subtitle: "Segurança e ajuste anatômico com 16 barbatanas siliconadas",
      description: "A estrutura reforçada proporciona sustentação firme à região lombar e pode auxiliar na correção postural durante a rotina de trabalho ou atividades diárias, sem enrolar e sem marcar sob a roupa.",
      bullets: [
        "Sustentação completa da região lombar e abdominal",
        "Composição premium: 90,4% Poliamida e 9,6% Elastano",
        "Barbatanas de silicone de alta resistência e flexibilidade"
      ],
      image: "/images/product/cinta-4-fechos/07.png",
      imagePosition: "left",
      bgStyle: "light"
    },
    {
      id: "c4-section3",
      tag: "ALTA TECNOLOGIA TÊXTIL",
      title: "Cetinete de Alta Compressão Revestido com Cotton",
      subtitle: "Toque macio na pele com compressão na medida certa",
      description: "Todas as peças são confeccionadas com tecido cetinete de alta compressão revestido com cotton, proporcionando segurança, respirabilidade e ajuste impecável ao corpo. Este produto adverte: não há evidências científicas que comprovem que esta peça ofereça benefícios terapêuticos, trate, previna ou cure doenças.",
      bullets: [
        "Cetinete de alta compressão com interior revestido em cotton",
        "Acabamento reforçado que valoriza as curvas naturais",
        "Fácil cuidado: lavagem manual com sabão neutro e secagem à sombra"
      ],
      image: "/images/product/cinta-4-fechos/04.png",
      imagePosition: "right",
      bgStyle: "white"
    }
  ],
  faqs: [
    {
      id: "c4faq1",
      question: "Quantas regulagens e barbatanas possui a Cinta Modeladora 4 Fechos?",
      answer: "Ela conta com 4 fileiras de regulagens de fechos frontais e 16 barbatanas siliconadas distribuídas estrategicamente para modelar sem enrolar e acompanhar sua redução de medidas."
    },
    {
      id: "c4faq2",
      question: "Qual é o tecido da Cinta Modeladora Feminina 4 Regulagens?",
      answer: "A peça é confeccionada em tecido cetinete de alta compressão (90,4% Poliamida e 9,6% Elastano) revestido com cotton, garantindo firmeza por fora e toque macio na pele."
    },
    {
      id: "c4faq3",
      question: "Ela ajuda na postura e na sustentação das costas?",
      answer: "Sim! Suas costas são mais altas devido ao design anatômico e, junto às 16 barbatanas siliconadas, proporcionam excelente sustentação à região lombar e auxílio na correção postural."
    },
    {
      id: "c4faq4",
      question: "Como devo lavar e conservar minha cinta modeladora?",
      answer: "Lave sempre à mão com movimentos suaves e sabão neutro. Não utilize máquina de lavar, alvejantes ou amaciantes, não torça a peça e seque sempre à sombra em superfície plana ou varal sem prendedores."
    },
    {
      id: "c4faq5",
      question: "Como funciona o prazo de entrega e a 1ª Troca Grátis?",
      answer: "Você pode simular o prazo exato para o seu CEP na calculadora acima. Caso precise trocar o tamanho, oferecemos a 1ª Troca Grátis em até 7 dias após o recebimento."
    }
  ],
  reviews: [
    {
      id: "c4r1",
      author: "Juliana M.",
      rating: 5,
      date: "Há 2 dias",
      verified: true,
      size: "M",
      color: "Preto",
      title: "As 4 regulagens fazem toda a diferença!",
      comment: "Comecei usando no primeiro fecho e em duas semanas já passei para o segundo. As 16 barbatanas seguram super bem, não enrola nada e o forro em cotton é muito confortável!",
      likes: 42,
      video: "https://down-bs-br.vod.susercontent.com/api/v4/11110103/mms/br-11110103-6jrno-ljlq7f92zj1ie2.16000051690226498.mp4"
    },
    {
      id: "c4r2",
      author: "Renata S.",
      rating: 5,
      date: "Há 4 dias",
      verified: true,
      size: "G",
      color: "Akaroa",
      title: "Sustentação incrível nas costas",
      comment: "As costas mais altas deixam a postura certinha e escondem aquela gordurinha perto do sutiã. O tecido cetinete é super firme, qualidade impecável!",
      likes: 35,
      photos: [
        "https://down-br.img.susercontent.com/file/br-11134103-7qukw-ljlq19npav7u78.webp",
        "https://down-br.img.susercontent.com/file/br-11134103-7qukw-ljlq19np9gneba.webp"
      ]
    },
    {
      id: "c4r3",
      author: "Amanda P.",
      rating: 5,
      date: "Há 1 semana",
      verified: true,
      size: "P",
      color: "Azalea",
      title: "A cor Azalea é maravilhosa!",
      comment: "Comprei a rosa (Azalea) e a preta. A cintura fica super desenhada na hora que veste e não machuca mesmo usando o dia inteiro no trabalho.",
      likes: 28
    },
    {
      id: "c4r4",
      author: "Carla V.",
      rating: 5,
      date: "Há 2 semanas",
      verified: true,
      size: "GG",
      color: "Preto",
      title: "Melhor cinta que já usei",
      comment: "Já tive outras cintas que dobravam ao sentar, mas essa com 16 barbatanas siliconadas fica intacta. Vale cada centavo!",
      likes: 19
    }
  ]
};
