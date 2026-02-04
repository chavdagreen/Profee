
import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, Client, Receipt, BillingSettings, LedgerEntry, InvoiceItem } from '../types';
import { 
  ReceiptIndianRupee, Download, Plus, ChevronLeft, Printer, FileText, 
  Sparkles, Search, Eye, Settings, Palette, Tag, CheckCircle2, Wallet, 
  Banknote, Smartphone, Hash, X, Trash2, Smartphone as UpiIcon, Table,
  Edit2, FileDown, CheckCircle, Clock, AlertTriangle, QrCode, ChevronRight
} from 'lucide-react';

interface BillingViewProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  clients: Client[];
  receipts: Receipt[];
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  groups: string[];
  settings: BillingSettings;
  setSettings: React.Dispatch<React.SetStateAction<BillingSettings>>;
  prefill?: Partial<Invoice> | null;
  onPrefillProcessed?: () => void;
}

const BillingView: React.FC<BillingViewProps> = ({ 
  invoices, setInvoices, clients, receipts, setReceipts, groups, settings, setSettings, prefill, onPrefillProcessed 
}) => {
  const [subView, setSubView] = useState<'list' | 'create' | 'settings' | 'invoice-preview' | 'groups' | 'create-receipt' | 'receipt-preview'>('list');
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts'>('invoices');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize Invoice Form
  const initialInvoiceState: Partial<Invoice> = {
    invoiceNumber: settings.isAutoNumbering ? `${settings.prefix}${(settings.lastNumber + 1).toString().padStart(3, '0')}` : '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 864000000).toISOString().split('T')[0],
    items: [{ id: '1', description: '', hsn: '9982', qty: 1, rate: 0, gstPercent: settings.isGstApplicable ? 18 : 0 }],
    discountPercent: 0,
    discountAmount: 0,
    clientId: '',
    notes: settings.defaultNotes,
    placeOfSupply: 'Maharashtra',
    countryOfSupply: 'India'
  };

  const [invoiceForm, setInvoiceForm] = useState<Partial<Invoice>>(initialInvoiceState);

  // Initialize Receipt Form
  const [receiptForm, setReceiptForm] = useState<Partial<Receipt>>({
    receiptNumber: `RCP/${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'UPI',
    clientId: ''
  });

  // Handle prefill from Matter/litigation view
  useEffect(() => {
    if (prefill) {
      setInvoiceForm(prev => ({
        ...prev,
        ...prefill,
        items: prefill.items || prev.items
      }));
      setSubView('create');
      if (onPrefillProcessed) onPrefillProcessed();
    }
  }, [prefill]);

  const totals = useMemo(() => {
    const subTotal = (invoiceForm.items || []).reduce((acc, item) => acc + (item.qty * item.rate), 0);
    const discAmount = (subTotal * (invoiceForm.discountPercent || 0)) / 100;
    const taxableAmount = subTotal - discAmount;
    const gstTotal = (invoiceForm.items || []).reduce((acc, item) => {
        const itemTaxable = (item.qty * item.rate) - (item.qty * item.rate * (invoiceForm.discountPercent || 0) / 100);
        return acc + (itemTaxable * (item.gstPercent / 100));
    }, 0);
    return { subTotal, discAmount, taxableAmount, gstTotal, total: taxableAmount + gstTotal };
  }, [invoiceForm.items, invoiceForm.discountPercent]);

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.clientId) return;
    const client = clients.find(c => c.id === invoiceForm.clientId);
    const updatedInvoice: Invoice = {
      ...invoiceForm as Invoice,
      id: isEditing ? (invoiceForm.id || `inv-${Date.now()}`) : `inv-${Date.now()}`,
      clientName: client?.name || 'Unknown',
      clientAddress: client?.address,
      clientGstin: client?.gstin,
      clientPan: client?.pan,
      subTotal: totals.subTotal,
      discountAmount: totals.discAmount,
      taxableAmount: totals.taxableAmount,
      gstTotal: totals.gstTotal,
      cgstTotal: totals.gstTotal / 2,
      sgstTotal: totals.gstTotal / 2,
      total: totals.total,
      themeColor: settings.themeColor,
      status: 'Unpaid'
    };

    if (isEditing) {
      setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
    } else {
      setInvoices(prev => [updatedInvoice, ...prev]);
      if (settings.isAutoNumbering) {
        setSettings(prev => ({ ...prev, lastNumber: prev.lastNumber + 1 }));
      }
    }
    
    setCurrentInvoice(updatedInvoice);
    setSubView('invoice-preview');
    setIsEditing(false);
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptForm.clientId) return;
    const client = clients.find(c => c.id === receiptForm.clientId);
    const newReceipt: Receipt = {
      ...receiptForm as Receipt,
      id: `rcp-${Date.now()}`,
      clientName: client?.name || 'Unknown'
    };
    setReceipts(prev => [newReceipt, ...prev]);
    setCurrentReceipt(newReceipt);
    setSubView('receipt-preview');
  };

  const startEditInvoice = (inv: Invoice) => {
    setInvoiceForm(inv);
    setIsEditing(true);
    setSubView('create');
  };

  const numberToWords = (num: number) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const format = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'And ' + format(n % 100) : '');
      if (n < 100000) return format(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? format(n % 1000) : '');
      return n.toString();
    };
    return format(Math.floor(num)) + 'Rupees Only';
  };

  const InvoiceTemplate = ({ invoice }: { invoice: Invoice }) => (
    <div className="bg-white p-12 shadow-2xl rounded-3xl max-w-[850px] mx-auto text-slate-800 font-sans print:shadow-none print:p-8" id="invoice-capture">
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-indigo-600 tracking-tighter uppercase" style={{ color: invoice.themeColor }}>Invoice</h1>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice#</p>
            <p className="font-bold text-sm">{invoice.invoiceNumber}</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
              <p className="font-bold text-sm uppercase">{new Date(invoice.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
              <p className="font-bold text-sm uppercase">{new Date(invoice.dueDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-2">
            <Sparkles className="text-indigo-600" style={{ color: invoice.themeColor }} />
            <h2 className="text-2xl font-black tracking-tighter uppercase">{settings.practiceName}</h2>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Tax Professionals & Consultants</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="clay-card bg-indigo-50/30 p-6 border-none rounded-3xl">
           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3" style={{ color: invoice.themeColor }}>Billed By</p>
           <p className="font-black text-sm uppercase mb-1">{settings.practiceName}</p>
           <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-3">{settings.address}</p>
           <p className="text-[10px] font-black uppercase"><span className="text-slate-400">GSTIN</span> {settings.gstin}</p>
           <p className="text-[10px] font-black uppercase"><span className="text-slate-400">PAN</span> {settings.pan}</p>
        </div>
        <div className="clay-card bg-slate-50 p-6 border-none rounded-3xl">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Billed To</p>
           <p className="font-black text-sm uppercase mb-1">{invoice.clientName}</p>
           <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-3">{invoice.clientAddress || 'Address details on file'}</p>
           <p className="text-[10px] font-black uppercase"><span className="text-slate-400">GSTIN</span> {invoice.clientGstin || 'URD'}</p>
           <p className="text-[10px] font-black uppercase"><span className="text-slate-400">PAN</span> {invoice.clientPan || 'NA'}</p>
        </div>
      </div>

      <div className="flex justify-between items-center px-6 py-2 bg-slate-50 rounded-xl mb-6 text-[10px] font-black uppercase tracking-widest">
        <span>Place of Supply: <b className="text-slate-800">{invoice.placeOfSupply}</b></span>
        <span>Country of Supply: <b className="text-slate-800">{invoice.countryOfSupply}</b></span>
      </div>

      <div className="mb-12">
        <table className="w-full text-left">
          <thead className="bg-indigo-600 text-white" style={{ backgroundColor: invoice.themeColor }}>
            <tr className="text-[9px] font-black uppercase tracking-widest">
              <th className="px-6 py-4 rounded-l-2xl"># / Description</th>
              <th className="px-4 py-4">HSN</th>
              <th className="px-4 py-4 text-center">Qty</th>
              {settings.isGstApplicable && <th className="px-4 py-4 text-center">GST</th>}
              <th className="px-4 py-4 text-right">Taxable</th>
              {settings.isGstApplicable && <th className="px-4 py-4 text-right">SGST</th>}
              {settings.isGstApplicable && <th className="px-4 py-4 text-right">CGST</th>}
              <th className="px-6 py-4 text-right rounded-r-2xl">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(invoice.items || []).map((item, i) => {
              const taxable = (item.qty * item.rate) - (item.qty * item.rate * (invoice.discountPercent || 0) / 100);
              const tax = taxable * (item.gstPercent / 100);
              return (
                <tr key={item.id} className="text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-6 flex gap-3">
                    <span className="text-slate-300">{i + 1}.</span>
                    <div>
                      <p className="text-slate-800 font-black uppercase tracking-tight">{item.description}</p>
                      {item.subNotes && <p className="text-[9px] text-slate-400 mt-1">{item.subNotes}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-6 text-slate-400">{item.hsn}</td>
                  <td className="px-4 py-6 text-center">{item.qty}</td>
                  {settings.isGstApplicable && <td className="px-4 py-6 text-center text-[10px] font-black">{item.gstPercent}%</td>}
                  <td className="px-4 py-6 text-right">₹{(taxable || 0).toLocaleString()}</td>
                  {settings.isGstApplicable && <td className="px-4 py-6 text-right text-slate-400">₹{(tax / 2 || 0).toLocaleString()}</td>}
                  {settings.isGstApplicable && <td className="px-4 py-6 text-right text-slate-400">₹{(tax / 2 || 0).toLocaleString()}</td>}
                  <td className="px-6 py-6 text-right font-black text-slate-800">₹{((taxable || 0) + (tax || 0)).toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="space-y-10">
           <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4" style={{ color: invoice.themeColor }}>Bank & Payment Details</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  ['Holder Name', settings.bankDetails.accountHolder],
                  ['Account No.', settings.bankDetails.accountNumber],
                  ['IFSC Code', settings.bankDetails.ifsc],
                  ['Account Type', settings.bankDetails.accountType],
                  ['Bank Name', settings.bankDetails.bankName],
                  ['UPI ID', settings.bankDetails.upiId]
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[8px] font-black text-slate-300 uppercase leading-none">{label}</p>
                    <p className="text-[10px] font-bold text-slate-600">{value}</p>
                  </div>
                ))}
              </div>
           </div>
           <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Terms & Conditions</h4>
              <ul className="space-y-1">
                {settings.terms.map((t, i) => <li key={i} className="text-[9px] text-slate-500 font-bold">{i+1}. {t}</li>)}
              </ul>
           </div>
        </div>

        <div className="space-y-4">
           {[
             ['Sub Total', `₹${(invoice.subTotal || 0).toLocaleString()}`],
             [`Discount (${invoice.discountPercent || 0}%)`, `- ₹${(invoice.discountAmount || 0).toLocaleString()}`, 'text-emerald-500'],
             ['Taxable Amount', `₹${(invoice.taxableAmount || 0).toLocaleString()}`],
             ['CGST', `₹${(invoice.cgstTotal || 0).toLocaleString()}`],
             ['SGST', `₹${(invoice.sgstTotal || 0).toLocaleString()}`]
           ].map(([label, val, cls]) => (
             <div key={label} className="flex justify-between items-center text-sm font-bold">
               <span className="text-slate-400">{label}</span>
               <span className={cls || 'text-slate-800'}>{val}</span>
             </div>
           ))}
           <div className="pt-4 border-t-4 border-indigo-600 flex justify-between items-end" style={{ borderColor: invoice.themeColor }}>
              <span className="text-xl font-black uppercase tracking-tighter">Total</span>
              <span className="text-3xl font-black tracking-tighter">₹{(invoice.total || 0).toLocaleString()}</span>
           </div>
           <div className="pt-2">
              <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Total (In Words)</p>
              <p className="text-xs font-black text-indigo-600 uppercase italic leading-tight" style={{ color: invoice.themeColor }}>{numberToWords(invoice.total || 0)}</p>
           </div>
        </div>
      </div>

      <div className="pt-12 border-t border-slate-50 flex justify-between items-end">
         <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Additional Notes</h4>
            <p className="text-[9px] text-slate-400 max-w-sm italic leading-relaxed">{invoice.notes}</p>
         </div>
         <div className="text-right">
            <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Authorized Signatory</p>
            <div className="h-10"></div>
            <p className="text-xs font-black uppercase tracking-tighter">{settings.practiceName}</p>
         </div>
      </div>
    </div>
  );

  const ReceiptTemplate = ({ receipt }: { receipt: Receipt }) => (
    <div className="bg-white p-12 shadow-2xl rounded-[3rem] max-w-[700px] mx-auto text-slate-800 font-sans border-[12px] border-emerald-50 relative overflow-hidden print:shadow-none print:border-none" id="receipt-capture">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500 opacity-5 rounded-full blur-3xl"></div>
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-emerald-500 text-white px-6 py-2 rounded-2xl w-fit">
            <CheckCircle size={20} />
            <h1 className="text-xl font-black uppercase tracking-widest">Payment Receipt</h1>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ref: {receipt.receiptNumber}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-black tracking-tighter uppercase">{settings.practiceName}</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Official Payment Confirmation</p>
        </div>
      </div>

      <div className="clay-card bg-slate-50/50 p-10 border-none rounded-[3rem] mb-12 space-y-8">
         <div className="flex justify-between border-b border-white pb-6">
            <div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Received From</p>
              <p className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{receipt.clientName}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Payment Date</p>
              <p className="text-lg font-black text-slate-600 uppercase">{new Date(receipt.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
         </div>

         <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Mode of Payment</p>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <Banknote size={14} className="text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-tight">{receipt.paymentMethod}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Transaction Ref</p>
              <p className="text-sm font-bold text-slate-500">{receipt.reference || 'SYSTEM_RECORD'}</p>
            </div>
         </div>

         <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-emerald-100">
            <div>
               <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Amount Received</p>
               <p className="text-4xl font-black tracking-tighter">₹{(receipt.amount || 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
               <QrCode size={48} className="opacity-30" />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-12 text-[10px]">
        <div>
           <p className="font-black text-slate-300 uppercase tracking-widest mb-3">Amount In Words</p>
           <p className="font-black text-slate-600 uppercase leading-relaxed italic">{numberToWords(receipt.amount || 0)}</p>
        </div>
        <div className="text-right">
           <p className="font-black text-slate-300 uppercase tracking-widest mb-6">Authorized By</p>
           <div className="w-40 h-px bg-slate-100 ml-auto mb-2"></div>
           <p className="font-black text-slate-800 uppercase tracking-tighter">{settings.practiceName}</p>
        </div>
      </div>
    </div>
  );

  if (subView === 'invoice-preview' && currentInvoice) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
         <div className="flex items-center justify-between no-print max-w-[850px] mx-auto">
            <button onClick={() => setSubView('list')} className="flex items-center gap-2 text-indigo-600 font-black hover:scale-105 transition-transform"><ChevronLeft size={20} /> Back to Invoices</button>
            <div className="flex gap-4">
               <button onClick={() => startEditInvoice(currentInvoice)} className="clay-card px-6 py-2 bg-slate-100 flex items-center gap-2 font-black text-xs hover:bg-slate-200 transition-all border-none shadow-sm"><Edit2 size={16} /> Edit Draft</button>
               <button onClick={() => window.print()} className="clay-button px-8 py-2 flex items-center gap-2 font-black shadow-lg"><Printer size={20} /> Download PDF / Print</button>
            </div>
         </div>
         <InvoiceTemplate invoice={currentInvoice} />
      </div>
    );
  }

  if (subView === 'receipt-preview' && currentReceipt) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
         <div className="flex items-center justify-between no-print max-w-[700px] mx-auto">
            <button onClick={() => setSubView('list')} className="flex items-center gap-2 text-indigo-600 font-black hover:scale-105 transition-transform"><ChevronLeft size={20} /> Back to Records</button>
            <button onClick={() => window.print()} className="clay-button px-8 py-2 bg-emerald-600 flex items-center gap-2 font-black shadow-lg"><Printer size={20} /> Print Receipt</button>
         </div>
         <ReceiptTemplate receipt={currentReceipt} />
      </div>
    );
  }

  if (subView === 'create' || subView === 'create-receipt') {
    const isReceipt = subView === 'create-receipt';
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 no-print">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setSubView('list')} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline"><ChevronLeft size={20} /> Discard {isReceipt ? 'Receipt' : 'Invoice'}</button>
          {!isReceipt && (
            <div className="flex gap-8 text-right">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub-Total</p><p className="text-xl font-bold">₹{(totals.subTotal || 0).toLocaleString()}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable</p><p className="text-2xl font-black text-indigo-600">₹{(totals.total || 0).toLocaleString()}</p></div>
            </div>
          )}
        </div>

        <div className="clay-card p-10 bg-white dark:bg-slate-800 border-none shadow-2xl">
          <form onSubmit={isReceipt ? handleSaveReceipt : handleSaveInvoice} className="space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2 col-span-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Debtor</label>
                   <select required className="clay-input w-full p-4 font-bold" 
                    value={isReceipt ? receiptForm.clientId : invoiceForm.clientId} 
                    onChange={e => isReceipt ? setReceiptForm({...receiptForm, clientId: e.target.value}) : setInvoiceForm({...invoiceForm, clientId: e.target.value})}>
                     <option value="">Choose party...</option>
                     {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isReceipt ? 'Receipt' : 'Invoice'} Number</label>
                   <input className="clay-input w-full p-4 font-bold" 
                    readOnly={!isReceipt && settings.isAutoNumbering && !isEditing}
                    value={isReceipt ? receiptForm.receiptNumber : invoiceForm.invoiceNumber} 
                    onChange={e => isReceipt ? setReceiptForm({...receiptForm, receiptNumber: e.target.value}) : setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                   <input type="date" className="clay-input w-full p-4 font-bold" 
                    value={isReceipt ? receiptForm.date : invoiceForm.date} 
                    onChange={e => isReceipt ? setReceiptForm({...receiptForm, date: e.target.value}) : setInvoiceForm({...invoiceForm, date: e.target.value})} />
                </div>
             </div>

             {isReceipt ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Received (₹)</label>
                     <input type="number" required className="clay-input w-full p-4 font-bold text-emerald-600 text-2xl" value={receiptForm.amount} onChange={e => setReceiptForm({...receiptForm, amount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                     <select className="clay-input w-full p-4 font-bold" value={receiptForm.paymentMethod} onChange={e => setReceiptForm({...receiptForm, paymentMethod: e.target.value as any})}>
                       <option value="UPI">UPI / G-Pay</option>
                       <option value="Bank Transfer">NEFT / RTGS / IMPS</option>
                       <option value="Cash">Cash Payment</option>
                       <option value="Cheque">Cheque / DD</option>
                     </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Reference (Optional)</label>
                     <input placeholder="UTR No. or Remarks" className="clay-input w-full p-4 font-bold" value={receiptForm.reference} onChange={e => setReceiptForm({...receiptForm, reference: e.target.value})} />
                  </div>
                </div>
             ) : (
                <>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2"><Tag size={18} className="text-indigo-600" /> Line Items</h4>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                            <label className="text-[9px] font-black uppercase text-slate-400">Apply GST</label>
                            <div className={`w-3 h-3 rounded-full ${settings.isGstApplicable ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                         </div>
                      </div>
                    </div>
                    {(invoiceForm.items || []).map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl group transition-all hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-indigo-50">
                          <div className="col-span-12 md:col-span-5 space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase">Service Description</label>
                            <input required className="clay-input w-full p-3 font-bold text-sm" value={item.description} onChange={e => {
                              const newItems = [...invoiceForm.items!];
                              newItems[idx].description = e.target.value;
                              setInvoiceForm({...invoiceForm, items: newItems});
                            }} />
                          </div>
                          {settings.isGstApplicable && (
                            <div className="col-span-3 md:col-span-2 space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">SAC/HSN</label>
                              <input className="clay-input w-full p-3 font-bold text-sm text-center" value={item.hsn} onChange={e => {
                                const newItems = [...invoiceForm.items!];
                                newItems[idx].hsn = e.target.value;
                                setInvoiceForm({...invoiceForm, items: newItems});
                              }} />
                            </div>
                          )}
                          <div className="col-span-3 md:col-span-2 space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase">Professional Fee (₹)</label>
                            <input type="number" required className="clay-input w-full p-3 font-bold text-sm text-right text-indigo-600" value={item.rate} onChange={e => {
                              const newItems = [...invoiceForm.items!];
                              newItems[idx].rate = Number(e.target.value);
                              setInvoiceForm({...invoiceForm, items: newItems});
                            }} />
                          </div>
                          {settings.isGstApplicable && (
                            <div className="col-span-3 md:col-span-2 space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">GST %</label>
                              <select className="clay-input w-full p-3 font-bold text-sm" value={item.gstPercent} onChange={e => {
                                const newItems = [...invoiceForm.items!];
                                newItems[idx].gstPercent = Number(e.target.value);
                                setInvoiceForm({...invoiceForm, items: newItems});
                              }}>
                                <option value={0}>Exempt</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18%</option>
                                <option value={28}>28%</option>
                              </select>
                            </div>
                          )}
                          <div className="col-span-3 md:col-span-1 flex items-end justify-center pb-3">
                            <button type="button" onClick={() => {
                              const newItems = invoiceForm.items!.filter((_, i) => i !== idx);
                              setInvoiceForm({...invoiceForm, items: newItems});
                            }} className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={20} /></button>
                          </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setInvoiceForm({...invoiceForm, items: [...(invoiceForm.items || []), { id: Date.now().toString(), description: '', hsn: '9982', qty: 1, rate: 0, gstPercent: settings.isGstApplicable ? 18 : 0 }]})} className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"><Plus size={16} /> Add Charge Item</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apply Special Discount (%)</label>
                          <input type="number" className="clay-input w-full p-4 font-bold text-emerald-600" value={invoiceForm.discountPercent} onChange={e => {
                            const dPct = Number(e.target.value);
                            setInvoiceForm({...invoiceForm, discountPercent: dPct, discountAmount: (totals.subTotal * dPct / 100)});
                          }} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Notes</label>
                          <textarea className="clay-input w-full p-4 font-bold text-sm" rows={4} value={invoiceForm.notes} onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})} />
                       </div>
                    </div>
                    <div className="clay-card bg-slate-50 p-8 border-none space-y-4 h-fit">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Financial Breakdown</h5>
                       <div className="space-y-3">
                          <div className="flex justify-between text-xs font-bold"><span>Taxable Value</span><span>₹{(totals.taxableAmount || 0).toLocaleString()}</span></div>
                          {settings.isGstApplicable && (
                            <>
                              <div className="flex justify-between text-xs font-bold text-slate-400"><span>CGST (Output)</span><span>₹{(totals.gstTotal / 2 || 0).toLocaleString()}</span></div>
                              <div className="flex justify-between text-xs font-bold text-slate-400"><span>SGST (Output)</span><span>₹{(totals.gstTotal / 2 || 0).toLocaleString()}</span></div>
                            </>
                          )}
                          <div className="pt-4 border-t flex justify-between text-2xl font-black text-indigo-600 tracking-tighter"><span>Grand Total</span><span>₹{(totals.total || 0).toLocaleString()}</span></div>
                       </div>
                    </div>
                  </div>
                </>
             )}

             <button type="submit" className={`clay-button w-full py-6 font-black text-2xl flex items-center justify-center gap-3 shadow-xl ${isReceipt ? 'bg-emerald-600' : ''}`}>
                <Sparkles size={32} /> {isReceipt ? 'Record Professional Receipt' : (isEditing ? 'Update Professional Bill' : 'Generate Professional Bill')}
             </button>
          </form>
        </div>
      </div>
    );
  }

  if (subView === 'settings') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 no-print">
         <div className="flex items-center justify-between">
           <button onClick={() => setSubView('list')} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline"><ChevronLeft size={20} /> Back to Financials</button>
           <h2 className="text-3xl font-black tracking-tighter uppercase">Configuration</h2>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <div className="clay-card p-10 bg-white dark:bg-slate-800 border-none shadow-2xl">
                  <h3 className="text-xl font-black uppercase tracking-widest mb-8 border-b pb-4 flex items-center gap-3"><Settings className="text-indigo-600" /> Practice & Identity</h3>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Theme Color (Invoice Layout)</label><div className="flex gap-4">{['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#0f172a', '#7c3aed', '#db2777'].map(c => <button key={c} onClick={() => setSettings({...settings, themeColor: c})} className={`w-12 h-12 rounded-2xl border-4 ${settings.themeColor === c ? 'border-indigo-200 scale-110 shadow-lg' : 'border-transparent'}`} style={{backgroundColor: c}} />)}</div></div>
                     <div className="col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firm Name</label><input className="clay-input w-full p-4 font-bold" value={settings.practiceName} onChange={e => setSettings({...settings, practiceName: e.target.value})} /></div>
                     <div className="col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address Line</label><textarea className="clay-input w-full p-4 font-bold" rows={2} value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} /></div>
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GSTIN Number</label><input className="clay-input w-full p-4 font-bold" value={settings.gstin} onChange={e => setSettings({...settings, gstin: e.target.value.toUpperCase()})} /></div>
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permanent Account No. (PAN)</label><input className="clay-input w-full p-4 font-bold" value={settings.pan} onChange={e => setSettings({...settings, pan: e.target.value.toUpperCase()})} /></div>
                  </div>
               </div>

               <div className="clay-card p-10 bg-white dark:bg-slate-800 border-none shadow-2xl">
                  <h3 className="text-xl font-black uppercase tracking-widest mb-8 border-b pb-4">Accounting Logic</h3>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between">
                        <div><p className="font-black text-sm uppercase tracking-tight">GST Compliance Mode</p><p className="text-[9px] text-slate-400 uppercase font-bold">Shows tax columns in invoice create</p></div>
                        <button onClick={() => setSettings({...settings, isGstApplicable: !settings.isGstApplicable})} className={`w-14 h-8 rounded-full transition-all relative p-1 ${settings.isGstApplicable ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`w-6 h-6 bg-white rounded-full transition-all ${settings.isGstApplicable ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between">
                        <div><p className="font-black text-sm uppercase tracking-tight">Auto-Numbering</p><p className="text-[9px] text-slate-400 uppercase font-bold">Increment invoice# automatically</p></div>
                        <button onClick={() => setSettings({...settings, isAutoNumbering: !settings.isAutoNumbering})} className={`w-14 h-8 rounded-full transition-all relative p-1 ${settings.isAutoNumbering ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`w-6 h-6 bg-white rounded-full transition-all ${settings.isAutoNumbering ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
                     </div>
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Prefix</label><input className="clay-input w-full p-4 font-bold" value={settings.prefix} onChange={e => setSettings({...settings, prefix: e.target.value})} /></div>
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Serial No.</label><input type="number" className="clay-input w-full p-4 font-bold" value={settings.lastNumber} onChange={e => setSettings({...settings, lastNumber: Number(e.target.value)})} /></div>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <div className="clay-card p-8 bg-white dark:bg-slate-800 border-none shadow-2xl">
                  <h3 className="text-lg font-black uppercase tracking-widest mb-6">Default Note (Invoices)</h3>
                  <textarea className="clay-input w-full p-4 font-bold text-xs" rows={6} value={settings.defaultNotes} onChange={e => setSettings({...settings, defaultNotes: e.target.value})} />
                  <p className="text-[9px] text-slate-400 mt-4 uppercase font-bold tracking-widest">This will appear on the bottom left of every professional bill generated.</p>
               </div>

               <div className="clay-card p-8 bg-indigo-600 text-white border-none shadow-xl">
                  <h3 className="text-lg font-black uppercase tracking-widest mb-4">Banking Link</h3>
                  <div className="space-y-4">
                     <div className="space-y-1"><p className="text-[8px] font-black uppercase opacity-60">UPI ID for Payments</p><input className="bg-white/10 w-full p-3 rounded-xl border border-white/20 font-bold text-sm" value={settings.bankDetails.upiId} onChange={e => setSettings({...settings, bankDetails: {...settings.bankDetails, upiId: e.target.value}})} /></div>
                     <div className="space-y-1"><p className="text-[8px] font-black uppercase opacity-60">Account Number</p><input className="bg-white/10 w-full p-3 rounded-xl border border-white/20 font-bold text-sm" value={settings.bankDetails.accountNumber} onChange={e => setSettings({...settings, bankDetails: {...settings.bankDetails, accountNumber: e.target.value}})} /></div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in no-print">
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">Revenue Control</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Practice Billing & Professional Accounting</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setSubView('settings')} className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><Settings size={24} /></button>
           <button onClick={() => setSubView('groups')} className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><Smartphone size={24} /></button>
           <button onClick={() => { setReceiptForm({ ...receiptForm, receiptNumber: `RCP/${Date.now().toString().slice(-4)}`, date: new Date().toISOString().split('T')[0] }); setSubView('create-receipt'); }} className="clay-button bg-emerald-600 px-6 py-3 font-black flex items-center gap-2 shadow-lg"><Wallet size={24} /> Record Receipt</button>
           <button onClick={() => { setIsEditing(false); setInvoiceForm(initialInvoiceState); setSubView('create'); }} className="clay-button px-8 py-3 font-black flex items-center gap-2 shadow-lg"><Plus size={24} /> Raise Invoice</button>
        </div>
      </div>

      <div className="clay-card bg-white dark:bg-slate-800 border-none overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex flex-col md:flex-row items-center gap-4 bg-slate-50/20">
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-full md:w-auto">
            <button onClick={() => setActiveTab('invoices')} className={`flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'invoices' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>Invoices</button>
            <button onClick={() => setActiveTab('receipts')} className={`flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'receipts' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>Receipts</button>
          </div>
          <div className="relative flex-1 w-full md:w-auto"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/><input placeholder="Search records..." className="clay-input pl-12 pr-4 py-3 w-full text-sm font-bold" /></div>
        </div>
        
        <table className="w-full text-left font-bold text-sm">
           <thead>
             <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-slate-700">
               <th className="px-6 py-5">Number</th>
               <th className="px-6 py-5">Party</th>
               <th className="px-6 py-5">Date</th>
               <th className="px-6 py-5 text-right">Amount (₹)</th>
               <th className="px-6 py-5 text-center">Status</th>
               <th className="px-6 py-5 text-right">Action</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
             {activeTab === 'invoices' ? invoices.map(inv => (
               <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                 <td className="px-6 py-5 text-slate-400 font-medium">{inv.invoiceNumber}</td>
                 <td className="px-6 py-5 text-slate-800 dark:text-white font-black uppercase tracking-tight">{inv.clientName}</td>
                 <td className="px-6 py-5 text-slate-400 font-medium text-xs">{inv.date}</td>
                 <td className="px-6 py-5 text-right text-indigo-600 font-black">₹{(inv.total || 0).toLocaleString()}</td>
                 <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] uppercase font-black border border-indigo-100">{inv.status}</span></td>
                 <td className="px-6 py-5 text-right">
                   <div className="flex items-center gap-3 justify-end">
                      <button onClick={(e) => { e.stopPropagation(); startEditInvoice(inv); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={18}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentInvoice(inv); setSubView('invoice-preview'); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Eye size={18} /></button>
                   </div>
                 </td>
               </tr>
             )) : receipts.map(rcp => (
               <tr key={rcp.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => { setCurrentReceipt(rcp); setSubView('receipt-preview'); }}>
                 <td className="px-6 py-5 text-slate-400 font-medium">{rcp.receiptNumber}</td>
                 <td className="px-6 py-5 text-slate-800 dark:text-white font-black uppercase tracking-tight">{rcp.clientName}</td>
                 <td className="px-6 py-5 text-slate-400 font-medium text-xs">{rcp.date}</td>
                 <td className="px-6 py-5 text-right text-emerald-600 font-black">₹{(rcp.amount || 0).toLocaleString()}</td>
                 <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] uppercase font-black border border-emerald-100">{rcp.paymentMethod}</span></td>
                 <td className="px-6 py-5 text-right"><Printer size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors inline cursor-pointer" /></td>
               </tr>
             ))}
           </tbody>
        </table>
        {((activeTab === 'invoices' && invoices.length === 0) || (activeTab === 'receipts' && receipts.length === 0)) && (
          <div className="p-20 text-center flex flex-col items-center justify-center opacity-20">
            <Search size={48} className="mb-4" />
            <p className="font-black uppercase tracking-widest text-sm">No transaction records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingView;
