
import React, { useState } from 'react';
import { BillingSettings } from '../types';
import { ChevronLeft, Building2, Landmark, Calendar, Save, CheckCircle, Link2 } from 'lucide-react';
import { signInWithGoogle } from '../services/database';

interface EditProfileViewProps {
  settings: BillingSettings;
  onSave: (settings: BillingSettings) => void;
  onBack: () => void;
  isGoogleConnected: boolean;
}

const EditProfileView: React.FC<EditProfileViewProps> = ({ settings, onSave, onBack, isGoogleConnected }) => {
  const [activeTab, setActiveTab] = useState<'practice' | 'bank' | 'calendar'>('practice');
  const [saved, setSaved] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [form, setForm] = useState({
    practiceName: settings.practiceName || '',
    address: settings.address || '',
    pan: settings.pan || '',
    gstin: settings.gstin || '',
    accountHolder: settings.bankDetails?.accountHolder || '',
    accountNumber: settings.bankDetails?.accountNumber || '',
    ifsc: settings.bankDetails?.ifsc || '',
    bankName: settings.bankDetails?.bankName || '',
    accountType: settings.bankDetails?.accountType || 'Current',
    upiId: settings.bankDetails?.upiId || '',
    themeColor: settings.themeColor || '#4f46e5',
    prefix: settings.prefix || 'INV/',
    isGstApplicable: settings.isGstApplicable ?? true,
    isAutoNumbering: settings.isAutoNumbering ?? true,
    lastNumber: settings.lastNumber || 0,
  });

  const handleSave = () => {
    const updatedSettings: BillingSettings = {
      ...settings,
      practiceName: form.practiceName || 'My Practice',
      address: form.address,
      pan: form.pan,
      gstin: form.gstin,
      themeColor: form.themeColor,
      prefix: form.prefix,
      isGstApplicable: form.isGstApplicable,
      isAutoNumbering: form.isAutoNumbering,
      lastNumber: form.lastNumber,
      bankDetails: {
        accountHolder: form.accountHolder,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
        bankName: form.bankName,
        accountType: form.accountType,
        upiId: form.upiId,
      },
    };
    onSave(updatedSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      await signInWithGoogle();
      // The page will redirect to Google OAuth
    } catch (err) {
      console.error('Failed to connect Google:', err);
      alert('Failed to connect Google Calendar. Please try again.');
      setConnectingGoogle(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline">
          <ChevronLeft size={20} /> Back
        </button>
        <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white">Edit Profile</h2>
        <div className="flex items-center gap-4">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl animate-in fade-in">
              <CheckCircle size={18} /> Saved!
            </div>
          )}
          <button onClick={handleSave} className="clay-button px-6 py-3 font-black flex items-center gap-2">
            <Save size={20} /> Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('practice')}
          className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'practice' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500'}`}
        >
          <Building2 size={16} /> Practice Details
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'bank' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500'}`}
        >
          <Landmark size={16} /> Bank Details
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500'}`}
        >
          <Calendar size={16} /> Calendar Sync
        </button>
      </div>

      {/* Practice Details Tab */}
      {activeTab === 'practice' && (
        <div className="clay-card p-10 bg-white dark:bg-slate-800 border-none shadow-2xl animate-in slide-in-from-right-4">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
            <Building2 className="text-indigo-600" /> Practice Information
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400">Practice / Firm Name</label>
              <input
                className="clay-input w-full p-4 font-bold text-lg"
                placeholder="e.g. ABC & Associates"
                value={form.practiceName}
                onChange={e => setForm({ ...form, practiceName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400">Office Address</label>
              <textarea
                className="clay-input w-full p-4 font-bold"
                rows={3}
                placeholder="Full office address for invoices"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">PAN Number</label>
                <input
                  className="clay-input w-full p-4 font-bold uppercase"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={form.pan}
                  onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">GSTIN (if applicable)</label>
                <input
                  className="clay-input w-full p-4 font-bold uppercase"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  value={form.gstin}
                  onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="pt-6 border-t">
              <h4 className="text-sm font-black text-slate-600 dark:text-slate-300 mb-4">Invoice Settings</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">Invoice Prefix</label>
                  <input
                    className="clay-input w-full p-4 font-bold"
                    value={form.prefix}
                    onChange={e => setForm({ ...form, prefix: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">Last Invoice Number</label>
                  <input
                    type="number"
                    className="clay-input w-full p-4 font-bold"
                    value={form.lastNumber}
                    onChange={e => setForm({ ...form, lastNumber: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">GST Applicable</p>
                    <p className="text-[9px] text-slate-400">Show GST columns in invoices</p>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, isGstApplicable: !form.isGstApplicable })}
                    className={`w-12 h-7 rounded-full transition-all relative p-1 ${form.isGstApplicable ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-all ${form.isGstApplicable ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Auto-Numbering</p>
                    <p className="text-[9px] text-slate-400">Auto-increment invoice numbers</p>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, isAutoNumbering: !form.isAutoNumbering })}
                    className={`w-12 h-7 rounded-full transition-all relative p-1 ${form.isAutoNumbering ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-all ${form.isAutoNumbering ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <label className="text-[10px] font-bold text-slate-400 mb-3 block">Brand Theme Color</label>
              <div className="flex gap-4">
                {['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#0f172a', '#7c3aed', '#db2777'].map(c => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, themeColor: c })}
                    className={`w-12 h-12 rounded-2xl border-4 transition-all ${form.themeColor === c ? 'border-indigo-300 scale-110 shadow-lg' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Details Tab */}
      {activeTab === 'bank' && (
        <div className="clay-card p-10 bg-white dark:bg-slate-800 border-none shadow-2xl animate-in slide-in-from-right-4">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
            <Landmark className="text-indigo-600" /> Bank & Payment Details
          </h3>
          <p className="text-sm text-slate-400 mb-6">These details will appear on your invoices for client payments.</p>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">Account Holder Name</label>
                <input
                  className="clay-input w-full p-4 font-bold"
                  placeholder="Name as per bank"
                  value={form.accountHolder}
                  onChange={e => setForm({ ...form, accountHolder: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">Bank Name</label>
                <input
                  className="clay-input w-full p-4 font-bold"
                  placeholder="e.g. State Bank of India"
                  value={form.bankName}
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">Account Number</label>
                <input
                  className="clay-input w-full p-4 font-bold"
                  placeholder="Account number"
                  value={form.accountNumber}
                  onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">IFSC Code</label>
                <input
                  className="clay-input w-full p-4 font-bold uppercase"
                  placeholder="e.g. SBIN0001234"
                  value={form.ifsc}
                  onChange={e => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">Account Type</label>
                <select
                  className="clay-input w-full p-4 font-bold"
                  value={form.accountType}
                  onChange={e => setForm({ ...form, accountType: e.target.value })}
                >
                  <option value="Current">Current Account</option>
                  <option value="Savings">Savings Account</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">UPI ID (for QR code on invoices)</label>
                <input
                  className="clay-input w-full p-4 font-bold"
                  placeholder="yourname@upi"
                  value={form.upiId}
                  onChange={e => setForm({ ...form, upiId: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Sync Tab */}
      {activeTab === 'calendar' && (
        <div className="clay-card p-10 bg-white dark:bg-slate-800 border-none shadow-2xl animate-in slide-in-from-right-4">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
            <Calendar className="text-indigo-600" /> Google Calendar Sync
          </h3>

          <div className="space-y-8">
            {/* Connection Status */}
            <div className={`p-6 rounded-2xl border-2 ${isGoogleConnected ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-700 dark:border-slate-600'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isGoogleConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    {isGoogleConnected ? (
                      <CheckCircle className="text-white" size={24} />
                    ) : (
                      <Link2 className="text-white" size={24} />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-lg text-slate-800 dark:text-white">
                      {isGoogleConnected ? 'Google Calendar Connected' : 'Google Calendar Not Connected'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {isGoogleConnected
                        ? 'Your hearings can be synced to Google Calendar'
                        : 'Connect your Google account to sync hearings'}
                    </p>
                  </div>
                </div>
                {!isGoogleConnected && (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={connectingGoogle}
                    className="clay-button px-6 py-3 font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {connectingGoogle ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Connect Google
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
              <h4 className="font-black text-indigo-800 dark:text-indigo-300 mb-3">How Calendar Sync Works</h4>
              <ul className="space-y-2 text-sm text-indigo-700 dark:text-indigo-400">
                <li>• Connect your Google account to enable calendar sync</li>
                <li>• Go to Dashboard and click "Sync to Calendar" button</li>
                <li>• All your upcoming hearings will be added as calendar events</li>
                <li>• Events include case details, forum, and client information</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfileView;
