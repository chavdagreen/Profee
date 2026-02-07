/**
 * ============================================================================
 * PROFEE - PDF Processor Service for Income Tax Documents
 * ============================================================================
 *
 * This service handles all PDF operations before sending documents to the
 * Claude API for AI analysis. It extracts text, validates PDFs, and prepares
 * content for structured analysis of Income Tax notices and orders.
 *
 * SUPPORTED DOCUMENT TYPES:
 * - Income Tax Notices (Section 143, 148, 156, etc.)
 * - Assessment Orders
 * - Demand Notices
 * - Intimation Orders (CPC)
 * - Appeal Orders (CIT-A, ITAT)
 * - Rectification Orders (Section 154)
 *
 * DEPENDENCIES:
 * - pdf-parse: Text extraction from PDF buffers
 * - pdf-lib: PDF manipulation, page extraction, metadata reading
 *
 * @author Profee
 * @version 1.0.0
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

import { PDFDocument } from 'pdf-lib';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum PDF file size in bytes (50 MB) */
export const MAX_PDF_SIZE = 50 * 1024 * 1024;

/** Minimum text length to consider a PDF as text-based (not scanned) */
export const MIN_TEXT_THRESHOLD = 50;

/** Maximum characters per chunk for AI API calls */
export const DEFAULT_CHUNK_SIZE = 100000;

/** Overlap between chunks to preserve context at boundaries */
export const DEFAULT_CHUNK_OVERLAP = 500;

/** Common Income Tax section references for document classification */
export const IT_SECTION_PATTERNS = [
  { pattern: /section\s*143\s*\(\s*1\s*\)/i, type: 'Intimation', section: '143(1)' },
  { pattern: /section\s*143\s*\(\s*2\s*\)/i, type: 'Scrutiny Notice', section: '143(2)' },
  { pattern: /section\s*143\s*\(\s*3\s*\)/i, type: 'Assessment Order', section: '143(3)' },
  { pattern: /section\s*144/i, type: 'Best Judgment Assessment', section: '144' },
  { pattern: /section\s*147/i, type: 'Reassessment', section: '147' },
  { pattern: /section\s*148/i, type: 'Reassessment Notice', section: '148' },
  { pattern: /section\s*148A/i, type: 'Reassessment Notice', section: '148A' },
  { pattern: /section\s*154/i, type: 'Rectification Order', section: '154' },
  { pattern: /section\s*156/i, type: 'Demand Notice', section: '156' },
  { pattern: /section\s*245/i, type: 'Set Off Notice', section: '245' },
  { pattern: /section\s*246A/i, type: 'Appeal', section: '246A' },
  { pattern: /section\s*250/i, type: 'CIT(A) Order', section: '250' },
  { pattern: /section\s*254/i, type: 'ITAT Order', section: '254' },
  { pattern: /section\s*263/i, type: 'Revision Order', section: '263' },
  { pattern: /section\s*264/i, type: 'Revision Order', section: '264' },
  { pattern: /section\s*271/i, type: 'Penalty Notice', section: '271' },
  { pattern: /section\s*274/i, type: 'Penalty Notice', section: '274' },
];

/** PAN format: 5 letters, 4 digits, 1 letter */
const PAN_REGEX = /[A-Z]{5}[0-9]{4}[A-Z]/g;

/** Assessment Year format: YYYY-YY or YYYY-YYYY */
const AY_REGEX = /(?:A\.?\s*Y\.?\s*|Assessment\s+Year\s*:?\s*)(\d{4}\s*[-–]\s*\d{2,4})/gi;

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Extract all text content from a PDF buffer
 *
 * Parses the PDF and extracts text from all pages. Detects whether
 * the PDF contains selectable text (text-based) or is a scanned image.
 * Most Income Tax notices from the portal are text-based PDFs.
 *
 * @param {Buffer} pdfBuffer - PDF file as binary data
 * @returns {Promise<Object>} Extraction result
 * @returns {string} result.text - All extracted text concatenated
 * @returns {number} result.pageCount - Total number of pages
 * @returns {boolean} result.hasTextLayer - True if PDF has selectable text
 * @returns {Object} result.metadata - PDF metadata
 * @returns {string} result.metadata.title - Document title
 * @returns {string} result.metadata.author - Document author
 * @returns {string} result.metadata.creator - PDF creator application
 * @returns {string} result.metadata.producer - PDF producer application
 * @throws {Error} If pdfBuffer is invalid or PDF parsing fails
 *
 * @example
 * import { extractTextFromPDF } from './pdf-processor.js';
 * import fs from 'fs';
 *
 * const pdfBuffer = fs.readFileSync('notice_143_1.pdf');
 * const result = await extractTextFromPDF(pdfBuffer);
 * console.log(result.text);         // Full extracted text
 * console.log(result.pageCount);    // e.g., 3
 * console.log(result.hasTextLayer); // true for portal-generated PDFs
 */
export async function extractTextFromPDF(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Invalid input: pdfBuffer must be a Buffer');
  }

  if (pdfBuffer.length === 0) {
    throw new Error('Invalid input: PDF buffer is empty');
  }

  if (pdfBuffer.length > MAX_PDF_SIZE) {
    throw new Error(
      `PDF file size (${(pdfBuffer.length / (1024 * 1024)).toFixed(1)} MB) ` +
      `exceeds maximum allowed size (${MAX_PDF_SIZE / (1024 * 1024)} MB)`
    );
  }

  try {
    const parsed = await pdfParse(pdfBuffer);

    const text = parsed.text || '';
    const trimmedText = text.trim();
    const hasTextLayer = trimmedText.length >= MIN_TEXT_THRESHOLD;

    return {
      text: trimmedText,
      pageCount: parsed.numpages || 0,
      hasTextLayer,
      metadata: {
        title: parsed.info?.Title || '',
        author: parsed.info?.Author || '',
        creator: parsed.info?.Creator || '',
        producer: parsed.info?.Producer || '',
      },
    };

  } catch (error) {
    if (error.message.includes('Invalid')) {
      throw error;
    }
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Validate a PDF buffer before processing
 *
 * Checks file size, PDF header signature, and structural integrity.
 * Use this before calling other functions to provide clear error messages.
 *
 * @param {Buffer} pdfBuffer - PDF file as binary data
 * @returns {Promise<Object>} Validation result
 * @returns {boolean} result.isValid - Whether the PDF is valid
 * @returns {number} result.fileSize - File size in bytes
 * @returns {number} result.pageCount - Number of pages
 * @returns {string|null} result.error - Error message if invalid, null if valid
 *
 * @example
 * const validation = await validatePDF(pdfBuffer);
 * if (!validation.isValid) {
 *   console.error('Invalid PDF:', validation.error);
 *   return;
 * }
 * console.log(`Valid PDF with ${validation.pageCount} pages`);
 */
export async function validatePDF(pdfBuffer) {
  // Check input type
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    return {
      isValid: false,
      fileSize: 0,
      pageCount: 0,
      error: 'Input must be a Buffer containing PDF data',
    };
  }

  // Check file size
  if (pdfBuffer.length === 0) {
    return {
      isValid: false,
      fileSize: 0,
      pageCount: 0,
      error: 'PDF buffer is empty',
    };
  }

  if (pdfBuffer.length > MAX_PDF_SIZE) {
    return {
      isValid: false,
      fileSize: pdfBuffer.length,
      pageCount: 0,
      error: `File size (${(pdfBuffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds maximum (${MAX_PDF_SIZE / (1024 * 1024)} MB)`,
    };
  }

  // Check PDF magic bytes (%PDF-)
  const header = pdfBuffer.slice(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    return {
      isValid: false,
      fileSize: pdfBuffer.length,
      pageCount: 0,
      error: 'File does not have a valid PDF header. Ensure this is a PDF file.',
    };
  }

  // Try loading with pdf-lib to verify structural integrity
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    return {
      isValid: true,
      fileSize: pdfBuffer.length,
      pageCount,
      error: null,
    };

  } catch (error) {
    return {
      isValid: false,
      fileSize: pdfBuffer.length,
      pageCount: 0,
      error: `PDF structure is corrupted or unreadable: ${error.message}`,
    };
  }
}

/**
 * Extract text from specific pages of a PDF
 *
 * Creates a new PDF containing only the specified pages, then extracts
 * text from that subset. Useful for processing large documents in parts
 * or focusing on specific sections of an Income Tax order.
 *
 * @param {Buffer} pdfBuffer - PDF file as binary data
 * @param {number} startPage - Start page (1-indexed, inclusive)
 * @param {number} endPage - End page (1-indexed, inclusive)
 * @returns {Promise<Object>} Extraction result
 * @returns {string} result.text - Extracted text from specified pages
 * @returns {number} result.pageCount - Number of pages extracted
 * @returns {number} result.startPage - Actual start page used
 * @returns {number} result.endPage - Actual end page used
 * @throws {Error} If page range is invalid or PDF cannot be processed
 *
 * @example
 * // Extract text from pages 2-5 of a long assessment order
 * const result = await extractPageRange(pdfBuffer, 2, 5);
 * console.log(`Extracted ${result.pageCount} pages`);
 * console.log(result.text);
 */
export async function extractPageRange(pdfBuffer, startPage, endPage) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Invalid input: pdfBuffer must be a Buffer');
  }

  if (!Number.isInteger(startPage) || !Number.isInteger(endPage)) {
    throw new Error('startPage and endPage must be integers');
  }

  if (startPage < 1) {
    throw new Error('startPage must be at least 1');
  }

  if (endPage < startPage) {
    throw new Error('endPage must be greater than or equal to startPage');
  }

  try {
    // Load the source PDF
    const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();

    // Clamp page range to actual document
    const actualStart = Math.min(startPage, totalPages);
    const actualEnd = Math.min(endPage, totalPages);

    // Create a new PDF with only the requested pages
    const newPdf = await PDFDocument.create();
    const pageIndices = [];

    for (let i = actualStart - 1; i < actualEnd; i++) {
      pageIndices.push(i);
    }

    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    // Save the subset PDF and extract text
    const subsetBytes = await newPdf.save();
    const subsetBuffer = Buffer.from(subsetBytes);
    const parsed = await pdfParse(subsetBuffer);

    return {
      text: (parsed.text || '').trim(),
      pageCount: copiedPages.length,
      startPage: actualStart,
      endPage: actualEnd,
    };

  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('must be')) {
      throw error;
    }
    throw new Error(`Failed to extract page range: ${error.message}`);
  }
}

/**
 * Split extracted text into chunks suitable for AI API consumption
 *
 * Long Income Tax orders can exceed API token limits. This function
 * splits text into overlapping chunks to maintain context across
 * boundaries while staying within size limits.
 *
 * @param {string} text - Text content to split
 * @param {Object} [options] - Chunking options
 * @param {number} [options.chunkSize=100000] - Maximum characters per chunk
 * @param {number} [options.overlap=500] - Characters of overlap between chunks
 * @returns {Object[]} Array of chunk objects
 * @returns {string} chunk.text - Chunk text content
 * @returns {number} chunk.index - Zero-based chunk index
 * @returns {number} chunk.total - Total number of chunks
 * @returns {number} chunk.startChar - Start character offset in original text
 * @returns {number} chunk.endChar - End character offset in original text
 *
 * @example
 * const { text } = await extractTextFromPDF(pdfBuffer);
 * const chunks = chunkText(text, { chunkSize: 50000 });
 * for (const chunk of chunks) {
 *   console.log(`Chunk ${chunk.index + 1}/${chunk.total}: ${chunk.text.length} chars`);
 *   // Send chunk.text to Claude API
 * }
 */
export function chunkText(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap || DEFAULT_CHUNK_OVERLAP;

  if (chunkSize <= 0) {
    throw new Error('chunkSize must be a positive number');
  }

  if (overlap >= chunkSize) {
    throw new Error('overlap must be less than chunkSize');
  }

  // If text fits in a single chunk, return it directly
  if (text.length <= chunkSize) {
    return [{
      text,
      index: 0,
      total: 1,
      startChar: 0,
      endChar: text.length,
    }];
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Try to break at a paragraph or sentence boundary
    if (end < text.length) {
      // Look for paragraph break near the end
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + chunkSize * 0.7) {
        end = paragraphBreak + 2;
      } else {
        // Fall back to sentence break
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start + chunkSize * 0.7) {
          end = sentenceBreak + 2;
        }
      }
    }

    chunks.push({
      text: text.slice(start, end),
      index: chunks.length,
      total: 0, // Will be filled after loop
      startChar: start,
      endChar: end,
    });

    start = end - overlap;

    // Prevent infinite loop if overlap pushes start backwards
    if (start <= chunks[chunks.length - 1].startChar) {
      start = end;
    }
  }

  // Fill in total count
  chunks.forEach((chunk) => {
    chunk.total = chunks.length;
  });

  return chunks;
}

/**
 * Detect Income Tax document type and extract key references
 *
 * Scans extracted text for Income Tax Act section references, PAN numbers,
 * assessment years, and other identifiers commonly found in IT documents.
 *
 * @param {string} text - Extracted text from PDF
 * @returns {Object} Classification result
 * @returns {string[]} result.sections - Detected IT Act sections (e.g., ['143(1)', '156'])
 * @returns {string} result.documentType - Best guess document type (e.g., 'Intimation')
 * @returns {string[]} result.panNumbers - PAN numbers found in text
 * @returns {string[]} result.assessmentYears - Assessment years found (e.g., ['2023-24'])
 * @returns {boolean} result.isIncomeTaxDocument - Whether this appears to be an IT document
 *
 * @example
 * const { text } = await extractTextFromPDF(pdfBuffer);
 * const docInfo = detectDocumentType(text);
 * console.log(docInfo.documentType);    // 'Intimation'
 * console.log(docInfo.sections);        // ['143(1)']
 * console.log(docInfo.panNumbers);      // ['ABCDE1234F']
 * console.log(docInfo.assessmentYears); // ['2023-24']
 */
export function detectDocumentType(text) {
  if (!text || typeof text !== 'string') {
    return {
      sections: [],
      documentType: 'Unknown',
      panNumbers: [],
      assessmentYears: [],
      isIncomeTaxDocument: false,
    };
  }

  // Find all matching IT Act sections
  const matchedSections = [];
  let documentType = 'Unknown';

  for (const { pattern, type, section } of IT_SECTION_PATTERNS) {
    if (pattern.test(text)) {
      matchedSections.push(section);
      // First match determines primary document type
      if (documentType === 'Unknown') {
        documentType = type;
      }
    }
  }

  // Extract PAN numbers (deduplicated)
  const panMatches = text.match(PAN_REGEX) || [];
  const panNumbers = [...new Set(panMatches)];

  // Extract Assessment Years
  const ayMatches = [];
  let ayMatch;
  // Create fresh regex instance for global matching
  const ayRegex = new RegExp(AY_REGEX.source, AY_REGEX.flags);
  while ((ayMatch = ayRegex.exec(text)) !== null) {
    ayMatches.push(ayMatch[1].replace(/\s+/g, ''));
  }
  const assessmentYears = [...new Set(ayMatches)];

  // Determine if this is likely an Income Tax document
  const itKeywords = [
    /income\s*tax/i,
    /assessing\s*officer/i,
    /commissioner.*income\s*tax/i,
    /centralized\s*processing\s*centre/i,
    /CPC.*Bengaluru/i,
    /CBDT/i,
    /Form\s*No\.\s*(?:16|26AS|ITR)/i,
    /total\s*income/i,
    /tax\s*payable/i,
    /assessment\s*year/i,
  ];
  const keywordMatches = itKeywords.filter((kw) => kw.test(text)).length;
  const isIncomeTaxDocument = matchedSections.length > 0 || keywordMatches >= 2;

  return {
    sections: matchedSections,
    documentType,
    panNumbers,
    assessmentYears,
    isIncomeTaxDocument,
  };
}

/**
 * Prepare a PDF for AI analysis by extracting and structuring all relevant data
 *
 * This is the primary function to call before sending a document to Claude API.
 * It combines extraction, validation, classification, and chunking into a single
 * call that returns everything needed for AI analysis.
 *
 * @param {Buffer} pdfBuffer - PDF file as binary data
 * @param {Object} [options] - Processing options
 * @param {number} [options.chunkSize=100000] - Maximum characters per chunk
 * @param {number} [options.overlap=500] - Overlap between chunks
 * @returns {Promise<Object>} Prepared document data
 * @returns {boolean} result.isValid - Whether the PDF could be processed
 * @returns {string|null} result.error - Error message if processing failed
 * @returns {string} result.text - Full extracted text
 * @returns {number} result.pageCount - Total number of pages
 * @returns {boolean} result.hasTextLayer - Whether PDF has selectable text
 * @returns {Object} result.metadata - PDF metadata
 * @returns {Object} result.documentInfo - Detected document classification
 * @returns {Object[]} result.chunks - Text chunks ready for API calls
 * @returns {number} result.fileSize - Original file size in bytes
 *
 * @example
 * import { preparePDFForAnalysis } from './pdf-processor.js';
 * import fs from 'fs';
 *
 * const pdfBuffer = fs.readFileSync('notice.pdf');
 * const prepared = await preparePDFForAnalysis(pdfBuffer);
 *
 * if (!prepared.isValid) {
 *   console.error(prepared.error);
 *   return;
 * }
 *
 * console.log(`Document: ${prepared.documentInfo.documentType}`);
 * console.log(`Pages: ${prepared.pageCount}`);
 * console.log(`Chunks: ${prepared.chunks.length}`);
 *
 * // Send to Claude API
 * for (const chunk of prepared.chunks) {
 *   const response = await claudeAPI.analyze(chunk.text);
 * }
 */
export async function preparePDFForAnalysis(pdfBuffer, options = {}) {
  // Validate first
  const validation = await validatePDF(pdfBuffer);
  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error,
      text: '',
      pageCount: 0,
      hasTextLayer: false,
      metadata: { title: '', author: '', creator: '', producer: '' },
      documentInfo: {
        sections: [],
        documentType: 'Unknown',
        panNumbers: [],
        assessmentYears: [],
        isIncomeTaxDocument: false,
      },
      chunks: [],
      fileSize: pdfBuffer ? pdfBuffer.length : 0,
    };
  }

  try {
    // Extract text
    const extraction = await extractTextFromPDF(pdfBuffer);

    // Classify document
    const documentInfo = detectDocumentType(extraction.text);

    // Split into chunks
    const chunks = chunkText(extraction.text, {
      chunkSize: options.chunkSize || DEFAULT_CHUNK_SIZE,
      overlap: options.overlap || DEFAULT_CHUNK_OVERLAP,
    });

    return {
      isValid: true,
      error: null,
      text: extraction.text,
      pageCount: extraction.pageCount,
      hasTextLayer: extraction.hasTextLayer,
      metadata: extraction.metadata,
      documentInfo,
      chunks,
      fileSize: pdfBuffer.length,
    };

  } catch (error) {
    return {
      isValid: false,
      error: `PDF processing failed: ${error.message}`,
      text: '',
      pageCount: validation.pageCount,
      hasTextLayer: false,
      metadata: { title: '', author: '', creator: '', producer: '' },
      documentInfo: {
        sections: [],
        documentType: 'Unknown',
        panNumbers: [],
        assessmentYears: [],
        isIncomeTaxDocument: false,
      },
      chunks: [],
      fileSize: pdfBuffer.length,
    };
  }
}

/**
 * Get a summary of PDF contents for quick preview
 *
 * Returns a concise summary of the document without the full text.
 * Useful for displaying document info in the UI before full analysis.
 *
 * @param {Buffer} pdfBuffer - PDF file as binary data
 * @returns {Promise<Object>} Document summary
 * @returns {boolean} result.isValid - Whether the PDF could be read
 * @returns {number} result.pageCount - Number of pages
 * @returns {number} result.fileSize - File size in bytes
 * @returns {number} result.characterCount - Total character count
 * @returns {boolean} result.hasTextLayer - Whether text is extractable
 * @returns {string} result.documentType - Detected document type
 * @returns {string[]} result.sections - Detected IT Act sections
 * @returns {string[]} result.assessmentYears - Detected assessment years
 * @returns {string} result.preview - First 500 characters of text
 * @returns {string|null} result.error - Error message if invalid
 *
 * @example
 * const summary = await getPDFSummary(pdfBuffer);
 * console.log(`${summary.documentType} - ${summary.pageCount} pages`);
 * console.log(`AY: ${summary.assessmentYears.join(', ')}`);
 */
export async function getPDFSummary(pdfBuffer) {
  try {
    const prepared = await preparePDFForAnalysis(pdfBuffer);

    if (!prepared.isValid) {
      return {
        isValid: false,
        pageCount: 0,
        fileSize: pdfBuffer ? pdfBuffer.length : 0,
        characterCount: 0,
        hasTextLayer: false,
        documentType: 'Unknown',
        sections: [],
        assessmentYears: [],
        preview: '',
        error: prepared.error,
      };
    }

    return {
      isValid: true,
      pageCount: prepared.pageCount,
      fileSize: prepared.fileSize,
      characterCount: prepared.text.length,
      hasTextLayer: prepared.hasTextLayer,
      documentType: prepared.documentInfo.documentType,
      sections: prepared.documentInfo.sections,
      assessmentYears: prepared.documentInfo.assessmentYears,
      preview: prepared.text.substring(0, 500),
      error: null,
    };

  } catch (error) {
    return {
      isValid: false,
      pageCount: 0,
      fileSize: pdfBuffer ? pdfBuffer.length : 0,
      characterCount: 0,
      hasTextLayer: false,
      documentType: 'Unknown',
      sections: [],
      assessmentYears: [],
      preview: '',
      error: `Failed to summarize PDF: ${error.message}`,
    };
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * Command-line interface for testing PDF processing
 *
 * Usage:
 *   node src/services/pdf-processor.js --extract <file.pdf>
 *   node src/services/pdf-processor.js --validate <file.pdf>
 *   node src/services/pdf-processor.js --detect <file.pdf>
 *   node src/services/pdf-processor.js --summary <file.pdf>
 */
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  const fs = await import('fs');
  const path = await import('path');
  const args = process.argv.slice(2);
  const command = args[0];
  const filePath = args[1];

  console.log('\n' + '='.repeat(65));
  console.log('  PROFEE - PDF Processor Service CLI');
  console.log('  Income Tax Document Processing');
  console.log('='.repeat(65) + '\n');

  if (!command || command === '--help') {
    console.log('Usage:\n');
    console.log('  Extract text from PDF:');
    console.log('    node src/services/pdf-processor.js --extract <file.pdf>\n');
    console.log('  Validate a PDF file:');
    console.log('    node src/services/pdf-processor.js --validate <file.pdf>\n');
    console.log('  Detect document type:');
    console.log('    node src/services/pdf-processor.js --detect <file.pdf>\n');
    console.log('  Get document summary:');
    console.log('    node src/services/pdf-processor.js --summary <file.pdf>\n');
    console.log('-'.repeat(65));
    process.exit(0);
  }

  if (!filePath) {
    console.log('Error: Please provide a PDF file path');
    console.log('Usage: node src/services/pdf-processor.js ' + command + ' <file.pdf>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.log(`Error: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(resolvedPath);
  console.log(`File: ${resolvedPath}`);
  console.log(`Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
  console.log('-'.repeat(65) + '\n');

  try {
    if (command === '--extract') {
      const result = await extractTextFromPDF(pdfBuffer);
      console.log(`Pages: ${result.pageCount}`);
      console.log(`Has text layer: ${result.hasTextLayer}`);
      console.log(`Text length: ${result.text.length} characters`);
      console.log(`Metadata:`, JSON.stringify(result.metadata, null, 2));
      console.log('\n--- Extracted Text ---\n');
      console.log(result.text.substring(0, 2000));
      if (result.text.length > 2000) {
        console.log(`\n... (${result.text.length - 2000} more characters)`);
      }

    } else if (command === '--validate') {
      const result = await validatePDF(pdfBuffer);
      if (result.isValid) {
        console.log('Status: VALID');
        console.log(`Pages: ${result.pageCount}`);
        console.log(`Size: ${(result.fileSize / 1024).toFixed(1)} KB`);
      } else {
        console.log('Status: INVALID');
        console.log(`Error: ${result.error}`);
      }

    } else if (command === '--detect') {
      const extraction = await extractTextFromPDF(pdfBuffer);
      const docInfo = detectDocumentType(extraction.text);
      console.log(`Document Type: ${docInfo.documentType}`);
      console.log(`Is IT Document: ${docInfo.isIncomeTaxDocument}`);
      console.log(`Sections: ${docInfo.sections.join(', ') || 'None detected'}`);
      console.log(`PAN Numbers: ${docInfo.panNumbers.join(', ') || 'None detected'}`);
      console.log(`Assessment Years: ${docInfo.assessmentYears.join(', ') || 'None detected'}`);

    } else if (command === '--summary') {
      const summary = await getPDFSummary(pdfBuffer);
      console.log(`Valid: ${summary.isValid}`);
      console.log(`Pages: ${summary.pageCount}`);
      console.log(`Characters: ${summary.characterCount}`);
      console.log(`Has Text Layer: ${summary.hasTextLayer}`);
      console.log(`Document Type: ${summary.documentType}`);
      console.log(`Sections: ${summary.sections.join(', ') || 'None detected'}`);
      console.log(`Assessment Years: ${summary.assessmentYears.join(', ') || 'None detected'}`);
      if (summary.preview) {
        console.log('\n--- Preview ---\n');
        console.log(summary.preview);
      }

    } else {
      console.log(`Unknown command: ${command}`);
      console.log('Run with --help for usage information');
      process.exit(1);
    }

  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }

  console.log('');
}
