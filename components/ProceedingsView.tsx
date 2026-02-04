
import React, { useState, useMemo } from 'react';
import { Hearing, Client } from '../types';
import { 
  Building2, Scale, Gavel, ChevronRight, Plus, 
  ChevronLeft, ReceiptIndianRupee, Tag, Info, Calendar, Sparkles
} from 'lucide-react';

interface ProceedingsViewProps {
  hearings: Hearing[];
  clients: Client[];
  setHearings: React.Dispatch<React.SetStateAction<Hearing[]>>;
  onBillMatter: (hearing: Hearing) => void;
}

const ProceedingsView: React.FC<ProceedingsViewProps> = ({ hearings, clients, setHearings, onBillMatter }) => {
  const [subView, setSubView] = useState<'list' | 'add'>('list');
  const [selectedForum, setSelectedForum] = useState<string>('AO');

  const filteredHearings = useMemo(() => hearings.filter(h => h.forum === selectedForum), [hearings, selectedForum]);

  const ForumCard = ({ title, icon: Icon, count, forumKey, color }: any) => (
    <button 
      onClick={() => setSelectedForum(forumKey)}
      className={`clay-card p-6 border-none flex flex-col items-center gap-3 transition-all ${selectedForum === forumKey ? `${color} text-white scale-105 shadow-xl` : 'bg-white dark:bg-slate-800 text-slate-500'}`}
    >
      <div className={`p-3 rounded-2xl ${selectedForum === forumKey ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-700'}`}><Icon size={24} /></div>
      <div className="text-center"><h4 className="font-black text-sm uppercase tracking-tighter">{title}</h4><p className="text-[10px] font-bold opacity-70">{count} Active Cases</p></div>
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Proceedings Manager</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Departmental Representation</p>
        </div>
        <button onClick={() => setSubView('add')} className="clay-button px-6 py-3 flex items-center gap-2 font-black shadow-lg"><Plus size={18} /> New Proceeding</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ForumCard title="AO (Assessing Officer)" icon={Building2} count={hearings.filter(h => h.forum === 'AO').length} forumKey="AO" color="bg-blue-600" />
        <ForumCard title="CIT (Appeals)" icon={Scale} count={hearings.filter(h => h.forum === 'CIT(A)').length} forumKey="CIT(A)" color="bg-indigo-600" />
        <ForumCard title="ITAT (Tribunal)" icon={Gavel} count={hearings.filter(h => h.forum === 'ITAT').length} forumKey="ITAT" color="bg-purple-600" />
      </div>

      <div className="clay-card border-none bg-white dark:bg-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-50/30">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={14} className="text-indigo-500" /> Active Matters at {selectedForum}</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filteredHearings.map(h => (
            <div key={h.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-slate-50 transition-all group cursor-pointer">
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">{h.clientName.charAt(0)}</div>
                <div className="truncate">
                  <h4 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">{h.clientName}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h.caseType} • AY {h.assessmentYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center hidden sm:block">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Next Hearing</p>
                   <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{h.hearingDate}</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Professional Fee</p>
                   <p className="font-black text-indigo-600">₹{h.quotedFees?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => onBillMatter(h)} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Quick Bill"><ReceiptIndianRupee size={18} /></button>
                   <button className="p-3 bg-slate-100 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><ChevronRight size={18} /></button>
                </div>
              </div>
            </div>
          ))}
          {filteredHearings.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">No proceedings found for this forum. Click "New Proceeding" to add one.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProceedingsView;
