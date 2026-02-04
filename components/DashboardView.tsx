
import React, { useMemo, useState } from 'react';
import { Client, Hearing, Invoice, View } from '../types';
import { 
  Calendar as CalendarIcon, UserCheck, TrendingUp, AlertCircle, 
  ChevronLeft, ChevronRight, Bell, ArrowUpRight, RefreshCw, 
  Smartphone, CheckCircle2, X, Gavel, Scale, Building2, Flame
} from 'lucide-react';

interface DashboardViewProps {
  clients: Client[];
  hearings: Hearing[];
  invoices: Invoice[];
  onNavigate: (view: View) => void;
  onSelectClient: (clientId: string, tab: 'details' | 'financials' | 'proceedings') => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ clients, hearings, invoices, onNavigate, onSelectClient }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [drillDown, setDrillDown] = useState<{ type: 'notices' | 'hearings' | 'daily_notices' | 'daily_hearings'; data: Hearing[] } | null>(null);
  const [dayEvents, setDayEvents] = useState<{ day: number; events: Hearing[] } | null>(null);

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= 31; i++) days.push(i);
    return days;
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const today = new Date();
  const lastSevenDays = new Date();
  lastSevenDays.setDate(today.getDate() - 7);
  const nextSevenDays = new Date();
  nextSevenDays.setDate(today.getDate() + 7);

  // Filter Data for Dashboard Pulse Cards
  const recentNotices = useMemo(() => {
    return hearings.filter(h => {
      if (!h.issueDate) return false;
      const issue = new Date(h.issueDate);
      return issue >= lastSevenDays && issue <= today;
    });
  }, [hearings]);

  const upcomingHearings = useMemo(() => {
    return hearings.filter(h => {
      const hearing = new Date(h.hearingDate);
      return hearing >= today && hearing <= nextSevenDays;
    });
  }, [hearings]);

  const noticesTodayOrYesterday = useMemo(() => {
    return hearings.filter(h => h.issueDate === todayStr || h.issueDate === yesterdayStr);
  }, [hearings, todayStr, yesterdayStr]);

  const hearingsScheduledToday = useMemo(() => {
    return hearings.filter(h => h.hearingDate === todayStr);
  }, [hearings, todayStr]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const getForumColor = (forum: string) => {
    switch (forum) {
      case 'AO': return 'bg-blue-600';
      case 'CIT(A)': return 'bg-indigo-600';
      case 'ITAT': return 'bg-purple-600';
      default: return 'bg-slate-600';
    }
  };

  const getForumIcon = (forum: string) => {
    switch (forum) {
      case 'AO': return Building2;
      case 'CIT(A)': return Scale;
      case 'ITAT': return Gavel;
      default: return AlertCircle;
    }
  };

  const PulseCard = ({ title, count, icon: Icon, color, onClick, index, label = "7-Day Pulse" }: any) => (
    <button 
      onClick={onClick}
      style={{ animationDelay: `${index * 150}ms` }}
      className={`clay-card p-6 border-none flex flex-col justify-between transition-all hover:scale-[1.05] hover:rotate-1 text-left group relative overflow-hidden animate-in slide-in-from-top-4`}
    >
      <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full ${color} opacity-5 group-hover:opacity-10 transition-opacity blur-3xl`}></div>
      <div className="flex justify-between items-start mb-6">
        <div className={`${color} p-4 rounded-[2rem] text-white shadow-xl shadow-indigo-100 transition-transform group-hover:rotate-12`}>
          <Icon size={32} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-500 transition-colors">{label}</span>
          <ArrowUpRight size={18} className="text-slate-300 mt-1" />
        </div>
      </div>
      <div>
        <p className="text-slate-400 dark:text-slate-500 font-black text-[11px] uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{count}</h3>
          <span className={`text-[10px] font-bold ${count > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-300'} bg-opacity-10 px-2 py-0.5 rounded-full`}>
            {count > 0 ? 'ACTION' : 'CLEAR'}
          </span>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-12">
      {/* Top Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h2 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-2">Practice Overview</h2>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Connected to Supabase DB & Google Cloud</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="clay-card px-6 py-3 border-none flex items-center gap-3 bg-white/80 backdrop-blur-md">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live DB Sync</span>
           </div>
           <button className="clay-button p-4 rounded-3xl relative"><Bell size={24}/><div className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full border-4 border-indigo-600"></div></button>
        </div>
      </div>

      {/* PULSE CARDS (Grid of 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PulseCard 
          index={0}
          title="New Intake (Today/Yesterday)" 
          count={noticesTodayOrYesterday.length} 
          icon={Flame} 
          color="bg-orange-500" 
          label="Real-time Alert"
          onClick={() => setDrillDown({ type: 'daily_notices', data: noticesTodayOrYesterday })}
        />
        <PulseCard 
          index={1}
          title="Today's Hearings" 
          count={hearingsScheduledToday.length} 
          icon={CheckCircle2} 
          color="bg-emerald-600" 
          label="Daily Schedule"
          onClick={() => setDrillDown({ type: 'daily_hearings', data: hearingsScheduledToday })}
        />
        <PulseCard 
          index={2}
          title="Notices (Last 7 Days)" 
          count={recentNotices.length} 
          icon={AlertCircle} 
          color="bg-rose-500" 
          onClick={() => setDrillDown({ type: 'notices', data: recentNotices })}
        />
        <PulseCard 
          index={3}
          title="Hearings (Next 7 Days)" 
          count={upcomingHearings.length} 
          icon={CalendarIcon} 
          color="bg-indigo-600" 
          onClick={() => setDrillDown({ type: 'hearings', data: upcomingHearings })}
        />
      </div>

      {/* DRILL DOWN MODAL */}
      {drillDown && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="clay-card w-full max-w-4xl bg-white dark:bg-slate-800 border-none shadow-3xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                     {drillDown.type === 'notices' ? 'Notice Issuance (7D)' : 
                      drillDown.type === 'hearings' ? 'Hearing Forecast (7D)' : 
                      drillDown.type === 'daily_notices' ? 'Newly Added Notices' : "Today's Representation Schedule"}
                   </h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Click any row to open client proceedings</p>
                </div>
                <button onClick={() => setDrillDown(null)} className="p-3 bg-white dark:bg-slate-700 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><X /></button>
             </div>
             <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-8">
                <table className="w-full text-left font-bold text-sm">
                   <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-slate-700">
                         <th className="px-4 py-4">Client Name</th>
                         <th className="px-4 py-4">AY</th>
                         <th className="px-4 py-4">Matter Type</th>
                         <th className="px-4 py-4">Date</th>
                         <th className="px-4 py-4 text-right">Forum</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                      {drillDown.data.map((h, i) => (
                        <tr 
                          key={h.id} 
                          style={{ animationDelay: `${i * 50}ms` }} 
                          onClick={() => { setDrillDown(null); onSelectClient(h.clientId, 'proceedings'); }}
                          className="hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors animate-in slide-in-from-left-4 cursor-pointer group"
                        >
                           <td className="px-4 py-6 text-slate-800 dark:text-white font-black uppercase tracking-tight group-hover:text-indigo-600">{h.clientName}</td>
                           <td className="px-4 py-6 text-indigo-600">AY {h.assessmentYear}</td>
                           <td className="px-4 py-6 text-slate-500 text-xs">{h.caseType}</td>
                           <td className="px-4 py-6 text-slate-400 text-[10px]">{drillDown.type === 'notices' || drillDown.type === 'daily_notices' ? h.issueDate : h.hearingDate}</td>
                           <td className="px-4 py-6 text-right"><span className={`px-3 py-1 ${getForumColor(h.forum)} text-white rounded-lg text-[10px] font-black uppercase`}>{h.forum}</span></td>
                        </tr>
                      ))}
                      {drillDown.data.length === 0 && (
                        <tr>
                           <td colSpan={5} className="text-center py-20 text-slate-400 italic">No records found for the selected period.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Main Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <button onClick={() => onNavigate('clients')} className="clay-card p-6 border-none text-left transition-all hover:scale-105 group">
           <UserCheck size={24} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Base</p>
           <h4 className="text-3xl font-black text-slate-800 dark:text-white">{clients.length}</h4>
        </button>
        <button onClick={() => onNavigate('proceedings')} className="clay-card p-6 border-none text-left transition-all hover:scale-105 group">
           <CalendarIcon size={24} className="text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Hearings</p>
           <h4 className="text-3xl font-black text-slate-800 dark:text-white">{hearings.length}</h4>
        </button>
        <button onClick={() => onNavigate('billing')} className="clay-card p-6 border-none text-left transition-all hover:scale-105 group">
           <TrendingUp size={24} className="text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
           <h4 className="text-3xl font-black text-slate-800 dark:text-white">₹1.4L</h4>
        </button>
        <button onClick={() => onNavigate('billing')} className="clay-card p-6 border-none text-left transition-all hover:scale-105 group">
           <AlertCircle size={24} className="text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstandings</p>
           <h4 className="text-3xl font-black text-slate-800 dark:text-white">₹45K</h4>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Glow Statutory Calendar */}
        <div className="xl:col-span-2 clay-card p-10 border-none bg-white dark:bg-slate-800 shadow-2xl animate-in slide-in-from-left-8 duration-700 relative">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-6">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Litigation Calendar</h3>
              <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600">
                 <div className={`flex items-center gap-2 ${isSyncing ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <Smartphone size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isSyncing ? 'Syncing Google...' : 'G-Sync Active'}</span>
                 </div>
                 <button onClick={handleSync} className={`transition-all ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-300 hover:text-indigo-600'}`}>
                    <RefreshCw size={14} />
                 </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mr-4">{currentMonth} {currentYear}</span>
               <button className="p-3 bg-slate-50 dark:bg-slate-700 rounded-2xl hover:bg-indigo-50 transition-all"><ChevronLeft size={20} /></button>
               <button className="p-3 bg-slate-50 dark:bg-slate-700 rounded-2xl hover:bg-indigo-50 transition-all"><ChevronRight size={20} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-4">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-[10px] font-black text-slate-400 text-center pb-4 tracking-widest">{day}</div>
            ))}
            {calendarDays.map(day => {
              const dateStr = `2024-06-${day.toString().padStart(2, '0')}`;
              const dayHearings = hearings.filter(h => h.hearingDate === dateStr);
              const hasHearing = dayHearings.length > 0;
              const primaryForum = hasHearing ? dayHearings[0].forum : null;
              const colorClass = primaryForum ? getForumColor(primaryForum) : 'bg-white dark:bg-slate-700';

              return (
                <button 
                  key={day} 
                  onClick={() => hasHearing && setDayEvents({ day, events: dayHearings })}
                  className={`calendar-day-glow aspect-square rounded-[1.8rem] border-2 flex flex-col items-center justify-center relative transition-all duration-300 font-black
                    ${hasHearing 
                      ? `${colorClass} text-white border-transparent shadow-xl` 
                      : 'bg-white dark:bg-slate-700 border-slate-50 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-purple-200'}
                  `}
                >
                  <span className="text-sm">{day}</span>
                  {hasHearing && dayHearings.length > 1 && (
                    <div className="absolute bottom-2 bg-white/20 text-[8px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      +{dayHearings.length - 1} More
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* DAY EVENTS POPUP */}
          {dayEvents && (
            <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] p-10 flex flex-col animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Events for June {dayEvents.day}</h4>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Select an event to view full proceedings</p>
                  </div>
                  <button onClick={() => setDayEvents(null)} className="p-4 bg-white dark:bg-slate-800 rounded-3xl hover:bg-rose-50 hover:text-rose-500 shadow-xl transition-all border border-slate-100 dark:border-slate-700"><X /></button>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                  {dayEvents.events.map((e, idx) => {
                    const ForumIcon = getForumIcon(e.forum);
                    return (
                      <button 
                        key={e.id}
                        onClick={() => { setDayEvents(null); onSelectClient(e.clientId, 'proceedings'); }}
                        style={{ animationDelay: `${idx * 100}ms` }}
                        className="w-full clay-card p-6 bg-white dark:bg-slate-800 border-none flex items-center justify-between group hover:scale-[1.02] transition-all animate-in slide-in-from-right-4"
                      >
                         <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl ${getForumColor(e.forum)} text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform`}>
                               <ForumIcon size={24} />
                            </div>
                            <div className="text-left">
                               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Matter: {e.forum}</p>
                               <h5 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{e.clientName}</h5>
                               <p className="text-xs font-bold text-slate-400 mt-0.5">{e.caseType} • AY {e.assessmentYear}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="text-right">
                               <p className="text-[9px] font-black text-slate-300 uppercase">Scheduled At</p>
                               <p className="text-sm font-black text-slate-600 dark:text-slate-300">{e.time}</p>
                            </div>
                            <ChevronRight size={24} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                         </div>
                      </button>
                    )
                  })}
               </div>
            </div>
          )}
        </div>

        {/* Existing Notifications List */}
        <div className="clay-card p-8 border-none flex flex-col bg-white dark:bg-slate-800 shadow-2xl animate-in slide-in-from-right-8 duration-700 h-full max-h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <Bell size={22} className="text-rose-500 animate-pulse" /> Alerts
            </h3>
          </div>
          <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {hearings.map((h, i) => (
              <button 
                key={h.id} 
                onClick={() => onSelectClient(h.clientId, 'proceedings')}
                className="w-full p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-900/40 border border-transparent hover:border-indigo-100 hover:bg-white dark:hover:bg-slate-800 transition-all group text-left"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-black ${getForumColor(h.forum)} text-white px-3 py-1 rounded-xl uppercase tracking-widest`}>{h.forum}</span>
                  <CheckCircle2 size={14} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm leading-tight uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{h.clientName}</p>
                <p className="text-[10px] font-bold text-slate-400">{h.hearingDate} • {h.caseType}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
