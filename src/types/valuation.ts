export type AppTab = 'dashboard' | 'profile' | 'wizard' | 'ptam-doc' | 'inspection-doc';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type EvaluationPurpose = 'VENDA' | 'LOCACAO' | 'AMBOS' | 'GARANTIA' | 'JUDICIAL';

export type PropertyType = 'APARTAMENTO' | 'CASA_CONDOMINIO' | 'SALA_COMERCIAL';

export type ConstructionStandard = 'PROFIT_BAIXO' | 'NORMAL_MEDIO' | 'ALTO' | 'LUXO';

export type RossState =
  | 'NOVO'
  | 'ENTRE_NOVO_REGULAR'
  | 'REGULAR'
  | 'ENTRE_REGULAR_REPAROS'
  | 'REPAROS_SIMPLES'
  | 'ENTRE_REPAROS_IMPORTANTES'
  | 'REPAROS_IMPORTANTES'
  | 'SEM_VALOR';

export type RoomCondition = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'REPAROS';

export type DefectSeverity = '' | 'LEVE' | 'MODERADO' | 'GRAVE';

export type InspectionType = 'ENTRADA' | 'SAIDA';

export interface UserProfile {
  name: string;
  creci: string;
  creciState: string;
  cnai: string;
  cpfCnpj: string;
  company: string;
  email: string;
  phone: string;
  cityState: string;
  address: string;
  logoUrl: string;
  stampShowCreci: boolean;
  stampShowCnai: boolean;
  stampShowGps: boolean;
}

export interface PropertyDetails {
  clientName: string;
  clientDoc: string;
  purpose: EvaluationPurpose;
  zip: string;
  street: string;
  neighborhood: string;
  cityState: string;
  matricula: string;
  cartorio: string;
  type: PropertyType;
  standard: ConstructionStandard;
  privateArea: number;
  totalArea: number;
  ageYears: number;
  usefulLifeYears: number;
  rossHeidecke: RossState;
  summaryDescription: string;
  meterWater: string;
  meterEnergy: string;
  meterGas: string;
  keysInventory: string;
}

export interface InspectionRoom {
  id: number;
  name: string;
  floor: string;
  ceiling: string;
  wall: string;
  joinery: string;
  condition: RoomCondition;
  notes: string;
}

export interface InspectionPhoto {
  id: string;
  title: string;
  room: string;
  url: string;
  desc: string;
  hasDefect: boolean;
  severity: DefectSeverity;
  date: string;
  gps: string;
}

export interface MarketSample {
  id: number;
  title: string;
  price: number;
  privateArea: number;
  ageYears: number;
  rossHeidecke: RossState;
  standard: ConstructionStandard;
  distanceMeters: number;
  sourceType: 'OFERTA' | 'TRANSACIONADO';
}

export interface TreatedSample extends MarketSample {
  rawUnitPrice: number;
  isOutlier: boolean;
  factors: {
    sourceFactor: number;
    areaFactor: number;
    conservationFactor: number;
    standardFactor: number;
    distanceFactor: number;
    totalFactor: number;
    homogenizedUnitPrice: number;
  };
}

export interface CalculationStats {
  sampleCount: number;
  sanitizedCount: number;
  sanitizedMeanUnitPrice: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  evaluationGrade: string;
  calculatedMarketValue: number;
  lowerLimit: number;
  upperLimit: number;
  suggestedRentalValue: number;
  yieldMonthlyPercent: number;
}

export interface CalculationResponse {
  targetK: number;
  treatedSamples: TreatedSample[];
  stats: CalculationStats;
}
