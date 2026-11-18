export type RossState =
  | 'NOVO'
  | 'ENTRE_NOVO_REGULAR'
  | 'REGULAR'
  | 'ENTRE_REGULAR_REPAROS'
  | 'REPAROS_SIMPLES'
  | 'ENTRE_REPAROS_IMPORTANTES'
  | 'REPAROS_IMPORTANTES'
  | 'SEM_VALOR';

export type ConstructionStandard = 'PROFIT_BAIXO' | 'NORMAL_MEDIO' | 'ALTO' | 'LUXO';

export interface TargetInput {
  ageYears: number;
  usefulLifeYears: number;
  rossHeidecke: RossState;
  privateArea: number;
  standard: ConstructionStandard;
  type: string;
}

export interface SampleInput {
  id: number | string;
  title: string;
  price: number;
  privateArea: number;
  ageYears: number;
  rossHeidecke: RossState;
  standard: ConstructionStandard;
  distanceMeters?: number;
  sourceType?: 'OFERTA' | 'TRANSACIONADO';
}

const HEIDECKE_COEFFICIENTS: Record<RossState, number> = {
  NOVO: 0.0,
  ENTRE_NOVO_REGULAR: 0.00032,
  REGULAR: 0.0252,
  ENTRE_REGULAR_REPAROS: 0.0809,
  REPAROS_SIMPLES: 0.181,
  ENTRE_REPAROS_IMPORTANTES: 0.326,
  REPAROS_IMPORTANTES: 0.522,
  SEM_VALOR: 1.0,
};

const STANDARD_INDEX: Record<ConstructionStandard, number> = {
  PROFIT_BAIXO: 0.78,
  NORMAL_MEDIO: 0.92,
  ALTO: 1.0,
  LUXO: 1.12,
};

export function calcRossHeideckeK(age: number, usefulLife: number, state: RossState): number {
  const safeLife = usefulLife > 0 ? usefulLife : 60;
  const x = Math.min(Math.max((age || 0) / safeLife, 0), 1.0);
  const ross = (x + Math.pow(x, 2)) / 2;
  const heidecke = HEIDECKE_COEFFICIENTS[state] ?? 0.0252;
  return ross + heidecke * (1 - ross);
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function calculateValuation(target: TargetInput, samples: SampleInput[]) {
  const safeTargetArea = target.privateArea > 0 ? target.privateArea : 100;
  const safeUsefulLife = target.usefulLifeYears > 0 ? target.usefulLifeYears : 60;
  const targetK = calcRossHeideckeK(target.ageYears, safeUsefulLife, target.rossHeidecke);
  const targetStdIdx = STANDARD_INDEX[target.standard] ?? 1.0;

  const treated = samples.map((sample) => {
    const safeSampleArea = sample.privateArea > 0 ? sample.privateArea : 1;
    const rawUnitPrice = sample.price / safeSampleArea;

    const sourceFactor = sample.sourceType === 'TRANSACIONADO' ? 1.0 : 0.9;

    const rawAreaFactor = Math.pow(safeSampleArea / safeTargetArea, 0.25);
    const areaFactor = roundTo(clamp(rawAreaFactor, 0.75, 1.3), 4);

    const sampleK = calcRossHeideckeK(sample.ageYears ?? 10, safeUsefulLife, sample.rossHeidecke);
    const denom = Math.max(1 - sampleK, 0.05);
    const rawConservationFactor = (1 - targetK) / denom;
    const conservationFactor = roundTo(clamp(rawConservationFactor, 0.7, 1.4), 4);

    const sampleStdIdx = STANDARD_INDEX[sample.standard] ?? 1.0;
    const standardFactor = roundTo(clamp(targetStdIdx / sampleStdIdx, 0.75, 1.35), 4);

    const dist = sample.distanceMeters ?? 300;
    const distanceFactor = dist > 600 ? roundTo(clamp(1 - (dist - 600) / 10000, 0.95, 1.0), 4) : 1.0;

    const totalFactor = roundTo(
      sourceFactor * areaFactor * conservationFactor * standardFactor * distanceFactor,
      4
    );
    const homogenizedUnitPrice = Math.round(rawUnitPrice * totalFactor);

    return {
      ...sample,
      rawUnitPrice: Math.round(rawUnitPrice),
      factors: {
        sourceFactor,
        areaFactor,
        conservationFactor,
        standardFactor,
        distanceFactor,
        totalFactor,
        homogenizedUnitPrice,
      },
      isOutlier: false,
    };
  });

  if (treated.length === 0) {
    return {
      targetK,
      treatedSamples: [],
      stats: {
        sampleCount: 0,
        sanitizedCount: 0,
        sanitizedMeanUnitPrice: 0,
        standardDeviation: 0,
        coefficientOfVariation: 0,
        evaluationGrade: 'SEM AMOSTRAS',
        calculatedMarketValue: 0,
        lowerLimit: 0,
        upperLimit: 0,
        suggestedRentalValue: 0,
        yieldMonthlyPercent: 0.48,
      },
    };
  }

  const initialMean =
    treated.reduce((sum, s) => sum + s.factors.homogenizedUnitPrice, 0) / treated.length;

  treated.forEach((s) => {
    const ratio = s.factors.homogenizedUnitPrice / (initialMean || 1);
    s.isOutlier = treated.length >= 3 && (ratio < 0.7 || ratio > 1.3);
  });

  const validSamples = treated.filter((s) => !s.isOutlier);
  const activePool = validSamples.length > 0 ? validSamples : treated;

  const meanUnit =
    activePool.reduce((sum, s) => sum + s.factors.homogenizedUnitPrice, 0) / activePool.length;
  const sanitizedMeanUnitPrice = Math.round(meanUnit);

  const variance =
    activePool.length > 1
      ? activePool.reduce(
          (sum, s) => sum + Math.pow(s.factors.homogenizedUnitPrice - meanUnit, 2),
          0
        ) /
        (activePool.length - 1)
      : 0;
  const standardDeviation = Math.round(Math.sqrt(variance));
  const coefficientOfVariation =
    meanUnit > 0 ? roundTo((standardDeviation / meanUnit) * 100, 2) : 0;

  let evaluationGrade = 'GRAU I';
  if (activePool.length >= 4 && coefficientOfVariation <= 15) {
    evaluationGrade = 'GRAU III';
  } else if (activePool.length >= 3 && coefficientOfVariation <= 25) {
    evaluationGrade = 'GRAU II';
  }

  const calculatedMarketValue = Math.round((sanitizedMeanUnitPrice * safeTargetArea) / 1000) * 1000;
  const lowerLimit = Math.round(calculatedMarketValue * 0.85);
  const upperLimit = Math.round(calculatedMarketValue * 1.15);
  const yieldMonthlyPercent = target.type === 'SALA_COMERCIAL' ? 0.62 : 0.48;
  const suggestedRentalValue =
    Math.round((calculatedMarketValue * (yieldMonthlyPercent / 100)) / 10) * 10;

  return {
    targetK: roundTo(targetK, 4),
    treatedSamples: treated,
    stats: {
      sampleCount: treated.length,
      sanitizedCount: activePool.length,
      sanitizedMeanUnitPrice,
      standardDeviation,
      coefficientOfVariation,
      evaluationGrade,
      calculatedMarketValue,
      lowerLimit,
      upperLimit,
      suggestedRentalValue,
      yieldMonthlyPercent,
    },
  };
}
