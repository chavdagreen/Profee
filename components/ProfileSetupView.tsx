
import React, { useState } from 'react';
import { BillingSettings } from '../types';
import { Sparkles, ArrowRight, Building2, MapPin, CreditCard, Phone, Mail, Landmark } from 'lucide-react';

interface ProfileSetupViewProps {
  settings: BillingSettings;
  onComplete: (settings: BillingSettings) => void;
}

const ProfileSetupView: React.FC<ProfileSetupViewProps> = ({ settings, onComplete }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    practiceName: settings.practiceName === 'My Practice' ? '' : settings.practiceName,
    address: settings.address || '',
    pan: settings.pan || '',
    gstin: settings.gstin || '',
    accountHolder: settings.bankDetails?.accountHolder || '',
    accountNumber: settings.bankDetails?.accountNumber || '',
    ifsc: settings.bankDetails?.ifsc || '',
    bankName: settings.bankDetails?.bankName || '',
    accountType: settings.bankDetails?.accountType || 'Current',
    upiId: settings.bankDetails?.upiId || '',
  });

  const handleFinish = () => {
    const updatedSettings: BillingSettings = {
      ...settings,
      practiceName: form.practiceName || 'My Practice',
      address: form.address,
      pan: form.pan,
      gstin: form.gstin,
      bankDetails: {
        accountHolder: form.accountHolder,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
        bankName: form.bankName,
        accountType: form.accountType,
        upiId: form.upiId,
      },
    };
    onComplete(updatedSettings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl inline-block mb-4">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">Welcome to Profee.in</h1>
          <p className="text-slate-400 font-bold text-sm">Let's set up your practice profile. This information will appear on your invoices and receipts.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8 px-4">
          {[1, 2].map(s => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>{s}</div>
              <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
            </div>
          ))}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step > 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>✓</div>
        </div>

        {/* Step 1: Practice Details */}
        {step === 1 && (
          <div className="clay-card p-10 border-none shadow-2xl bg-white dark:bg-slate-800 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <Building2 className="text-indigo-600" size={24} />
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Practice Details</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">Practice / Firm Name</label>
                <input className="clay-input w-full p-4 font-bold text-lg" placeholder="e.g. ABC & Associates" value={form.practiceName} onChange={e => setForm({...form, practiceName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">Office Address</label>
                <textarea className="clay-input w-full p-4 font-bold" rows={3} placeholder="Full office address for invoices" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">PAN Number</label>
                  <input className="clay-input w-full p-4 font-bold uppercase" placeholder="ABCDE1234F" maxLength={10} value={form.pan} onChange={e => setForm({...form, pan: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">GSTIN (if applicable)</label>
                  <input className="clay-input w-full p-4 font-bold uppercase" placeholder="22AAAAA0000A1Z5" maxLength={15} value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <button onClick={() => setStep(2)} className="clay-button px-8 py-4 font-black flex items-center gap-2 text-lg">
                Next <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Bank Details */}
        {step === 2 && (
          <div className="clay-card p-10 border-none shadow-2xl bg-white dark:bg-slate-800 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <Landmark className="text-indigo-600" size={24} />
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Bank & Payment Details</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6">These details will appear on your invoices for client payments. You can skip and fill later.</p>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">Account Holder Name</label>
                  <input className="clay-input w-full p-4 font-bold" placeholder="Name as per bank" value={form.accountHolder} onChange={e => setForm({...form, accountHolder: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">Bank Name</label>
                  <input className="clay-input w-full p-4 font-bold" placeholder="e.g. State Bank of India" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">Account Number</label>
                  <input className="clay-input w-full p-4 font-bold" placeholder="Account number" value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">IFSC Code</label>
                  <input className="clay-input w-full p-4 font-bold uppercase" placeholder="e.g. SBIN0001234" value={form.ifsc} onChange={e => setForm({...form, ifsc: e.target.value.toUpperCase()})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">Account Type</label>
                  <select className="clay-input w-full p-4 font-bold" value={form.accountType} onChange={e => setForm({...form, accountType: e.target.value})}>
                    <option value="Current">Current Account</option>
                    <option value="Savings">Savings Account</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400">UPI ID (for QR code on invoices)</label>
                  <input className="clay-input w-full p-4 font-bold" placeholder="yourname@upi" value={form.upiId} onChange={e => setForm({...form, upiId: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-400 font-bold hover:text-indigo-600 transition-colors">Back</button>
              <div className="flex gap-4">
                <button onClick={handleFinish} className="px-6 py-3 text-indigo-600 font-bold hover:underline">Skip for now</button>
                <button onClick={handleFinish} className="clay-button px-8 py-4 font-black flex items-center gap-2 text-lg">
                  Complete Setup <Sparkles size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSetupView;
