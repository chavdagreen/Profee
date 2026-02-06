-- ============================================================================
-- Migration: Add auth_tag column to client_credentials table
-- Purpose: Store authentication tag for AES-256-GCM encryption
-- Date: 2024-02-06
-- ============================================================================

-- Add auth_tag column for storing GCM authentication tag
ALTER TABLE public.client_credentials
ADD COLUMN IF NOT EXISTS auth_tag TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.client_credentials.auth_tag IS 'GCM authentication tag (hex) - required for decryption and tamper detection';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
