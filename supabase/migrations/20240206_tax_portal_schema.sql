-- ============================================================================
-- PROFEE - Income Tax Portal Document Management System
-- Complete Database Schema for Supabase
-- Version: 1.0.0
-- Date: 2024-02-06
-- Optimized for 5000+ clients
-- ============================================================================

-- ============================================================================
-- SECTION 1: UTILITY FUNCTIONS
-- ============================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate short unique ID for references
CREATE OR REPLACE FUNCTION public.generate_short_id(prefix TEXT DEFAULT '')
RETURNS TEXT AS $$
BEGIN
    RETURN prefix || to_char(now(), 'YYMM') || '-' ||
           upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SECTION 2: ENUM TYPES (for type safety)
-- ============================================================================

-- Sync status enum
DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('success', 'failed', 'pending', 'in_progress');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document type enum
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('notice', 'order', 'letter', 'reply', 'attachment', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Proceeding type enum
DO $$ BEGIN
    CREATE TYPE proceeding_type AS ENUM ('scrutiny', 'assessment', 'penalty', 'appeal', 'reassessment', 'rectification', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Download source enum
DO $$ BEGIN
    CREATE TYPE download_source AS ENUM ('auto_sync', 'manual', 'new_client_sync');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Action type enum
DO $$ BEGIN
    CREATE TYPE action_type AS ENUM ('attend_hearing', 'file_reply', 'upload_documents', 'file_appeal', 'pay_demand', 'seek_stay', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Priority enum
DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Action status enum
DO $$ BEGIN
    CREATE TYPE action_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sync type enum
DO $$ BEGIN
    CREATE TYPE sync_type AS ENUM ('scheduled_nightly', 'manual_trigger', 'new_client', 'retry');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sync log status enum
DO $$ BEGIN
    CREATE TYPE sync_log_status AS ENUM ('running', 'completed', 'failed', 'partial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Proceeding status enum
DO $$ BEGIN
    CREATE TYPE proceeding_status AS ENUM ('open', 'hearing_pending', 'reply_pending', 'appeal_filed', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AI operation type enum
DO $$ BEGIN
    CREATE TYPE ai_operation_type AS ENUM ('document_analysis', 'summary_generation', 'reply_suggestion', 'reanalysis');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ============================================================================
-- SECTION 3: TABLE 1 - CLIENT_CREDENTIALS
-- Purpose: Store encrypted Income Tax portal login credentials
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

    -- Encrypted credentials (use pgcrypto or application-level encryption)
    pan_number TEXT NOT NULL,
    portal_user_id TEXT NOT NULL,
    portal_password TEXT NOT NULL,
    encryption_iv TEXT NOT NULL, -- Initialization vector for decryption

    -- Status flags
    is_active BOOLEAN DEFAULT true,

    -- Sync tracking
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'pending', 'in_progress')),
    sync_error_message TEXT,

    -- Consent tracking (IMPORTANT for legal compliance)
    consent_obtained BOOLEAN DEFAULT false,
    consent_date TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Ensure one credential per client
    CONSTRAINT unique_client_credentials UNIQUE (client_id)
);

-- Indexes for client_credentials
CREATE INDEX IF NOT EXISTS idx_client_credentials_client_id
    ON public.client_credentials(client_id);

CREATE INDEX IF NOT EXISTS idx_client_credentials_is_active
    ON public.client_credentials(is_active)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_client_credentials_sync_status
    ON public.client_credentials(last_sync_status);

CREATE INDEX IF NOT EXISTS idx_client_credentials_consent
    ON public.client_credentials(consent_obtained)
    WHERE consent_obtained = true;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_client_credentials_updated_at ON public.client_credentials;
CREATE TRIGGER update_client_credentials_updated_at
    BEFORE UPDATE ON public.client_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.client_credentials IS 'Stores encrypted Income Tax portal credentials for automated sync';
COMMENT ON COLUMN public.client_credentials.encryption_iv IS 'Initialization vector required for AES-256-GCM decryption';
COMMENT ON COLUMN public.client_credentials.consent_obtained IS 'Legal consent flag - sync only allowed when true';


-- ============================================================================
-- SECTION 4: TABLE 2 - PORTAL_DOCUMENTS
-- Purpose: Store metadata of downloaded Income Tax documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.portal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

    -- Document classification
    assessment_year TEXT NOT NULL, -- Format: '2022-23'
    document_type TEXT NOT NULL CHECK (document_type IN ('notice', 'order', 'letter', 'reply', 'attachment', 'other')),
    document_name TEXT NOT NULL,
    original_filename TEXT NOT NULL,

    -- Storage details
    storage_path TEXT NOT NULL, -- Supabase storage path: client_id/ay/proceeding/file.pdf
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    file_format TEXT DEFAULT 'pdf',

    -- Income Tax specific fields
    din_number TEXT, -- Document Identification Number (unique per document)
    proceeding_type TEXT CHECK (proceeding_type IN ('scrutiny', 'assessment', 'penalty', 'appeal', 'reassessment', 'rectification', 'other')),
    proceeding_reference TEXT, -- e.g., "ITBA/AST/S/143(2)/2024-25/1234567890"

    -- Important dates
    issue_date DATE,
    hearing_date DATE,
    reply_deadline DATE,

    -- Portal tracking
    portal_document_id TEXT NOT NULL, -- Unique identifier from IT portal
    download_source TEXT NOT NULL CHECK (download_source IN ('auto_sync', 'manual', 'new_client_sync')),

    -- Analysis status
    is_analyzed BOOLEAN DEFAULT false,
    analysis_priority INTEGER DEFAULT 5, -- 1 = highest priority

    -- Timestamps
    downloaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Prevent duplicate downloads from same portal
    CONSTRAINT unique_portal_document UNIQUE (client_id, portal_document_id)
);

-- Indexes for portal_documents
CREATE INDEX IF NOT EXISTS idx_portal_documents_client_ay
    ON public.portal_documents(client_id, assessment_year);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_documents_din
    ON public.portal_documents(din_number)
    WHERE din_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_documents_portal_id
    ON public.portal_documents(portal_document_id);

CREATE INDEX IF NOT EXISTS idx_portal_documents_not_analyzed
    ON public.portal_documents(is_analyzed, analysis_priority)
    WHERE is_analyzed = false;

CREATE INDEX IF NOT EXISTS idx_portal_documents_hearing_date
    ON public.portal_documents(hearing_date)
    WHERE hearing_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portal_documents_proceeding_type
    ON public.portal_documents(proceeding_type);

CREATE INDEX IF NOT EXISTS idx_portal_documents_document_type
    ON public.portal_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_portal_documents_reply_deadline
    ON public.portal_documents(reply_deadline)
    WHERE reply_deadline IS NOT NULL;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_portal_documents_client_type_ay
    ON public.portal_documents(client_id, document_type, assessment_year DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_portal_documents_updated_at ON public.portal_documents;
CREATE TRIGGER update_portal_documents_updated_at
    BEFORE UPDATE ON public.portal_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.portal_documents IS 'Metadata for all documents downloaded from Income Tax portal';
COMMENT ON COLUMN public.portal_documents.din_number IS 'Document Identification Number - unique identifier from IT department';
COMMENT ON COLUMN public.portal_documents.storage_path IS 'Path in Supabase Storage: {client_id}/{assessment_year}/{proceeding_type}/{filename}';


-- ============================================================================
-- SECTION 5: TABLE 3 - DOCUMENT_ANALYSIS
-- Purpose: Store AI-extracted intelligence from documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.document_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.portal_documents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    assessment_year TEXT NOT NULL,

    -- Full structured extraction
    extracted_data JSONB NOT NULL DEFAULT '{}',

    -- Classification
    document_type_classified TEXT,

    -- Key information arrays
    sections_involved TEXT[] DEFAULT '{}', -- e.g., ['143(2)', '142(1)', '148']
    main_issues TEXT[] DEFAULT '{}', -- Key issues identified

    -- Important dates structure
    key_dates JSONB DEFAULT '{}',
    /* Expected structure:
    {
        "issue_date": "2024-01-15",
        "hearing_date": "2024-02-20",
        "reply_deadline": "2024-02-10",
        "appeal_deadline": "2024-03-15",
        "limitation_date": "2024-06-30"
    }
    */

    -- Financial summary
    financial_summary JSONB DEFAULT '{}',
    /* Expected structure:
    {
        "returned_income": 1500000,
        "assessed_income": 2500000,
        "additions": 1000000,
        "disallowances": 500000,
        "tax_demand": 350000,
        "interest_234a": 25000,
        "interest_234b": 15000,
        "interest_234c": 10000,
        "penalty": 100000,
        "total_demand": 500000
    }
    */

    -- Required actions
    action_required JSONB DEFAULT '{}',
    /* Expected structure:
    {
        "type": "file_reply",
        "description": "Submit reply to notice u/s 143(2)",
        "deadline": "2024-02-10",
        "priority": "high",
        "documents_needed": ["Bank statements", "ITR copy", "26AS"]
    }
    */

    -- Summary and suggestions
    summary TEXT, -- Executive summary (3-5 lines)
    reply_suggestions JSONB[] DEFAULT '{}', -- Array of suggested reply points
    case_laws_cited JSONB[] DEFAULT '{}', -- Relevant case laws
    ao_reasoning TEXT, -- AO's reasoning extracted from order
    weak_points TEXT[] DEFAULT '{}', -- Potential appeal grounds

    -- AI metrics
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_used TEXT DEFAULT 'claude-3.5-sonnet',
    tokens_used INTEGER DEFAULT 0,
    analysis_cost_usd DECIMAL(10,4) DEFAULT 0,
    analysis_cost_inr DECIMAL(10,2) DEFAULT 0,
    analysis_duration_ms INTEGER DEFAULT 0,

    -- Manual review workflow
    needs_manual_review BOOLEAN DEFAULT false,
    manual_review_notes TEXT,
    reviewed_by_user_id UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,

    -- Timestamps
    analyzed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- One analysis per document
    CONSTRAINT unique_document_analysis UNIQUE (document_id)
);

-- Indexes for document_analysis
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_analysis_document_id
    ON public.document_analysis(document_id);

CREATE INDEX IF NOT EXISTS idx_document_analysis_client_ay
    ON public.document_analysis(client_id, assessment_year);

CREATE INDEX IF NOT EXISTS idx_document_analysis_low_confidence
    ON public.document_analysis(confidence_score)
    WHERE confidence_score < 0.7;

CREATE INDEX IF NOT EXISTS idx_document_analysis_needs_review
    ON public.document_analysis(needs_manual_review)
    WHERE needs_manual_review = true;

-- GIN index for JSONB key_dates queries
CREATE INDEX IF NOT EXISTS idx_document_analysis_key_dates
    ON public.document_analysis USING GIN (key_dates);

-- GIN index for sections_involved array
CREATE INDEX IF NOT EXISTS idx_document_analysis_sections
    ON public.document_analysis USING GIN (sections_involved);

-- Index for hearing dates from key_dates JSONB
CREATE INDEX IF NOT EXISTS idx_document_analysis_hearing_date
    ON public.document_analysis((key_dates->>'hearing_date'));

COMMENT ON TABLE public.document_analysis IS 'AI-extracted structured data from Income Tax documents';
COMMENT ON COLUMN public.document_analysis.confidence_score IS 'AI confidence: 0.00-1.00, flag for review if < 0.70';
COMMENT ON COLUMN public.document_analysis.sections_involved IS 'Array of Income Tax Act sections mentioned';


-- ============================================================================
-- SECTION 6: TABLE 4 - ACTION_ITEMS
-- Purpose: Track required actions based on document analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.portal_documents(id) ON DELETE SET NULL,
    analysis_id UUID REFERENCES public.document_analysis(id) ON DELETE SET NULL,

    -- Reference
    proceeding_reference TEXT,

    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN ('attend_hearing', 'file_reply', 'upload_documents', 'file_appeal', 'pay_demand', 'seek_stay', 'other')),
    title TEXT NOT NULL,
    description TEXT,

    -- Timeline
    due_date DATE NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),

    -- Assignment
    assigned_to_user_id UUID REFERENCES auth.users(id),

    -- Requirements
    documents_needed TEXT[] DEFAULT '{}',
    estimated_time_hours INTEGER,

    -- Completion tracking
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    completed_by_user_id UUID REFERENCES auth.users(id),

    -- Reminders
    reminder_sent BOOLEAN DEFAULT false,
    last_reminder_at TIMESTAMPTZ,
    reminder_days_before INTEGER[] DEFAULT '{7, 3, 1}', -- Days before due date to send reminders

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for action_items
CREATE INDEX IF NOT EXISTS idx_action_items_client_status
    ON public.action_items(client_id, status);

CREATE INDEX IF NOT EXISTS idx_action_items_due_date
    ON public.action_items(due_date)
    WHERE status NOT IN ('completed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_action_items_priority_status
    ON public.action_items(priority, status)
    WHERE status NOT IN ('completed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_action_items_assigned_user
    ON public.action_items(assigned_to_user_id)
    WHERE assigned_to_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_action_items_overdue
    ON public.action_items(due_date, status)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_action_items_upcoming
    ON public.action_items(due_date)
    WHERE status = 'pending';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_action_items_updated_at ON public.action_items;
CREATE TRIGGER update_action_items_updated_at
    BEFORE UPDATE ON public.action_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.action_items IS 'Trackable action items generated from document analysis';
COMMENT ON COLUMN public.action_items.reminder_days_before IS 'Array of days before due_date to send reminder notifications';


-- ============================================================================
-- SECTION 7: TABLE 5 - SYNC_LOGS
-- Purpose: Track all sync operations for monitoring and debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

    -- Sync details
    sync_type TEXT NOT NULL CHECK (sync_type IN ('scheduled_nightly', 'manual_trigger', 'new_client', 'retry')),

    -- Timing
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    completed_at TIMESTAMPTZ,
    execution_time_seconds INTEGER,

    -- Status
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),

    -- Metrics
    documents_found INTEGER DEFAULT 0,
    documents_downloaded INTEGER DEFAULT 0,
    documents_analyzed INTEGER DEFAULT 0,
    documents_failed INTEGER DEFAULT 0,
    documents_skipped INTEGER DEFAULT 0, -- Already existed

    -- Cost tracking
    total_cost_usd DECIMAL(10,4) DEFAULT 0,
    total_cost_inr DECIMAL(10,2) DEFAULT 0,

    -- Error tracking
    error_messages JSONB[] DEFAULT '{}',
    /* Structure per error:
    {
        "stage": "download" | "analysis" | "storage",
        "document_id": "...",
        "error": "...",
        "timestamp": "..."
    }
    */

    -- User tracking
    triggered_by_user_id UUID REFERENCES auth.users(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_client_started
    ON public.sync_logs(client_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_logs_status
    ON public.sync_logs(status);

CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type
    ON public.sync_logs(sync_type);

CREATE INDEX IF NOT EXISTS idx_sync_logs_recent
    ON public.sync_logs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_logs_failed
    ON public.sync_logs(status, started_at DESC)
    WHERE status = 'failed';

-- Partial index for running syncs (should be very few)
CREATE INDEX IF NOT EXISTS idx_sync_logs_running
    ON public.sync_logs(client_id)
    WHERE status = 'running';

COMMENT ON TABLE public.sync_logs IS 'Audit log for all portal sync operations';


-- ============================================================================
-- SECTION 8: TABLE 6 - PROCEEDING_SUMMARY
-- Purpose: Aggregated view of proceedings per client per AY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proceeding_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

    -- Proceeding identification
    assessment_year TEXT NOT NULL,
    proceeding_type TEXT NOT NULL CHECK (proceeding_type IN ('scrutiny', 'assessment', 'penalty', 'appeal', 'reassessment', 'rectification', 'other')),
    proceeding_reference TEXT,

    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'hearing_pending', 'reply_pending', 'appeal_filed', 'closed')),

    -- Timeline
    first_notice_date DATE,
    latest_document_date DATE,
    next_hearing_date DATE,
    next_reply_deadline DATE,

    -- Financial
    total_demand_inr DECIMAL(15,2) DEFAULT 0,
    demand_paid_inr DECIMAL(15,2) DEFAULT 0,
    demand_outstanding_inr DECIMAL(15,2) GENERATED ALWAYS AS (total_demand_inr - demand_paid_inr) STORED,

    -- Counts
    document_count INTEGER DEFAULT 0,
    action_items_pending INTEGER DEFAULT 0,
    action_items_completed INTEGER DEFAULT 0,

    -- Priority
    priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),

    -- Officer details
    officer_name TEXT,
    officer_designation TEXT,
    officer_email TEXT,
    officer_phone TEXT,
    office_address TEXT,

    -- Timestamps
    last_updated TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Unique constraint per proceeding
    CONSTRAINT unique_proceeding UNIQUE (client_id, assessment_year, proceeding_reference)
);

-- Indexes for proceeding_summary
CREATE INDEX IF NOT EXISTS idx_proceeding_summary_client_ay
    ON public.proceeding_summary(client_id, assessment_year);

CREATE UNIQUE INDEX IF NOT EXISTS idx_proceeding_summary_unique
    ON public.proceeding_summary(client_id, assessment_year, proceeding_type)
    WHERE proceeding_reference IS NULL;

CREATE INDEX IF NOT EXISTS idx_proceeding_summary_next_hearing
    ON public.proceeding_summary(next_hearing_date)
    WHERE next_hearing_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_proceeding_summary_status
    ON public.proceeding_summary(status)
    WHERE status != 'closed';

CREATE INDEX IF NOT EXISTS idx_proceeding_summary_priority
    ON public.proceeding_summary(priority_level, status);

CREATE INDEX IF NOT EXISTS idx_proceeding_summary_deadline
    ON public.proceeding_summary(next_reply_deadline)
    WHERE next_reply_deadline IS NOT NULL;

COMMENT ON TABLE public.proceeding_summary IS 'Aggregated summary of each proceeding for quick dashboard access';
COMMENT ON COLUMN public.proceeding_summary.demand_outstanding_inr IS 'Auto-calculated: total_demand - demand_paid';


-- ============================================================================
-- SECTION 9: TABLE 7 - AI_USAGE_LOGS
-- Purpose: Track AI API usage for cost monitoring and optimization
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.portal_documents(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

    -- Model details
    model_name TEXT DEFAULT 'claude-3.5-sonnet',
    operation_type TEXT NOT NULL CHECK (operation_type IN ('document_analysis', 'summary_generation', 'reply_suggestion', 'reanalysis')),

    -- Token usage
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    tokens_total INTEGER GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,

    -- Costs
    cost_usd DECIMAL(10,4) DEFAULT 0,
    cost_inr DECIMAL(10,2) DEFAULT 0,

    -- Status
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Performance
    processing_time_ms INTEGER DEFAULT 0,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_client_created
    ON public.ai_usage_logs(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model
    ON public.ai_usage_logs(model_name);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_failed
    ON public.ai_usage_logs(success)
    WHERE success = false;

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_date
    ON public.ai_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_operation
    ON public.ai_usage_logs(operation_type);

-- For monthly cost reports
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_monthly
    ON public.ai_usage_logs(date_trunc('month', created_at), client_id);

COMMENT ON TABLE public.ai_usage_logs IS 'Tracks all AI API calls for cost monitoring and optimization';
COMMENT ON COLUMN public.ai_usage_logs.tokens_total IS 'Auto-calculated: tokens_input + tokens_output';


-- ============================================================================
-- SECTION 10: TRIGGER FUNCTIONS FOR AUTO-UPDATES
-- ============================================================================

-- Function: Update proceeding_summary when new document is added
CREATE OR REPLACE FUNCTION public.update_proceeding_on_document()
RETURNS TRIGGER AS $$
BEGIN
    -- Upsert proceeding_summary
    INSERT INTO public.proceeding_summary (
        client_id,
        assessment_year,
        proceeding_type,
        proceeding_reference,
        latest_document_date,
        document_count
    )
    VALUES (
        NEW.client_id,
        NEW.assessment_year,
        COALESCE(NEW.proceeding_type, 'other'),
        NEW.proceeding_reference,
        NEW.issue_date,
        1
    )
    ON CONFLICT (client_id, assessment_year, proceeding_reference)
    DO UPDATE SET
        document_count = proceeding_summary.document_count + 1,
        latest_document_date = GREATEST(proceeding_summary.latest_document_date, EXCLUDED.latest_document_date),
        next_hearing_date = COALESCE(NEW.hearing_date, proceeding_summary.next_hearing_date),
        last_updated = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: After new document inserted
DROP TRIGGER IF EXISTS trigger_update_proceeding_on_document ON public.portal_documents;
CREATE TRIGGER trigger_update_proceeding_on_document
    AFTER INSERT ON public.portal_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_proceeding_on_document();


-- Function: Update proceeding_summary when action item status changes
CREATE OR REPLACE FUNCTION public.update_proceeding_on_action_change()
RETURNS TRIGGER AS $$
DECLARE
    v_proceeding_id UUID;
    v_pending_count INTEGER;
    v_completed_count INTEGER;
BEGIN
    -- Find related proceeding
    SELECT ps.id INTO v_proceeding_id
    FROM public.proceeding_summary ps
    JOIN public.portal_documents pd ON pd.proceeding_reference = ps.proceeding_reference
    WHERE pd.id = COALESCE(NEW.document_id, OLD.document_id)
    LIMIT 1;

    IF v_proceeding_id IS NOT NULL THEN
        -- Count pending and completed actions
        SELECT
            COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress', 'overdue')),
            COUNT(*) FILTER (WHERE status = 'completed')
        INTO v_pending_count, v_completed_count
        FROM public.action_items ai
        JOIN public.portal_documents pd ON pd.id = ai.document_id
        JOIN public.proceeding_summary ps ON ps.proceeding_reference = pd.proceeding_reference
        WHERE ps.id = v_proceeding_id;

        -- Update proceeding_summary
        UPDATE public.proceeding_summary
        SET
            action_items_pending = v_pending_count,
            action_items_completed = v_completed_count,
            last_updated = now()
        WHERE id = v_proceeding_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: After action item insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_proceeding_on_action ON public.action_items;
CREATE TRIGGER trigger_update_proceeding_on_action
    AFTER INSERT OR UPDATE OR DELETE ON public.action_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_proceeding_on_action_change();


-- Function: Auto-mark overdue action items
CREATE OR REPLACE FUNCTION public.mark_overdue_actions()
RETURNS void AS $$
BEGIN
    UPDATE public.action_items
    SET
        status = 'overdue',
        updated_at = now()
    WHERE
        status = 'pending'
        AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;


-- Function: Update sync completion metrics
CREATE OR REPLACE FUNCTION public.complete_sync_log(
    p_sync_id UUID,
    p_status TEXT,
    p_docs_downloaded INTEGER DEFAULT 0,
    p_docs_analyzed INTEGER DEFAULT 0,
    p_docs_failed INTEGER DEFAULT 0,
    p_cost_usd DECIMAL DEFAULT 0,
    p_cost_inr DECIMAL DEFAULT 0
)
RETURNS void AS $$
BEGIN
    UPDATE public.sync_logs
    SET
        status = p_status,
        completed_at = now(),
        execution_time_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER,
        documents_downloaded = p_docs_downloaded,
        documents_analyzed = p_docs_analyzed,
        documents_failed = p_docs_failed,
        total_cost_usd = p_cost_usd,
        total_cost_inr = p_cost_inr
    WHERE id = p_sync_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SECTION 11: MATERIALIZED VIEW FOR DASHBOARD
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.v_client_dashboard_summary AS
SELECT
    c.id AS client_id,
    c.name AS client_name,
    c.pan AS client_pan,
    c.email AS client_email,

    -- Credential status
    cc.is_active AS sync_enabled,
    cc.last_sync_at,
    cc.last_sync_status,
    cc.consent_obtained,

    -- Document stats
    COALESCE(doc_stats.total_documents, 0) AS total_documents,
    COALESCE(doc_stats.unanalyzed_documents, 0) AS unanalyzed_documents,
    COALESCE(doc_stats.latest_document_date, '1900-01-01'::DATE) AS latest_document_date,

    -- Action items
    COALESCE(action_stats.pending_actions, 0) AS pending_actions,
    COALESCE(action_stats.overdue_actions, 0) AS overdue_actions,
    COALESCE(action_stats.critical_actions, 0) AS critical_actions,
    action_stats.next_deadline,

    -- Proceeding stats
    COALESCE(proc_stats.open_proceedings, 0) AS open_proceedings,
    COALESCE(proc_stats.total_demand, 0) AS total_demand_outstanding,
    proc_stats.next_hearing_date,

    -- Cost stats (last 30 days)
    COALESCE(cost_stats.monthly_cost_inr, 0) AS monthly_ai_cost_inr,

    -- Calculated priority
    CASE
        WHEN COALESCE(action_stats.overdue_actions, 0) > 0 THEN 'critical'
        WHEN action_stats.next_deadline <= CURRENT_DATE + INTERVAL '3 days' THEN 'high'
        WHEN proc_stats.next_hearing_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'high'
        WHEN COALESCE(action_stats.pending_actions, 0) > 5 THEN 'medium'
        ELSE 'low'
    END AS attention_level

FROM public.clients c

LEFT JOIN public.client_credentials cc ON cc.client_id = c.id

LEFT JOIN LATERAL (
    SELECT
        COUNT(*) AS total_documents,
        COUNT(*) FILTER (WHERE NOT is_analyzed) AS unanalyzed_documents,
        MAX(issue_date) AS latest_document_date
    FROM public.portal_documents pd
    WHERE pd.client_id = c.id
) doc_stats ON true

LEFT JOIN LATERAL (
    SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_actions,
        COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_actions,
        COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('completed', 'cancelled')) AS critical_actions,
        MIN(due_date) FILTER (WHERE status IN ('pending', 'in_progress')) AS next_deadline
    FROM public.action_items ai
    WHERE ai.client_id = c.id
) action_stats ON true

LEFT JOIN LATERAL (
    SELECT
        COUNT(*) FILTER (WHERE status != 'closed') AS open_proceedings,
        SUM(demand_outstanding_inr) AS total_demand,
        MIN(next_hearing_date) FILTER (WHERE next_hearing_date >= CURRENT_DATE) AS next_hearing_date
    FROM public.proceeding_summary ps
    WHERE ps.client_id = c.id
) proc_stats ON true

LEFT JOIN LATERAL (
    SELECT
        SUM(cost_inr) AS monthly_cost_inr
    FROM public.ai_usage_logs au
    WHERE au.client_id = c.id
      AND au.created_at > NOW() - INTERVAL '30 days'
) cost_stats ON true;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_v_client_dashboard_client_id
    ON public.v_client_dashboard_summary(client_id);

CREATE INDEX IF NOT EXISTS idx_v_client_dashboard_attention
    ON public.v_client_dashboard_summary(attention_level);

-- Function to refresh dashboard view
CREATE OR REPLACE FUNCTION public.refresh_client_dashboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.v_client_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

COMMENT ON MATERIALIZED VIEW public.v_client_dashboard_summary IS 'Aggregated dashboard data per client - refresh every 15 mins';


-- ============================================================================
-- SECTION 12: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.client_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proceeding_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;


-- Create user_client_access table if not exists (for multi-user access)
CREATE TABLE IF NOT EXISTS public.user_client_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
    granted_at TIMESTAMPTZ DEFAULT now(),
    granted_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_user_client UNIQUE (user_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_user_client_access_user ON public.user_client_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_client_access_client ON public.user_client_access(client_id);


-- Helper function: Check if user has access to client
CREATE OR REPLACE FUNCTION public.user_has_client_access(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user owns the client or has explicit access
    RETURN EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = p_client_id AND c.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.user_client_access uca
        WHERE uca.client_id = p_client_id AND uca.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RLS Policies: client_credentials
DROP POLICY IF EXISTS "Users can view own client credentials" ON public.client_credentials;
CREATE POLICY "Users can view own client credentials"
    ON public.client_credentials FOR SELECT
    USING (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can insert own client credentials" ON public.client_credentials;
CREATE POLICY "Users can insert own client credentials"
    ON public.client_credentials FOR INSERT
    WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can update own client credentials" ON public.client_credentials;
CREATE POLICY "Users can update own client credentials"
    ON public.client_credentials FOR UPDATE
    USING (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can delete own client credentials" ON public.client_credentials;
CREATE POLICY "Users can delete own client credentials"
    ON public.client_credentials FOR DELETE
    USING (public.user_has_client_access(client_id));


-- RLS Policies: portal_documents
DROP POLICY IF EXISTS "Users can view own client documents" ON public.portal_documents;
CREATE POLICY "Users can view own client documents"
    ON public.portal_documents FOR SELECT
    USING (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can insert own client documents" ON public.portal_documents;
CREATE POLICY "Users can insert own client documents"
    ON public.portal_documents FOR INSERT
    WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can update own client documents" ON public.portal_documents;
CREATE POLICY "Users can update own client documents"
    ON public.portal_documents FOR UPDATE
    USING (public.user_has_client_access(client_id));


-- RLS Policies: document_analysis
DROP POLICY IF EXISTS "Users can view own document analysis" ON public.document_analysis;
CREATE POLICY "Users can view own document analysis"
    ON public.document_analysis FOR SELECT
    USING (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can insert document analysis" ON public.document_analysis;
CREATE POLICY "Users can insert document analysis"
    ON public.document_analysis FOR INSERT
    WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can update document analysis" ON public.document_analysis;
CREATE POLICY "Users can update document analysis"
    ON public.document_analysis FOR UPDATE
    USING (public.user_has_client_access(client_id));


-- RLS Policies: action_items
DROP POLICY IF EXISTS "Users can view own action items" ON public.action_items;
CREATE POLICY "Users can view own action items"
    ON public.action_items FOR SELECT
    USING (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can manage own action items" ON public.action_items;
CREATE POLICY "Users can manage own action items"
    ON public.action_items FOR ALL
    USING (public.user_has_client_access(client_id));


-- RLS Policies: sync_logs
DROP POLICY IF EXISTS "Users can view own sync logs" ON public.sync_logs;
CREATE POLICY "Users can view own sync logs"
    ON public.sync_logs FOR SELECT
    USING (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can insert sync logs" ON public.sync_logs;
CREATE POLICY "Users can insert sync logs"
    ON public.sync_logs FOR INSERT
    WITH CHECK (public.user_has_client_access(client_id));


-- RLS Policies: proceeding_summary
DROP POLICY IF EXISTS "Users can view own proceedings" ON public.proceeding_summary;
CREATE POLICY "Users can view own proceedings"
    ON public.proceeding_summary FOR SELECT
    USING (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can manage own proceedings" ON public.proceeding_summary;
CREATE POLICY "Users can manage own proceedings"
    ON public.proceeding_summary FOR ALL
    USING (public.user_has_client_access(client_id));


-- RLS Policies: ai_usage_logs
DROP POLICY IF EXISTS "Users can view own AI usage" ON public.ai_usage_logs;
CREATE POLICY "Users can view own AI usage"
    ON public.ai_usage_logs FOR SELECT
    USING (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Users can insert AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Users can insert AI usage logs"
    ON public.ai_usage_logs FOR INSERT
    WITH CHECK (public.user_has_client_access(client_id));


-- Service role bypass for backend operations
-- (Service role automatically bypasses RLS in Supabase)


-- ============================================================================
-- SECTION 13: STORAGE BUCKET SETUP
-- ============================================================================

-- Note: Storage bucket creation via SQL is limited in Supabase
-- This needs to be done via Supabase Dashboard or Storage API
-- Below is the equivalent setup code for documentation
--
-- Create bucket via Supabase Dashboard or API:
-- Bucket name: tax-portal-documents
-- Public: false
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, image/png, image/jpeg, application/msword
--
-- Storage RLS policies (apply via Dashboard):
--
-- Policy 1: Users can read their client files
-- CREATE POLICY "Users can read own client files"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'tax-portal-documents' AND
--     public.user_has_client_access((storage.foldername(name))[1]::uuid)
-- );
--
-- Policy 2: Service role can insert files (for sync operations)
-- CREATE POLICY "Service can insert files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'tax-portal-documents'
-- );
--
-- Policy 3: Service role can delete files
-- CREATE POLICY "Service can delete files"
-- ON storage.objects FOR DELETE
-- USING (
--     bucket_id = 'tax-portal-documents'
-- );


-- ============================================================================
-- SECTION 14: HELPER VIEWS
-- ============================================================================

-- View: Upcoming hearings (next 30 days)
CREATE OR REPLACE VIEW public.v_upcoming_hearings AS
SELECT
    c.id AS client_id,
    c.name AS client_name,
    ps.assessment_year,
    ps.proceeding_type,
    ps.proceeding_reference,
    ps.next_hearing_date,
    ps.officer_name,
    ps.office_address,
    ai.title AS related_action,
    ai.status AS action_status,
    EXTRACT(DAY FROM ps.next_hearing_date - CURRENT_DATE) AS days_until_hearing
FROM public.proceeding_summary ps
JOIN public.clients c ON c.id = ps.client_id
LEFT JOIN public.action_items ai ON ai.client_id = ps.client_id
    AND ai.action_type = 'attend_hearing'
    AND ai.due_date = ps.next_hearing_date
WHERE ps.next_hearing_date >= CURRENT_DATE
  AND ps.next_hearing_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY ps.next_hearing_date;


-- View: Pending reply deadlines
CREATE OR REPLACE VIEW public.v_pending_deadlines AS
SELECT
    c.id AS client_id,
    c.name AS client_name,
    pd.assessment_year,
    pd.document_type,
    pd.document_name,
    pd.reply_deadline,
    pd.din_number,
    EXTRACT(DAY FROM pd.reply_deadline - CURRENT_DATE) AS days_remaining,
    CASE
        WHEN pd.reply_deadline < CURRENT_DATE THEN 'overdue'
        WHEN pd.reply_deadline <= CURRENT_DATE + INTERVAL '3 days' THEN 'critical'
        WHEN pd.reply_deadline <= CURRENT_DATE + INTERVAL '7 days' THEN 'urgent'
        ELSE 'normal'
    END AS urgency
FROM public.portal_documents pd
JOIN public.clients c ON c.id = pd.client_id
WHERE pd.reply_deadline IS NOT NULL
  AND pd.reply_deadline >= CURRENT_DATE - INTERVAL '7 days' -- Include recent overdue
ORDER BY pd.reply_deadline;


-- View: AI cost summary by client
CREATE OR REPLACE VIEW public.v_ai_cost_summary AS
SELECT
    c.id AS client_id,
    c.name AS client_name,
    COUNT(*) AS total_operations,
    SUM(al.tokens_total) AS total_tokens,
    SUM(al.cost_inr) AS total_cost_inr,
    SUM(al.cost_usd) AS total_cost_usd,
    AVG(al.processing_time_ms) AS avg_processing_time_ms,
    MAX(al.created_at) AS last_operation,
    SUM(al.cost_inr) FILTER (WHERE al.created_at > NOW() - INTERVAL '30 days') AS monthly_cost_inr,
    SUM(al.cost_inr) FILTER (WHERE al.created_at > NOW() - INTERVAL '7 days') AS weekly_cost_inr
FROM public.ai_usage_logs al
JOIN public.clients c ON c.id = al.client_id
GROUP BY c.id, c.name
ORDER BY total_cost_inr DESC;


-- View: Documents pending analysis
CREATE OR REPLACE VIEW public.v_documents_pending_analysis AS
SELECT
    pd.id AS document_id,
    c.id AS client_id,
    c.name AS client_name,
    pd.assessment_year,
    pd.document_type,
    pd.document_name,
    pd.proceeding_type,
    pd.issue_date,
    pd.hearing_date,
    pd.downloaded_at,
    pd.analysis_priority,
    EXTRACT(DAY FROM NOW() - pd.downloaded_at) AS days_since_download
FROM public.portal_documents pd
JOIN public.clients c ON c.id = pd.client_id
WHERE pd.is_analyzed = false
ORDER BY pd.analysis_priority, pd.downloaded_at;


-- ============================================================================
-- SECTION 15: SCHEDULED JOBS (via pg_cron or Supabase Edge Functions)
-- ============================================================================

-- Note: These need to be set up via Supabase Dashboard or pg_cron extension
-- Below is documentation of what jobs should be created
--
-- Job 1: Mark overdue actions (run every hour)
-- SELECT cron.schedule(
--     'mark-overdue-actions',
--     '0 * * * *',
--     $$SELECT public.mark_overdue_actions()$$
-- );
--
-- Job 2: Refresh dashboard materialized view (every 15 minutes)
-- SELECT cron.schedule(
--     'refresh-dashboard',
--     '0,15,30,45 * * * *',
--     $$SELECT public.refresh_client_dashboard()$$
-- );
--
-- Job 3: Nightly sync trigger (at 2 AM IST / 8:30 PM UTC)
-- This would be an Edge Function that triggers sync for all active clients


-- ============================================================================
-- SECTION 16: GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant access to tables for authenticated users (RLS will filter)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.portal_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.document_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_items TO authenticated;
GRANT SELECT, INSERT ON public.sync_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.proceeding_summary TO authenticated;
GRANT SELECT, INSERT ON public.ai_usage_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_client_access TO authenticated;

-- Grant access to views
GRANT SELECT ON public.v_upcoming_hearings TO authenticated;
GRANT SELECT ON public.v_pending_deadlines TO authenticated;
GRANT SELECT ON public.v_ai_cost_summary TO authenticated;
GRANT SELECT ON public.v_documents_pending_analysis TO authenticated;
GRANT SELECT ON public.v_client_dashboard_summary TO authenticated;

-- Full access for service role (backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;


-- ============================================================================
-- SECTION 17: INITIAL DATA / SEED DATA
-- ============================================================================

-- No seed data needed - tables will be populated via application


-- ============================================================================
-- SETUP INSTRUCTIONS
-- ============================================================================
--
-- SETUP STEPS:
--
-- 1. Run this entire SQL script in Supabase SQL Editor
--
-- 2. Create Storage Bucket:
--    - Go to Storage in Supabase Dashboard
--    - Create bucket: "tax-portal-documents"
--    - Set to Private (not public)
--    - Add allowed MIME types: application/pdf, image/png, image/jpeg
--    - Set max file size: 50MB
--
-- 3. Configure Storage Policies:
--    - Go to Storage > Policies
--    - Add SELECT policy for authenticated users using user_has_client_access()
--    - Service role automatically has full access
--
-- 4. Set up Scheduled Jobs (optional):
--    - Enable pg_cron extension in Database > Extensions
--    - Or use Supabase Edge Functions with cron triggers
--
-- 5. Configure Edge Function for Nightly Sync:
--    - Create Edge Function for portal sync
--    - Set up cron trigger for 2 AM IST
--
-- 6. Add to existing clients table (if not already present):
--    - Ensure clients table has: id (UUID), name, pan, email, user_id columns
--    - user_id should reference auth.users(id)
--
-- 7. Verify RLS:
--    - Test that authenticated users can only see their own data
--    - Verify service role can access all data
--
-- 8. Monitor Performance:
--    - Check index usage with: SELECT FROM pg_stat_user_indexes;
--    - Monitor slow queries in Supabase Dashboard
--
-- IMPORTANT NOTES:
--
-- - All credentials (portal passwords) should be encrypted BEFORE storage
-- - Use application-level AES-256-GCM encryption with unique IV per credential
-- - Never log or expose decrypted credentials
-- - Consent must be obtained before storing/using credentials
-- - Materialized view needs periodic refresh (recommended: every 15 mins)
-- - Consider partitioning portal_documents by assessment_year for 10000+ documents


-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
