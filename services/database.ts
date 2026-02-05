import { supabase } from './supabase';
import { Client, Hearing, Invoice, Receipt, BillingSettings, InvoiceItem } from '../types';

// ============================================================
// HELPER: Convert database row -> frontend type
// ============================================================

function toClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    pan: row.pan,
    group: row.group_name,
    entityType: row.entity_type,
    contact: row.contact,
    email: row.email || undefined,
    address: row.address || undefined,
    portalPassword: row.portal_password || undefined,
    gstin: row.gstin || undefined,
  };
}

function toHearing(row: any): Hearing {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    caseType: row.case_type,
    issueDate: row.issue_date || undefined,
    hearingDate: row.hearing_date,
    time: row.time,
    forum: row.forum,
    status: row.status,
    assessmentYear: row.assessment_year,
    description: row.description || undefined,
    isCritical: row.is_critical || false,
    quotedFees: row.quoted_fees ? Number(row.quoted_fees) : undefined,
  };
}

function toInvoice(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id,
    clientName: row.client_name,
    clientAddress: row.client_address || undefined,
    clientGstin: row.client_gstin || undefined,
    clientPan: row.client_pan || undefined,
    date: row.date,
    dueDate: row.due_date,
    placeOfSupply: row.place_of_supply,
    countryOfSupply: row.country_of_supply,
    items: (row.items || []) as InvoiceItem[],
    subTotal: Number(row.sub_total),
    discountPercent: Number(row.discount_percent),
    discountAmount: Number(row.discount_amount),
    taxableAmount: Number(row.taxable_amount),
    gstTotal: Number(row.gst_total),
    cgstTotal: Number(row.cgst_total),
    sgstTotal: Number(row.sgst_total),
    total: Number(row.total),
    status: row.status,
    themeColor: row.theme_color,
    assessmentYear: row.assessment_year || undefined,
    caseType: row.case_type || undefined,
    notes: row.notes || undefined,
  };
}

function toReceipt(row: any): Receipt {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    clientId: row.client_id || undefined,
    groupId: row.group_id || undefined,
    clientName: row.client_name,
    date: row.date,
    amount: Number(row.amount),
    settlementDiscount: row.settlement_discount ? Number(row.settlement_discount) : undefined,
    paymentMethod: row.payment_method,
    reference: row.reference || undefined,
    invoiceIds: row.invoice_ids || undefined,
    notes: row.notes || undefined,
  };
}

function toBillingSettings(row: any): BillingSettings {
  const bank = row.bank_details || {};
  return {
    practiceName: row.practice_name,
    address: row.address,
    pan: row.pan,
    gstin: row.gstin,
    themeColor: row.theme_color,
    prefix: row.prefix,
    isGstApplicable: row.is_gst_applicable,
    isAutoNumbering: row.is_auto_numbering,
    lastNumber: row.last_number,
    bankDetails: {
      accountHolder: bank.accountHolder || '',
      accountNumber: bank.accountNumber || '',
      ifsc: bank.ifsc || '',
      accountType: bank.accountType || 'Current',
      bankName: bank.bankName || '',
      upiId: bank.upiId || '',
    },
    terms: row.terms || [],
    defaultNotes: row.default_notes || '',
    notes: row.notes || '',
  };
}

// ============================================================
// AUTH
// ============================================================

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      scopes: 'https://www.googleapis.com/auth/calendar.events',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw error;
  return data;
}

// ============================================================
// GOOGLE CALENDAR SYNC
// ============================================================

export async function getGoogleAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.provider_token || null;
}

export async function syncHearingToGoogleCalendar(hearing: Hearing): Promise<boolean> {
  const token = await getGoogleAccessToken();
  if (!token) return false;

  const startDate = hearing.hearingDate;
  const startTime = hearing.time || '10:00';
  const startDateTime = `${startDate}T${startTime}:00`;
  const endHour = parseInt(startTime.split(':')[0]) + 1;
  const endDateTime = `${startDate}T${endHour.toString().padStart(2, '0')}:${startTime.split(':')[1]}:00`;

  const event = {
    summary: `${hearing.forum} Hearing - ${hearing.clientName}`,
    description: `Case: ${hearing.caseType}\nAY: ${hearing.assessmentYear}\nStatus: ${hearing.status}${hearing.description ? '\n\n' + hearing.description : ''}`,
    start: {
      dateTime: startDateTime,
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Asia/Kolkata',
    },
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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncAllHearingsToGoogleCalendar(hearings: Hearing[]): Promise<number> {
  let synced = 0;
  for (const h of hearings) {
    if (h.status === 'Upcoming' || h.status === 'Adjourned') {
      const ok = await syncHearingToGoogleCalendar(h);
      if (ok) synced++;
    }
  }
  return synced;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ============================================================
// GROUPS
// ============================================================

export async function fetchGroups(): Promise<string[]> {
  const { data, error } = await supabase.from('groups').select('name').order('name');
  if (error) throw error;
  return (data || []).map((g: any) => g.name);
}

export async function addGroup(name: string) {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const { error } = await supabase.from('groups').insert({ user_id: session.user.id, name });
  if (error) throw error;
}

// ============================================================
// CLIENTS
// ============================================================

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('name');
  if (error) throw error;
  return (data || []).map(toClient);
}

export async function addClient(client: Omit<Client, 'id'>): Promise<Client> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('clients').insert({
    user_id: session.user.id,
    name: client.name,
    pan: client.pan,
    group_name: client.group,
    entity_type: client.entityType,
    contact: client.contact,
    email: client.email || null,
    address: client.address || null,
    portal_password: client.portalPassword || null,
    gstin: client.gstin || null,
  }).select().single();
  if (error) throw error;
  return toClient(data);
}

export async function updateClient(client: Client): Promise<Client> {
  const { data, error } = await supabase.from('clients').update({
    name: client.name,
    pan: client.pan,
    group_name: client.group,
    entity_type: client.entityType,
    contact: client.contact,
    email: client.email || null,
    address: client.address || null,
    portal_password: client.portalPassword || null,
    gstin: client.gstin || null,
    updated_at: new Date().toISOString(),
  }).eq('id', client.id).select().single();
  if (error) throw error;
  return toClient(data);
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// HEARINGS
// ============================================================

export async function fetchHearings(): Promise<Hearing[]> {
  const { data, error } = await supabase.from('hearings').select('*').order('hearing_date', { ascending: true });
  if (error) throw error;
  return (data || []).map(toHearing);
}

export async function addHearing(hearing: Omit<Hearing, 'id'>): Promise<Hearing> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('hearings').insert({
    user_id: session.user.id,
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
  }).select().single();
  if (error) throw error;
  return toHearing(data);
}

export async function updateHearing(hearing: Hearing): Promise<Hearing> {
  const { data, error } = await supabase.from('hearings').update({
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
  }).eq('id', hearing.id).select().single();
  if (error) throw error;
  return toHearing(data);
}

// ============================================================
// INVOICES
// ============================================================

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toInvoice);
}

export async function addInvoice(invoice: Invoice): Promise<Invoice> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('invoices').insert({
    user_id: session.user.id,
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
  }).select().single();
  if (error) throw error;
  return toInvoice(data);
}

export async function updateInvoice(invoice: Invoice): Promise<Invoice> {
  const { data, error } = await supabase.from('invoices').update({
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
  }).eq('id', invoice.id).select().single();
  if (error) throw error;
  return toInvoice(data);
}

// ============================================================
// RECEIPTS
// ============================================================

export async function fetchReceipts(): Promise<Receipt[]> {
  const { data, error } = await supabase.from('receipts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toReceipt);
}

export async function addReceipt(receipt: Receipt): Promise<Receipt> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('receipts').insert({
    user_id: session.user.id,
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
  }).select().single();
  if (error) throw error;
  return toReceipt(data);
}

// ============================================================
// BILLING SETTINGS
// ============================================================

export async function fetchBillingSettings(): Promise<BillingSettings | null> {
  const { data, error } = await supabase.from('billing_settings').select('*').single();
  if (error) {
    if (error.code === 'PGRST116') return null; // no rows
    throw error;
  }
  return data ? toBillingSettings(data) : null;
}

export async function saveBillingSettings(settings: BillingSettings) {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const { error } = await supabase.from('billing_settings').upsert({
    user_id: session.user.id,
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
  }, { onConflict: 'user_id' });
  if (error) throw error;
}
