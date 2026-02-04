
import React, { useState, useEffect } from 'react';
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
import { generateAppLogo } from './services/geminiService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  
  // Navigation State for deep linking from Dashboard to Clients
  const [targetClientId, setTargetClientId] = useState<string | null>(null);
  const [targetProfileTab, setTargetProfileTab] = useState<'details' | 'financials' | 'proceedings'>('details');

  const [billingSettings, setBillingSettings] = useState<BillingSettings>({
    practiceName: 'CA Sharma & Associates',
    address: '46, Professional Park, Nariman Point, Mumbai - 400021',
    pan: 'ABCDE1234F',
    gstin: '27ABCDE1234F1Z5',
    themeColor: '#4f46e5', 
    prefix: 'INV/',
    isGstApplicable: true,
    isAutoNumbering: true,
    lastNumber: 10,
    bankDetails: {
      accountHolder: 'Sharma Associates',
      accountNumber: '50100234567890',
      ifsc: 'HDFC0001234',
      accountType: 'Current',
      bankName: 'HDFC Bank',
      upiId: 'sharma.associates@okhdfc'
    },
    terms: [
      'Payment within 15 days.',
      'Subject to Mumbai Jurisdiction.'
    ],
    defaultNotes: 'Professional services rendered.',
    notes: ''
  });

  const [groups, setGroups] = useState<string[]>(['Acme Group', 'Individual', 'Tech Hub', 'Aditya Birla Group']);

  const [clients, setClients] = useState<Client[]>([
    { id: 'c1', name: 'Acme Corp Pvt Ltd', pan: 'ABCDE1234F', group: 'Acme Group', entityType: 'Company', contact: '9876543210', email: 'accounts@acme.com', address: '123 Business Park, Mumbai', gstin: '27ABCDE1234F1Z5' },
    { id: 'c2', name: 'Rajesh Sharma', pan: 'FGHIJ5678K', group: 'Individual', entityType: 'Individual', contact: '8765432109', email: 'rajesh@gmail.com', address: 'Flat 402, Delhi', gstin: '07FGHIJ5678K1Z1' },
    { id: 'c3', name: 'Tech Solutions LLP', pan: 'KLMNO9012P', group: 'Tech Hub', entityType: 'Firm', contact: '7654321098', email: 'contact@techllp.in', gstin: '29KLMNO9012P1Z0' },
  ]);

  const today = new Date();
  const getISO = (daysOffset: number) => {
    const d = new Date();
    d.setDate(today.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const [hearings, setHearings] = useState<Hearing[]>([
    { id: 'h1', clientId: 'c1', clientName: 'Acme Corp Pvt Ltd', caseType: 'Scrutiny Assessment', issueDate: getISO(0), hearingDate: getISO(5), time: '11:00 AM', forum: 'AO', status: 'Upcoming', assessmentYear: '2022-23', isCritical: true, quotedFees: 50000 },
    { id: 'h2', clientId: 'c3', clientName: 'Tech Solutions LLP', caseType: 'First Appeal', issueDate: getISO(-4), hearingDate: getISO(0), time: '02:30 PM', forum: 'CIT(A)', status: 'Upcoming', assessmentYear: '2021-22', quotedFees: 35000 },
    { id: 'h3', clientId: 'c2', clientName: 'Rajesh Sharma', caseType: '148 Reassessment', issueDate: getISO(-1), hearingDate: getISO(3), time: '10:00 AM', forum: 'AO', status: 'Upcoming', assessmentYear: '2019-20', quotedFees: 25000 },
    { id: 'h4', clientId: 'c1', clientName: 'Acme Corp Pvt Ltd', caseType: 'Penalty Proceeding', issueDate: getISO(-10), hearingDate: getISO(0), time: '04:00 PM', forum: 'AO', status: 'Upcoming', assessmentYear: '2022-23', quotedFees: 15000 },
    { id: 'h5', clientId: 'c2', clientName: 'Rajesh Sharma', caseType: 'Rectification 154', issueDate: getISO(-1), hearingDate: getISO(10), time: '12:00 PM', forum: 'AO', status: 'Upcoming', assessmentYear: '2020-21', quotedFees: 5000 },
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    { 
      id: 'inv1', 
      invoiceNumber: 'INV/001', 
      clientId: 'c1', 
      clientName: 'Acme Corp Pvt Ltd', 
      date: '2024-05-20', 
      dueDate: '2024-06-05',
      placeOfSupply: 'Maharashtra',
      countryOfSupply: 'India',
      items: [{ id: 'i1', description: 'Scrutiny Assessment AY 2022-23 Appearance', hsn: '9982', qty: 1, rate: 25000, gstPercent: 18 }],
      subTotal: 25000, discountPercent: 0, discountAmount: 0, taxableAmount: 25000, gstTotal: 4500, cgstTotal: 2250, sgstTotal: 2250, total: 29500, status: 'Paid', themeColor: '#4f46e5',
      assessmentYear: '2022-23', caseType: 'Scrutiny Assessment'
    },
  ]);

  const [receipts, setReceipts] = useState<Receipt[]>([
    { id: 'r1', receiptNumber: 'RCP/001', clientId: 'c1', clientName: 'Acme Corp Pvt Ltd', date: '2024-05-25', amount: 29500, paymentMethod: 'Bank Transfer', reference: 'TXN123456', invoiceIds: ['inv1'] }
  ]);

  const [pendingInvoiceFromMatter, setPendingInvoiceFromMatter] = useState<Partial<Invoice> | null>(null);

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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F0F4F8] dark:bg-[#0f172a] transition-all duration-500 overflow-hidden">
      {/* Sidebar with animated items */}
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
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">AI Tax Professional</p>
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg">CA</div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs text-slate-800 dark:text-slate-200 truncate uppercase tracking-tight">{billingSettings.practiceName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={toggleTheme} className="text-[10px] text-indigo-500 font-black uppercase tracking-widest hover:underline">{isDarkMode ? 'Light' : 'Dark'}</button>
                  <span className="text-slate-300">•</span>
                  <button className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-rose-500 transition-colors">Logout</button>
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
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-3 bg-indigo-50 dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm"><Menu size={24}/></button>
      </div>

      {/* Main View Transition Wrapper */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar relative">
        <div key={activeView} className="animate-in fade-in slide-in-from-bottom-6 duration-500">
          {activeView === 'dashboard' && <DashboardView clients={clients} hearings={hearings} invoices={invoices} onNavigate={setActiveView} onSelectClient={handleNavigateToClientProfile} />}
          {activeView === 'clients' && <ClientsView clients={clients} setClients={setClients} hearings={hearings} setHearings={setHearings} groups={groups} setGroups={setGroups} setActiveView={setActiveView} invoices={invoices} receipts={receipts} onQuickBill={handleBillMatter} initialClientId={targetClientId} initialTab={targetProfileTab} clearNavigation={() => { setTargetClientId(null); setTargetProfileTab('details'); }} />}
          {activeView === 'proceedings' && <ProceedingsView hearings={hearings} clients={clients} setHearings={setHearings} onBillMatter={handleBillMatter} />}
          {activeView === 'billing' && <BillingView invoices={invoices} setInvoices={setInvoices} clients={clients} receipts={receipts} setReceipts={setReceipts} groups={groups} settings={billingSettings} setSettings={setBillingSettings} prefill={pendingInvoiceFromMatter} onPrefillProcessed={() => setPendingInvoiceFromMatter(null)} />}
        </div>
      </main>
    </div>
  );
};

export default App;
