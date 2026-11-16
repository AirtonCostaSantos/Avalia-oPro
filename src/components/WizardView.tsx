import { useState, type ChangeEvent } from 'react';
import {
  AlertTriangle,
  Camera,
  FileCheck,
  Gauge,
  Layers,
  MapPin,
  Plus,
  PlusCircle,
  Ruler,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import type {
  AppTab,
  CalculationResponse,
  ClientRecord,
  ConstructionStandard,
  DefectSeverity,
  EvaluationPurpose,
  InspectionPhoto,
  InspectionRoom,
  MarketSample,
  PropertyDetails,
  PropertyType,
  RegisteredProperty,
  RoomCondition,
  RossState,
  UserProfile,
  WizardStep,
} from '../types/valuation';
import {
  buildPhotoWatermark,
  calcRossHeideckeK,
  formatBRL,
  ROSS_STATE_LABELS,
} from '../utils/valuationMath';

interface WizardViewProps {
  profile: UserProfile;
  property: PropertyDetails;
  onChangeProperty: (updated: PropertyDetails) => void;
  clients: ClientRecord[];
  registeredProperties: RegisteredProperty[];
  onSelectRegisteredProperty: (prop: RegisteredProperty, client?: ClientRecord) => void;
  onSaveCurrentToRegistry: () => void;
  rooms: InspectionRoom[];
  onChangeRooms: (updated: InspectionRoom[]) => void;
  photos: InspectionPhoto[];
  onChangePhotos: (updated: InspectionPhoto[]) => void;
  samples: MarketSample[];
  onChangeSamples: (updated: MarketSample[]) => void;
  calculation: CalculationResponse | null;
  isCalculating: boolean;
  onNotify: (message: string, variant?: 'info' | 'warning' | 'success') => void;
  onNavigate: (tab: AppTab) => void;
}

const STEP_LABELS: { step: WizardStep; title: string }[] = [
  { step: 1, title: '1. Cartório' },
  { step: 2, title: '2. Ross-Heidecke' },
  { step: 3, title: '3. Ambientes' },
  { step: 4, title: '4. Galeria & Fotos' },
  { step: 5, title: '5. Homogeneização' },
];

export function WizardView({
  profile,
  property,
  onChangeProperty,
  clients,
  registeredProperties,
  onSelectRegisteredProperty,
  onSaveCurrentToRegistry,
  rooms,
  onChangeRooms,
  photos,
  onChangePhotos,
  samples,
  onChangeSamples,
  calculation,
  isCalculating,
  onNotify,
  onNavigate,
}: WizardViewProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [cepLoading, setCepLoading] = useState(false);

  // Inline room creation form state (replaces window.prompt)
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState<Omit<InspectionRoom, 'id'>>({
    name: '',
    floor: 'Porcelanato',
    ceiling: 'Gesso rebaixado',
    wall: 'Pintura látex acrílica',
    joinery: 'Alumínio preto anodizado',
    condition: 'BOM',
    notes: '',
  });

  // Add sample modal state
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [newSample, setNewSample] = useState({
    title: '',
    price: 2500000,
    privateArea: 160,
    ageYears: 10,
    distanceMeters: 300,
    rossHeidecke: 'ENTRE_NOVO_REGULAR' as RossState,
    standard: 'ALTO' as ConstructionStandard,
    sourceType: 'OFERTA' as 'OFERTA' | 'TRANSACIONADO',
  });

  const [failedPhotoIds, setFailedPhotoIds] = useState<Record<string, boolean>>({});

  const updateProp = <K extends keyof PropertyDetails>(key: K, value: PropertyDetails[K]) => {
    onChangeProperty({ ...property, [key]: value });
  };

  const handleLookupCep = async () => {
    const cleanCep = property.zip.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      onNotify('Informe um CEP válido com 8 dígitos.', 'warning');
      return;
    }

    setCepLoading(true);
    try {
      const response = await fetch(`/api/cep/${cleanCep}`);
      const data = await response.json();
      if (!response.ok) {
        onNotify(data.error || 'Não foi possível localizar o CEP.', 'warning');
        return;
      }

      onChangeProperty({
        ...property,
        street: data.logradouro || property.street,
        neighborhood: data.bairro || property.neighborhood,
        cityState:
          data.localidade && data.uf ? `${data.localidade} - ${data.uf}` : property.cityState,
      });
      onNotify('Endereço atualizado via ViaCEP.', 'success');
    } catch {
      onNotify('Falha de rede ao consultar CEP.', 'warning');
    } finally {
      setCepLoading(false);
    }
  };

  const handleAddRoom = () => {
    const trimmed = newRoom.name.trim();
    if (!trimmed) {
      onNotify('Informe o nome do ambiente antes de salvar.', 'warning');
      return;
    }

    onChangeRooms([
      ...rooms,
      {
        id: Date.now(),
        name: trimmed,
        floor: newRoom.floor.trim() || 'Porcelanato',
        ceiling: newRoom.ceiling.trim() || 'Gesso rebaixado',
        wall: newRoom.wall.trim() || 'Pintura látex',
        joinery: newRoom.joinery.trim() || 'Alumínio preto',
        condition: newRoom.condition,
        notes: newRoom.notes.trim() || 'Padrão conforme vistoria.',
      },
    ]);
    setNewRoom({
      name: '',
      floor: 'Porcelanato',
      ceiling: 'Gesso rebaixado',
      wall: 'Pintura látex acrílica',
      joinery: 'Alumínio preto anodizado',
      condition: 'BOM',
      notes: '',
    });
    setShowAddRoom(false);
    onNotify('Ambiente adicionado ao memorial.', 'success');
  };

  const handleDeleteRoom = (id: number) => {
    onChangeRooms(rooms.filter((r) => r.id !== id));
  };

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const now = new Date();
    const dateStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        const created: InspectionPhoto = {
          id: `up_${Date.now()}_${idx}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          room: `Ambiente ${photos.length + idx + 1}`,
          url: result,
          desc: 'Foto registrada em vistoria técnica de campo.',
          hasDefect: false,
          severity: '',
          date: dateStr,
          gps: '-23.5844, -46.6789',
        };
        onChangePhotos([...photos, created]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const togglePhotoDefect = (photoId: string) => {
    onChangePhotos(
      photos.map((p) =>
        p.id === photoId
          ? { ...p, hasDefect: !p.hasDefect, severity: !p.hasDefect ? 'LEVE' : '' }
          : p
      )
    );
  };

  const updatePhotoSeverity = (photoId: string, severity: DefectSeverity) => {
    onChangePhotos(photos.map((p) => (p.id === photoId ? { ...p, severity } : p)));
  };

  const updatePhotoField = (
    photoId: string,
    field: 'title' | 'room' | 'desc',
    value: string
  ) => {
    onChangePhotos(photos.map((p) => (p.id === photoId ? { ...p, [field]: value } : p)));
  };

  const deletePhoto = (photoId: string) => {
    onChangePhotos(photos.filter((p) => p.id !== photoId));
  };

  const handleConfirmAddSample = () => {
    const created: MarketSample = {
      id: Date.now(),
      title: newSample.title.trim() || 'Amostra Comparável Adicional',
      price: Number(newSample.price) || 2500000,
      privateArea: Number(newSample.privateArea) || 160,
      ageYears: Number(newSample.ageYears) || 10,
      distanceMeters: Number(newSample.distanceMeters) || 300,
      rossHeidecke: newSample.rossHeidecke,
      standard: newSample.standard,
      sourceType: newSample.sourceType,
    };
    onChangeSamples([...samples, created]);
    setShowSampleModal(false);
    setNewSample({
      title: '',
      price: 2500000,
      privateArea: 160,
      ageYears: 10,
      distanceMeters: 300,
      rossHeidecke: 'ENTRE_NOVO_REGULAR',
      standard: 'ALTO',
      sourceType: 'OFERTA',
    });
    onNotify('Amostra adicionada à homogeneização.', 'success');
  };

  const handleDeleteSample = (id: number) => {
    if (samples.length <= 1) {
      onNotify('É necessário manter ao menos 1 amostra para a homogeneização.', 'warning');
      return;
    }
    onChangeSamples(samples.filter((s) => s.id !== id));
  };

  const kPercent = (
    calcRossHeideckeK(property.ageYears, property.usefulLifeYears, property.rossHeidecke) * 100
  ).toFixed(2);

  const stats = calculation?.stats;
  const treatedSamples = calculation?.treatedSamples ?? [];

  return (
    <div className="space-y-6">
      {/* Wizard Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Ciclo de Avaliação Mercadológica (PTAM) & Vistoria Técnica
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Fluxo guiado conforme normativas COFECI nº 1.065/2007 e ABNT NBR 14.653-2
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {STEP_LABELS.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setStep(item.step)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                step === item.step
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: CARTÓRIO & DADOS GERAIS */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="min-w-[200px] flex-1">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Importar Imóvel Cadastrado
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const selected = registeredProperties.find((p) => p.id === e.target.value);
                    if (!selected) return;
                    const owner = clients.find((c) => c.id === selected.clientId);
                    onSelectRegisteredProperty(selected, owner);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecionar imóvel da base ({registeredProperties.length})...</option>
                  {registeredProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · Mat. {p.matricula}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[200px] flex-1">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Vincular Cliente Cadastrado
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const selected = clients.find((c) => c.id === e.target.value);
                    if (!selected) return;
                    onChangeProperty({
                      ...property,
                      clientName: selected.name,
                      clientDoc: selected.document,
                    });
                    onNotify(`Cliente "${selected.name}" vinculado.`, 'success');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecionar cliente da base ({clients.length})...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.document}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 lg:self-end">
              <button
                type="button"
                onClick={onSaveCurrentToRegistry}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold whitespace-nowrap cursor-pointer"
              >
                Salvar Atual no Cadastro
              </button>
              <button
                type="button"
                onClick={() => onNavigate('registry')}
                className="px-3.5 py-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap cursor-pointer"
              >
                Gerenciar Base
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <User className="w-4 h-4" /> Solicitante da Avaliação & Finalidade
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Nome do Solicitante / Cliente
                </label>
                <input
                  type="text"
                  value={property.clientName}
                  onChange={(e) => updateProp('clientName', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={property.clientDoc}
                  onChange={(e) => updateProp('clientDoc', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Finalidade do Laudo</label>
                <select
                  value={property.purpose}
                  onChange={(e) => updateProp('purpose', e.target.value as EvaluationPurpose)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="VENDA">Compra e Venda</option>
                  <option value="LOCACAO">Fixação de Aluguel</option>
                  <option value="AMBOS">Venda e Locação Simultâneas</option>
                  <option value="GARANTIA">Garantia Bancária / Alienação</option>
                  <option value="JUDICIAL">Perícia Judicial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Localização com Busca Automática por CEP
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="flex items-center justify-between text-slate-400 mb-1 font-medium">
                  <span>CEP (ViaCEP)</span>
                  {cepLoading && (
                    <span className="text-amber-400 font-mono text-[10px]">Buscando...</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={property.zip}
                    onChange={(e) => updateProp('zip', e.target.value)}
                    onBlur={handleLookupCep}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    aria-label="Consultar CEP"
                    onClick={handleLookupCep}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1 font-medium">Logradouro / Unidade</label>
                <input
                  type="text"
                  value={property.street}
                  onChange={(e) => updateProp('street', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Bairro</label>
                <input
                  type="text"
                  value={property.neighborhood}
                  onChange={(e) => updateProp('neighborhood', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Cidade / UF</label>
                <input
                  type="text"
                  value={property.cityState}
                  onChange={(e) => updateProp('cityState', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nº Matrícula (RGI)</label>
                <input
                  type="text"
                  value={property.matricula}
                  onChange={(e) => updateProp('matricula', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1 font-medium">
                  Cartório de Registro de Imóveis
                </label>
                <input
                  type="text"
                  value={property.cartorio}
                  onChange={(e) => updateProp('cartorio', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ROSS-HEIDECKE & CONSTRUTIVO */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Áreas e Padrão Construtivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tipologia</label>
                <select
                  value={property.type}
                  onChange={(e) => updateProp('type', e.target.value as PropertyType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="APARTAMENTO">Apartamento Padrão</option>
                  <option value="CASA_CONDOMINIO">Casa em Condomínio</option>
                  <option value="SALA_COMERCIAL">Conjunto Comercial</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Padrão Construtivo (CUB)
                </label>
                <select
                  value={property.standard}
                  onChange={(e) => updateProp('standard', e.target.value as ConstructionStandard)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="PROFIT_BAIXO">Econômico / Popular</option>
                  <option value="NORMAL_MEDIO">Normal Médio</option>
                  <option value="ALTO">Alto Padrão</option>
                  <option value="LUXO">Luxo / Triple A</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Área Privativa / Útil (m²)
                </label>
                <input
                  type="number"
                  min={1}
                  value={property.privateArea}
                  onChange={(e) => updateProp('privateArea', Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Área Total Construída (m²)
                </label>
                <input
                  type="number"
                  min={1}
                  value={property.totalArea}
                  onChange={(e) => updateProp('totalArea', Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="text-xs">
              <label className="block text-slate-400 mb-1 font-medium">
                Descrição Sumária do Imóvel (aplicada no PTAM)
              </label>
              <textarea
                rows={2}
                value={property.summaryDescription}
                onChange={(e) => updateProp('summaryDescription', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Depreciação Físico-Construtiva (Método de Ross-Heidecke)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Critério conjugado de idade cronológica e conservação conforme NBR 14.653-2
                </p>
              </div>
              <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400">Depreciação Total (K):</span>
                <span className="text-xl font-bold text-amber-400 font-mono tabular-nums">
                  {kPercent}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Idade Aparente (Anos)
                </label>
                <input
                  type="number"
                  min={0}
                  value={property.ageYears}
                  onChange={(e) => updateProp('ageYears', Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Vida Útil Estimada (Anos)
                </label>
                <input
                  type="number"
                  min={1}
                  value={property.usefulLifeYears}
                  onChange={(e) => updateProp('usefulLifeYears', Number(e.target.value) || 60)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Estado de Conservação (Heidecke)
                </label>
                <select
                  value={property.rossHeidecke}
                  onChange={(e) => updateProp('rossHeidecke', e.target.value as RossState)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                >
                  {(Object.keys(ROSS_STATE_LABELS) as RossState[]).map((key) => (
                    <option key={key} value={key}>
                      {ROSS_STATE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: AMBIENTES & MEDIDORES */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Leituras de Medidores & Inventário de Chaves
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Hidrômetro (Água m³)
                </label>
                <input
                  type="text"
                  value={property.meterWater}
                  onChange={(e) => updateProp('meterWater', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Energia (Luz kWh)</label>
                <input
                  type="text"
                  value={property.meterEnergy}
                  onChange={(e) => updateProp('meterEnergy', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Gás Encanado (m³)</label>
                <input
                  type="text"
                  value={property.meterGas}
                  onChange={(e) => updateProp('meterGas', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-slate-400 mb-1 font-medium">
                  Chaves & Controles Entregues
                </label>
                <input
                  type="text"
                  value={property.keysInventory}
                  onChange={(e) => updateProp('keysInventory', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Memorial de Ambientes & Acabamentos
                </h2>
                <p className="text-xs text-slate-400">
                  Adicione e customize os cômodos para o Laudo de Vistoria
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRoom((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddRoom ? 'Fechar Formulário' : 'Adicionar Ambiente'}
              </button>
            </div>

            {showAddRoom && (
              <div className="bg-slate-950 border border-amber-500/40 rounded-lg p-4 space-y-3 text-xs">
                <div className="font-bold text-amber-400">Novo Cômodo / Ambiente</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Nome do Ambiente</label>
                    <input
                      type="text"
                      placeholder="Ex: Sacada Gourmet, Lavabo"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Piso</label>
                    <input
                      type="text"
                      value={newRoom.floor}
                      onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Teto</label>
                    <input
                      type="text"
                      value={newRoom.ceiling}
                      onChange={(e) => setNewRoom({ ...newRoom, ceiling: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Paredes</label>
                    <input
                      type="text"
                      value={newRoom.wall}
                      onChange={(e) => setNewRoom({ ...newRoom, wall: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Esquadrias</label>
                    <input
                      type="text"
                      value={newRoom.joinery}
                      onChange={(e) => setNewRoom({ ...newRoom, joinery: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Estado</label>
                    <select
                      value={newRoom.condition}
                      onChange={(e) =>
                        setNewRoom({ ...newRoom, condition: e.target.value as RoomCondition })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="EXCELENTE">EXCELENTE</option>
                      <option value="BOM">BOM</option>
                      <option value="REGULAR">REGULAR</option>
                      <option value="REPAROS">REPAROS</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-slate-400 mb-1">Observações</label>
                    <input
                      type="text"
                      placeholder="Detalhes de conservação, funcionamento elétrico/hidráulico..."
                      value={newRoom.notes}
                      onChange={(e) => setNewRoom({ ...newRoom, notes: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRoom(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRoom}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                  >
                    Salvar Ambiente
                  </button>
                </div>
              </div>
            )}

            {rooms.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
                Nenhum ambiente cadastrado. Clique em &ldquo;Adicionar Ambiente&rdquo; para compor o memorial.
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room, idx) => (
                  <div
                    key={room.id}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="font-mono text-amber-400 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span>{room.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-[11px] font-semibold ${
                            room.condition === 'EXCELENTE'
                              ? 'text-emerald-400'
                              : room.condition === 'REPAROS'
                                ? 'text-red-400'
                                : 'text-amber-400'
                          }`}
                        >
                          {room.condition}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remover ${room.name}`}
                          onClick={() => handleDeleteRoom(room.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300 pt-1">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Piso</span>
                        {room.floor}
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Teto</span>
                        {room.ceiling}
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Paredes</span>
                        {room.wall}
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Esquadrias</span>
                        {room.joinery}
                      </div>
                    </div>
                    {room.notes && (
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        {room.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: GALERIA FOTOGRÁFICA & CARIMBO */}
      {step === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                Memorial Fotográfico & Apontamento de Vícios
              </h2>
              <p className="text-xs text-slate-400">
                Fotos com carimbo indelével automático (CRECI, CNAI, Data, Hora e GPS)
              </p>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0">
              <UploadCloud className="w-4 h-4" />
              Upload de Fotos (Computador/Celular)
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {photos.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
              Nenhuma evidência fotográfica anexada. Utilize o botão de upload acima.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="relative h-52 bg-slate-900">
                    {failedPhotoIds[photo.id] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-900">
                        <Camera className="w-8 h-8 text-amber-500/70" />
                        <span className="text-xs">{photo.title}</span>
                      </div>
                    ) : (
                      <img
                        src={photo.url}
                        alt={photo.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedPhotoIds((prev) => ({ ...prev, [photo.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                    {photo.hasDefect && (
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-red-600 text-white font-bold text-[10px] inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        VÍCIO ({photo.severity || 'LEVE'})
                      </div>
                    )}
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded bg-black/85 text-[10px] text-amber-300 font-mono border border-amber-500/30 tabular-nums">
                      {buildPhotoWatermark(profile, photo.date, photo.gps)}
                    </div>
                  </div>

                  <div className="p-4 text-xs flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 tabular-nums">
                        <input
                          type="text"
                          value={photo.room}
                          onChange={(e) => updatePhotoField(photo.id, 'room', e.target.value)}
                          className="bg-transparent font-bold text-amber-400 focus:outline-none focus:underline w-1/2"
                        />
                        <span>{photo.date}</span>
                      </div>
                      <input
                        type="text"
                        value={photo.title}
                        onChange={(e) => updatePhotoField(photo.id, 'title', e.target.value)}
                        className="w-full bg-transparent font-bold text-white text-sm focus:outline-none focus:underline"
                      />
                      <input
                        type="text"
                        value={photo.desc}
                        onChange={(e) => updatePhotoField(photo.id, 'desc', e.target.value)}
                        className="w-full bg-transparent text-slate-400 focus:outline-none focus:text-slate-200"
                      />
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => togglePhotoDefect(photo.id)}
                          className="text-amber-400 hover:underline font-semibold cursor-pointer"
                        >
                          {photo.hasDefect ? 'Remover Apontamento' : 'Apontar Avaria'}
                        </button>
                        {photo.hasDefect && (
                          <select
                            value={photo.severity || 'LEVE'}
                            onChange={(e) =>
                              updatePhotoSeverity(photo.id, e.target.value as DefectSeverity)
                            }
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white text-[11px]"
                          >
                            <option value="LEVE">Leve</option>
                            <option value="MODERADO">Moderado</option>
                            <option value="GRAVE">Grave</option>
                          </select>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => deletePhoto(photo.id)}
                        className="text-red-400 hover:underline font-semibold cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 5: HOMOGENEIZAÇÃO NBR 14.653 */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono text-amber-400 font-semibold">
                  Método Comparativo Direto de Dados de Mercado (MCDDM)
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Diagnóstico Estatístico Homogeneizado
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                <span className="px-3 py-1 rounded-md font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  {stats ? `${stats.evaluationGrade} (NBR 14.653-2)` : 'Calculando...'}
                </span>
                <span className="px-3 py-1 rounded-md font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  CV: {stats ? `${stats.coefficientOfVariation}%` : '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">
                  Preço Unitário Homogeneizado
                </span>
                <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-1">
                  {isCalculating
                    ? 'Calculando...'
                    : stats
                      ? `${formatBRL(stats.sanitizedMeanUnitPrice)} / m²`
                      : '—'}
                </div>
                <span className="text-[11px] text-slate-400 block mt-1 tabular-nums">
                  Média saneada ({stats?.sanitizedCount ?? 0} de {stats?.sampleCount ?? 0} amostras)
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Valor de Mercado (Venda)</span>
                <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                  {stats ? formatBRL(stats.calculatedMarketValue) : '—'}
                </div>
                <span className="text-[11px] text-slate-400 block mt-1 tabular-nums">
                  Campo ±15%: {stats ? `${formatBRL(stats.lowerLimit)} a ${formatBRL(stats.upperLimit)}` : '—'}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-purple-300 font-medium">Sugestão de Aluguel</span>
                <div className="text-2xl font-bold text-purple-300 font-mono tabular-nums mt-1">
                  {stats ? `${formatBRL(stats.suggestedRentalValue)} / mês` : '—'}
                </div>
                <span className="text-[11px] text-slate-400 block mt-1 tabular-nums">
                  Yield estimado: {stats ? `${stats.yieldMonthlyPercent}%` : '0.48%'} ao mês
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Dispersão Amostral</span>
                <div className="text-xl font-bold text-slate-100 font-mono tabular-nums mt-1">
                  {stats ? `± ${formatBRL(stats.standardDeviation)}` : '—'}
                </div>
                <span className="text-[11px] text-emerald-400 block mt-1">
                  {stats && stats.coefficientOfVariation <= 30
                    ? 'Atende rigorosamente NBR 14.653'
                    : 'Revisar homogeneização das amostras'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Memória de Fatores Homogeneizados por Amostra
                </h3>
                <p className="text-xs text-slate-400">
                  Adicione ou remova imóveis comparáveis para refinar o cálculo estatístico
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSampleModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Inserir Nova Amostra
              </button>
            </div>

            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 font-sans font-semibold">Amostra Coletada</th>
                  <th className="py-2.5 px-3 font-semibold">Preço</th>
                  <th className="py-2.5 px-3 font-semibold">Área</th>
                  <th className="py-2.5 px-2 text-center font-semibold">F.Fonte</th>
                  <th className="py-2.5 px-2 text-center font-semibold">F.Área</th>
                  <th className="py-2.5 px-2 text-center font-semibold">F.Cons.</th>
                  <th className="py-2.5 px-2 text-center font-semibold">F.Padrão</th>
                  <th className="py-2.5 px-2 text-center font-bold text-amber-400">F.Total</th>
                  <th className="py-2.5 px-3 text-right font-bold text-amber-400 font-sans">
                    R$/m² Homog.
                  </th>
                  <th className="py-2.5 px-2 text-center font-sans font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {treatedSamples.map((s) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-800/40 ${
                      s.isOutlier ? 'text-slate-500 line-through' : 'text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans font-medium text-white">
                      {s.title}
                      {s.isOutlier && (
                        <span className="ml-2 text-[10px] text-red-400 font-mono no-underline">
                          (Expurgada)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">{formatBRL(s.price)}</td>
                    <td className="py-2.5 px-3">{s.privateArea} m²</td>
                    <td className="py-2.5 px-2 text-center text-slate-400">
                      {s.factors.sourceFactor.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-400">
                      {s.factors.areaFactor.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-400">
                      {s.factors.conservationFactor.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-400">
                      {s.factors.standardFactor.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-amber-400">
                      {s.factors.totalFactor.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                      {formatBRL(s.factors.homogenizedUnitPrice)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        aria-label={`Remover amostra ${s.title}`}
                        onClick={() => handleDeleteSample(s.id)}
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wizard Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => step > 1 && setStep((step - 1) as WizardStep)}
          className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Voltar Etapa
        </button>

        <button
          type="button"
          onClick={() => {
            if (step < 5) {
              setStep((step + 1) as WizardStep);
            } else {
              onNavigate('ptam-doc');
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
        >
          {step === 5 ? (
            <>
              <FileCheck className="w-4 h-4" /> Concluir e Visualizar PTAM
            </>
          ) : (
            `Avançar para Etapa ${step + 1}`
          )}
        </button>
      </div>

      {/* Modal: Inserir Nova Amostra */}
      {showSampleModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-500" />
                Cadastrar Nova Amostra de Comparação (MCDDM)
              </h3>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setShowSampleModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Identificação / Edifício</label>
                <input
                  type="text"
                  placeholder="Ex: Apto Ed. Lumière (R. Amauri)"
                  value={newSample.title}
                  onChange={(e) => setNewSample({ ...newSample, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  value={newSample.price}
                  onChange={(e) => setNewSample({ ...newSample, price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Área Privativa (m²)</label>
                <input
                  type="number"
                  value={newSample.privateArea}
                  onChange={(e) =>
                    setNewSample({ ...newSample, privateArea: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Idade Aparente (Anos)</label>
                <input
                  type="number"
                  value={newSample.ageYears}
                  onChange={(e) => setNewSample({ ...newSample, ageYears: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Distância (m)</label>
                <input
                  type="number"
                  value={newSample.distanceMeters}
                  onChange={(e) =>
                    setNewSample({ ...newSample, distanceMeters: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Estado de Conservação</label>
                <select
                  value={newSample.rossHeidecke}
                  onChange={(e) =>
                    setNewSample({ ...newSample, rossHeidecke: e.target.value as RossState })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="NOVO">A - Novo</option>
                  <option value="ENTRE_NOVO_REGULAR">B - Entre Novo/Regular</option>
                  <option value="REGULAR">C - Regular</option>
                  <option value="REPAROS_SIMPLES">E - Reparos Simples</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Padrão Construtivo</label>
                <select
                  value={newSample.standard}
                  onChange={(e) =>
                    setNewSample({
                      ...newSample,
                      standard: e.target.value as ConstructionStandard,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="NORMAL_MEDIO">Normal Médio</option>
                  <option value="ALTO">Alto Padrão</option>
                  <option value="LUXO">Luxo</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Natureza da Fonte</label>
                <select
                  value={newSample.sourceType}
                  onChange={(e) =>
                    setNewSample({
                      ...newSample,
                      sourceType: e.target.value as 'OFERTA' | 'TRANSACIONADO',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="OFERTA">Oferta (Anúncio - Fator 0,90)</option>
                  <option value="TRANSACIONADO">Transacionado (Venda Realizada - Fator 1,00)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSample}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Salvar Amostra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
