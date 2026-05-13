
import React, { useState, useMemo } from 'react';
import { Hearing, Client } from '../types';
import {
  Building2, Scale, Gavel, ChevronRight, Plus,
  ReceiptIndianRupee, Info, Calendar, X, CheckCircle2,
} from 'lucide-react';

interface ProceedingsViewProps {
  hearings: Hearing[];
  clients: Client[];
  setHearings: React.Dispatch<React.SetStateAction<Hearing[]>>;
  onBillMatter: (hearing: Hearing) => void;
  isCalendarConnected?: boolean;
}

const FORUMS = ['AO', 'CIT(A)', 'ITAT'] as const;
const AY_OPTIONS = ['2024-25', '2025-26', '2026-27', '2023-24', '2022-23', '2021-22', '2020-21'];

const CASE_TYPES: Record<string, string[]> = {
  AO: ['Section 143(3) Scrutiny', 'Section 148 Reassessment', 'Section 133(6) Notice', 'Section 263 Revision', 'Section 271 Penalty', 'TDS Default', 'Other'],
  'CIT(A)': ['Appeal against AO Order', 'Penalty Appeal', 'Reassessment Appeal', 'Other'],
  ITAT: ['Second Appeal', 'Miscellaneous Application', 'Stay Application', 'Other'],
};

const forumMeta: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  AO:      { icon: Building2, color: 'bg-blue-600',   label: 'AO (Assessing Officer)' },
  'CIT(A)': { icon: Scale,     color: 'bg-indigo-600', label: 'CIT (Appeals)' },
  ITAT:    { icon: Gavel,     color: 'bg-purple-600', label: 'ITAT (Tribunal)' },
};

const ProceedingsView: React.FC<ProceedingsViewProps> = ({ hearings, clients, setHearings, onBillMatter, isCalendarConnected }) => {
  const [selectedForum, setSelectedForum] = useState<string>('AO');
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState<Partial<Hearing>>({
    forum: 'AO',
    status: 'Upcoming',
    assessmentYear: '2024-25',
    hearingDate: new Date().toISOString().split('T')[0],
    time: '10:00',
  });

  const filteredHearings = useMemo(
    () => hearings.filter(h => h.forum === selectedForum),
    [hearings, selectedForum]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.caseType || !form.hearingDate) return;

    const client = clients.find(c => c.id === form.clientId);
    if (!client) return;

    const newHearing: Hearing = {
      id: `h${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      caseType: form.caseType!,
      forum: form.forum!,
      status: form.status as Hearing['status'],
      assessmentYear: form.assessmentYear!,
      hearingDate: form.hearingDate!,
      time: form.time || '10:00',
      description: form.description,
      quotedFees: form.quotedFees,
      issueDate: form.issueDate,
    };

    setHearings(prev => [newHearing, ...prev]);
    setSelectedForum(newHearing.forum);
    setShowAddModal(false);
    setForm({
      forum: 'AO',
      status: 'Upcoming',
      assessmentYear: '2024-25',
      hearingDate: new Date().toISOString().split('T')[0],
      time: '10:00',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Proceedings Manager</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-2">
            Direct Departmental Representation
            {isCalendarConnected && (
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 size={11} /> Auto-syncing to Google Calendar
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-md shadow-indigo-200/50"
        >
          <Plus size={16} /> New Proceeding
        </button>
      </div>

      {/* Forum selector cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FORUMS.map(f => {
          const { icon: Icon, color, label } = forumMeta[f];
          const count = hearings.filter(h => h.forum === f && (h.status === 'Upcoming' || h.status === 'Adjourned')).length;
          return (
            <button
              key={f}
              onClick={() => setSelectedForum(f)}
              className={`clay-card p-6 border-none flex flex-col items-center gap-3 transition-all ${selectedForum === f ? `${color} text-white scale-105 shadow-xl` : 'bg-white dark:bg-slate-800 text-slate-500'}`}
            >
              <div className={`p-3 rounded-2xl ${selectedForum === f ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-700'}`}><Icon size={24} /></div>
              <div className="text-center">
                <h4 className="font-black text-sm tracking-tight">{label}</h4>
                <p className="text-[10px] font-bold opacity-70">{count} Active Cases</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Hearing list */}
      <div className="clay-card border-none bg-white dark:bg-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-50/30">
          <h3 className="text-xs font-black text-slate-400 tracking-wide flex items-center gap-2">
            <Info size={14} className="text-indigo-500" /> Active Matters at {selectedForum}
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filteredHearings.map(h => (
            <div key={h.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group cursor-pointer">
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">{h.clientName.charAt(0)}</div>
                <div className="truncate">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight truncate">{h.clientName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-bold text-slate-400">{h.caseType} • AY {h.assessmentYear}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${h.status === 'Upcoming' ? 'bg-amber-50 text-amber-600' : h.status === 'Adjourned' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{h.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center hidden sm:block">
                  <p className="text-[10px] font-bold text-slate-400">Next Hearing</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{h.hearingDate}</p>
                  {h.time && <p className="text-[9px] text-slate-400 font-medium">{h.time}</p>}
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400">Professional Fee</p>
                  <p className="font-black text-indigo-600">₹{(h.quotedFees || 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onBillMatter(h)} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Quick Bill"><ReceiptIndianRupee size={18} /></button>
                  <button className="p-3 bg-slate-100 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><ChevronRight size={18} /></button>
                </div>
              </div>
            </div>
          ))}
          {filteredHearings.length === 0 && (
            <div className="p-20 text-center">
              <Gavel size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 text-sm font-semibold">No proceedings at {selectedForum}</p>
              <button onClick={() => setShowAddModal(true)} className="mt-3 text-indigo-600 text-xs font-bold hover:underline">+ Add New Proceeding</button>
            </div>
          )}
        </div>
      </div>

      {/* ======= ADD PROCEEDING MODAL ======= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" /> New Proceeding
                </h3>
                {isCalendarConnected && (
                  <p className="text-[10px] text-emerald-500 font-semibold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Will auto-sync to Google Calendar on save
                  </p>
                )}
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar">
              <div className="p-8 grid grid-cols-2 gap-5">
                {/* Client */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client *</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    value={form.clientId || ''}
                    onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  >
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.pan}</option>)}
                  </select>
                </div>

                {/* Forum */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Forum *</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    value={form.forum || 'AO'}
                    onChange={e => setForm(f => ({ ...f, forum: e.target.value, caseType: undefined }))}
                  >
                    {FORUMS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Assessment Year */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assessment Year *</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    value={form.assessmentYear || '2024-25'}
                    onChange={e => setForm(f => ({ ...f, assessmentYear: e.target.value }))}
                  >
                    {AY_OPTIONS.map(ay => <option key={ay} value={ay}>{ay}</option>)}
                  </select>
                </div>

                {/* Case Type */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Case / Matter Type *</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    value={form.caseType || ''}
                    onChange={e => setForm(f => ({ ...f, caseType: e.target.value }))}
                  >
                    <option value="">Select case type…</option>
                    {(CASE_TYPES[form.forum || 'AO'] || []).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                  </select>
                </div>

                {/* Hearing Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hearing Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    value={form.hearingDate || ''}
                    onChange={e => setForm(f => ({ ...f, hearingDate: e.target.value }))}
                  />
                </div>

                {/* Time */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hearing Time</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    value={form.time || '10:00'}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>

                {/* Notice Issue Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Notice Issue Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    value={form.issueDate || ''}
                    onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    value={form.status || 'Upcoming'}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Hearing['status'] }))}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Adjourned">Adjourned</option>
                    <option value="Concluded">Concluded</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Quoted Fees */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Professional Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    value={form.quotedFees || ''}
                    onChange={e => setForm(f => ({ ...f, quotedFees: Number(e.target.value) }))}
                  />
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Notes / Description</label>
                  <textarea
                    rows={3}
                    placeholder="Any relevant details about this matter…"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 resize-none"
                    value={form.description || ''}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-md shadow-indigo-200/50">
                  <Calendar size={15} /> Save Proceeding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProceedingsView;
