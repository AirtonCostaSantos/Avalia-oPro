import type {
  ConstructionStandard,
  EvaluationPurpose,
  InspectionPhoto,
  InspectionRoom,
  MarketSample,
  PropertyDetails,
  RossState,
  UserProfile,
} from '../types/valuation';

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
    url: '/src/assets/images/living_room_luxury_1794692666004.jpg',
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
    url: '/src/assets/images/gourmet_balcony_1794692666307.jpg',
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
