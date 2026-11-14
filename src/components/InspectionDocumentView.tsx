import { useState } from 'react';
import { AlertTriangle, Building2, Camera, Download } from 'lucide-react';
import type {
  InspectionPhoto,
  InspectionRoom,
  InspectionType,
  PropertyDetails,
  UserProfile,
} from '../types/valuation';
import { buildPhotoWatermark } from '../utils/valuationMath';

interface InspectionDocumentViewProps {
  profile: UserProfile;
  property: PropertyDetails;
  rooms: InspectionRoom[];
  photos: InspectionPhoto[];
}

export function InspectionDocumentView({
  profile,
  property,
  rooms,
  photos,
}: InspectionDocumentViewProps) {
  const [inspectionType, setInspectionType] = useState<InspectionType>('ENTRADA');
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl no-print">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            Laudo Técnico de Vistoria de Imóvel (Entrada / Saída)
          </h2>
          <p className="text-xs text-slate-400">
            Memorial descritivo minucioso com grelha de fotos georreferenciadas e carimbo indelével
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setInspectionType('ENTRADA')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                inspectionType === 'ENTRADA'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vistoria de Entrada
            </button>
            <button
              type="button"
              onClick={() => setInspectionType('SAIDA')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                inspectionType === 'SAIDA'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vistoria de Saída
            </button>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Imprimir Laudo de Vistoria (PDF)
          </button>
        </div>
      </div>

      {/* A4 Sheet */}
      <article className="printable-doc bg-white text-slate-900 p-8 md:p-12 shadow-xl rounded font-sans text-xs leading-relaxed max-w-4xl mx-auto border border-slate-200">
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
              <h1 className="text-lg font-extrabold uppercase tracking-tight text-slate-950">
                Laudo Técnico de Vistoria de Imóvel
              </h1>
              <p className="text-xs font-semibold uppercase text-amber-700 tracking-wider">
                {inspectionType === 'ENTRADA'
                  ? 'Vistoria Inicial de Entrada (Locação / Venda)'
                  : 'Vistoria Final de Saída / Desocupação de Locação'}
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5 tabular-nums">
                Protocolo: <strong>VIST-2026-0089</strong> · {property.street} · {property.neighborhood}
              </p>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-300 sm:pl-4 pt-2 sm:pt-0 shrink-0">
            <div className="font-bold text-xs text-slate-950">{profile.name}</div>
            <div className="text-[11px] font-mono text-amber-800 font-bold">
              CRECI: {profile.creci} / {profile.creciState}
            </div>
            <div className="text-[10px] font-mono text-slate-600">CNAI Perito: {profile.cnai}</div>
          </div>
        </header>

        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 mb-2.5">
            1. Leituras Oficiais de Medidores & Inventário de Chaves
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-2.5 text-center tabular-nums">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">
                Água (Hidrômetro)
              </span>
              <div className="text-sm font-bold font-mono text-blue-800 mt-0.5">
                {property.meterWater}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">
                Energia (Relógio)
              </span>
              <div className="text-sm font-bold font-mono text-amber-800 mt-0.5">
                {property.meterEnergy}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">
                Gás Encanado
              </span>
              <div className="text-sm font-bold font-mono text-emerald-800 mt-0.5">
                {property.meterGas}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
            <strong>Chaves Entregues:</strong> {property.keysInventory}
          </p>
        </section>

        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 mb-2.5">
            2. Memorial Descritivo de Ambientes e Acabamentos
          </h2>
          <div className="space-y-2">
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                className="border border-slate-200 rounded p-2.5 bg-slate-50 break-inside-avoid"
              >
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200 font-bold">
                  <span>
                    {idx + 1}. {room.name}
                  </span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                      room.condition === 'EXCELENTE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : room.condition === 'REPAROS'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {room.condition}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-700">
                  <div>
                    <strong>Piso:</strong> {room.floor}
                  </div>
                  <div>
                    <strong>Teto:</strong> {room.ceiling}
                  </div>
                  <div>
                    <strong>Paredes:</strong> {room.wall}
                  </div>
                  <div>
                    <strong>Esquadrias:</strong> {room.joinery}
                  </div>
                </div>
                {room.notes && (
                  <div className="mt-1.5 text-[10px] text-slate-600">
                    <strong>Observações:</strong> {room.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-5 page-break">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 mb-3 flex items-center justify-between">
            <span>3. Memorial Fotográfico com Carimbo Indelével & Patologias</span>
            <span className="text-[10px] font-mono text-slate-500 tabular-nums">
              {photos.length} Evidências Registradas
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="border border-slate-300 rounded overflow-hidden bg-slate-50 flex flex-col break-inside-avoid"
              >
                <div className="relative h-44 bg-slate-200">
                  {failedPhotos[photo.id] ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      {photo.title}
                    </div>
                  ) : (
                    <img
                      src={photo.url}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedPhotos((prev) => ({ ...prev, [photo.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  )}
                  {photo.hasDefect && (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[8px] inline-flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      VÍCIO ({photo.severity || 'LEVE'})
                    </div>
                  )}
                  <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/85 text-[8px] text-amber-300 font-mono border border-amber-500/30 tabular-nums">
                    {buildPhotoWatermark(profile, photo.date, photo.gps)}
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="font-bold text-slate-900 text-[10px]">
                    {photo.room} · {photo.title}
                  </div>
                  <p className="text-[9px] text-slate-600 mt-0.5">{photo.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="pt-4 border-t-2 border-slate-900 break-inside-avoid">
          <p className="text-[9px] text-slate-600 text-justify mb-5 leading-normal">
            As partes reconhecem a integral fidelidade deste laudo de vistoria física e fotográfica,
            comprometendo-se a devolver o imóvel nas condições descritas, nos termos da Lei nº
            8.245/1991.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="border-b border-slate-900 pb-1 mb-1 font-serif italic text-slate-800 text-xs">
                {property.clientName}
              </div>
              <div className="font-bold text-[10px] text-slate-900">Proprietário / Locador</div>
            </div>
            <div>
              <div className="border-b border-slate-900 pb-1 mb-1 font-serif italic text-slate-800 text-xs">
                Locatário Responsável
              </div>
              <div className="font-bold text-[10px] text-slate-900">Locatário / Ocupante</div>
            </div>
            <div>
              <div className="border-b border-slate-900 pb-1 mb-1 font-serif italic text-slate-800 text-xs">
                {profile.name}
              </div>
              <div className="font-bold text-[10px] text-slate-900">
                Perito · CRECI {profile.creci}
              </div>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
