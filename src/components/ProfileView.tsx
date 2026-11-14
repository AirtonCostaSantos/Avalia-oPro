import { useState, type ChangeEvent } from 'react';
import { Award, Building, Camera, Check, Phone, Save, Sparkles, UserCheck } from 'lucide-react';
import type { UserProfile } from '../types/valuation';
import { buildPhotoWatermark } from '../utils/valuationMath';

interface ProfileViewProps {
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
}

export function ProfileView({ profile, onSaveProfile }: ProfileViewProps) {
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleFieldChange = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key === 'logoUrl') setLogoError(false);
  };

  const handleLogoFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setLogoError(false);
        setDraft((prev) => ({ ...prev, logoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSaveProfile(draft);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const stampPreview = buildPhotoWatermark(draft, '13/11/2026 14:30', '-23.5844, -46.6789');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            Perfil Profissional & Identidade Visual
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configuração de dados CRECI/CNAI e logotipo aplicados em todos os laudos e fotos
          </p>
        </div>
        {savedFeedback && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" /> Dados salvos com sucesso
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Award className="w-4 h-4" /> Credenciamento Profissional (COFECI · CRECI · CNAI)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nome Completo</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Registro CRECI</label>
                <input
                  type="text"
                  value={draft.creci}
                  onChange={(e) => handleFieldChange('creci', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">UF do CRECI</label>
                <input
                  type="text"
                  value={draft.creciState}
                  onChange={(e) => handleFieldChange('creciState', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Registro CNAI (COFECI)</label>
                <input
                  type="text"
                  value={draft.cnai}
                  onChange={(e) => handleFieldChange('cnai', e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={draft.cpfCnpj}
                  onChange={(e) => handleFieldChange('cpfCnpj', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Razão Social / Imobiliária</label>
                <input
                  type="text"
                  value={draft.company}
                  onChange={(e) => handleFieldChange('company', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Contatos e Domicílio Profissional
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">E-mail Profissional</label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={draft.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Cidade / Estado</label>
                <input
                  type="text"
                  value={draft.cityState}
                  onChange={(e) => handleFieldChange('cityState', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-slate-400 mb-1 font-medium">Endereço Comercial Completo</label>
                <input
                  type="text"
                  value={draft.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Logotipo do Corretor / Empresa
            </h2>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center space-y-3">
              <div className="h-20 flex items-center justify-center">
                {draft.logoUrl && !logoError ? (
                  <img
                    src={draft.logoUrl}
                    alt={`Logotipo de ${draft.company}`}
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="max-h-16 max-w-full object-contain mx-auto"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Building className="w-9 h-9 text-amber-500" />
                    <span className="text-[11px]">Brasão padrão ativo</span>
                  </div>
                )}
              </div>

              <div className="text-left">
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Upload de Imagem (PNG / JPEG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
              </div>

              <div className="text-left">
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Ou cole a URL da Logo
                </label>
                <input
                  type="text"
                  value={draft.logoUrl.startsWith('data:') ? '' : draft.logoUrl}
                  onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Marca D'Água Automática nas Fotos
            </h2>
            <div className="space-y-2.5 text-xs text-slate-300">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.stampShowCreci}
                  onChange={(e) => handleFieldChange('stampShowCreci', e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 accent-amber-500"
                />
                Exibir Número CRECI
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.stampShowCnai}
                  onChange={(e) => handleFieldChange('stampShowCnai', e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 accent-amber-500"
                />
                Exibir Registro CNAI (COFECI)
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.stampShowGps}
                  onChange={(e) => handleFieldChange('stampShowGps', e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 accent-amber-500"
                />
                Carimbo de Data, Hora e Coordenadas GPS
              </label>
            </div>

            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300 tabular-nums">
              <span className="text-slate-500 block text-[10px] font-sans mb-1">Prévia do Carimbo</span>
              {stampPreview}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" /> Salvar Identidade Profissional
          </button>
        </div>
      </div>
    </div>
  );
}
