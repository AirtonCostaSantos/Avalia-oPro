import { ArrowUpRight, Building, CheckCircle2, Clock, Percent, Plus, Sliders, TrendingUp, Users } from 'lucide-react';
import type { AppTab, CalculationStats, PropertyDetails } from '../types/valuation';
import { formatBRL } from '../utils/valuationMath';

interface DashboardViewProps {
  onNavigate: (tab: AppTab) => void;
  property: PropertyDetails;
  stats: CalculationStats | null;
  clientCount: number;
  propertyCount: number;
}

const OBSERVATORY_REGIONS = [
  { region: 'Itaim Bibi / V. N. Conceição', priceM2: 18200, samples: 31, trend: '+6.1%' },
  { region: 'Jardins / Cerqueira César', priceM2: 15400, samples: 24, trend: '+4.2%' },
  { region: 'Moema Pássaros', priceM2: 14250, samples: 26, trend: '+2.8%' },
  { region: 'Pinheiros / Vila Madalena', priceM2: 13100, samples: 28, trend: '+3.5%' },
];

const TYPOLOGY_DISTRIBUTION = [
  { label: 'Apartamentos Residenciais', count: 68, percent: 53, barClass: 'bg-amber-500' },
  { label: 'Casas em Condomínio', count: 32, percent: 25, barClass: 'bg-blue-500' },
  { label: 'Salas & Conjuntos Comerciais', count: 18, percent: 14, barClass: 'bg-emerald-500' },
  { label: 'Terrenos & Loteamentos', count: 10, percent: 8, barClass: 'bg-purple-500' },
];

export function DashboardView({
  onNavigate,
  property,
  stats,
  clientCount,
  propertyCount,
}: DashboardViewProps) {
  const activeMarketVal = stats ? formatBRL(stats.calculatedMarketValue) : 'R$ 2.350.000';
  const activeUnitM2 = stats ? formatBRL(stats.sanitizedMeanUnitPrice) : 'R$ 14.242';
  const activeGrade = stats ? stats.evaluationGrade : 'GRAU III';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-balance">
            Painel Executivo de Avaliações & Laudos
          </h1>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            Gestão consolidada de perícias · {clientCount} clientes e {propertyCount} imóveis na base
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Cadastro do Corretor
          </button>
          <button
            type="button"
            onClick={() => onNavigate('registry')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Clientes & Imóveis
          </button>
          <button
            type="button"
            onClick={() => onNavigate('wizard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Avaliação (PTAM)
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Volume Avaliado</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
              R$ 148.500.000
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium tabular-nums">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% neste mês</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">128 imóveis</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Valor Médio Homogeneizado</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
              R$ 9.840 <span className="text-xs font-sans font-normal text-slate-400">/ m²</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 tabular-nums">
              <span>Desvio Padrão: ± 8.4%</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-semibold">Grau III</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Laudos Técnicos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
              114 <span className="text-xs font-sans font-medium text-emerald-400">Finalizados</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>14 em campo / elaboração</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Carteira & Finalidade</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between text-xs tabular-nums">
              <span className="font-bold text-white text-sm">82 Vendas (64%)</span>
              <span className="text-purple-400 font-medium">46 Locações (36%)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
              <div style={{ width: '64%' }} className="bg-amber-500 h-full" />
              <div style={{ width: '36%' }} className="bg-purple-500 h-full" />
            </div>
            <div className="mt-2 text-xs text-slate-400 tabular-nums">
              Yield médio apurado: <span className="text-slate-200 font-semibold">0.49% a.m.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active PTAM Summary Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-amber-400 font-semibold">Avaliação em Andamento</div>
          <div className="text-base font-bold text-white">
            {property.street} · {property.neighborhood}, {property.cityState}
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            Solicitante: {property.clientName} · Matrícula RGI {property.matricula} · Área Privativa {property.privateArea} m²
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 shrink-0">
          <div>
            <div className="text-xs text-slate-400">Unitário Homogeneizado</div>
            <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">{activeUnitM2} / m²</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Valor de Mercado</div>
            <div className="text-lg font-bold font-mono text-white tabular-nums">{activeMarketVal}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Enquadramento</div>
            <div className="text-sm font-semibold text-emerald-400">{activeGrade}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('wizard')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              Editar Vistoria
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ptam-doc')}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              Abrir PTAM
            </button>
          </div>
        </div>
      </div>

      {/* Distribution & Regional Observatory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Distribuição por Tipologia</h2>
            <span className="text-xs text-slate-400">128 laudos</span>
          </div>
          <div className="space-y-4 text-xs">
            {TYPOLOGY_DISTRIBUTION.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-1.5 font-medium tabular-nums">
                  <span className="text-slate-200">{item.label}</span>
                  <span className="text-slate-400">
                    {item.count} un ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${item.barClass} h-full rounded-full`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">
                Observatório Regional de Preço Médio (m²)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Homogeneização estatística em raio de proximidade (NBR 14.653-2) · Macrozonas SP
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Bairro / Região</th>
                  <th className="py-2.5 px-3 font-semibold">Preço Homogeneizado</th>
                  <th className="py-2.5 px-3 font-semibold">Amostras</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Tendência Semestral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 tabular-nums">
                {OBSERVATORY_REGIONS.map((row) => (
                  <tr key={row.region} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-medium text-white">{row.region}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {formatBRL(row.priceM2)} / m²
                    </td>
                    <td className="py-3 px-3">{row.samples} imóveis</td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-400 font-mono">
                      {row.trend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
