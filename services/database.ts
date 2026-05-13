import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { Client, Hearing, Invoice, Receipt, BillingSettings, InvoiceItem } from '../types';

// ============================================================
// HELPERS
// ============================================================

function userCol(uid: string, col: string) {
  return collection(firestore, 'users', uid, col);
}

function userDoc(uid: string, col: string, id: string) {
  return doc(firestore, 'users', uid, col, id);
}

function getCurrentUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

function toClient(id: string, data: any): Client {
  return {
    id,
    name: data.name,
    pan: data.pan,
    group: data.group_name,
    entityType: data.entity_type,
    contact: data.contact,
    email: data.email || undefined,
    address: data.address || undefined,
    portalPassword: data.portal_password || undefined,
    gstin: data.gstin || undefined,
  };
}

function toHearing(id: string, data: any): Hearing {
  return {
    id,
    clientId: data.client_id,
    clientName: data.client_name,
    caseType: data.case_type,
    issueDate: data.issue_date || undefined,
    hearingDate: data.hearing_date,
    time: data.time,
    forum: data.forum,
    status: data.status,
    assessmentYear: data.assessment_year,
    description: data.description || undefined,
    isCritical: data.is_critical || false,
    quotedFees: data.quoted_fees ? Number(data.quoted_fees) : undefined,
  };
}

function toInvoice(id: string, data: any): Invoice {
  return {
    id,
    invoiceNumber: data.invoice_number,
    clientId: data.client_id,
    clientName: data.client_name,
    clientAddress: data.client_address || undefined,
    clientGstin: data.client_gstin || undefined,
    clientPan: data.client_pan || undefined,
    date: data.date,
    dueDate: data.due_date,
    placeOfSupply: data.place_of_supply,
    countryOfSupply: data.country_of_supply,
    items: (data.items || []) as InvoiceItem[],
    subTotal: Number(data.sub_total),
    discountPercent: Number(data.discount_percent),
    discountAmount: Number(data.discount_amount),
    taxableAmount: Number(data.taxable_amount),
    gstTotal: Number(data.gst_total),
    cgstTotal: Number(data.cgst_total),
    sgstTotal: Number(data.sgst_total),
    total: Number(data.total),
    status: data.status,
    themeColor: data.theme_color,
    assessmentYear: data.assessment_year || undefined,
    caseType: data.case_type || undefined,
    notes: data.notes || undefined,
  };
}

function toReceipt(id: string, data: any): Receipt {
  return {
    id,
    receiptNumber: data.receipt_number,
    clientId: data.client_id || undefined,
    groupId: data.group_id || undefined,
    clientName: data.client_name,
    date: data.date,
    amount: Number(data.amount),
    settlementDiscount: data.settlement_discount ? Number(data.settlement_discount) : undefined,
    paymentMethod: data.payment_method,
    reference: data.reference || undefined,
    invoiceIds: data.invoice_ids || undefined,
    notes: data.notes || undefined,
  };
}

function toBillingSettings(data: any): BillingSettings {
  const bank = data.bank_details || {};
  return {
    practiceName: data.practice_name,
    address: data.address,
    pan: data.pan,
    gstin: data.gstin,
    themeColor: data.theme_color,
    prefix: data.prefix,
    isGstApplicable: data.is_gst_applicable,
    isAutoNumbering: data.is_auto_numbering,
    lastNumber: data.last_number,
    bankDetails: {
      accountHolder: bank.accountHolder || '',
      accountNumber: bank.accountNumber || '',
      ifsc: bank.ifsc || '',
      accountType: bank.accountType || 'Current',
      bankName: bank.bankName || '',
      upiId: bank.upiId || '',
    },
    terms: data.terms || [],
    defaultNotes: data.default_notes || '',
    notes: data.notes || '',
  };
}

// ============================================================
// AUTH
// ============================================================

export async function signUp(email: string, password: string, fullName: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: fullName });
  return user;
}

export async function signIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    localStorage.setItem('google_access_token', credential.accessToken);
  }
  return result.user;
}

export async function connectGoogleCalendar() {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.setCustomParameters({ access_type: 'offline', prompt: 'consent' });
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    // Use a dedicated key so it's never overwritten by basic Google sign-in
    localStorage.setItem('google_calendar_token', credential.accessToken);
    return true;
  }
  return false;
}

export function hasCalendarToken(): boolean {
  return !!localStorage.getItem('google_calendar_token');
}

export function clearCalendarToken() {
  localStorage.removeItem('google_calendar_token');
}

export async function signOut() {
  localStorage.removeItem('google_access_token');
  await firebaseSignOut(auth);
}

export function onAuthStateChange(callback: (user: any) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getSession() {
  return auth.currentUser;
}

// ============================================================
// GOOGLE CALENDAR SYNC
// ============================================================

export type SyncResult = { success: boolean; authError: boolean };
export type BulkSyncResult = { synced: number; total: number; authError: boolean };

export async function syncHearingToGoogleCalendar(hearing: Hearing): Promise<SyncResult> {
  const token = localStorage.getItem('google_calendar_token');
  if (!token) return { success: false, authError: true };

  const startDate = hearing.hearingDate;
  const startTime = (hearing.time && hearing.time.includes(':')) ? hearing.time : '10:00';
  const [hh, mm] = startTime.split(':').map(Number);
  const endHour = (hh + 1).toString().padStart(2, '0');
  const startDateTime = `${startDate}T${startTime}:00`;
  const endDateTime = `${startDate}T${endHour}:${mm.toString().padStart(2, '0')}:00`;

  const event = {
    summary: `${hearing.forum} Hearing — ${hearing.clientName}`,
    description: `Case: ${hearing.caseType}\nAY: ${hearing.assessmentYear}\nStatus: ${hearing.status}${hearing.description ? '\n\n' + hearing.description : ''}`,
    start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
    end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };

  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (res.status === 401 || res.status === 403) {
      // Token expired or missing calendar scope — clear it so UI updates
      localStorage.removeItem('google_calendar_token');
      return { success: false, authError: true };
    }

    return { success: res.ok, authError: false };
  } catch {
    return { success: false, authError: false };
  }
}

export async function syncAllHearingsToGoogleCalendar(hearings: Hearing[]): Promise<BulkSyncResult> {
  const eligible = hearings.filter(h => h.status === 'Upcoming' || h.status === 'Adjourned');
  let synced = 0;
  let authError = false;

  for (const h of eligible) {
    const result = await syncHearingToGoogleCalendar(h);
    if (result.authError) { authError = true; break; }
    if (result.success) synced++;
  }

  return { synced, total: eligible.length, authError };
}

// ============================================================
// GROUPS
// ============================================================

export async function fetchGroups(): Promise<string[]> {
  const uid = getCurrentUid();
  const snap = await getDocs(query(userCol(uid, 'groups'), orderBy('name')));
  return snap.docs.map(d => d.data().name as string);
}

export async function addGroup(name: string) {
  const uid = getCurrentUid();
  await addDoc(userCol(uid, 'groups'), { name, createdAt: serverTimestamp() });
}

// ============================================================
// CLIENTS
// ============================================================

export async function fetchClients(): Promise<Client[]> {
  const uid = getCurrentUid();
  const snap = await getDocs(query(userCol(uid, 'clients'), orderBy('name')));
  return snap.docs.map(d => toClient(d.id, d.data()));
}

export async function addClient(client: Omit<Client, 'id'>): Promise<Client> {
  const uid = getCurrentUid();
  const data = {
    name: client.name,
    pan: client.pan,
    group_name: client.group,
    entity_type: client.entityType,
    contact: client.contact,
    email: client.email || null,
    address: client.address || null,
    portal_password: client.portalPassword || null,
    gstin: client.gstin || null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(userCol(uid, 'clients'), data);
  return toClient(ref.id, data);
}

export async function updateClient(client: Client): Promise<Client> {
  const uid = getCurrentUid();
  await updateDoc(userDoc(uid, 'clients', client.id), {
    name: client.name,
    pan: client.pan,
    group_name: client.group,
    entity_type: client.entityType,
    contact: client.contact,
    email: client.email || null,
    address: client.address || null,
    portal_password: client.portalPassword || null,
    gstin: client.gstin || null,
    updatedAt: serverTimestamp(),
  });
  return client;
}

export async function deleteClient(id: string) {
  const uid = getCurrentUid();
  await deleteDoc(userDoc(uid, 'clients', id));
}

// ============================================================
// HEARINGS
// ============================================================

export async function fetchHearings(): Promise<Hearing[]> {
  const uid = getCurrentUid();
  const snap = await getDocs(query(userCol(uid, 'hearings'), orderBy('hearing_date')));
  return snap.docs.map(d => toHearing(d.id, d.data()));
}

export async function addHearing(hearing: Omit<Hearing, 'id'>): Promise<Hearing> {
  const uid = getCurrentUid();
  const data = {
    client_id: hearing.clientId,
    client_name: hearing.clientName,
    case_type: hearing.caseType,
    issue_date: hearing.issueDate || null,
    hearing_date: hearing.hearingDate,
    time: hearing.time,
    forum: hearing.forum,
    status: hearing.status,
    assessment_year: hearing.assessmentYear,
    description: hearing.description || null,
    is_critical: hearing.isCritical || false,
    quoted_fees: hearing.quotedFees || 0,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(userCol(uid, 'hearings'), data);
  return toHearing(ref.id, data);
}

export async function updateHearing(hearing: Hearing): Promise<Hearing> {
  const uid = getCurrentUid();
  await updateDoc(userDoc(uid, 'hearings', hearing.id), {
    client_name: hearing.clientName,
    case_type: hearing.caseType,
    issue_date: hearing.issueDate || null,
    hearing_date: hearing.hearingDate,
    time: hearing.time,
    forum: hearing.forum,
    status: hearing.status,
    assessment_year: hearing.assessmentYear,
    description: hearing.description || null,
    is_critical: hearing.isCritical || false,
    quoted_fees: hearing.quotedFees || 0,
    updatedAt: serverTimestamp(),
  });
  return hearing;
}

// ============================================================
// INVOICES
// ============================================================

export async function fetchInvoices(): Promise<Invoice[]> {
  const uid = getCurrentUid();
  const snap = await getDocs(query(userCol(uid, 'invoices'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => toInvoice(d.id, d.data()));
}

export async function addInvoice(invoice: Invoice): Promise<Invoice> {
  const uid = getCurrentUid();
  const data = {
    invoice_number: invoice.invoiceNumber,
    client_id: invoice.clientId,
    client_name: invoice.clientName,
    client_address: invoice.clientAddress || null,
    client_gstin: invoice.clientGstin || null,
    client_pan: invoice.clientPan || null,
    date: invoice.date,
    due_date: invoice.dueDate,
    place_of_supply: invoice.placeOfSupply,
    country_of_supply: invoice.countryOfSupply,
    items: invoice.items,
    sub_total: invoice.subTotal,
    discount_percent: invoice.discountPercent,
    discount_amount: invoice.discountAmount,
    taxable_amount: invoice.taxableAmount,
    gst_total: invoice.gstTotal,
    cgst_total: invoice.cgstTotal,
    sgst_total: invoice.sgstTotal,
    total: invoice.total,
    status: invoice.status,
    theme_color: invoice.themeColor,
    assessment_year: invoice.assessmentYear || null,
    case_type: invoice.caseType || null,
    notes: invoice.notes || null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(userCol(uid, 'invoices'), data);
  return { ...invoice, id: ref.id };
}

export async function updateInvoice(invoice: Invoice): Promise<Invoice> {
  const uid = getCurrentUid();
  await updateDoc(userDoc(uid, 'invoices', invoice.id), {
    invoice_number: invoice.invoiceNumber,
    client_id: invoice.clientId,
    client_name: invoice.clientName,
    client_address: invoice.clientAddress || null,
    client_gstin: invoice.clientGstin || null,
    client_pan: invoice.clientPan || null,
    date: invoice.date,
    due_date: invoice.dueDate,
    place_of_supply: invoice.placeOfSupply,
    country_of_supply: invoice.countryOfSupply,
    items: invoice.items,
    sub_total: invoice.subTotal,
    discount_percent: invoice.discountPercent,
    discount_amount: invoice.discountAmount,
    taxable_amount: invoice.taxableAmount,
    gst_total: invoice.gstTotal,
    cgst_total: invoice.cgstTotal,
    sgst_total: invoice.sgstTotal,
    total: invoice.total,
    status: invoice.status,
    theme_color: invoice.themeColor,
    assessment_year: invoice.assessmentYear || null,
    case_type: invoice.caseType || null,
    notes: invoice.notes || null,
    updatedAt: serverTimestamp(),
  });
  return invoice;
}

// ============================================================
// RECEIPTS
// ============================================================

export async function fetchReceipts(): Promise<Receipt[]> {
  const uid = getCurrentUid();
  const snap = await getDocs(query(userCol(uid, 'receipts'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => toReceipt(d.id, d.data()));
}

export async function addReceipt(receipt: Receipt): Promise<Receipt> {
  const uid = getCurrentUid();
  const data = {
    receipt_number: receipt.receiptNumber,
    client_id: receipt.clientId || null,
    group_id: receipt.groupId || null,
    client_name: receipt.clientName,
    date: receipt.date,
    amount: receipt.amount,
    settlement_discount: receipt.settlementDiscount || 0,
    payment_method: receipt.paymentMethod,
    reference: receipt.reference || null,
    invoice_ids: receipt.invoiceIds || [],
    notes: receipt.notes || null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(userCol(uid, 'receipts'), data);
  return { ...receipt, id: ref.id };
}

// ============================================================
// BILLING SETTINGS
// ============================================================

export async function fetchBillingSettings(): Promise<BillingSettings | null> {
  const uid = getCurrentUid();
  const snap = await getDoc(doc(firestore, 'users', uid, 'settings', 'billing'));
  if (!snap.exists()) return null;
  return toBillingSettings(snap.data());
}

export async function saveBillingSettings(settings: BillingSettings) {
  const uid = getCurrentUid();
  await setDoc(doc(firestore, 'users', uid, 'settings', 'billing'), {
    practice_name: settings.practiceName,
    address: settings.address,
    pan: settings.pan,
    gstin: settings.gstin,
    theme_color: settings.themeColor,
    prefix: settings.prefix,
    is_gst_applicable: settings.isGstApplicable,
    is_auto_numbering: settings.isAutoNumbering,
    last_number: settings.lastNumber,
    bank_details: settings.bankDetails,
    terms: settings.terms,
    default_notes: settings.defaultNotes,
    notes: settings.notes,
  });
}
