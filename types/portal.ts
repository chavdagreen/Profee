// ============================================================================
// PROFEE - Income Tax Portal Document Management System
// TypeScript Types for Database Tables
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type SyncStatus = 'success' | 'failed' | 'pending' | 'in_progress';

export type DocumentType = 'notice' | 'order' | 'letter' | 'reply' | 'attachment' | 'other';

export type ProceedingType = 'scrutiny' | 'assessment' | 'penalty' | 'appeal' | 'reassessment' | 'rectification' | 'other';

export type DownloadSource = 'auto_sync' | 'manual' | 'new_client_sync';

export type ActionType = 'attend_hearing' | 'file_reply' | 'upload_documents' | 'file_appeal' | 'pay_demand' | 'seek_stay' | 'other';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export type SyncType = 'scheduled_nightly' | 'manual_trigger' | 'new_client' | 'retry';

export type SyncLogStatus = 'running' | 'completed' | 'failed' | 'partial';

export type ProceedingStatus = 'open' | 'hearing_pending' | 'reply_pending' | 'appeal_filed' | 'closed';

export type AIOperationType = 'document_analysis' | 'summary_generation' | 'reply_suggestion' | 'reanalysis';

export type AccessLevel = 'view' | 'edit' | 'admin';


// ============================================================================
// TABLE 1: CLIENT_CREDENTIALS
// ============================================================================

export interface ClientCredentials {
  id: string;
  client_id: string;
  pan_number: string; // Encrypted
  portal_user_id: string; // Encrypted
  portal_password: string; // Encrypted
  encryption_iv: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: SyncStatus | null;
  sync_error_message: string | null;
  consent_obtained: boolean;
  consent_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientCredentialsInsert {
  client_id: string;
  pan_number: string;
  portal_user_id: string;
  portal_password: string;
  encryption_iv: string;
  is_active?: boolean;
  consent_obtained?: boolean;
  consent_date?: string | null;
}

export interface ClientCredentialsUpdate {
  pan_number?: string;
  portal_user_id?: string;
  portal_password?: string;
  encryption_iv?: string;
  is_active?: boolean;
  last_sync_at?: string | null;
  last_sync_status?: SyncStatus | null;
  sync_error_message?: string | null;
  consent_obtained?: boolean;
  consent_date?: string | null;
}


// ============================================================================
// TABLE 2: PORTAL_DOCUMENTS
// ============================================================================

export interface PortalDocument {
  id: string;
  client_id: string;
  assessment_year: string; // Format: '2022-23'
  document_type: DocumentType;
  document_name: string;
  original_filename: string;
  storage_path: string;
  file_size_bytes: number;
  file_format: string;
  din_number: string | null;
  proceeding_type: ProceedingType | null;
  proceeding_reference: string | null;
  issue_date: string | null;
  hearing_date: string | null;
  reply_deadline: string | null;
  portal_document_id: string;
  download_source: DownloadSource;
  is_analyzed: boolean;
  analysis_priority: number;
  downloaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface PortalDocumentInsert {
  client_id: string;
  assessment_year: string;
  document_type: DocumentType;
  document_name: string;
  original_filename: string;
  storage_path: string;
  file_size_bytes: number;
  file_format?: string;
  din_number?: string | null;
  proceeding_type?: ProceedingType | null;
  proceeding_reference?: string | null;
  issue_date?: string | null;
  hearing_date?: string | null;
  reply_deadline?: string | null;
  portal_document_id: string;
  download_source: DownloadSource;
  analysis_priority?: number;
}

export interface PortalDocumentUpdate {
  document_type?: DocumentType;
  document_name?: string;
  proceeding_type?: ProceedingType | null;
  proceeding_reference?: string | null;
  issue_date?: string | null;
  hearing_date?: string | null;
  reply_deadline?: string | null;
  is_analyzed?: boolean;
  analysis_priority?: number;
}


// ============================================================================
// TABLE 3: DOCUMENT_ANALYSIS
// ============================================================================

export interface KeyDates {
  issue_date?: string;
  hearing_date?: string;
  reply_deadline?: string;
  appeal_deadline?: string;
  limitation_date?: string;
}

export interface FinancialSummary {
  returned_income?: number;
  assessed_income?: number;
  additions?: number;
  disallowances?: number;
  tax_demand?: number;
  interest_234a?: number;
  interest_234b?: number;
  interest_234c?: number;
  penalty?: number;
  total_demand?: number;
}

export interface ActionRequired {
  type?: ActionType;
  description?: string;
  deadline?: string;
  priority?: PriorityLevel;
  documents_needed?: string[];
}

export interface ReplySuggestion {
  point_number: number;
  issue: string;
  suggested_reply: string;
  supporting_case_laws?: string[];
  documents_to_attach?: string[];
}

export interface CaseLawCited {
  case_name: string;
  citation: string;
  court: string;
  year: number;
  relevance: string;
  favorable: boolean;
}

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  client_id: string;
  assessment_year: string;
  extracted_data: Record<string, any>;
  document_type_classified: string | null;
  sections_involved: string[];
  main_issues: string[];
  key_dates: KeyDates;
  financial_summary: FinancialSummary;
  action_required: ActionRequired;
  summary: string | null;
  reply_suggestions: ReplySuggestion[];
  case_laws_cited: CaseLawCited[];
  ao_reasoning: string | null;
  weak_points: string[];
  confidence_score: number | null;
  model_used: string;
  tokens_used: number;
  analysis_cost_usd: number;
  analysis_cost_inr: number;
  analysis_duration_ms: number;
  needs_manual_review: boolean;
  manual_review_notes: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  analyzed_at: string;
  created_at: string;
}

export interface DocumentAnalysisInsert {
  document_id: string;
  client_id: string;
  assessment_year: string;
  extracted_data?: Record<string, any>;
  document_type_classified?: string | null;
  sections_involved?: string[];
  main_issues?: string[];
  key_dates?: KeyDates;
  financial_summary?: FinancialSummary;
  action_required?: ActionRequired;
  summary?: string | null;
  reply_suggestions?: ReplySuggestion[];
  case_laws_cited?: CaseLawCited[];
  ao_reasoning?: string | null;
  weak_points?: string[];
  confidence_score?: number | null;
  model_used?: string;
  tokens_used?: number;
  analysis_cost_usd?: number;
  analysis_cost_inr?: number;
  analysis_duration_ms?: number;
  needs_manual_review?: boolean;
}


// ============================================================================
// TABLE 4: ACTION_ITEMS
// ============================================================================

export interface ActionItem {
  id: string;
  client_id: string;
  document_id: string | null;
  analysis_id: string | null;
  proceeding_reference: string | null;
  action_type: ActionType;
  title: string;
  description: string | null;
  due_date: string;
  priority: PriorityLevel;
  status: ActionStatus;
  assigned_to_user_id: string | null;
  documents_needed: string[];
  estimated_time_hours: number | null;
  completion_notes: string | null;
  completed_at: string | null;
  completed_by_user_id: string | null;
  reminder_sent: boolean;
  last_reminder_at: string | null;
  reminder_days_before: number[];
  created_at: string;
  updated_at: string;
}

export interface ActionItemInsert {
  client_id: string;
  document_id?: string | null;
  analysis_id?: string | null;
  proceeding_reference?: string | null;
  action_type: ActionType;
  title: string;
  description?: string | null;
  due_date: string;
  priority?: PriorityLevel;
  assigned_to_user_id?: string | null;
  documents_needed?: string[];
  estimated_time_hours?: number | null;
}

export interface ActionItemUpdate {
  action_type?: ActionType;
  title?: string;
  description?: string | null;
  due_date?: string;
  priority?: PriorityLevel;
  status?: ActionStatus;
  assigned_to_user_id?: string | null;
  documents_needed?: string[];
  estimated_time_hours?: number | null;
  completion_notes?: string | null;
  completed_at?: string | null;
  completed_by_user_id?: string | null;
}


// ============================================================================
// TABLE 5: SYNC_LOGS
// ============================================================================

export interface SyncError {
  stage: 'download' | 'analysis' | 'storage';
  document_id?: string;
  error: string;
  timestamp: string;
}

export interface SyncLog {
  id: string;
  client_id: string;
  sync_type: SyncType;
  started_at: string;
  completed_at: string | null;
  execution_time_seconds: number | null;
  status: SyncLogStatus;
  documents_found: number;
  documents_downloaded: number;
  documents_analyzed: number;
  documents_failed: number;
  documents_skipped: number;
  total_cost_usd: number;
  total_cost_inr: number;
  error_messages: SyncError[];
  triggered_by_user_id: string | null;
  created_at: string;
}

export interface SyncLogInsert {
  client_id: string;
  sync_type: SyncType;
  triggered_by_user_id?: string | null;
}

export interface SyncLogUpdate {
  completed_at?: string | null;
  status?: SyncLogStatus;
  documents_found?: number;
  documents_downloaded?: number;
  documents_analyzed?: number;
  documents_failed?: number;
  documents_skipped?: number;
  total_cost_usd?: number;
  total_cost_inr?: number;
  error_messages?: SyncError[];
}


// ============================================================================
// TABLE 6: PROCEEDING_SUMMARY
// ============================================================================

export interface ProceedingSummary {
  id: string;
  client_id: string;
  assessment_year: string;
  proceeding_type: ProceedingType;
  proceeding_reference: string | null;
  status: ProceedingStatus;
  first_notice_date: string | null;
  latest_document_date: string | null;
  next_hearing_date: string | null;
  next_reply_deadline: string | null;
  total_demand_inr: number;
  demand_paid_inr: number;
  demand_outstanding_inr: number; // Generated column
  document_count: number;
  action_items_pending: number;
  action_items_completed: number;
  priority_level: PriorityLevel;
  officer_name: string | null;
  officer_designation: string | null;
  officer_email: string | null;
  officer_phone: string | null;
  office_address: string | null;
  last_updated: string;
  created_at: string;
}

export interface ProceedingSummaryInsert {
  client_id: string;
  assessment_year: string;
  proceeding_type: ProceedingType;
  proceeding_reference?: string | null;
  status?: ProceedingStatus;
  first_notice_date?: string | null;
  total_demand_inr?: number;
  officer_name?: string | null;
  officer_designation?: string | null;
  officer_email?: string | null;
  officer_phone?: string | null;
  office_address?: string | null;
}

export interface ProceedingSummaryUpdate {
  status?: ProceedingStatus;
  next_hearing_date?: string | null;
  next_reply_deadline?: string | null;
  total_demand_inr?: number;
  demand_paid_inr?: number;
  priority_level?: PriorityLevel;
  officer_name?: string | null;
  officer_designation?: string | null;
  officer_email?: string | null;
  officer_phone?: string | null;
  office_address?: string | null;
}


// ============================================================================
// TABLE 7: AI_USAGE_LOGS
// ============================================================================

export interface AIUsageLog {
  id: string;
  document_id: string | null;
  client_id: string;
  model_name: string;
  operation_type: AIOperationType;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number; // Generated column
  cost_usd: number;
  cost_inr: number;
  success: boolean;
  error_message: string | null;
  processing_time_ms: number;
  created_at: string;
}

export interface AIUsageLogInsert {
  document_id?: string | null;
  client_id: string;
  model_name?: string;
  operation_type: AIOperationType;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  cost_inr: number;
  success?: boolean;
  error_message?: string | null;
  processing_time_ms: number;
}


// ============================================================================
// USER_CLIENT_ACCESS TABLE
// ============================================================================

export interface UserClientAccess {
  id: string;
  user_id: string;
  client_id: string;
  access_level: AccessLevel;
  granted_at: string;
  granted_by: string | null;
}

export interface UserClientAccessInsert {
  user_id: string;
  client_id: string;
  access_level?: AccessLevel;
  granted_by?: string | null;
}


// ============================================================================
// MATERIALIZED VIEW: CLIENT_DASHBOARD_SUMMARY
// ============================================================================

export interface ClientDashboardSummary {
  client_id: string;
  client_name: string;
  client_pan: string | null;
  client_email: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: SyncStatus | null;
  consent_obtained: boolean;
  total_documents: number;
  unanalyzed_documents: number;
  latest_document_date: string;
  pending_actions: number;
  overdue_actions: number;
  critical_actions: number;
  next_deadline: string | null;
  open_proceedings: number;
  total_demand_outstanding: number;
  next_hearing_date: string | null;
  monthly_ai_cost_inr: number;
  attention_level: 'critical' | 'high' | 'medium' | 'low';
}


// ============================================================================
// VIEW: UPCOMING_HEARINGS
// ============================================================================

export interface UpcomingHearing {
  client_id: string;
  client_name: string;
  assessment_year: string;
  proceeding_type: ProceedingType;
  proceeding_reference: string | null;
  next_hearing_date: string;
  officer_name: string | null;
  office_address: string | null;
  related_action: string | null;
  action_status: ActionStatus | null;
  days_until_hearing: number;
}


// ============================================================================
// VIEW: PENDING_DEADLINES
// ============================================================================

export interface PendingDeadline {
  client_id: string;
  client_name: string;
  assessment_year: string;
  document_type: DocumentType;
  document_name: string;
  reply_deadline: string;
  din_number: string | null;
  days_remaining: number;
  urgency: 'overdue' | 'critical' | 'urgent' | 'normal';
}


// ============================================================================
// VIEW: AI_COST_SUMMARY
// ============================================================================

export interface AICostSummary {
  client_id: string;
  client_name: string;
  total_operations: number;
  total_tokens: number;
  total_cost_inr: number;
  total_cost_usd: number;
  avg_processing_time_ms: number;
  last_operation: string;
  monthly_cost_inr: number;
  weekly_cost_inr: number;
}


// ============================================================================
// VIEW: DOCUMENTS_PENDING_ANALYSIS
// ============================================================================

export interface DocumentPendingAnalysis {
  document_id: string;
  client_id: string;
  client_name: string;
  assessment_year: string;
  document_type: DocumentType;
  document_name: string;
  proceeding_type: ProceedingType | null;
  issue_date: string | null;
  hearing_date: string | null;
  downloaded_at: string;
  analysis_priority: number;
  days_since_download: number;
}


// ============================================================================
// UTILITY TYPES
// ============================================================================

// For API responses
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

// For paginated responses
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// For sync operation
export interface SyncResult {
  syncLogId: string;
  documentsFound: number;
  documentsDownloaded: number;
  documentsAnalyzed: number;
  documentsFailed: number;
  errors: SyncError[];
  totalCostInr: number;
  executionTimeSeconds: number;
}

// For document analysis request
export interface AnalysisRequest {
  documentId: string;
  priority?: number;
  forceReanalyze?: boolean;
}

// For credential encryption
export interface EncryptedCredential {
  encryptedData: string;
  iv: string;
}

// For dashboard filters
export interface DashboardFilters {
  assessmentYear?: string;
  proceedingType?: ProceedingType;
  status?: ProceedingStatus;
  priority?: PriorityLevel;
  attentionLevel?: 'critical' | 'high' | 'medium' | 'low';
  hasOverdueActions?: boolean;
  hasUpcomingHearings?: boolean;
}
