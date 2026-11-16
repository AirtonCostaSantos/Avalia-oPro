import { useMemo, useState } from 'react';
import {
  Building,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type {
  ClientRecord,
  ConstructionStandard,
  EvaluationPurpose,
  PersonType,
  PropertyType,
  RegisteredProperty,
  RossState,
} from '../types/valuation';
import {
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
  ROSS_STATE_LABELS,
  STANDARD_LABELS,
} from '../utils/valuationMath';

interface RegistryViewProps {
  clients: ClientRecord[];
  onChangeClients: (updated: ClientRecord[]) => void;
  properties: RegisteredProperty[];
  onChangeProperties: (updated: RegisteredProperty[]) => void;
  activeMatricula: string;
  onSelectPropertyForEvaluation: (prop: RegisteredProperty, client?: ClientRecord) => void;
  onNotify: (message: string, variant?: 'info' | 'warning' | 'success') => void;
}

type RegistrySubTab = 'clients' | 'properties';

const EMPTY_CLIENT_FORM = {
  name: '',
  document: '',
  personType: 'PF' as PersonType,
  email: '',
  phone: '',
  cityState: 'São Paulo - SP',
  notes: '',
};

const EMPTY_PROPERTY_FORM = {
  clientId: '',
  title: '',
  purpose: 'VENDA' as EvaluationPurpose,
  zip: '',
  street: '',
  neighborhood: '',
  cityState: 'São Paulo - SP',
  matricula: '',
  cartorio: '',
  type: 'APARTAMENTO' as PropertyType,
  standard: 'ALTO' as ConstructionStandard,
  privateArea: 120,
  totalArea: 160,
  ageYears: 10,
  usefulLifeYears: 60,
  rossHeidecke: 'ENTRE_NOVO_REGULAR' as RossState,
  summaryDescription: '',
};

export function RegistryView({
  clients,
  onChangeClients,
  properties,
  onChangeProperties,
  activeMatricula,
  onSelectPropertyForEvaluation,
  onNotify,
}: RegistryViewProps) {
  const [subTab, setSubTab] = useState<RegistrySubTab>('clients');
  const [searchTerm, setSearchTerm] = useState('');

  // Client Modal State
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState(EMPTY_CLIENT_FORM);

  // Property Modal State
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [propertyForm, setPropertyForm] = useState(EMPTY_PROPERTY_FORM);
  const [cepLoading, setCepLoading] = useState(false);

  const clientMap = useMemo(() => {
    const map = new Map<string, ClientRecord>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const propertyCountByClient = useMemo(() => {
    const counts = new Map<string, number>();
    properties.forEach((p) => {
      counts.set(p.clientId, (counts.get(p.clientId) ?? 0) + 1);
    });
    return counts;
  }, [properties]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.document.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.cityState.toLowerCase().includes(q)
    );
  }, [clients, searchTerm]);

  const filteredProperties = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) => {
      const owner = clientMap.get(p.clientId)?.name ?? '';
      return (
        p.title.toLowerCase().includes(q) ||
        p.street.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.matricula.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q)
      );
    });
  }, [properties, searchTerm, clientMap]);

  // Client CRUD
  const openCreateClient = () => {
    setEditingClientId(null);
    setClientForm(EMPTY_CLIENT_FORM);
    setClientModalOpen(true);
  };

  const openEditClient = (client: ClientRecord) => {
    setEditingClientId(client.id);
    setClientForm({
      name: client.name,
      document: client.document,
      personType: client.personType,
      email: client.email,
      phone: client.phone,
      cityState: client.cityState,
      notes: client.notes,
    });
    setClientModalOpen(true);
  };

  const handleSaveClient = () => {
    if (!clientForm.name.trim() || !clientForm.document.trim()) {
      onNotify('Informe o nome e o CPF/CNPJ do cliente.', 'warning');
      return;
    }

    if (editingClientId) {
      onChangeClients(
        clients.map((c) => (c.id === editingClientId ? { ...c, ...clientForm } : c))
      );
      onNotify('Cadastro do cliente atualizado.', 'success');
    } else {
      const created: ClientRecord = {
        id: `cli_${Date.now()}`,
        ...clientForm,
        name: clientForm.name.trim(),
        document: clientForm.document.trim(),
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };
      onChangeClients([created, ...clients]);
      onNotify('Cliente cadastrado com sucesso.', 'success');
    }
    setClientModalOpen(false);
  };

  const handleDeleteClient = (client: ClientRecord) => {
    const linkedCount = propertyCountByClient.get(client.id) ?? 0;
    if (linkedCount > 0) {
      onNotify(
        `Não é possível excluir "${client.name}" pois há ${linkedCount} imóvel(is) vinculado(s).`,
        'warning'
      );
      return;
    }
    onChangeClients(clients.filter((c) => c.id !== client.id));
    onNotify('Cliente removido do cadastro.', 'info');
  };

  // Property CRUD
  const openCreateProperty = (preselectedClientId?: string) => {
    setEditingPropertyId(null);
    setPropertyForm({
      ...EMPTY_PROPERTY_FORM,
      clientId: preselectedClientId || clients[0]?.id || '',
    });
    setPropertyModalOpen(true);
  };

  const openEditProperty = (prop: RegisteredProperty) => {
    setEditingPropertyId(prop.id);
    setPropertyForm({
      clientId: prop.clientId,
      title: prop.title,
      purpose: prop.purpose,
      zip: prop.zip,
      street: prop.street,
      neighborhood: prop.neighborhood,
      cityState: prop.cityState,
      matricula: prop.matricula,
      cartorio: prop.cartorio,
      type: prop.type,
      standard: prop.standard,
      privateArea: prop.privateArea,
      totalArea: prop.totalArea,
      ageYears: prop.ageYears,
      usefulLifeYears: prop.usefulLifeYears,
      rossHeidecke: prop.rossHeidecke,
      summaryDescription: prop.summaryDescription,
    });
    setPropertyModalOpen(true);
  };

  const handlePropertyCepLookup = async () => {
    const cleanCep = propertyForm.zip.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      onNotify('Informe um CEP válido com 8 dígitos.', 'warning');
      return;
    }
    setCepLoading(true);
    try {
      const response = await fetch(`/api/cep/${cleanCep}`);
      const data = await response.json();
      if (!response.ok) {
        onNotify(data.error || 'CEP não localizado.', 'warning');
        return;
      }
      setPropertyForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        cityState: data.localidade && data.uf ? `${data.localidade} - ${data.uf}` : prev.cityState,
      }));
      onNotify('Endereço preenchido via ViaCEP.', 'success');
    } catch {
      onNotify('Erro de rede ao consultar CEP.', 'warning');
    } finally {
      setCepLoading(false);
    }
  };

  const handleSaveProperty = () => {
    if (!propertyForm.title.trim() || !propertyForm.street.trim()) {
      onNotify('Informe a identificação e o logradouro do imóvel.', 'warning');
      return;
    }
    if (!propertyForm.clientId) {
      onNotify('Selecione ou cadastre um cliente proprietário/solicitante.', 'warning');
      return;
    }

    if (editingPropertyId) {
      onChangeProperties(
        properties.map((p) => (p.id === editingPropertyId ? { ...p, ...propertyForm } : p))
      );
      onNotify('Cadastro do imóvel atualizado.', 'success');
    } else {
      const created: RegisteredProperty = {
        id: `prop_${Date.now()}`,
        ...propertyForm,
        title: propertyForm.title.trim(),
        street: propertyForm.street.trim(),
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };
      onChangeProperties([created, ...properties]);
      onNotify('Imóvel cadastrado com sucesso.', 'success');
    }
    setPropertyModalOpen(false);
  };

  const handleDeleteProperty = (id: string) => {
    onChangeProperties(properties.filter((p) => p.id !== id));
    onNotify('Imóvel removido do cadastro.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cadastro de Clientes & Imóveis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Base central de solicitantes, proprietários e matrículas vinculadas aos pareceres PTAM e vistorias
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openCreateClient}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            Novo Cliente
          </button>
          <button
            type="button"
            onClick={() => openCreateProperty()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Imóvel
          </button>
        </div>
      </div>

      {/* Filter & Sub-tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setSubTab('clients')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'clients'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Clientes ({clients.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('properties')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'properties'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Imóveis ({properties.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              subTab === 'clients'
                ? 'Buscar por nome, CPF/CNPJ, e-mail...'
                : 'Buscar por imóvel, endereço, matrícula...'
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* CLIENTS TABLE */}
      {subTab === 'clients' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {filteredClients.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Nenhum cliente encontrado para o filtro informado.
              </p>
              <button
                type="button"
                onClick={openCreateClient}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Cadastrar Primeiro Cliente
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Cliente / Razão Social</th>
                    <th className="py-3 px-3 font-semibold">Tipo</th>
                    <th className="py-3 px-3 font-semibold">CPF / CNPJ</th>
                    <th className="py-3 px-3 font-semibold">Contato</th>
                    <th className="py-3 px-3 font-semibold">Cidade / UF</th>
                    <th className="py-3 px-3 text-center font-semibold">Imóveis</th>
                    <th className="py-3 px-4 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 tabular-nums">
                  {filteredClients.map((client) => {
                    const count = propertyCountByClient.get(client.id) ?? 0;
                    return (
                      <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{client.name}</div>
                          {client.notes && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {client.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {client.personType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </td>
                        <td className="py-3 px-3 font-mono text-amber-400">{client.document}</td>
                        <td className="py-3 px-3">
                          <div className="font-mono text-slate-200">{client.phone || '—'}</div>
                          <div className="text-[11px] text-slate-400">{client.email || '—'}</div>
                        </td>
                        <td className="py-3 px-3">{client.cityState}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-white">
                          {count}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSubTab('properties');
                                openCreateProperty(client.id);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                            >
                              + Imóvel
                            </button>
                            <button
                              type="button"
                              aria-label={`Editar ${client.name}`}
                              onClick={() => openEditClient(client)}
                              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Excluir ${client.name}`}
                              onClick={() => handleDeleteClient(client)}
                              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROPERTIES TABLE */}
      {subTab === 'properties' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {filteredProperties.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Nenhum imóvel encontrado para o filtro informado.
              </p>
              <button
                type="button"
                onClick={() => openCreateProperty()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Cadastrar Primeiro Imóvel
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Imóvel & Endereço</th>
                    <th className="py-3 px-3 font-semibold">Cliente / Solicitante</th>
                    <th className="py-3 px-3 font-semibold">Matrícula RGI</th>
                    <th className="py-3 px-3 font-semibold">Tipologia & Padrão</th>
                    <th className="py-3 px-3 text-right font-semibold">Área Privativa</th>
                    <th className="py-3 px-4 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 tabular-nums">
                  {filteredProperties.map((prop) => {
                    const owner = clientMap.get(prop.clientId);
                    const isActive = prop.matricula === activeMatricula;
                    return (
                      <tr key={prop.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{prop.title}</span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Em avaliação
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {prop.street} · {prop.neighborhood}, {prop.cityState}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-200 font-medium">
                            {owner?.name ?? 'Cliente não vinculado'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {owner?.document ?? '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div className="text-amber-400 font-semibold">{prop.matricula || '—'}</div>
                          <div className="text-[11px] text-slate-400 font-sans truncate max-w-[160px]">
                            {prop.cartorio || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-white">{PROPERTY_TYPE_LABELS[prop.type]}</div>
                          <div className="text-[11px] text-slate-400">
                            {STANDARD_LABELS[prop.standard]} · {PURPOSE_LABELS[prop.purpose]}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {prop.privateArea} m²
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectPropertyForEvaluation(prop, owner)}
                              className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] whitespace-nowrap cursor-pointer"
                            >
                              Avaliar / PTAM
                            </button>
                            <button
                              type="button"
                              aria-label={`Editar ${prop.title}`}
                              onClick={() => openEditProperty(prop)}
                              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Excluir ${prop.title}`}
                              onClick={() => handleDeleteProperty(prop.id)}
                              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CLIENT MODAL */}
      {clientModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                {editingClientId ? 'Editar Cadastro de Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <button
                type="button"
                aria-label="Fechar modal de cliente"
                onClick={() => setClientModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Nome Completo / Razão Social *</label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  placeholder="Ex: Dr. Paulo Henrique Siqueira"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tipo de Pessoa</label>
                <select
                  value={clientForm.personType}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, personType: e.target.value as PersonType })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="PF">Pessoa Física (CPF)</option>
                  <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">CPF / CNPJ *</label>
                <input
                  type="text"
                  value={clientForm.document}
                  onChange={(e) => setClientForm({ ...clientForm, document: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="cliente@dominio.com.br"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Cidade / UF</label>
                <input
                  type="text"
                  value={clientForm.cityState}
                  onChange={(e) => setClientForm({ ...clientForm, cityState: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Observações Comerciais</label>
                <textarea
                  rows={2}
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  placeholder="Preferências, histórico de perícias ou dados de procuração..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setClientModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveClient}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                {editingClientId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROPERTY MODAL */}
      {propertyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                {editingPropertyId ? 'Editar Imóvel Cadastrado' : 'Cadastrar Novo Imóvel'}
              </h2>
              <button
                type="button"
                aria-label="Fechar modal de imóvel"
                onClick={() => setPropertyModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Identificação do Imóvel *</label>
                <input
                  type="text"
                  value={propertyForm.title}
                  onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                  placeholder="Ex: Apto 142 · Ed. Pedroso Alvarenga"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Cliente / Solicitante *</label>
                <select
                  value={propertyForm.clientId}
                  onChange={(e) => setPropertyForm({ ...propertyForm, clientId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center justify-between text-slate-400 mb-1">
                  <span>CEP (ViaCEP)</span>
                  {cepLoading && <span className="text-amber-400 font-mono">Buscando...</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={propertyForm.zip}
                    onChange={(e) => setPropertyForm({ ...propertyForm, zip: e.target.value })}
                    onBlur={handlePropertyCepLookup}
                    placeholder="04538-133"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    aria-label="Buscar CEP"
                    onClick={handlePropertyCepLookup}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Logradouro / Unidade *</label>
                <input
                  type="text"
                  value={propertyForm.street}
                  onChange={(e) => setPropertyForm({ ...propertyForm, street: e.target.value })}
                  placeholder="Rua, número, bloco/apartamento"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bairro</label>
                <input
                  type="text"
                  value={propertyForm.neighborhood}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, neighborhood: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Cidade / UF</label>
                <input
                  type="text"
                  value={propertyForm.cityState}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, cityState: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nº Matrícula (RGI)</label>
                <input
                  type="text"
                  value={propertyForm.matricula}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, matricula: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Cartório de Registro</label>
                <input
                  type="text"
                  value={propertyForm.cartorio}
                  onChange={(e) => setPropertyForm({ ...propertyForm, cartorio: e.target.value })}
                  placeholder="Ex: 4º Oficial de Registro de Imóveis de SP"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Finalidade</label>
                <select
                  value={propertyForm.purpose}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      purpose: e.target.value as EvaluationPurpose,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="VENDA">Compra e Venda</option>
                  <option value="LOCACAO">Fixação de Aluguel</option>
                  <option value="AMBOS">Venda e Locação</option>
                  <option value="GARANTIA">Garantia Bancária</option>
                  <option value="JUDICIAL">Perícia Judicial</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tipologia</label>
                <select
                  value={propertyForm.type}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, type: e.target.value as PropertyType })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="APARTAMENTO">Apartamento Padrão</option>
                  <option value="CASA_CONDOMINIO">Casa em Condomínio</option>
                  <option value="SALA_COMERCIAL">Conjunto Comercial</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Padrão Construtivo (CUB)</label>
                <select
                  value={propertyForm.standard}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      standard: e.target.value as ConstructionStandard,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="PROFIT_BAIXO">Econômico / Popular</option>
                  <option value="NORMAL_MEDIO">Normal Médio</option>
                  <option value="ALTO">Alto Padrão</option>
                  <option value="LUXO">Luxo / Triple A</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Conservação (Heidecke)</label>
                <select
                  value={propertyForm.rossHeidecke}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      rossHeidecke: e.target.value as RossState,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {(Object.keys(ROSS_STATE_LABELS) as RossState[]).map((key) => (
                    <option key={key} value={key}>
                      {ROSS_STATE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Área Privativa (m²)</label>
                <input
                  type="number"
                  min={1}
                  value={propertyForm.privateArea}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      privateArea: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Área Total (m²)</label>
                <input
                  type="number"
                  min={1}
                  value={propertyForm.totalArea}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      totalArea: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Idade Aparente (Anos)</label>
                <input
                  type="number"
                  min={0}
                  value={propertyForm.ageYears}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, ageYears: Number(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-400 mb-1">Descrição Sumária do Imóvel</label>
                <textarea
                  rows={2}
                  value={propertyForm.summaryDescription}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, summaryDescription: e.target.value })
                  }
                  placeholder="Características construtivas, acabamentos, vagas, infraestrutura..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPropertyModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProperty}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                {editingPropertyId ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
