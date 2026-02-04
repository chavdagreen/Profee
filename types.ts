
export interface Client {
  id: string;
  name: string;
  pan: string;
  group: string;
  entityType: 'Individual' | 'Company' | 'Firm' | 'HUF';
  contact: string;
  email?: string;
  address?: string;
  portalPassword?: string;
  gstin?: string;
}

export interface ProceedingLog {
  id: string;
  date: string;
  action: string;
  description: string;
  remarks?: string;
}

export interface Hearing {
  id: string;
  clientId: string;
  clientName: string;
  caseType: string;
  issueDate?: string; // Date notice was issued
  hearingDate: string;
  time: string;
  forum: string;
  status: 'Upcoming' | 'Adjourned' | 'Concluded' | 'Cancelled';
  assessmentYear: string;
  description?: string;
  logs?: ProceedingLog[];
  isCritical?: boolean;
  quotedFees?: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  subNotes?: string; 
  notes?: string;
  hsn: string;
  qty: number;
  rate: number;
  gstPercent: number;
}

export interface BankDetails {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  accountType: string;
  bankName: string;
  upiId: string;
}

export interface BillingSettings {
  themeColor: string;
  prefix: string;
  isGstApplicable: boolean;
  gstin: string;
  pan: string;
  address: string;
  practiceName: string;
  isAutoNumbering: boolean;
  lastNumber: number;
  bankDetails: BankDetails;
  terms: string[];
  defaultNotes: string; 
  notes: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  clientGstin?: string;
  clientPan?: string;
  date: string;
  dueDate: string;
  placeOfSupply: string;
  countryOfSupply: string;
  items: InvoiceItem[];
  subTotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  total: number;
  status: 'Paid' | 'Unpaid' | 'Draft';
  themeColor: string;
  assessmentYear?: string;
  caseType?: string;
  notes?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  clientId?: string; 
  groupId?: string; 
  clientName: string;
  date: string;
  amount: number;
  settlementDiscount?: number;
  paymentMethod: 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque';
  reference?: string;
  invoiceIds?: string[];
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  particulars: string;
  type: 'Invoice' | 'Receipt' | 'Discount';
  debit: number;
  credit: number;
  balance: number;
}

export type View = 'dashboard' | 'clients' | 'proceedings' | 'billing';
