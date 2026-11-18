import type {
  ClientRecord,
  ConstructionStandard,
  EvaluationPurpose,
  InspectionPhoto,
  InspectionRoom,
  MarketSample,
  PropertyDetails,
  PropertyType,
  RegisteredProperty,
  RossState,
  UserProfile,
} from '../types/valuation';
import livingRoomImg from '../assets/images/living_room_luxury_1794692666004.jpg';
import gourmetBalconyImg from '../assets/images/gourmet_balcony_1794692666307.jpg';

export const HEIDECKE_COEFFICIENTS: Record<RossState, number> = {
  NOVO: 0.0,
  ENTRE_NOVO_REGULAR: 0.00032,
  REGULAR: 0.0252,
  ENTRE_REGULAR_REPAROS: 0.0809,
  REPAROS_SIMPLES: 0.181,
  ENTRE_REPAROS_IMPORTANTES: 0.326,
  REPAROS_IMPORTANTES: 0.522,
  SEM_VALOR: 1.0,
};

export const ROSS_STATE_LABELS: Record<RossState, string> = {
  NOVO: 'A — Novo (0,00% reparos)',
  ENTRE_NOVO_REGULAR: 'B — Entre Novo e Regular (0,032%)',
  REGULAR: 'C — Regular (2,52%)',
  ENTRE_REGULAR_REPAROS: 'D — Reparos Simples (8,09%)',
  REPAROS_SIMPLES: 'E — Reparos Simples a Importantes (18,1%)',
  ENTRE_REPAROS_IMPORTANTES: 'F — Reparos Importantes (32,6%)',
  REPAROS_IMPORTANTES: 'G — Entre Importantes e Sem Valor (52,2%)',
  SEM_VALOR: 'H — Sem Valor Comercial (100%)',
};

export const STANDARD_LABELS: Record<ConstructionStandard, string> = {
  PROFIT_BAIXO: 'Econômico / Popular',
  NORMAL_MEDIO: 'Normal Médio',
  ALTO: 'Alto Padrão',
  LUXO: 'Luxo / Triple A',
};

export const PURPOSE_LABELS: Record<EvaluationPurpose, string> = {
  VENDA: 'Compra e Venda Mercadológica',
  LOCACAO: 'Fixação de Aluguel',
  AMBOS: 'Venda e Locação Simultâneas',
  GARANTIA: 'Garantia Bancária / Alienação',
  JUDICIAL: 'Perícia Judicial',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTAMENTO: 'Apartamento Padrão',
  CASA_CONDOMINIO: 'Casa em Condomínio',
  SALA_COMERCIAL: 'Conjunto Comercial',
};

export function calcRossHeideckeK(age: number, usefulLife: number, state: RossState): number {
  const safeLife = usefulLife > 0 ? usefulLife : 60;
  const x = Math.min(Math.max((age || 0) / safeLife, 0), 1.0);
  const ross = (x + Math.pow(x, 2)) / 2;
  const heidecke = HEIDECKE_COEFFICIENTS[state] ?? 0.0252;
  return ross + heidecke * (1 - ross);
}

export function formatBRL(value: number, withDecimals = false): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  });
}

export function buildPhotoWatermark(
  profile: UserProfile,
  dateStr: string,
  gps?: string
): string {
  const parts: string[] = [];
  if (profile.stampShowCreci && profile.creci) {
    parts.push(`CRECI ${profile.creci}`);
  }
  if (profile.stampShowCnai && profile.cnai) {
    parts.push(`CNAI ${profile.cnai}`);
  }
  if (profile.stampShowGps) {
    parts.push(dateStr);
    if (gps) parts.push(gps);
  }
  return parts.length > 0 ? parts.join(' · ') : `${profile.name} · ${dateStr}`;
}

export const INITIAL_PROFILE: UserProfile = {
  id: 'broker_1',
  name: 'Carlos Alberto Mendonça',
  creci: '18.490-F',
  creciState: 'SP',
  cnai: '42.109',
  cpfCnpj: '089.441.228-19',
  company: 'Mendonça Avaliações & Perícias Imobiliárias',
  email: 'carlos.avaliador@creci.org.br',
  phone: '(11) 99123-4567',
  cityState: 'São Paulo - SP',
  address: 'Av. Brigadeiro Faria Lima, 2000 - Cj. 142',
  logoUrl: '',
  stampShowCreci: true,
  stampShowCnai: true,
  stampShowGps: true,
};

export const INITIAL_PROPERTY: PropertyDetails = {
  clientName: 'Dr. Paulo Henrique Siqueira',
  clientDoc: '142.890.318-72',
  purpose: 'VENDA',
  zip: '04538-133',
  street: 'Rua Pedroso Alvarenga, 1140 - Apto 142',
  neighborhood: 'Itaim Bibi',
  cityState: 'São Paulo - SP',
  matricula: '148.902',
  cartorio: '4º Oficial de Registro de Imóveis de SP',
  type: 'APARTAMENTO',
  standard: 'ALTO',
  privateArea: 165,
  totalArea: 240,
  ageYears: 12,
  usefulLifeYears: 60,
  rossHeidecke: 'ENTRE_NOVO_REGULAR',
  summaryDescription:
    'Unidade residencial autônoma com living integrado para 3 ambientes, varanda gourmet nivelada, acabamentos em porcelanato nobre e madeira cumaru, esquadrias de alta vedação acústica e pleno funcionamento predial.',
  meterWater: '0412.8 m³',
  meterEnergy: '18.940 kWh',
  meterGas: '0129.4 m³',
  keysInventory:
    '3 cópias da porta social principal · 2 controles remotos do portão de garagem · 1 chave da caixa de correspondências. Testadas e funcionais.',
};

export const INITIAL_ROOMS: InspectionRoom[] = [
  {
    id: 1,
    name: 'Living Integrado / Sala de Estar',
    floor: 'Porcelanato 120x120 Calacatta',
    ceiling: 'Gesso rebaixado c/ spots LED',
    wall: 'Látex acrílico acetinado',
    joinery: 'Alumínio preto anodizado',
    condition: 'EXCELENTE',
    notes: 'Piso intacto, sem peças soltas ou riscos aparentes.',
  },
  {
    id: 2,
    name: 'Suíte Master com Closet',
    floor: 'Madeira maciça Cumaru',
    ceiling: 'Forro de gesso com cortineiro',
    wall: 'Pintura fosca e painel ripado',
    joinery: 'Janela acústica automatizada',
    condition: 'EXCELENTE',
    notes: 'Persiana elétrica testada e 100% operacional.',
  },
  {
    id: 3,
    name: 'Cozinha Gourmet Integrada',
    floor: 'Porcelanato acetinado cinza',
    ceiling: 'Laje pintada com moldura',
    wall: 'Azulejo metro white sobre bancada',
    joinery: 'Bancada em Quartzo Branco Stellar',
    condition: 'BOM',
    notes: 'Torneira monocomando com vedação perfeita.',
  },
];

export const INITIAL_PHOTOS: InspectionPhoto[] = [
  {
    id: 'p1',
    title: 'Living Principal & Sala de Jantar',
    room: 'Sala de Estar',
    url: livingRoomImg,
    desc: 'Porcelanato polido 120x120 intacto, sem peças soltas ou trincas.',
    hasDefect: false,
    severity: '',
    date: '13/11/2026 14:32',
    gps: '-23.5844, -46.6789',
  },
  {
    id: 'p2',
    title: 'Bancada da Varanda Gourmet',
    room: 'Varanda Gourmet',
    url: gourmetBalconyImg,
    desc: 'Pequena fissura superficial no rejunte da bancada lateral esquerda.',
    hasDefect: true,
    severity: 'LEVE',
    date: '13/11/2026 14:45',
    gps: '-23.5844, -46.6789',
  },
];

export const INITIAL_SAMPLES: MarketSample[] = [
  {
    id: 1,
    title: 'Apto Ed. Bellagio (R. Leopoldo Couto)',
    price: 2450000,
    privateArea: 160,
    ageYears: 10,
    rossHeidecke: 'ENTRE_NOVO_REGULAR',
    standard: 'ALTO',
    distanceMeters: 350,
    sourceType: 'OFERTA',
  },
  {
    id: 2,
    title: 'Apto Ed. Maison Blanche (R. Clodomiro)',
    price: 2750000,
    privateArea: 175,
    ageYears: 14,
    rossHeidecke: 'REGULAR',
    standard: 'ALTO',
    distanceMeters: 420,
    sourceType: 'OFERTA',
  },
  {
    id: 3,
    title: 'Apto Ed. Contemporâneo (R. Joaquim Floriano)',
    price: 2300000,
    privateArea: 150,
    ageYears: 18,
    rossHeidecke: 'REGULAR',
    standard: 'NORMAL_MEDIO',
    distanceMeters: 550,
    sourceType: 'TRANSACIONADO',
  },
  {
    id: 4,
    title: 'Apto Ed. Splendido (R. Dr. Renato Paes)',
    price: 2890000,
    privateArea: 180,
    ageYears: 8,
    rossHeidecke: 'NOVO',
    standard: 'LUXO',
    distanceMeters: 490,
    sourceType: 'OFERTA',
  },
];

export const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: 'cli_1',
    name: 'Dr. Paulo Henrique Siqueira',
    document: '142.890.318-72',
    personType: 'PF',
    email: 'paulo.siqueira@adv.br',
    phone: '(11) 98412-7730',
    cityState: 'São Paulo - SP',
    notes: 'Proprietário investidor — carteira Itaim Bibi e Moema.',
    createdAt: '10/11/2026',
  },
  {
    id: 'cli_2',
    name: 'Construtora Horizonte Sul Ltda.',
    document: '28.419.002/0001-54',
    personType: 'PJ',
    email: 'patrimonio@horizontesul.com.br',
    phone: '(11) 3042-8810',
    cityState: 'São Paulo - SP',
    notes: 'Solicita avaliações periódicas para garantias bancárias.',
    createdAt: '12/11/2026',
  },
  {
    id: 'cli_3',
    name: 'Mariana Vasconcelos Duarte',
    document: '318.744.918-05',
    personType: 'PF',
    email: 'mariana.duarte@uol.com.br',
    phone: '(11) 97210-3349',
    cityState: 'São Paulo - SP',
    notes: 'Locação residencial de alto padrão nos Jardins.',
    createdAt: '14/11/2026',
  },
];

export const INITIAL_REGISTERED_PROPERTIES: RegisteredProperty[] = [
  {
    id: 'prop_1',
    clientId: 'cli_1',
    title: 'Apto 142 · Ed. Pedroso Alvarenga',
    purpose: 'VENDA',
    zip: '04538-133',
    street: 'Rua Pedroso Alvarenga, 1140 - Apto 142',
    neighborhood: 'Itaim Bibi',
    cityState: 'São Paulo - SP',
    matricula: '148.902',
    cartorio: '4º Oficial de Registro de Imóveis de SP',
    type: 'APARTAMENTO',
    standard: 'ALTO',
    privateArea: 165,
    totalArea: 240,
    ageYears: 12,
    usefulLifeYears: 60,
    rossHeidecke: 'ENTRE_NOVO_REGULAR',
    summaryDescription:
      'Unidade residencial autônoma com living integrado para 3 ambientes, varanda gourmet nivelada, acabamentos em porcelanato nobre e madeira cumaru, esquadrias de alta vedação acústica e pleno funcionamento predial.',
    createdAt: '10/11/2026',
  },
  {
    id: 'prop_2',
    clientId: 'cli_2',
    title: 'Conjunto Corporativo 91 · Faria Lima Prime',
    purpose: 'GARANTIA',
    zip: '01451-001',
    street: 'Av. Brigadeiro Faria Lima, 3144 - Conj. 91',
    neighborhood: 'Jardim Paulistano',
    cityState: 'São Paulo - SP',
    matricula: '92.410',
    cartorio: '13º Oficial de Registro de Imóveis de SP',
    type: 'SALA_COMERCIAL',
    standard: 'LUXO',
    privateArea: 220,
    totalArea: 310,
    ageYears: 6,
    usefulLifeYears: 60,
    rossHeidecke: 'ENTRE_NOVO_REGULAR',
    summaryDescription:
      'Laje corporativa Triple A com piso elevado, ar-condicionado VRF central, 6 vagas de garagem e certificação LEED Gold.',
    createdAt: '12/11/2026',
  },
  {
    id: 'prop_3',
    clientId: 'cli_3',
    title: 'Casa 08 · Condomínio Jardim Europa',
    purpose: 'LOCACAO',
    zip: '01449-000',
    street: 'Rua Rússia, 412 - Casa 08',
    neighborhood: 'Jardim Europa',
    cityState: 'São Paulo - SP',
    matricula: '67.118',
    cartorio: '4º Oficial de Registro de Imóveis de SP',
    type: 'CASA_CONDOMINIO',
    standard: 'LUXO',
    privateArea: 340,
    totalArea: 420,
    ageYears: 15,
    usefulLifeYears: 65,
    rossHeidecke: 'REGULAR',
    summaryDescription:
      'Residência em condomínio fechado com 4 suítes, jardim privativo com piscina aquecida e sistema de segurança perimetral.',
    createdAt: '14/11/2026',
  },
];
