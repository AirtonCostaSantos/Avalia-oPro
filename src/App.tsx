import { useCallback, useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { InspectionDocumentView } from './components/InspectionDocumentView';
import { ProfileView } from './components/ProfileView';
import { PtamDocumentView } from './components/PtamDocumentView';
import { WizardView } from './components/WizardView';
import type {
  AppTab,
  CalculationResponse,
  InspectionPhoto,
  InspectionRoom,
  MarketSample,
  PropertyDetails,
  UserProfile,
} from './types/valuation';
import {
  INITIAL_PHOTOS,
  INITIAL_PROFILE,
  INITIAL_PROPERTY,
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
  { id: 'profile', label: 'Identidade' },
  { id: 'wizard', label: 'Vistoria & PTAM' },
  { id: 'ptam-doc', label: 'Parecer PTAM' },
  { id: 'inspection-doc', label: 'Laudo Vistoria' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) return parsed.profile;
      }
    } catch {
      // Ignore invalid local storage
    }
    return INITIAL_PROFILE;
  });

  const [property, setProperty] = useState<PropertyDetails>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.property) return parsed.property;
      }
    } catch {
      // Ignore invalid local storage
    }
    return INITIAL_PROPERTY;
  });

  const [rooms, setRooms] = useState<InspectionRoom[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.rooms)) return parsed.rooms;
      }
    } catch {
      // Ignore invalid local storage
    }
    return INITIAL_ROOMS;
  });

  const [photos, setPhotos] = useState<InspectionPhoto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.photos)) return parsed.photos;
      }
    } catch {
      // Ignore invalid local storage
    }
    return INITIAL_PHOTOS;
  });

  const [samples, setSamples] = useState<MarketSample[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.samples)) return parsed.samples;
      }
    } catch {
      // Ignore invalid local storage
    }
    return INITIAL_SAMPLES;
  });

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

  // Persist workspace state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profile, property, rooms, photos, samples })
      );
    } catch {
      // Storage quota exceeded on large uploaded images; continue safely in memory
    }
  }, [profile, property, rooms, photos, samples]);

  // Sync homogenized NBR 14.653 calculation with Express backend
  useEffect(() => {
    let active = true;
    const runCalculation = async () => {
      setIsCalculating(true);
      try {
        const response = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: {
              ageYears: property.ageYears,
              usefulLifeYears: property.usefulLifeYears,
              rossHeidecke: property.rossHeidecke,
              privateArea: property.privateArea,
              standard: property.standard,
              type: property.type,
            },
            samples,
          }),
        });
        if (!response.ok) return;
        const data: CalculationResponse = await response.json();
        if (active) setCalculation(data);
      } catch (err) {
        console.error('Failed to calculate valuation:', err);
      } finally {
        if (active) setIsCalculating(false);
      }
    };

    const debounceId = setTimeout(runCalculation, 120);
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

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar (3-zone single-row contract) */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
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
            className="flex items-center gap-6 overflow-x-auto text-xs font-medium"
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
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            onSaveProfile={(updated) => {
              setProfile(updated);
              notify('Identidade profissional atualizada.', 'success');
            }}
          />
        )}

        {activeTab === 'wizard' && (
          <WizardView
            profile={profile}
            property={property}
            onChangeProperty={setProperty}
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
