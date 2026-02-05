
import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Gavel,
  ReceiptIndianRupee,
  Plus,
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { View, Client, Hearing, Invoice, Receipt, BillingSettings } from './types';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import ProceedingsView from './components/ProceedingsView';
import BillingView from './components/BillingView';
import AuthView from './components/AuthView';
import ProfileSetupView from './components/ProfileSetupView';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { generateAppLogo } from './services/geminiService';
import * as db from './services/database';
import { supabase } from './services/supabase';

const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  practiceName: 'My Practice',
  address: '',
  pan: '',
  gstin: '',
  themeColor: '#4f46e5',
  prefix: 'INV/',
  isGstApplicable: true,
  isAutoNumbering: true,
  lastNumber: 0,
  bankDetails: {
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    accountType: 'Current',
    bankName: '',
    upiId: ''
  },
  terms: ['Payment within 15 days.', 'Subject to local jurisdiction.'],
  defaultNotes: 'Professional services rendered.',
  notes: ''
};

const App: React.FC = () => {
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Navigation State for deep linking
  const [targetClientId, setTargetClientId] = useState<string | null>(null);
  const [targetProfileTab, setTargetProfileTab] = useState<'details' | 'financials' | 'proceedings'>('details');

  // Legal pages state (for auth screen and direct URL access)
  const [showLegalPage, setShowLegalPage] = useState<'privacy' | 'terms' | null>(() => {
    // Check URL on initial load for direct access to legal pages
    const path = window.location.pathname;
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    return null;
  });

  // Data state (loaded from Supabase)
  const [billingSettings, setBillingSettings] = useState<BillingSettings>(DEFAULT_BILLING_SETTINGS);
  const [groups, setGroups] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pendingInvoiceFromMatter, setPendingInvoiceFromMatter] = useState<Partial<Invoice> | null>(null);

  // ======= AUTH LISTENER =======
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ======= LOAD DATA FROM SUPABASE =======
  const loadAllData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [clientsData, hearingsData, invoicesData, receiptsData, groupsData, settingsData] = await Promise.all([
        db.fetchClients(),
        db.fetchHearings(),
        db.fetchInvoices(),
        db.fetchReceipts(),
        db.fetchGroups(),
        db.fetchBillingSettings(),
      ]);
      setClients(clientsData);
      setHearings(hearingsData);
      setInvoices(invoicesData);
      setReceipts(receiptsData);
      setGroups(groupsData);
      if (settingsData) setBillingSettings(settingsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadAllData();
  }, [user, loadAllData]);

  // ======= THEME =======
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    const cachedLogo = localStorage.getItem('profee_app_logo');
    if (cachedLogo) setAppLogo(cachedLogo);
  }, []);

  const handleGenerateLogo = async () => {
    if (isGeneratingLogo) return;
    setIsGeneratingLogo(true);
    const logo = await generateAppLogo();
    if (logo) {
      setAppLogo(logo);
      localStorage.setItem('profee_app_logo', logo);
    }
    setIsGeneratingLogo(false);
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // ======= SUPABASE-BACKED CRUD WRAPPERS =======

  const handleSetClients: React.Dispatch<React.SetStateAction<Client[]>> = (action) => {
    setClients(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      // Find newly added clients (in next but not in prev by id)
      const prevIds = new Set(prev.map(c => c.id));
      const newClients = next.filter(c => !prevIds.has(c.id));
      newClients.forEach(c => {
        db.addClient(c).then(saved => {
          // Update the client with the server-generated id
          setClients(current => current.map(cc => cc.id === c.id ? saved : cc));
        }).catch(console.error);
      });
      return next;
    });
  };

  const handleSetHearings: React.Dispatch<React.SetStateAction<Hearing[]>> = (action) => {
    setHearings(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      const prevIds = new Set(prev.map(h => h.id));
      const newHearings = next.filter(h => !prevIds.has(h.id));
      newHearings.forEach(h => {
        db.addHearing(h).then(saved => {
          setHearings(current => current.map(hh => hh.id === h.id ? saved : hh));
        }).catch(console.error);
      });
      return next;
    });
  };

  const handleSetInvoices: React.Dispatch<React.SetStateAction<Invoice[]>> = (action) => {
    setInvoices(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      const prevIds = new Set(prev.map(i => i.id));
      // New invoices
      const newInvoices = next.filter(i => !prevIds.has(i.id));
      newInvoices.forEach(inv => {
        db.addInvoice(inv).then(saved => {
          setInvoices(current => current.map(ii => ii.id === inv.id ? saved : ii));
        }).catch(console.error);
      });
      // Updated invoices
      const updatedInvoices = next.filter(i => prevIds.has(i.id) && JSON.stringify(i) !== JSON.stringify(prev.find(p => p.id === i.id)));
      updatedInvoices.forEach(inv => {
        db.updateInvoice(inv).catch(console.error);
      });
      return next;
    });
  };

  const handleSetReceipts: React.Dispatch<React.SetStateAction<Receipt[]>> = (action) => {
    setReceipts(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      const prevIds = new Set(prev.map(r => r.id));
      const newReceipts = next.filter(r => !prevIds.has(r.id));
      newReceipts.forEach(r => {
        db.addReceipt(r).then(saved => {
          setReceipts(current => current.map(rr => rr.id === r.id ? saved : rr));
        }).catch(console.error);
      });
      return next;
    });
  };

  const handleSetBillingSettings: React.Dispatch<React.SetStateAction<BillingSettings>> = (action) => {
    setBillingSettings(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      db.saveBillingSettings(next).catch(console.error);
      return next;
    });
  };

  const handleSetGroups: React.Dispatch<React.SetStateAction<string[]>> = (action) => {
    setGroups(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      const newGroups = next.filter(g => !prev.includes(g));
      newGroups.forEach(g => db.addGroup(g).catch(console.error));
      return next;
    });
  };

  // ======= NAVIGATION & BILLING =======

  const handleBillMatter = (hearing: Hearing | Partial<Invoice>) => {
    if ('hearingDate' in hearing) {
      setPendingInvoiceFromMatter({
        clientId: hearing.clientId,
        assessmentYear: hearing.assessmentYear,
        caseType: hearing.caseType,
        items: [{
          id: 'matter-item',
          description: `Professional Fees: ${hearing.caseType}`,
          subNotes: `AY ${hearing.assessmentYear} | Forum: ${hearing.forum}`,
          hsn: '9982',
          qty: 1,
          rate: hearing.quotedFees || 0,
          gstPercent: billingSettings.isGstApplicable ? 18 : 0
        }]
      });
    } else {
      setPendingInvoiceFromMatter(hearing);
    }
    setActiveView('billing');
  };

  const handleNavigateToClientProfile = (clientId: string, tab: 'details' | 'financials' | 'proceedings' = 'details') => {
    setTargetClientId(clientId);
    setTargetProfileTab(tab);
    setActiveView('clients');
  };

  const handleLogout = async () => {
    await db.signOut();
    setUser(null);
    setClients([]);
    setHearings([]);
    setInvoices([]);
    setReceipts([]);
    setGroups([]);
    setBillingSettings(DEFAULT_BILLING_SETTINGS);
  };

  // ======= AUTH LOADING SCREEN =======
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl inline-block mb-4">
            <Gavel className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-indigo-600 tracking-tighter">Profee</h1>
          <p className="text-[10px] font-black text-slate-400 tracking-wide mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // ======= LEGAL PAGES (accessible to everyone via URL) =======
  const handleShowLegalPage = (page: 'privacy' | 'terms') => {
    setShowLegalPage(page);
    window.history.pushState({}, '', `/${page}`);
  };

  const handleCloseLegalPage = () => {
    setShowLegalPage(null);
    window.history.pushState({}, '', '/');
  };

  // Show legal pages if requested (works for both logged-in and logged-out users)
  if (showLegalPage === 'privacy') {
    return <PrivacyPolicy onBack={handleCloseLegalPage} />;
  }
  if (showLegalPage === 'terms') {
    return <TermsOfService onBack={handleCloseLegalPage} />;
  }

  // ======= AUTH SCREEN =======
  if (!user) {
    return (
      <AuthView
        onAuthSuccess={loadAllData}
        onShowPrivacy={() => handleShowLegalPage('privacy')}
        onShowTerms={() => handleShowLegalPage('terms')}
      />
    );
  }

  // ======= PROFILE SETUP SCREEN (first-time users) =======
  const isProfileIncomplete = !dataLoading && billingSettings.practiceName === 'My Practice' && !billingSettings.address;

  if (isProfileIncomplete) {
    return (
      <ProfileSetupView
        settings={billingSettings}
        onComplete={(updatedSettings) => {
          handleSetBillingSettings(updatedSettings);
        }}
      />
    );
  }

  // ======= DATA LOADING SCREEN =======
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl inline-block mb-4">
            <RefreshCw className="w-10 h-10 animate-spin" />
          </div>
          <h1 className="text-3xl font-black text-indigo-600 tracking-tighter">Profee</h1>
          <p className="text-[10px] font-black text-slate-400 tracking-wide mt-2">Loading your practice data...</p>
        </div>
      </div>
    );
  }

  // ======= NAV ITEM =======
  const NavItem: React.FC<{ view: View; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
    <button
      onClick={() => {
        setActiveView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`group flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all w-full relative overflow-hidden ${
        activeView === view
          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none scale-105'
          : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center gap-4 z-10">
        <div className={`transition-transform group-hover:scale-110 ${activeView === view ? 'text-white' : 'text-indigo-400'}`}>
          {icon}
        </div>
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
      {activeView === view && (
        <ChevronRight size={16} className="text-white/50" />
      )}
    </button>
  );

  // ======= MAIN APP =======
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F0F4F8] dark:bg-[#0f172a] transition-all duration-500 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-[#f8fafc] dark:bg-[#1e293b] p-8 shadow-2xl z-20 border-r border-white dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-4 mb-12 px-2 group">
          <div className="relative cursor-pointer transition-all duration-500 hover:rotate-12" onClick={handleGenerateLogo}>
            {appLogo ? <img src={appLogo} alt="Profee" className="w-12 h-12 rounded-2xl object-cover shadow-lg" /> :
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl">
                {isGeneratingLogo ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Gavel className="w-6 h-6" />}
              </div>
            }
          </div>
          <div>
            <h1 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">Profee</h1>
            <p className="text-[9px] font-black text-slate-400 tracking-wide leading-none">AI Tax Professional</p>
          </div>
        </div>

        <nav className="space-y-4 flex-1">
          <NavItem view="dashboard" icon={<LayoutDashboard size={22} />} label="Overview" />
          <NavItem view="clients" icon={<Users size={22} />} label="Client Vault" />
          <NavItem view="proceedings" icon={<Gavel size={22} />} label="Litigation" />
          <NavItem view="billing" icon={<ReceiptIndianRupee size={22} />} label="Accounts" />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="clay-card p-6 bg-white dark:bg-slate-800 border-none shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg">
                {(user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs text-slate-800 dark:text-slate-200 truncate tracking-tight">{billingSettings.practiceName}</p>
                <p className="text-[9px] text-slate-400 truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={toggleTheme} className="text-[10px] text-indigo-500 font-black tracking-wide hover:underline">{isDarkMode ? 'Light' : 'Dark'}</button>
                  <span className="text-slate-300">&bull;</span>
                  <button onClick={handleLogout} className="text-[10px] text-slate-400 font-black tracking-wide hover:text-rose-500 transition-colors">Logout</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-6 bg-white dark:bg-[#1e293b] shadow-xl sticky top-0 z-30 border-b dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><Gavel size={18}/></div>
          <span className="font-black text-xl tracking-tighter text-indigo-600">Profee</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500"><LogOut size={20}/></button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-3 bg-indigo-50 dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm"><Menu size={24}/></button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white dark:bg-slate-800 p-6 m-4 rounded-3xl shadow-2xl space-y-2" onClick={e => e.stopPropagation()}>
            <NavItem view="dashboard" icon={<LayoutDashboard size={22} />} label="Overview" />
            <NavItem view="clients" icon={<Users size={22} />} label="Client Vault" />
            <NavItem view="proceedings" icon={<Gavel size={22} />} label="Litigation" />
            <NavItem view="billing" icon={<ReceiptIndianRupee size={22} />} label="Accounts" />
          </div>
        </div>
      )}

      {/* Main View */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar relative">
        <div key={activeView} className="animate-in fade-in slide-in-from-bottom-6 duration-500">
          {activeView === 'dashboard' && <DashboardView clients={clients} hearings={hearings} invoices={invoices} onNavigate={setActiveView} onSelectClient={handleNavigateToClientProfile} />}
          {activeView === 'clients' && <ClientsView clients={clients} setClients={handleSetClients} hearings={hearings} setHearings={handleSetHearings} groups={groups} setGroups={handleSetGroups} setActiveView={setActiveView} invoices={invoices} receipts={receipts} onQuickBill={handleBillMatter} initialClientId={targetClientId} initialTab={targetProfileTab} clearNavigation={() => { setTargetClientId(null); setTargetProfileTab('details'); }} />}
          {activeView === 'proceedings' && <ProceedingsView hearings={hearings} clients={clients} setHearings={handleSetHearings} onBillMatter={handleBillMatter} />}
          {activeView === 'billing' && <BillingView invoices={invoices} setInvoices={handleSetInvoices} clients={clients} receipts={receipts} setReceipts={handleSetReceipts} groups={groups} settings={billingSettings} setSettings={handleSetBillingSettings} prefill={pendingInvoiceFromMatter} onPrefillProcessed={() => setPendingInvoiceFromMatter(null)} />}
        </div>

        {/* Footer with Legal Links */}
        <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400">
            <button onClick={() => handleShowLegalPage('privacy')} className="hover:text-indigo-500 hover:underline">Privacy Policy</button>
            <span className="mx-2">&bull;</span>
            <button onClick={() => handleShowLegalPage('terms')} className="hover:text-indigo-500 hover:underline">Terms of Service</button>
            <span className="mx-2">&bull;</span>
            <span>&copy; 2026 Profee. All rights reserved.</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
