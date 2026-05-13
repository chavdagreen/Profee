
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Gavel,
  ReceiptIndianRupee,
  Bell,
  Menu,
  X,
  RefreshCw,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  UserCircle,
} from 'lucide-react';
import { View, Client, Hearing, Invoice, Receipt, BillingSettings } from './types';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import ProceedingsView from './components/ProceedingsView';
import BillingView from './components/BillingView';
import AuthView from './components/AuthView';
import ProfileSetupView from './components/ProfileSetupView';
import EditProfileView from './components/EditProfileView';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import LandingPage from './components/LandingPage';
import { generateAppLogo } from './services/geminiService';
import * as db from './services/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(() => db.hasCalendarToken());
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Navigation State for deep linking
  const [targetClientId, setTargetClientId] = useState<string | null>(null);
  const [targetProfileTab, setTargetProfileTab] = useState<'details' | 'financials' | 'proceedings'>('details');

  // Page routing state (for public pages)
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'privacy' | 'terms'>(() => {
    // Check URL on initial load for direct access to pages
    const path = window.location.pathname;
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    if (path === '/login') return 'login';
    return 'landing';
  });

  // Data state (loaded from Supabase)
  const [billingSettings, setBillingSettings] = useState<BillingSettings>(DEFAULT_BILLING_SETTINGS);
  const [groups, setGroups] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pendingInvoiceFromMatter, setPendingInvoiceFromMatter] = useState<Partial<Invoice> | null>(null);

  // Edit Profile state
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Save-error banner (shown when a Firestore write fails)
  const [saveError, setSaveError] = useState<string | null>(null);

  // Check if user logged in with Google (for calendar sync status)
  const isGoogleConnected = user?.providerData?.some((p: any) => p.providerId === 'google.com');

  // ======= AUTH LISTENER =======
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ======= LOAD DATA FROM SUPABASE =======
  // Track which UID we last loaded for — prevents spurious reloads when
  // connectGoogleCalendar() re-fires onAuthStateChanged for the same user.
  const loadedUidRef = useRef<string | null>(null);

  const loadAllData = useCallback(async () => {
    if (!auth.currentUser) return;
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
      console.error('Error loading data from database:', err);
      setSaveError('Could not load your data. Please refresh the page. If the problem persists, check your Firebase/Firestore setup.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    const uid = user?.uid ?? null;
    if (uid === loadedUidRef.current) return; // same user — skip reload
    loadedUidRef.current = uid;
    if (uid) loadAllData();
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

  const handleConnectGoogleCalendar = async (): Promise<boolean> => {
    try {
      const success = await db.connectGoogleCalendar();
      setIsCalendarConnected(success);
      return success;
    } catch (err) {
      console.error('Google Calendar connect error:', err);
      return false;
    }
  };

  // Ref so persistence logic can read current hearings without a stale closure
  const hearingsRef = useRef<Hearing[]>([]);
  hearingsRef.current = hearings;

  const handleSetHearings: React.Dispatch<React.SetStateAction<Hearing[]>> = (action) => {
    const prev = hearingsRef.current;
    const next = typeof action === 'function' ? action(prev) : action;

    // Update UI immediately
    setHearings(next);

    // Determine what changed — outside the state updater to avoid React 18 double-invocation
    const prevIds = new Set(prev.map(h => h.id));

    // Persist new hearings
    const newHearings = next.filter(h => !prevIds.has(h.id));
    newHearings.forEach(h => {
      db.addHearing(h).then(saved => {
        // Replace the temporary client-side id with the Firestore-generated one
        setHearings(current => current.map(hh => hh.id === h.id ? saved : hh));
        hearingsRef.current = hearingsRef.current.map(hh => hh.id === h.id ? saved : hh);
        setSaveError(null);
        // Auto-sync new hearing to Google Calendar if connected (best-effort, non-blocking)
        if (db.hasCalendarToken() && (saved.status === 'Upcoming' || saved.status === 'Adjourned')) {
          db.syncHearingToGoogleCalendar(saved).then(result => {
            if (result.authError) setIsCalendarConnected(false);
          }).catch(console.error);
        }
      }).catch((err) => {
        console.error('Failed to save matter to database:', err);
        setSaveError('Matter could not be saved to the database. Check your connection and try again.');
      });
    });

    // Persist updated hearings
    const updatedHearings = next.filter(h =>
      prevIds.has(h.id) &&
      JSON.stringify(h) !== JSON.stringify(prev.find(p => p.id === h.id))
    );
    updatedHearings.forEach(h => {
      db.updateHearing(h).catch((err) => {
        console.error('Failed to update matter in database:', err);
        setSaveError('Matter update could not be saved. Check your connection and try again.');
      });
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
          <h1 className="text-3xl font-black text-indigo-600 tracking-tighter">Profee.in</h1>
          <p className="text-[10px] font-black text-slate-400 tracking-wide mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // ======= PAGE NAVIGATION (for public pages) =======
  const navigateTo = (page: 'landing' | 'login' | 'privacy' | 'terms') => {
    setCurrentPage(page);
    const path = page === 'landing' ? '/' : `/${page}`;
    window.history.pushState({}, '', path);
  };

  // Show public pages (accessible to everyone)
  if (currentPage === 'privacy') {
    return <PrivacyPolicy onBack={() => navigateTo('landing')} />;
  }
  if (currentPage === 'terms') {
    return <TermsOfService onBack={() => navigateTo('landing')} />;
  }

  // ======= NOT LOGGED IN =======
  if (!user) {
    // Show login page if requested
    if (currentPage === 'login') {
      return (
        <AuthView
          onAuthSuccess={loadAllData}
          onShowPrivacy={() => navigateTo('privacy')}
          onShowTerms={() => navigateTo('terms')}
        />
      );
    }
    // Show landing page by default
    return <LandingPage onGetStarted={() => navigateTo('login')} />;
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
          <h1 className="text-3xl font-black text-indigo-600 tracking-tighter">Profee.in</h1>
          <p className="text-[10px] font-black text-slate-400 tracking-wide mt-2">Loading your practice data...</p>
        </div>
      </div>
    );
  }

  // ======= NAV ITEM (supports collapsed mode) =======
  const NavItem: React.FC<{ view: View; icon: React.ReactNode; label: string; collapsed?: boolean }> = ({ view, icon, label, collapsed }) => (
    <div className="relative group/nav">
      <button
        onClick={() => {
          setActiveView(view);
          setIsMobileMenuOpen(false);
        }}
        title={collapsed ? label : undefined}
        className={`flex items-center transition-all duration-200 w-full ${
          collapsed
            ? 'justify-center p-3 rounded-2xl'
            : 'gap-3 px-4 py-3 rounded-2xl'
        } ${
          activeView === view
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/40'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
        }`}
      >
        <span className={`shrink-0 transition-transform duration-200 group-hover/nav:scale-110 ${activeView === view ? 'text-white' : 'text-indigo-400'}`}>
          {icon}
        </span>
        {!collapsed && <span className="font-semibold text-sm tracking-tight truncate">{label}</span>}
      </button>
      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold rounded-xl whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 z-50 shadow-xl">
          {label}
        </div>
      )}
    </div>
  );

  // ======= MAIN APP =======
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F0F4F8] dark:bg-[#0f172a] transition-all duration-500 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-[#1a2236] border-r border-slate-100 dark:border-slate-800 z-20 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo + Collapse Toggle */}
        <div className={`flex items-center border-b border-slate-100 dark:border-slate-800 shrink-0 ${isSidebarCollapsed ? 'justify-center p-4 h-[72px]' : 'justify-between px-5 h-[72px]'}`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleGenerateLogo}>
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md transition-transform group-hover:rotate-12">
                {appLogo
                  ? <img src={appLogo} alt="Profee.in" className="w-5 h-5 object-cover rounded" />
                  : isGeneratingLogo ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Gavel className="w-5 h-5" />
                }
              </div>
              <div>
                <h1 className="text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-tighter leading-none">Profee.in</h1>
                <p className="text-[9px] font-semibold text-slate-400 tracking-wide">AI Tax Professional</p>
              </div>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md cursor-pointer" onClick={handleGenerateLogo}>
              {isGeneratingLogo ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Gavel className="w-5 h-5" />}
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(v => !v)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors ${isSidebarCollapsed ? 'hidden' : ''}`}
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Expand button when collapsed */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="mx-auto mt-3 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {/* Nav Items */}
        <nav className={`flex-1 py-4 space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
          <NavItem view="dashboard" icon={<LayoutDashboard size={20} />} label="Overview" collapsed={isSidebarCollapsed} />
          <NavItem view="clients" icon={<Users size={20} />} label="Client Vault" collapsed={isSidebarCollapsed} />
          <NavItem view="proceedings" icon={<Gavel size={20} />} label="Litigation" collapsed={isSidebarCollapsed} />
          <NavItem view="billing" icon={<ReceiptIndianRupee size={20} />} label="Accounts" collapsed={isSidebarCollapsed} />
        </nav>

        {/* User Footer */}
        <div className={`border-t border-slate-100 dark:border-slate-800 shrink-0 ${isSidebarCollapsed ? 'p-3' : 'p-4'}`}>
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md cursor-pointer" onClick={() => setShowEditProfile(true)} title={billingSettings.practiceName}>
                {(user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <button onClick={toggleTheme} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors" title={isDarkMode ? 'Light mode' : 'Dark mode'}>
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors" title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                {(user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{billingSettings.practiceName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setShowEditProfile(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors" title="Edit profile">
                  <UserCircle size={15} />
                </button>
                <button onClick={toggleTheme} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors" title={isDarkMode ? 'Light mode' : 'Dark mode'}>
                  {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                </button>
                <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors" title="Logout">
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white dark:bg-[#1a2236] shadow-sm sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><Gavel size={16}/></div>
          <span className="font-black text-lg tracking-tighter text-indigo-600">Profee.in</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><LogOut size={18}/></button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 rounded-xl"><Menu size={20}/></button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white dark:bg-slate-800 p-5 m-4 rounded-3xl shadow-2xl space-y-1" onClick={e => e.stopPropagation()}>
            <NavItem view="dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
            <NavItem view="clients" icon={<Users size={20} />} label="Client Vault" />
            <NavItem view="proceedings" icon={<Gavel size={20} />} label="Litigation" />
            <NavItem view="billing" icon={<ReceiptIndianRupee size={20} />} label="Accounts" />
          </div>
        </div>
      )}

      {/* Save-error banner */}
      {saveError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-start gap-3 shadow-lg">
            <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
            <p className="text-sm flex-1">{saveError}</p>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600 shrink-0 ml-2">✕</button>
          </div>
        </div>
      )}

      {/* Main View */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto custom-scrollbar relative min-w-0">
        {showEditProfile ? (
          <EditProfileView
            settings={billingSettings}
            onSave={(updated) => handleSetBillingSettings(updated)}
            onBack={() => setShowEditProfile(false)}
            isGoogleConnected={isGoogleConnected}
            user={user}
          />
        ) : (
        <div key={activeView} className="animate-in fade-in slide-in-from-bottom-6 duration-500">
          {activeView === 'dashboard' && <DashboardView clients={clients} hearings={hearings} invoices={invoices} onNavigate={setActiveView} onSelectClient={handleNavigateToClientProfile} isCalendarConnected={isCalendarConnected} onConnectCalendar={handleConnectGoogleCalendar} onCalendarDisconnected={() => setIsCalendarConnected(false)} />}
          {activeView === 'clients' && <ClientsView clients={clients} setClients={handleSetClients} hearings={hearings} setHearings={handleSetHearings} groups={groups} setGroups={handleSetGroups} setActiveView={setActiveView} invoices={invoices} receipts={receipts} onQuickBill={handleBillMatter} initialClientId={targetClientId} initialTab={targetProfileTab} clearNavigation={() => { setTargetClientId(null); setTargetProfileTab('details'); }} />}
          {activeView === 'proceedings' && <ProceedingsView hearings={hearings} clients={clients} setHearings={handleSetHearings} onBillMatter={handleBillMatter} isCalendarConnected={isCalendarConnected} />}
          {activeView === 'billing' && <BillingView invoices={invoices} setInvoices={handleSetInvoices} clients={clients} receipts={receipts} setReceipts={handleSetReceipts} groups={groups} settings={billingSettings} setSettings={handleSetBillingSettings} prefill={pendingInvoiceFromMatter} onPrefillProcessed={() => setPendingInvoiceFromMatter(null)} />}
        </div>
        )}

        {/* Footer with Legal Links */}
        <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400">
            <button onClick={() => navigateTo('privacy')} className="hover:text-indigo-500 hover:underline">Privacy Policy</button>
            <span className="mx-2">&bull;</span>
            <button onClick={() => navigateTo('terms')} className="hover:text-indigo-500 hover:underline">Terms of Service</button>
            <span className="mx-2">&bull;</span>
            <span>&copy; 2026 Profee.in. All rights reserved.</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
