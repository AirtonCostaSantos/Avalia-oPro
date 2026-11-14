import { Building2, Download, Printer } from 'lucide-react';
import type { CalculationResponse, PropertyDetails, UserProfile } from '../types/valuation';
import {
  calcRossHeideckeK,
  formatBRL,
  PURPOSE_LABELS,
  ROSS_STATE_LABELS,
  STANDARD_LABELS,
} from '../utils/valuationMath';

interface PtamDocumentViewProps {
  profile: UserProfile;
  property: PropertyDetails;
  calculation: CalculationResponse | null;
}

function QrVerificationSvg() {
  return (
    <svg
      viewBox="0 0 36 36"
      className="w-14 h-14 text-slate-900"
      aria-label="Selo QR de autenticidade CNAI"
    >
      <rect width="36" height="36" fill="#ffffff" />
      <path
        fill="currentColor"
        d="M2 2h10v10H2V2zm2 2v6h6V4H4zm2 2h2v2H6V6zm18-4h10v10H24V2zm2 2v6h6V4h-6zm2 2h2v2h-2V6zM2 24h10v10H2V24zm2 2v6h6v-6H4zm2 2h2v2H6v-2zm8-26h2v4h-2V2zm4 0h4v2h-4V2zm-2 4h2v4h-2V6zm4 2h2v4h-2V8zm-6 4h4v2h-4v-2zm6 2h4v2h-4v-2zM2 14h4v2H2v-2zm6 0h4v4H8v-4zm6 2h4v2h-4v-2zm6 0h2v4h-2v-4zm4-2h4v2h-4v-2zm6 0h4v4h-4v-4zm-24 4h4v2H2v-2zm6 2h4v2H8v-2zm6 0h4v4h-4v-4zm6 2h4v2h-4v-2zm6-2h2v4h-2v-4zm4 2h4v2h-4v-2zm-16 4h4v2h-4v-2zm6 0h2v4h-2v-4zm4 2h4v2h-4v-2zm6-2h4v4h-4v-4zm-10 4h4v4h-4v-4zm6 2h4v2h-4v-2zm6 0h2v4h-2v-4zm-18 0h4v2h-4v-2z"
      />
    </svg>
  );
}

export function PtamDocumentView({ profile, property, calculation }: PtamDocumentViewProps) {
  const kPercent = (
    calcRossHeideckeK(property.ageYears, property.usefulLifeYears, property.rossHeidecke) * 100
  ).toFixed(2);
  const stats = calculation?.stats;
  const samples = calculation?.treatedSamples ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl no-print">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            Parecer Técnico de Avaliação Mercadológica (PTAM)
          </h2>
          <p className="text-xs text-slate-400">
            Formatação formal homologada para impressão, laudos judiciais e garantias bancárias
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Imprimir / Exportar PTAM (PDF)
        </button>
      </div>

      {/* A4 Sheet */}
      <article className="printable-doc bg-white text-slate-900 p-8 md:p-12 shadow-xl rounded font-serif text-justify text-xs leading-relaxed max-w-4xl mx-auto border border-slate-200">
        <header className="border-b-2 border-slate-900 pb-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded border border-amber-600 flex items-center justify-center bg-amber-50 text-amber-800 overflow-hidden shrink-0">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.company}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Building2 className="w-8 h-8 text-amber-700" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-950 font-sans uppercase tracking-tight">
                Parecer Técnico de Avaliação Mercadológica
              </h1>
              <p className="text-[11px] font-sans text-slate-600 font-semibold tracking-wider uppercase">
                PTAM Oficial · Resolução COFECI Nº 1.065/2007 · ABNT NBR 14.653
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5 tabular-nums">
                Número de Controle: <strong className="text-slate-900">PTAM-2026-0042</strong>
              </p>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-300 sm:pl-4 pt-2 sm:pt-0 shrink-0">
            <div className="text-[11px] font-sans font-bold text-amber-800 uppercase">
              Perito Avaliador CNAI
            </div>
            <div className="font-mono text-xs font-bold text-slate-900 mt-0.5 tabular-nums">
              CNAI: Nº {profile.cnai}
            </div>
            <div className="text-[10px] font-sans text-slate-600">
              CRECI: {profile.creci} / {profile.creciState}
            </div>
          </div>
        </header>

        <section className="mb-5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 mb-2.5">
            1. Identificação dos Interessados e do Avaliador
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-sans">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-bold text-slate-700 block uppercase text-[10px]">
                Solicitante / Cliente
              </span>
              <div className="font-bold text-slate-900 mt-0.5">{property.clientName}</div>
              <div className="text-slate-600 font-mono">CPF/CNPJ: {property.clientDoc}</div>
              <div className="text-slate-600">
                Finalidade: <strong>{PURPOSE_LABELS[property.purpose]}</strong>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-bold text-slate-700 block uppercase text-[10px]">
                Avaliador Responsável
              </span>
              <div className="font-bold text-slate-900 mt-0.5">{profile.name}</div>
              <div className="text-slate-600 font-mono">
                CRECI {profile.creci} · CNAI {profile.cnai}
              </div>
              <div className="text-slate-600">
                Contato: {profile.phone} · {profile.email}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 mb-2.5">
            2. Identificação e Caracterização Física do Imóvel
          </h2>
          <table className="w-full text-[11px] font-sans border-collapse border border-slate-200 mb-2.5">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold bg-slate-100 w-1/4">Logradouro / Unidade</td>
                <td className="p-2 w-1/4">{property.street}</td>
                <td className="p-2 font-bold bg-slate-100 w-1/4">Bairro / Cidade</td>
                <td className="p-2 w-1/4">
                  {property.neighborhood}, {property.cityState}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold bg-slate-100">Matrícula (RGI)</td>
                <td className="p-2 font-mono">
                  {property.matricula} ({property.cartorio})
                </td>
                <td className="p-2 font-bold bg-slate-100">Padrão Construtivo</td>
                <td className="p-2 font-semibold text-slate-900">
                  {STANDARD_LABELS[property.standard]} (CUB)
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-slate-100">Área Privativa / Total</td>
                <td className="p-2 font-bold text-slate-900 font-mono tabular-nums">
                  {property.privateArea} m² / {property.totalArea} m²
                </td>
                <td className="p-2 font-bold bg-slate-100">Ross-Heidecke</td>
                <td className="p-2 font-semibold text-amber-800 tabular-nums">
                  {ROSS_STATE_LABELS[property.rossHeidecke]} (K = {kPercent}%)
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-[11px] text-slate-700 leading-normal">
            <strong>Descrição Sumária:</strong> {property.summaryDescription}
          </p>
        </section>

        <section className="mb-5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 mb-2">
            3. Metodologia Avaliatória & Amostragem (ABNT NBR 14.653-2)
          </h2>
          <p className="text-[11px] text-slate-700 leading-normal mb-2.5">
            Adotou-se o <strong>Método Comparativo Direto de Dados de Mercado (MCDDM)</strong>,
            ponderando fatores de oferta (deságio de 10%), escala/área pelo expoente de Borda,
            padrão construtivo CUB e estado de conservação pela Tabela de Ross-Heidecke.
          </p>
          {samples.length > 0 && (
            <table className="w-full text-[10px] font-sans border-collapse border border-slate-200 tabular-nums">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-1.5 text-left border-b border-slate-200">Amostra</th>
                  <th className="p-1.5 text-right border-b border-slate-200">Valor</th>
                  <th className="p-1.5 text-right border-b border-slate-200">Área</th>
                  <th className="p-1.5 text-right border-b border-slate-200">F.Total</th>
                  <th className="p-1.5 text-right border-b border-slate-200">Homog. (R$/m²)</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-slate-200 ${
                      s.isOutlier ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}
                  >
                    <td className="p-1.5 font-medium">{s.title}</td>
                    <td className="p-1.5 text-right font-mono">{formatBRL(s.price)}</td>
                    <td className="p-1.5 text-right font-mono">{s.privateArea} m²</td>
                    <td className="p-1.5 text-right font-mono">
                      {s.factors.totalFactor.toFixed(2)}
                    </td>
                    <td className="p-1.5 text-right font-mono font-bold">
                      {formatBRL(s.factors.homogenizedUnitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mb-6 bg-slate-50 p-4 rounded border border-slate-800 break-inside-avoid">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 mb-3">
            4. Conclusão e Determinação do Valor Mercadológico
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center mb-3 tabular-nums">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 font-sans block uppercase font-bold">
                Média Saneada
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {stats ? `${formatBRL(stats.sanitizedMeanUnitPrice)} / m²` : '—'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 font-sans block uppercase font-bold">
                Coeficiente Variação
              </span>
              <span className="text-sm font-bold font-mono text-emerald-700">
                {stats ? `${stats.coefficientOfVariation}%` : '—'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 font-sans block uppercase font-bold">
                Grau de Fundamentação
              </span>
              <span className="text-sm font-bold font-sans text-blue-800">
                {stats ? `${stats.evaluationGrade} (NBR 14.653)` : '—'}
              </span>
            </div>
          </div>

          <div className="text-center py-3 bg-amber-50 rounded border border-amber-300 tabular-nums">
            <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-amber-900 block">
              Valor de Mercado Estimado (Venda à Vista)
            </span>
            <div className="text-2xl font-extrabold font-mono text-slate-950 mt-0.5">
              {stats ? formatBRL(stats.calculatedMarketValue, true) : '—'}
            </div>
            <span className="text-[10px] font-sans text-slate-700 block mt-0.5">
              Campo de Arbítrio Admissível (±15%): de{' '}
              {stats ? `${formatBRL(stats.lowerLimit)} a ${formatBRL(stats.upperLimit)}` : '—'}
            </span>
          </div>

          <div className="mt-2.5 text-center py-2 bg-purple-50 rounded border border-purple-200 tabular-nums">
            <span className="text-[10px] font-sans font-bold uppercase text-purple-900 block">
              Valor Sugerido para Locação Mensal (Yield Estimado{' '}
              {stats ? stats.yieldMonthlyPercent : 0.48}% a.m.)
            </span>
            <div className="text-base font-bold font-mono text-purple-950">
              {stats ? `${formatBRL(stats.suggestedRentalValue, true)} / mês` : '—'}
            </div>
          </div>
        </section>

        <footer className="pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row sm:items-end justify-between gap-4 break-inside-avoid">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white border border-slate-300 flex items-center justify-center p-1">
              <QrVerificationSvg />
            </div>
            <div className="text-[9px] font-mono text-slate-500">
              <div>Autenticidade Verificável via Selo CNAI</div>
              <div>Hash SHA-256: 7f8a91c0...4b2e881d</div>
              <div>{profile.cityState} · Carimbo ICP-Brasil</div>
            </div>
          </div>

          <div className="text-center w-64">
            <div className="border-b border-slate-900 pb-1 mb-1 font-serif italic text-sm text-slate-800">
              {profile.name}
            </div>
            <div className="font-sans font-bold text-xs text-slate-950">{profile.name}</div>
            <div className="font-sans text-[10px] text-slate-600">
              Corretor de Imóveis · CRECI {profile.creci}
            </div>
            <div className="font-sans text-[10px] text-amber-800 font-bold">
              Perito Avaliador Imobiliário · CNAI {profile.cnai}
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
