import { useCallback, useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { InspectionDocumentView } from './components/InspectionDocumentView';
import { ProfileView } from './components/ProfileView';
import { PtamDocumentView } from './components/PtamDocumentView';
import { RegistryView } from './components/RegistryView';
import { WizardView } from './components/WizardView';
import type {
  AppTab,
  CalculationResponse,
  ClientRecord,
  InspectionPhoto,
  InspectionRoom,
  MarketSample,
  PropertyDetails,
  RegisteredProperty,
  UserProfile,
} from './types/valuation';
import { calculateValuation } from './lib/valuationEngine';
import {
  INITIAL_CLIENTS,
  INITIAL_PHOTOS,
  INITIAL_PROFILE,
  INITIAL_PROPERTY,
  INITIAL_REGISTERED_PROPERTIES,
  INITIAL_ROOMS,
  INITIAL_SAMPLES,
} from './utils/valuationMath';

const STORAGE_KEY = 'valuation_pro_state_v1';

interface ToastState {
  message: string;
  variant: 'info' | 'warning' | 'success';
}

const NAV_TABS: { id: AppTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profile', label: 'Cadastro Corretor' },
  { id: 'registry', label: 'Clientes & Imóveis' },
  { id: 'wizard', label: 'Vistoria & PTAM' },
  { id: 'ptam-doc', label: 'Parecer PTAM' },
  { id: 'inspection-doc', label: 'Laudo Vistoria' },
];

function loadSavedField<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed[key] !== undefined) {
        return parsed[key] as T;
      }
    }
  } catch {
    // Ignore invalid local storage
  }
  return fallback;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [profile, setProfile] = useState<UserProfile>(() =>
    loadSavedField('profile', INITIAL_PROFILE)
  );
  const [brokers, setBrokers] = useState<UserProfile[]>(() =>
    loadSavedField('brokers', [INITIAL_PROFILE])
  );
  const [clients, setClients] = useState<ClientRecord[]>(() =>
    loadSavedField('clients', INITIAL_CLIENTS)
  );
  const [registeredProperties, setRegisteredProperties] = useState<RegisteredProperty[]>(() =>
    loadSavedField('registeredProperties', INITIAL_REGISTERED_PROPERTIES)
  );
  const [property, setProperty] = useState<PropertyDetails>(() =>
    loadSavedField('property', INITIAL_PROPERTY)
  );
  const [rooms, setRooms] = useState<InspectionRoom[]>(() =>
    loadSavedField('rooms', INITIAL_ROOMS)
  );
  const [photos, setPhotos] = useState<InspectionPhoto[]>(() =>
    loadSavedField('photos', INITIAL_PHOTOS)
  );
  const [samples, setSamples] = useState<MarketSample[]>(() =>
    loadSavedField('samples', INITIAL_SAMPLES)
  );

  const [calculation, setCalculation] = useState<CalculationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback(
    (message: string, variant: 'info' | 'warning' | 'success' = 'info') => {
      setToast({ message, variant });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile,
          brokers,
          clients,
          registeredProperties,
          property,
          rooms,
          photos,
          samples,
        })
      );
    } catch {
      // Storage quota exceeded on large uploaded images; continue safely in memory
    }
  }, [profile, brokers, clients, registeredProperties, property, rooms, photos, samples]);

  useEffect(() => {
    let active = true;
    const targetPayload = {
      ageYears: property.ageYears,
      usefulLifeYears: property.usefulLifeYears,
      rossHeidecke: property.rossHeidecke,
      privateArea: property.privateArea,
      standard: property.standard,
      type: property.type,
    };

    const runCalculation = async () => {
      setIsCalculating(true);
      const localResult = calculateValuation(targetPayload, samples) as CalculationResponse;

      try {
        const response = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: targetPayload,
            samples,
          }),
        });
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const data: CalculationResponse = await response.json();
          if (active && data && Array.isArray(data.treatedSamples)) {
            setCalculation(data);
            return;
          }
        }
        if (active) setCalculation(localResult);
      } catch {
        if (active) setCalculation(localResult);
      } finally {
        if (active) setIsCalculating(false);
      }
    };

    const debounceId = setTimeout(runCalculation, 80);
    return () => {
      active = false;
      clearTimeout(debounceId);
    };
  }, [
    property.ageYears,
    property.usefulLifeYears,
    property.rossHeidecke,
    property.privateArea,
    property.standard,
    property.type,
    samples,
  ]);

  const handleSaveProfile = useCallback(
    (updated: UserProfile) => {
      const targetId = updated.id || profile.id || 'broker_1';
      const normalized = { ...updated, id: targetId };
      setProfile(normalized);
      setBrokers((prev) => {
        const exists = prev.some((b) => b.id === targetId);
        return exists
          ? prev.map((b) => (b.id === targetId ? normalized : b))
          : [...prev, normalized];
      });
      notify('Cadastro do corretor atualizado.', 'success');
    },
    [profile.id, notify]
  );

  const handleAddBroker = useCallback(
    (created: UserProfile) => {
      setBrokers((prev) => [...prev, created]);
      setProfile(created);
      notify(`Corretor "${created.name}" cadastrado e definido como ativo.`, 'success');
    },
    [notify]
  );

  const handleSelectBroker = useCallback(
    (broker: UserProfile) => {
      setProfile(broker);
      notify(`Corretor ativo alterado para "${broker.name}".`, 'info');
    },
    [notify]
  );

  const handleDeleteBroker = useCallback(
    (brokerId: string) => {
      if (brokers.length <= 1) {
        notify('É necessário manter ao menos 1 corretor cadastrado.', 'warning');
        return;
      }
      const nextList = brokers.filter((b) => b.id !== brokerId);
      setBrokers(nextList);
      if (profile.id === brokerId && nextList[0]) {
        setProfile(nextList[0]);
      }
      notify('Corretor removido do cadastro.', 'info');
    },
    [brokers, profile.id, notify]
  );

  const handleSelectRegisteredProperty = useCallback(
    (selectedProp: RegisteredProperty, owner?: ClientRecord) => {
      setProperty((prev) => ({
        ...prev,
        clientName: owner?.name ?? prev.clientName,
        clientDoc: owner?.document ?? prev.clientDoc,
        purpose: selectedProp.purpose,
        zip: selectedProp.zip,
        street: selectedProp.street,
        neighborhood: selectedProp.neighborhood,
        cityState: selectedProp.cityState,
        matricula: selectedProp.matricula,
        cartorio: selectedProp.cartorio,
        type: selectedProp.type,
        standard: selectedProp.standard,
        privateArea: selectedProp.privateArea,
        totalArea: selectedProp.totalArea,
        ageYears: selectedProp.ageYears,
        usefulLifeYears: selectedProp.usefulLifeYears,
        rossHeidecke: selectedProp.rossHeidecke,
        summaryDescription: selectedProp.summaryDescription || prev.summaryDescription,
      }));
      setActiveTab('wizard');
      notify(`Imóvel "${selectedProp.title}" carregado para avaliação.`, 'success');
    },
    [notify]
  );

  const handleSaveCurrentToRegistry = useCallback(() => {
    const cleanDoc = property.clientDoc.trim();
    const cleanName = property.clientName.trim();
    if (!cleanName) {
      notify('Informe o nome do solicitante antes de salvar na base.', 'warning');
      return;
    }

    let existingClient = clients.find(
      (c) =>
        (cleanDoc && c.document === cleanDoc) ||
        c.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (!existingClient) {
      existingClient = {
        id: `cli_${Date.now()}`,
        name: cleanName,
        document: cleanDoc || 'Não informado',
        personType: cleanDoc.includes('/') ? 'PJ' : 'PF',
        email: '',
        phone: '',
        cityState: property.cityState,
        notes: 'Cadastrado automaticamente a partir da avaliação PTAM.',
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };
      setClients((prev) => [existingClient!, ...prev]);
    }

    const existingProp = registeredProperties.find(
      (p) =>
        (property.matricula && p.matricula === property.matricula) ||
        p.street.toLowerCase() === property.street.toLowerCase()
    );

    if (existingProp) {
      setRegisteredProperties((prev) =>
        prev.map((p) =>
          p.id === existingProp.id
            ? {
                ...p,
                clientId: existingClient!.id,
                purpose: property.purpose,
                zip: property.zip,
                street: property.street,
                neighborhood: property.neighborhood,
                cityState: property.cityState,
                matricula: property.matricula,
                cartorio: property.cartorio,
                type: property.type,
                standard: property.standard,
                privateArea: property.privateArea,
                totalArea: property.totalArea,
                ageYears: property.ageYears,
                usefulLifeYears: property.usefulLifeYears,
                rossHeidecke: property.rossHeidecke,
                summaryDescription: property.summaryDescription,
              }
            : p
        )
      );
      notify('Cliente e imóvel atualizados na base de cadastros.', 'success');
    } else {
      const newProp: RegisteredProperty = {
        id: `prop_${Date.now()}`,
        clientId: existingClient.id,
        title: `${property.street.split('-')[0].trim()} · ${property.neighborhood}`,
        purpose: property.purpose,
        zip: property.zip,
        street: property.street,
        neighborhood: property.neighborhood,
        cityState: property.cityState,
        matricula: property.matricula,
        cartorio: property.cartorio,
        type: property.type,
        standard: property.standard,
        privateArea: property.privateArea,
        totalArea: property.totalArea,
        ageYears: property.ageYears,
        usefulLifeYears: property.usefulLifeYears,
        rossHeidecke: property.rossHeidecke,
        summaryDescription: property.summaryDescription,
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };
      setRegisteredProperties((prev) => [newProp, ...prev]);
      notify('Cliente e imóvel salvos na base de cadastros.', 'success');
    }
  }, [clients, property, registeredProperties, notify]);

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-white font-bold text-base tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
              <Building2 className="w-4 h-4" />
            </span>
            <span>Valuation Pro</span>
          </button>

          <nav
            aria-label="Navegação principal"
            className="flex items-center gap-5 overflow-x-auto text-xs font-medium"
          >
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-amber-500 text-white font-semibold'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            title={`${profile.name} · CRECI ${profile.creci}`}
            className="hidden md:flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="font-semibold truncate max-w-[160px]">{profile.name}</span>
            <span className="w-8 h-8 rounded-full bg-slate-800 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-xs">
              {initials || 'VP'}
            </span>
          </button>
        </div>
      </header>

      {/* Non-blocking Toast Feedback */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg border text-xs font-semibold shadow-lg no-print ${
            toast.variant === 'warning'
              ? 'bg-amber-950 border-amber-500/50 text-amber-200'
              : toast.variant === 'success'
                ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={setActiveTab}
            property={property}
            stats={calculation?.stats ?? null}
            clientCount={clients.length}
            propertyCount={registeredProperties.length}
          />
        )}

        {activeTab === 'registry' && (
          <RegistryView
            clients={clients}
            onChangeClients={setClients}
            properties={registeredProperties}
            onChangeProperties={setRegisteredProperties}
            activeMatricula={property.matricula}
            onSelectPropertyForEvaluation={handleSelectRegisteredProperty}
            onNotify={notify}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            brokers={brokers}
            onSaveProfile={handleSaveProfile}
            onSelectBroker={handleSelectBroker}
            onAddBroker={handleAddBroker}
            onDeleteBroker={handleDeleteBroker}
          />
        )}

        {activeTab === 'wizard' && (
          <WizardView
            profile={profile}
            property={property}
            onChangeProperty={setProperty}
            clients={clients}
            registeredProperties={registeredProperties}
            onSelectRegisteredProperty={handleSelectRegisteredProperty}
            onSaveCurrentToRegistry={handleSaveCurrentToRegistry}
            rooms={rooms}
            onChangeRooms={setRooms}
            photos={photos}
            onChangePhotos={setPhotos}
            samples={samples}
            onChangeSamples={setSamples}
            calculation={calculation}
            isCalculating={isCalculating}
            onNotify={notify}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'ptam-doc' && (
          <PtamDocumentView
            profile={profile}
            property={property}
            calculation={calculation}
          />
        )}

        {activeTab === 'inspection-doc' && (
          <InspectionDocumentView
            profile={profile}
            property={property}
            rooms={rooms}
            photos={photos}
          />
        )}
      </main>
    </div>
  );
}
