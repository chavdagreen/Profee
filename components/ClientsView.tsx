
import React, { useState, useMemo, useEffect } from 'react';
import { Client, Hearing, View, Invoice, Receipt, LedgerEntry } from '../types';
import { 
  Search, Plus, ChevronLeft, History, Gavel, Tag, CreditCard, 
  ChevronRight, Printer, FileDown, Eye, X, UserPlus, FolderPlus,
  TrendingUp, AlertCircle, Sparkles, LayoutGrid, List, ArrowUpDown,
  Lock, Mail, Phone, MapPin, Building, Calendar, Wallet, ReceiptIndianRupee,
  Filter, ShieldCheck, MoreVertical, Users
} from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  hearings: Hearing[];
  setHearings: React.Dispatch<React.SetStateAction<Hearing[]>>;
  groups: string[];
  setGroups: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveView: (view: View) => void;
  invoices: Invoice[];
  receipts: Receipt[];
  onQuickBill: (prefill: Partial<Invoice>) => void;
  initialClientId?: string | null;
  initialTab?: 'details' | 'financials' | 'proceedings';
  clearNavigation?: () => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ 
  clients, setClients, hearings, setHearings, groups, setGroups, setActiveView, 
  invoices, receipts, onQuickBill, initialClientId, initialTab, clearNavigation 
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);
  const [profileTab, setProfileTab] = useState<'details' | 'financials' | 'proceedings'>('details');

  // Handle deep-linking from Dashboard
  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
      if (initialTab) {
        setProfileTab(initialTab);
      }
      // Optional: Clear the navigation state in App.tsx after consuming it
      if (clearNavigation) clearNavigation();
    }
  }, [initialClientId, initialTab]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddHearingModal, setShowAddHearingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Profile Form State
  const [newClient, setNewClient] = useState<Partial<Client>>({ entityType: 'Individual', group: 'Individual' });
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const HEARING_DEFAULTS: Partial<Hearing> = {
    forum: 'AO',
    assessmentYear: '2024-25',
    status: 'Upcoming',
    hearingDate: new Date().toISOString().split('T')[0],
    time: '10:00',
  };

  const AY_OPTIONS = ['2025-26', '2024-25', '2023-24', '2022-23', '2021-22', '2020-21'];
  const CASE_TYPES: Record<string, string[]> = {
    AO: ['Section 143(3) Scrutiny', 'Section 148 Reassessment', 'Section 133(6) Notice', 'Section 263 Revision', 'Section 271 Penalty', 'TDS Default', 'Other'],
    'CIT(A)': ['Appeal against AO Order', 'Penalty Appeal', 'Reassessment Appeal', 'Other'],
    ITAT: ['Second Appeal', 'Miscellaneous Application', 'Stay Application', 'Other'],
  };

  // New Hearing State
  const [newHearing, setNewHearing] = useState<Partial<Hearing>>(HEARING_DEFAULTS);

  // Master List Filtering
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.pan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = groupFilter === 'All' || c.group === groupFilter;
      return matchesSearch && matchesGroup;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm, groupFilter]);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);
  const clientHearings = useMemo(() => hearings.filter(h => h.clientId === selectedClientId), [hearings, selectedClientId]);
  const clientInvoices = useMemo(() => invoices.filter(inv => inv.clientId === selectedClientId), [invoices, selectedClientId]);
  const clientReceipts = useMemo(() => receipts.filter(r => r.clientId === selectedClientId), [receipts, selectedClientId]);

  const ledgerData = useMemo(() => {
    if (!selectedClientId) return [];
    let entries: LedgerEntry[] = [];
    clientInvoices.forEach(inv => entries.push({ id: inv.id, date: inv.date, particulars: `Invoice ${inv.invoiceNumber}`, type: 'Invoice', debit: inv.total, credit: 0, balance: 0 }));
    clientReceipts.forEach(r => entries.push({ id: r.id, date: r.date, particulars: `Receipt ${r.receiptNumber}`, type: 'Receipt', debit: 0, credit: r.amount, balance: 0 }));
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let balance = 0;
    return entries.map(e => { balance += (e.debit - e.credit); return { ...e, balance }; });
  }, [selectedClientId, clientInvoices, clientReceipts]);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const finalGroup = isAddingGroup ? newGroupName : newClient.group || 'Individual';
    if (isAddingGroup && newGroupName) setGroups(prev => [...prev, newGroupName]);
    
    const clientToAdd: Client = {
      ...newClient as Client,
      id: `c${Date.now()}`,
      group: finalGroup
    };
    setClients(prev => [clientToAdd, ...prev]);
    setSelectedClientId(clientToAdd.id);
    setShowAddModal(false);
    setNewClient({ entityType: 'Individual', group: 'Individual' });
    setNewGroupName('');
  };

  const handleAddHearing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const hearingToAdd: Hearing = {
      ...newHearing as Hearing,
      id: `h${Date.now()}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      time: newHearing.time || '10:00',
    };
    setHearings(prev => [...prev, hearingToAdd]);
    setShowAddHearingModal(false);
    // Reset form for next use
    setNewHearing({ ...HEARING_DEFAULTS, hearingDate: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="flex h-[calc(100vh-112px)] gap-5 animate-in fade-in duration-500 overflow-hidden">
      {/* LEFT: CLIENT DIRECTORY */}
      <div className="w-72 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shrink-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Client Directory</h3>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full tabular-nums">{filteredClients.length}</span>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input
              type="text"
              placeholder="Name or PAN..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/40 transition font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/40 transition text-slate-500 dark:text-slate-400 font-medium"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="All">All Groups</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredClients.map(client => (
            <button
              key={client.id}
              onClick={() => { setSelectedClientId(client.id); setProfileTab('details'); }}
              className={`w-full px-4 py-3 text-left transition-all flex items-center gap-3 group border-b border-slate-50 dark:border-slate-700/40 ${
                selectedClientId === client.id
                  ? 'bg-indigo-600 border-b-indigo-600'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                selectedClientId === client.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
              }`}>
                {client.name.charAt(0)}
              </div>
              <div className="truncate flex-1 min-w-0">
                <p className={`font-semibold text-xs truncate ${selectedClientId === client.id ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{client.name}</p>
                <p className={`text-[10px] truncate font-medium ${selectedClientId === client.id ? 'text-indigo-200' : 'text-slate-400'}`}>{client.pan}</p>
              </div>
              <ChevronRight size={12} className={`shrink-0 transition-all ${selectedClientId === client.id ? 'text-white/60 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
            </button>
          ))}
        </div>

        {/* Add Client Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-t border-slate-100 dark:border-slate-700 shrink-0"
        >
          <Plus size={13} /> New Client
        </button>
      </div>

      {/* RIGHT: PROFILE DETAIL */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-w-0">
        {selectedClient ? (
          <div className="space-y-5">
            {/* Profile Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 flex items-center gap-6 sticky top-0 z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-200/50 shrink-0">{selectedClient.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">{selectedClient.name}</h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Building size={10}/> {selectedClient.group}</span>
                  <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Tag size={10}/> {selectedClient.pan}</span>
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100">{selectedClient.entityType}</span>
                </div>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-700/70 p-1 rounded-xl gap-0.5 shrink-0">
                {(['details', 'financials', 'proceedings'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setProfileTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                      profileTab === tab
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* DETAILS TAB */}
            {profileTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-4">
                  <p className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase">Identification & Portal</p>
                  <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-slate-400 mb-0.5">IT Portal Password (Encrypted)</p>
                      <p className="font-semibold font-mono text-sm tracking-widest text-slate-700 dark:text-slate-200">
                        {isPasswordVisible ? (selectedClient.portalPassword || 'N/A') : '••••••••••••'}
                      </p>
                    </div>
                    <button onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="text-slate-300 hover:text-indigo-500 transition-colors shrink-0"><Eye size={16}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <p className="text-[10px] font-medium text-slate-400 mb-1">GSTIN</p>
                      <p className="font-semibold text-xs text-slate-700 dark:text-slate-200">{selectedClient.gstin || 'Unregistered'}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <p className="text-[10px] font-medium text-slate-400 mb-1">Email ID</p>
                      <p className="font-semibold text-xs truncate text-slate-700 dark:text-slate-200">{selectedClient.email || 'None'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-4">
                  <p className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase">Communication</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <Phone className="text-slate-300 shrink-0" size={16} />
                      <div>
                        <p className="text-[10px] font-medium text-slate-400 mb-0.5">Mobile</p>
                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{selectedClient.contact || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <MapPin className="text-slate-300 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-[10px] font-medium text-slate-400 mb-0.5">Address</p>
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedClient.address || 'Not Provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FINANCIALS TAB */}
            {profileTab === 'financials' && (
              <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-500 rounded-2xl p-5 text-white flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium opacity-75 mb-1">Paid Amount</p>
                      <h3 className="text-2xl font-bold">₹{clientReceipts.reduce((s, r) => s + r.amount, 0).toLocaleString()}</h3>
                    </div>
                    <TrendingUp size={28} className="opacity-25" />
                  </div>
                  <div className="bg-amber-500 rounded-2xl p-5 text-white flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium opacity-75 mb-1">Receivable</p>
                      <h3 className="text-2xl font-bold">₹{ledgerData.length > 0 ? ledgerData[ledgerData.length-1].balance.toLocaleString() : 0}</h3>
                    </div>
                    <AlertCircle size={28} className="opacity-25" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex flex-col gap-2">
                    <button
                      onClick={() => onQuickBill({ clientId: selectedClient.id, clientName: selectedClient.name })}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 rounded-xl font-semibold text-xs hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <ReceiptIndianRupee size={14}/> Create Invoice
                    </button>
                    <button
                      onClick={() => setActiveView('billing')}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 rounded-xl font-semibold text-xs hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <Wallet size={14}/> Record Receipt
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-700 dark:text-white text-sm">Ledger Statement</h4>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Printer size={15}/></button>
                      <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><FileDown size={15}/></button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/40 text-[10px] font-semibold uppercase text-slate-400 tracking-wide">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Particulars</th>
                          <th className="px-6 py-3 text-right">Debit</th>
                          <th className="px-6 py-3 text-right">Credit</th>
                          <th className="px-6 py-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {ledgerData.map(e => (
                          <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="px-6 py-3.5 text-slate-400 text-xs font-medium">{e.date}</td>
                            <td className="px-6 py-3.5 text-slate-700 dark:text-slate-200 font-medium text-xs">{e.particulars}</td>
                            <td className="px-6 py-3.5 text-right text-rose-500 font-semibold text-xs">{e.debit > 0 ? `₹${e.debit.toLocaleString()}` : '—'}</td>
                            <td className="px-6 py-3.5 text-right text-emerald-600 font-semibold text-xs">{e.credit > 0 ? `₹${e.credit.toLocaleString()}` : '—'}</td>
                            <td className="px-6 py-3.5 text-right font-bold text-slate-700 dark:text-white text-xs">₹{e.balance.toLocaleString()}</td>
                          </tr>
                        ))}
                        {ledgerData.length === 0 && (
                          <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-300 text-xs font-medium">No transactions yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PROCEEDINGS TAB */}
            {profileTab === 'proceedings' && (
              <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-700 dark:text-white text-sm">Case Directory</h4>
                  <button onClick={() => setShowAddHearingModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200/50">
                    <Plus size={13}/> Register Matter
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientHearings.map(h => (
                    <div key={h.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-semibold">{h.forum}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${h.status === 'Upcoming' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{h.status}</span>
                      </div>
                      <h5 className="font-bold text-slate-800 dark:text-white text-sm leading-snug mb-1">{h.caseType}</h5>
                      <p className="text-[10px] font-medium text-slate-400 mb-4">AY {h.assessmentYear}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium"><Calendar size={12}/>{h.hearingDate}</div>
                        <button className="text-indigo-600 text-[10px] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">Details <ChevronRight size={11}/></button>
                      </div>
                    </div>
                  ))}
                  {clientHearings.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-20">
                      <Gavel size={48} className="mb-3" />
                      <p className="font-semibold text-sm">No Active Proceedings</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <Users size={48} className="mb-3 opacity-20" />
            <p className="font-medium text-sm text-slate-400">Select a client to view profile</p>
          </div>
        )}
      </div>

      {/* MODAL: New Client */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card p-10 bg-white dark:bg-slate-800 w-full max-w-2xl border-none shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3"><UserPlus className="text-indigo-600"/> Create Professional Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-rose-500"><X /></button>
            </div>
            <form onSubmit={handleAddClient} className="grid grid-cols-2 gap-6">
               <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Full Legal Name</label>
                  <input required className="clay-input w-full p-3 font-bold" onChange={e => setNewClient({...newClient, name: e.target.value})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">PAN Number</label>
                  <input required placeholder="ABCDE1234F" className="clay-input w-full p-3 font-bold uppercase" maxLength={10} onChange={e => setNewClient({...newClient, pan: e.target.value.toUpperCase()})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Entity Type</label>
                  <select className="clay-input w-full p-3 font-bold" onChange={e => setNewClient({...newClient, entityType: e.target.value as any})}>
                    <option value="Individual">Individual</option><option value="Company">Company</option><option value="Firm">Partnership Firm</option><option value="HUF">HUF</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Mobile Contact</label>
                  <input required className="clay-input w-full p-3 font-bold" onChange={e => setNewClient({...newClient, contact: e.target.value})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Portal Password</label>
                  <input type="password" placeholder="••••••••" className="clay-input w-full p-3 font-bold" onChange={e => setNewClient({...newClient, portalPassword: e.target.value})} />
               </div>
               <div className="col-span-2 space-y-1">
                  <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-400">Group Assignment</label><button type="button" onClick={() => setIsAddingGroup(!isAddingGroup)} className="text-[8px] font-bold text-indigo-600 underline">+ Create Group</button></div>
                  {isAddingGroup ? <input required placeholder="New group name..." className="clay-input w-full p-3 font-bold" onChange={e => setNewGroupName(e.target.value)} /> : <select className="clay-input w-full p-3 font-bold" onChange={e => setNewClient({...newClient, group: e.target.value})}>{groups.map(g => <option key={g} value={g}>{g}</option>)}</select>}
               </div>
               <button type="submit" className="col-span-2 clay-button py-4 mt-4 font-black text-lg flex items-center justify-center gap-2 shadow-indigo-100"><Sparkles size={20}/> Encrypt & Save Profile</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register New Hearing */}
      {showAddHearingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">New Matter — {selectedClient?.name}</h3>
              <button onClick={() => setShowAddHearingModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"><X /></button>
            </div>
            <form onSubmit={handleAddHearing} className="overflow-y-auto p-8 grid grid-cols-2 gap-5">
              {/* Forum */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Forum *</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  value={newHearing.forum || 'AO'}
                  onChange={e => setNewHearing(h => ({ ...h, forum: e.target.value, caseType: undefined }))}
                >
                  <option value="AO">AO (Assessing Officer)</option>
                  <option value="CIT(A)">CIT (Appeals)</option>
                  <option value="ITAT">ITAT (Tribunal)</option>
                </select>
              </div>
              {/* Assessment Year */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assessment Year *</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  value={newHearing.assessmentYear || '2024-25'}
                  onChange={e => setNewHearing(h => ({ ...h, assessmentYear: e.target.value }))}
                >
                  {AY_OPTIONS.map(ay => <option key={ay} value={ay}>{ay}</option>)}
                </select>
              </div>
              {/* Case / Matter Type */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Case / Matter Type *</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  value={newHearing.caseType || ''}
                  onChange={e => setNewHearing(h => ({ ...h, caseType: e.target.value }))}
                >
                  <option value="">Select case type…</option>
                  {(CASE_TYPES[newHearing.forum || 'AO'] || []).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
              {/* Hearing Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hearing Date *</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  value={newHearing.hearingDate || ''}
                  onChange={e => setNewHearing(h => ({ ...h, hearingDate: e.target.value }))}
                />
              </div>
              {/* Time */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hearing Time</label>
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  value={newHearing.time || '10:00'}
                  onChange={e => setNewHearing(h => ({ ...h, time: e.target.value }))}
                />
              </div>
              {/* Notice Issue Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Notice Issue Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  value={newHearing.issueDate || ''}
                  onChange={e => setNewHearing(h => ({ ...h, issueDate: e.target.value }))}
                />
              </div>
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  value={newHearing.status || 'Upcoming'}
                  onChange={e => setNewHearing(h => ({ ...h, status: e.target.value as Hearing['status'] }))}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Adjourned">Adjourned</option>
                  <option value="Concluded">Concluded</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              {/* Professional Fee */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Professional Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  value={newHearing.quotedFees || ''}
                  onChange={e => setNewHearing(h => ({ ...h, quotedFees: Number(e.target.value) }))}
                />
              </div>
              {/* Notes */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes about this matter…"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 resize-none"
                  value={newHearing.description || ''}
                  onChange={e => setNewHearing(h => ({ ...h, description: e.target.value }))}
                />
              </div>
              {/* Submit */}
              <button type="submit" className="col-span-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> Add Matter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsView;
