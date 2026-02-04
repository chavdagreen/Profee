
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

  // New Hearing State
  const [newHearing, setNewHearing] = useState<Partial<Hearing>>({
    forum: 'AO', assessmentYear: '2024-25', status: 'Upcoming', 
    hearingDate: new Date().toISOString().split('T')[0]
  });

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
      clientName: selectedClient.name
    };
    setHearings(prev => [...prev, hearingToAdd]);
    setShowAddHearingModal(false);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* LEFT: MASTER LIST SIDEBAR */}
      <div className="w-80 flex flex-col clay-card bg-white dark:bg-slate-800 border-none shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-50 dark:border-slate-700 space-y-3 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-800 dark:text-white tracking-tight text-sm">Client Directory</h3>
            <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{filteredClients.length}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Name or PAN..." 
              className="clay-input w-full pl-9 pr-3 py-2 text-xs font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="clay-input w-full p-2 text-[10px] font-black tracking-wide text-slate-500"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="All">All Groups</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredClients.map(client => (
            <button
              key={client.id}
              onClick={() => { setSelectedClientId(client.id); setProfileTab('details'); }}
              className={`w-full p-4 text-left transition-all border-b border-slate-50 dark:border-slate-700/50 flex items-center gap-3 group ${selectedClientId === client.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${selectedClientId === client.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                {client.name.charAt(0)}
              </div>
              <div className="truncate flex-1">
                <p className={`font-bold text-xs truncate ${selectedClientId === client.id ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{client.name}</p>
                <p className={`text-[9px] font-bold truncate opacity-60 tracking-wide ${selectedClientId === client.id ? 'text-indigo-100' : 'text-slate-400'}`}>{client.pan}</p>
              </div>
              <ChevronRight size={14} className={`shrink-0 transition-transform ${selectedClientId === client.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
            </button>
          ))}
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full p-4 text-center text-indigo-600 font-black text-[10px] tracking-wide bg-indigo-50/50 hover:bg-indigo-100 transition-colors sticky bottom-0 border-t"
          >
            + New Client
          </button>
        </div>
      </div>

      {/* RIGHT: DETAIL VIEW AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {selectedClient ? (
          <div className="space-y-6">
            <div className="clay-card p-8 border-none bg-white dark:bg-slate-800 shadow-xl flex items-center gap-8 sticky top-0 z-10">
               <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-indigo-200">{selectedClient.name.charAt(0)}</div>
               <div className="flex-1">
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{selectedClient.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-black tracking-wide text-slate-400 flex items-center gap-1"><Building size={12}/> {selectedClient.group}</span>
                    <span className="text-[10px] font-black tracking-wide text-slate-400 flex items-center gap-1"><Tag size={12}/> {selectedClient.pan}</span>
                    <span className="text-[10px] font-black tracking-wide bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg">{selectedClient.entityType}</span>
                  </div>
               </div>
               <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-2xl">
                  {['details', 'financials', 'proceedings'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setProfileTab(tab as any)} 
                      className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-wide transition-all ${profileTab === tab ? 'bg-white dark:bg-slate-600 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>
            </div>

            {profileTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2">
                <div className="clay-card p-8 bg-white dark:bg-slate-800 border-none space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-500 tracking-wide border-b pb-2">Identification & Portal</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl group">
                       <ShieldCheck className="text-emerald-500" size={20} />
                       <div className="flex-1">
                          <p className="text-[9px] font-bold text-slate-400">IT Portal Password (Encrypted)</p>
                          <p className="font-bold font-mono tracking-tighter text-slate-800 dark:text-slate-200">
                            {isPasswordVisible ? (selectedClient.portalPassword || 'N/A') : '••••••••••••'}
                          </p>
                       </div>
                       <button onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="text-slate-300 hover:text-indigo-600"><Eye size={18}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                          <p className="text-[9px] font-bold text-slate-400">GSTIN</p>
                          <p className="font-bold text-xs">{selectedClient.gstin || 'Unregistered'}</p>
                       </div>
                       <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                          <p className="text-[9px] font-bold text-slate-400">Email ID</p>
                          <p className="font-bold text-xs truncate">{selectedClient.email || 'None'}</p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="clay-card p-8 bg-white dark:bg-slate-800 border-none space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-500 tracking-wide border-b pb-2">Communication</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <Phone className="text-slate-300" size={18} />
                       <div><p className="text-[10px] font-bold text-slate-400">Mobile</p><p className="font-bold">{selectedClient.contact}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                       <MapPin className="text-slate-300" size={18} />
                       <div><p className="text-[10px] font-bold text-slate-400">Address</p><p className="font-bold text-sm leading-tight text-slate-600">{selectedClient.address || 'Not Provided'}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {profileTab === 'financials' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2">
                 <div className="grid grid-cols-3 gap-6">
                    <div className="clay-card p-6 bg-emerald-500 text-white border-none flex items-center justify-between">
                       <div><p className="text-[9px] font-black tracking-wide opacity-80">Paid Amount</p><h3 className="text-3xl font-black">₹{clientReceipts.reduce((s, r) => s + r.amount, 0).toLocaleString()}</h3></div>
                       <TrendingUp size={32} className="opacity-30" />
                    </div>
                    <div className="clay-card p-6 bg-amber-500 text-white border-none flex items-center justify-between">
                       <div><p className="text-[9px] font-black tracking-wide opacity-80">Receivable</p><h3 className="text-3xl font-black">₹{ledgerData.length > 0 ? ledgerData[ledgerData.length-1].balance.toLocaleString() : 0}</h3></div>
                       <AlertCircle size={32} className="opacity-30" />
                    </div>
                    <div className="clay-card p-4 bg-white dark:bg-slate-800 border-none flex flex-col gap-2">
                       <button 
                        onClick={() => onQuickBill({ clientId: selectedClient.id, clientName: selectedClient.name })}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] tracking-wide hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                       >
                         <ReceiptIndianRupee size={16}/> Create Invoice
                       </button>
                       <button 
                        onClick={() => setActiveView('billing')}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] tracking-wide hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                       >
                         <Wallet size={16}/> Record Receipt
                       </button>
                    </div>
                 </div>

                 <div className="clay-card p-8 border-none bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                       <h4 className="font-black text-slate-800 dark:text-white tracking-wide">Ledger Statement</h4>
                       <div className="flex gap-2">
                         <button className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600"><Printer size={16}/></button>
                         <button className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600"><FileDown size={16}/></button>
                       </div>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left text-sm font-bold">
                          <thead className="bg-slate-50 dark:bg-slate-900/50 text-[9px] font-bold uppercase text-slate-400 tracking-wide border-b">
                             <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Particulars</th>
                                <th className="px-6 py-4 text-right">Debit</th>
                                <th className="px-6 py-4 text-right">Credit</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                             {ledgerData.map(e => (
                               <tr key={e.id} className="hover:bg-slate-50/50">
                                  <td className="px-6 py-4 text-slate-400 text-xs">{e.date}</td>
                                  <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{e.particulars}</td>
                                  <td className="px-6 py-4 text-right text-rose-500">{e.debit > 0 ? e.debit.toLocaleString() : '-'}</td>
                                  <td className="px-6 py-4 text-right text-emerald-600">{e.credit > 0 ? e.credit.toLocaleString() : '-'}</td>
                                  <td className="px-6 py-4 text-right font-black">₹{e.balance.toLocaleString()}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
            )}

            {profileTab === 'proceedings' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2">
                 <div className="flex justify-between items-center">
                    <h4 className="font-black text-slate-800 dark:text-white tracking-wide">Case Directory</h4>
                    <button onClick={() => setShowAddHearingModal(true)} className="clay-button px-6 py-2 flex items-center gap-2 font-black text-[10px]">
                      <Plus size={14}/> Register New Matter
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clientHearings.map(h => (
                      <div key={h.id} className="clay-card p-6 border-none bg-white dark:bg-slate-800 hover:scale-[1.02] transition-all group">
                         <div className="flex justify-between items-start mb-4">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase">{h.forum}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${h.status === 'Upcoming' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{h.status}</span>
                         </div>
                         <h5 className="font-black text-lg text-slate-800 dark:text-white tracking-tight leading-tight">{h.caseType}</h5>
                         <p className="text-[10px] font-bold text-slate-400 tracking-wide mt-1 mb-4">AY {h.assessmentYear}</p>
                         <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-2 text-slate-500"><Calendar size={14}/><span className="text-[10px] font-black">{h.hearingDate}</span></div>
                            <button className="text-indigo-600 font-bold text-[10px] flex items-center gap-1 group-hover:translate-x-1 transition-transform">View Details <ChevronRight size={12}/></button>
                         </div>
                      </div>
                    ))}
                    {clientHearings.length === 0 && (
                      <div className="col-span-full p-20 flex flex-col items-center justify-center opacity-20">
                         <Gavel size={64} className="mb-4" />
                         <p className="font-black tracking-wide text-sm">No Active Proceedings</p>
                      </div>
                    )}
                 </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
             <Users size={64} className="mb-4 opacity-10" />
             <p className="font-black tracking-wide">Select a client to view profile</p>
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
           <div className="clay-card p-10 bg-white dark:bg-slate-800 w-full max-w-xl border-none shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">New Matter: {selectedClient?.name}</h3>
                 <button onClick={() => setShowAddHearingModal(false)} className="p-2 text-slate-400 hover:text-rose-500"><X /></button>
              </div>
              <form onSubmit={handleAddHearing} className="grid grid-cols-2 gap-6">
                 <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Case/Notice Description</label>
                    <input required placeholder="E.g. 148 Reassessment Notice" className="clay-input w-full p-3 font-bold" onChange={e => setNewHearing({...newHearing, caseType: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Assessment Year</label>
                    <input required placeholder="2021-22" className="clay-input w-full p-3 font-bold" onChange={e => setNewHearing({...newHearing, assessmentYear: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Forum</label>
                    <select className="clay-input w-full p-3 font-bold" onChange={e => setNewHearing({...newHearing, forum: e.target.value})}>
                       <option value="AO">AO</option><option value="CIT(A)">CIT (Appeals)</option><option value="ITAT">ITAT</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Date of Compliance</label>
                    <input type="date" className="clay-input w-full p-3 font-bold" value={newHearing.hearingDate} onChange={e => setNewHearing({...newHearing, hearingDate: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Fee Quote (₹)</label>
                    <input type="number" className="clay-input w-full p-3 font-bold" onChange={e => setNewHearing({...newHearing, quotedFees: Number(e.target.value)})} />
                 </div>
                 <button type="submit" className="col-span-2 clay-button py-4 mt-4 font-black flex items-center justify-center gap-2"><Plus size={18}/> Add Matter to Ledger</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClientsView;
