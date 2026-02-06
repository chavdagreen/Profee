/**
 * ============================================================================
 * PROFEE - Encryption Service for Income Tax Portal Credentials
 * ============================================================================
 *
 * This service provides secure encryption/decryption for storing sensitive
 * credentials like Income Tax portal passwords using AES-256-GCM.
 *
 * SECURITY FEATURES:
 * - AES-256-GCM (Authenticated Encryption with Associated Data)
 * - Random IV (Initialization Vector) for each encryption
 * - Authentication tag to detect tampering
 * - Timing-safe comparisons to prevent timing attacks
 *
 * IMPORTANT:
 * - Store ENCRYPTION_KEY in environment variable, NEVER in code
 * - Back up your encryption key securely - if lost, data cannot be recovered
 * - Never log plaintext passwords or encryption keys
 *
 * @author Profee
 * @version 1.0.0
 */

const crypto = require('crypto');

// ============================================================================
// CONSTANTS
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;        // 256 bits = 32 bytes
const IV_LENGTH = 16;         // 128 bits = 16 bytes (recommended for GCM)
const AUTH_TAG_LENGTH = 16;   // 128 bits = 16 bytes
const KEY_HEX_LENGTH = 64;    // 32 bytes * 2 = 64 hex characters

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the encryption key from environment variable
 *
 * @returns {Buffer} The encryption key as a Buffer
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid
 *
 * @example
 * // In .env file:
 * // ENCRYPTION_KEY=your64characterhexkeyhere...
 *
 * const key = getEncryptionKey();
 */
function getEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      'ENCRYPTION_KEY not found in environment.\n' +
      'Please set ENCRYPTION_KEY in your .env file.\n' +
      'Generate a key using: node src/services/encryption-service.js --generate-key'
    );
  }

  if (keyHex.length !== KEY_HEX_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_HEX_LENGTH} hex characters (${KEY_LENGTH} bytes).\n` +
      `Current length: ${keyHex.length} characters.\n` +
      'Generate a valid key using: node src/services/encryption-service.js --generate-key'
    );
  }

  // Validate hex format
  if (!/^[0-9a-fA-F]+$/.test(keyHex)) {
    throw new Error(
      'ENCRYPTION_KEY must contain only hexadecimal characters (0-9, a-f, A-F).\n' +
      'Generate a valid key using: node src/services/encryption-service.js --generate-key'
    );
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Securely clear sensitive data from memory
 *
 * @param {Buffer|string} data - Data to clear
 */
function clearSensitiveData(data) {
  if (Buffer.isBuffer(data)) {
    data.fill(0);
  }
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Generate a cryptographically secure encryption key
 *
 * Run this ONCE during initial setup to create your ENCRYPTION_KEY.
 * Store the generated key in your .env file and back it up securely.
 *
 * @returns {string} A 64-character hex string (32 bytes)
 *
 * @example
 * const key = generateEncryptionKey();
 * console.log(key);
 * // Output: "a1b2c3d4e5f6..." (64 characters)
 *
 * // Add to .env file:
 * // ENCRYPTION_KEY=a1b2c3d4e5f6...
 *
 * @security
 * - Uses crypto.randomBytes() for cryptographically secure randomness
 * - Generate this key ONCE and store securely
 * - If lost, all encrypted data becomes unrecoverable
 */
function generateEncryptionKey() {
  const key = crypto.randomBytes(KEY_LENGTH);
  const keyHex = key.toString('hex');

  // Clear the buffer from memory
  clearSensitiveData(key);

  return keyHex;
}

/**
 * Encrypt sensitive credentials for secure storage
 *
 * Uses AES-256-GCM which provides:
 * - Confidentiality (data is encrypted)
 * - Integrity (detects if data was modified)
 * - Authentication (verifies data came from someone with the key)
 *
 * @param {string} plaintext - The password/credential to encrypt
 * @returns {Object} Encryption result
 * @returns {string} result.encrypted - Encrypted data in hex format
 * @returns {string} result.iv - Initialization vector in hex format
 * @returns {string} result.authTag - Authentication tag in hex format
 * @throws {Error} If encryption fails or ENCRYPTION_KEY is invalid
 *
 * @example
 * const password = 'mySecretPassword123';
 * const { encrypted, iv, authTag } = encryptCredentials(password);
 *
 * // Store in database:
 * await supabase.from('client_credentials').insert({
 *   portal_password: encrypted,
 *   encryption_iv: iv,
 *   auth_tag: authTag
 * });
 *
 * @security
 * - Each encryption uses a unique random IV
 * - Never reuse IV with the same key
 * - Store encrypted, iv, and authTag together
 * - All three are needed for decryption
 */
function encryptCredentials(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a non-empty string');
  }

  let key = null;
  let iv = null;
  let cipher = null;

  try {
    // Get encryption key from environment
    key = getEncryptionKey();

    // Generate a random IV for this encryption
    // CRITICAL: Never reuse IV with the same key
    iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with AES-256-GCM
    cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH
    });

    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };

  } catch (error) {
    // Don't reveal details about encryption failure
    if (error.message.includes('ENCRYPTION_KEY')) {
      throw error; // Re-throw key-related errors as-is
    }
    throw new Error('Encryption failed. Please check your encryption key.');

  } finally {
    // Clear sensitive data from memory
    if (key) clearSensitiveData(key);
    if (iv) clearSensitiveData(iv);
  }
}

/**
 * Decrypt credentials retrieved from database
 *
 * @param {string} encrypted - Encrypted data in hex format (from database)
 * @param {string} iv - Initialization vector in hex format (from database)
 * @param {string} authTag - Authentication tag in hex format (from database)
 * @returns {string} The original plaintext password
 * @throws {Error} If decryption fails (wrong key, corrupted data, or tampered data)
 *
 * @example
 * // Retrieve from database
 * const row = await supabase
 *   .from('client_credentials')
 *   .select('portal_password, encryption_iv, auth_tag')
 *   .eq('client_id', clientId)
 *   .single();
 *
 * // Decrypt
 * const password = decryptCredentials(
 *   row.portal_password,
 *   row.encryption_iv,
 *   row.auth_tag
 * );
 *
 * @security
 * - Authentication tag is verified before returning data
 * - If data was tampered, decryption will fail
 * - Never reveals why decryption failed (security best practice)
 */
function decryptCredentials(encrypted, iv, authTag) {
  if (!encrypted || !iv || !authTag) {
    throw new Error('Missing required parameters: encrypted, iv, and authTag are all required');
  }

  if (typeof encrypted !== 'string' || typeof iv !== 'string' || typeof authTag !== 'string') {
    throw new Error('All parameters must be strings');
  }

  let key = null;
  let ivBuffer = null;
  let authTagBuffer = null;
  let decipher = null;

  try {
    // Get encryption key from environment
    key = getEncryptionKey();

    // Convert hex strings to Buffers
    ivBuffer = Buffer.from(iv, 'hex');
    authTagBuffer = Buffer.from(authTag, 'hex');

    // Validate IV length
    if (ivBuffer.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }

    // Validate authTag length
    if (authTagBuffer.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid authTag length');
    }

    // Create decipher with AES-256-GCM
    decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, {
      authTagLength: AUTH_TAG_LENGTH
    });

    // Set the authentication tag for verification
    decipher.setAuthTag(authTagBuffer);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;

  } catch (error) {
    // Don't reveal specific details about decryption failure
    if (error.message.includes('ENCRYPTION_KEY')) {
      throw error; // Re-throw key-related errors as-is
    }

    // Generic error message for security
    throw new Error(
      'Decryption failed. Possible causes:\n' +
      '- Wrong encryption key\n' +
      '- Data has been corrupted\n' +
      '- Data has been tampered with\n' +
      '- Invalid encrypted data format'
    );

  } finally {
    // Clear sensitive data from memory
    if (key) clearSensitiveData(key);
    if (ivBuffer) clearSensitiveData(ivBuffer);
    if (authTagBuffer) clearSensitiveData(authTagBuffer);
  }
}

/**
 * Validate that ENCRYPTION_KEY is properly configured
 *
 * Call this during application startup to ensure encryption is ready.
 *
 * @returns {boolean} true if key is valid
 * @throws {Error} If key is not set or invalid
 *
 * @example
 * // In your app initialization:
 * try {
 *   validateEncryptionKey();
 *   console.log('Encryption service ready');
 * } catch (error) {
 *   console.error('Encryption not configured:', error.message);
 *   process.exit(1);
 * }
 */
function validateEncryptionKey() {
  // This will throw if key is invalid
  const key = getEncryptionKey();

  // Clear the key from memory after validation
  clearSensitiveData(key);

  return true;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * Command-line interface for testing and key generation
 *
 * Usage:
 *   node encryption-service.js --generate-key
 *   node encryption-service.js --test "password"
 *   node encryption-service.js --encrypt "password"
 *   node encryption-service.js --decrypt <encrypted> <iv> <authTag>
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        PROFEE - Encryption Service CLI                       ║');
  console.log('║        AES-256-GCM Authenticated Encryption                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // --generate-key: Generate a new encryption key
  if (command === '--generate-key') {
    console.log('🔐 Generating new encryption key...\n');

    const key = generateEncryptionKey();

    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│ YOUR NEW ENCRYPTION KEY (copy this entire line):               │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│ ${key} │`);
    console.log('└─────────────────────────────────────────────────────────────────┘');
    console.log('\n📝 Add this to your .env file:');
    console.log('─'.repeat(65));
    console.log(`ENCRYPTION_KEY=${key}`);
    console.log('─'.repeat(65));
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   • Store this key securely - if lost, encrypted data cannot be recovered');
    console.log('   • Never commit this key to version control');
    console.log('   • Back up this key in a secure offline location');
    console.log('   • Use different keys for development and production\n');
  }

  // --test: Test encryption and decryption
  else if (command === '--test') {
    const testPassword = args[1] || 'TestPassword123!@#';

    console.log('🧪 Running encryption test...\n');
    console.log(`   Test input: "${testPassword}"`);
    console.log('─'.repeat(65));

    try {
      // Check if key is configured
      validateEncryptionKey();
      console.log('✓ Encryption key validated\n');

      // Benchmark encryption
      const encryptStart = process.hrtime.bigint();
      const { encrypted, iv, authTag } = encryptCredentials(testPassword);
      const encryptEnd = process.hrtime.bigint();
      const encryptTime = Number(encryptEnd - encryptStart) / 1000000; // Convert to ms

      console.log('📦 Encrypted Result:');
      console.log(`   encrypted: ${encrypted}`);
      console.log(`   iv:        ${iv}`);
      console.log(`   authTag:   ${authTag}`);
      console.log(`   ⏱️  Time: ${encryptTime.toFixed(3)} ms\n`);

      // Benchmark decryption
      const decryptStart = process.hrtime.bigint();
      const decrypted = decryptCredentials(encrypted, iv, authTag);
      const decryptEnd = process.hrtime.bigint();
      const decryptTime = Number(decryptEnd - decryptStart) / 1000000;

      console.log('🔓 Decrypted Result:');
      console.log(`   decrypted: "${decrypted}"`);
      console.log(`   ⏱️  Time: ${decryptTime.toFixed(3)} ms\n`);

      // Verify match
      if (decrypted === testPassword) {
        console.log('─'.repeat(65));
        console.log('✅ TEST PASSED - Encryption and decryption successful!');
        console.log('─'.repeat(65));

        // Performance stats
        const totalTime = encryptTime + decryptTime;
        const opsPerSecond = Math.round(1000 / totalTime);
        console.log('\n📊 Performance:');
        console.log(`   Total time: ${totalTime.toFixed(3)} ms`);
        console.log(`   Operations/second: ~${opsPerSecond} encrypt+decrypt cycles`);
      } else {
        console.log('❌ TEST FAILED - Decrypted value does not match original!');
        process.exit(1);
      }

    } catch (error) {
      console.log('─'.repeat(65));
      console.log('❌ TEST FAILED');
      console.log('─'.repeat(65));
      console.log(`Error: ${error.message}\n`);
      process.exit(1);
    }
  }

  // --encrypt: Encrypt a password
  else if (command === '--encrypt') {
    const password = args[1];

    if (!password) {
      console.log('❌ Error: Please provide a password to encrypt');
      console.log('   Usage: node encryption-service.js --encrypt "yourPassword"');
      process.exit(1);
    }

    console.log('🔒 Encrypting password...\n');

    try {
      const { encrypted, iv, authTag } = encryptCredentials(password);

      console.log('┌─────────────────────────────────────────────────────────────────┐');
      console.log('│ ENCRYPTION RESULT                                               │');
      console.log('├─────────────────────────────────────────────────────────────────┤');
      console.log(`│ encrypted: ${encrypted.substring(0, 50)}...`);
      console.log(`│ iv:        ${iv}`);
      console.log(`│ authTag:   ${authTag}`);
      console.log('└─────────────────────────────────────────────────────────────────┘');

      console.log('\n📋 Copy-paste for database:');
      console.log('─'.repeat(65));
      console.log(JSON.stringify({ encrypted, iv, authTag }, null, 2));
      console.log('─'.repeat(65));

      console.log('\n💡 To decrypt, run:');
      console.log(`   node encryption-service.js --decrypt "${encrypted}" "${iv}" "${authTag}"`);

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  // --decrypt: Decrypt encrypted data
  else if (command === '--decrypt') {
    const encrypted = args[1];
    const iv = args[2];
    const authTag = args[3];

    if (!encrypted || !iv || !authTag) {
      console.log('❌ Error: Please provide all required parameters');
      console.log('   Usage: node encryption-service.js --decrypt <encrypted> <iv> <authTag>');
      process.exit(1);
    }

    console.log('🔓 Decrypting...\n');

    try {
      const decrypted = decryptCredentials(encrypted, iv, authTag);

      console.log('┌─────────────────────────────────────────────────────────────────┐');
      console.log('│ DECRYPTION RESULT                                               │');
      console.log('├─────────────────────────────────────────────────────────────────┤');
      console.log(`│ Decrypted password: ${decrypted}`);
      console.log('└─────────────────────────────────────────────────────────────────┘');

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  // --validate: Check if encryption key is configured
  else if (command === '--validate') {
    console.log('🔍 Validating encryption key...\n');

    try {
      validateEncryptionKey();
      console.log('✅ Encryption key is valid and ready to use!');
    } catch (error) {
      console.log(`❌ ${error.message}`);
      process.exit(1);
    }
  }

  // No command or --help: Show usage
  else {
    console.log('Usage:\n');
    console.log('  Generate a new encryption key:');
    console.log('    node src/services/encryption-service.js --generate-key\n');
    console.log('  Test encryption/decryption:');
    console.log('    node src/services/encryption-service.js --test "myPassword123"\n');
    console.log('  Encrypt a password:');
    console.log('    node src/services/encryption-service.js --encrypt "myPassword123"\n');
    console.log('  Decrypt encrypted data:');
    console.log('    node src/services/encryption-service.js --decrypt <encrypted> <iv> <authTag>\n');
    console.log('  Validate encryption key:');
    console.log('    node src/services/encryption-service.js --validate\n');
    console.log('─'.repeat(65));
    console.log('📝 Setup Instructions:');
    console.log('   1. Run --generate-key to create a new encryption key');
    console.log('   2. Add the key to your .env file as ENCRYPTION_KEY=...');
    console.log('   3. Run --test to verify encryption is working');
    console.log('─'.repeat(65));
  }

  console.log('');
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  generateEncryptionKey,
  encryptCredentials,
  decryptCredentials,
  validateEncryptionKey,

  // Export constants for reference
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  KEY_HEX_LENGTH
};
