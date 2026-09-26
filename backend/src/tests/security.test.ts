import assert from 'assert';
import {
  encryptData,
  decryptData,
  timingSafeEqualString,
  sanitizeInput,
  generateToken,
  verifyToken,
  hashPin,
  verifyPinHash,
} from '../utils/security';
import { createRateLimiter, requireOwner } from '../middleware/security';

console.log('--- RUNNING SECURITY SUITE TESTS ---');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✓ ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ✗ ${name}:`, err.message);
            failed++;
          });
      } else {
        console.log(`  ✓ ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // 1. AES-256-GCM Encryption Tests
  console.log('\n[1] Testing AES-256-GCM Authenticated Encryption:');
  test('Encrypt and decrypt returns original plaintext', () => {
    const secretMessage = 'Customer Aadhaar / Private Sheet Token #12345';
    const encrypted = encryptData(secretMessage);
    assert(encrypted.ciphertext.length > 0, 'Ciphertext should not be empty');
    assert(encrypted.iv.length === 24, '12-byte IV should be 24 hex characters');
    assert(encrypted.authTag.length === 32, '16-byte auth tag should be 32 hex characters');

    const decrypted = decryptData(encrypted.ciphertext, encrypted.iv, encrypted.authTag);
    assert.strictEqual(decrypted, secretMessage, 'Decrypted text must match original');
  });

  test('IV uniqueness: Two encryptions of same text have different IVs and ciphertexts', () => {
    const text = 'Identical Customer Phone: 9974298866';
    const enc1 = encryptData(text);
    const enc2 = encryptData(text);
    assert.notStrictEqual(enc1.iv, enc2.iv, 'IVs must be unique');
    assert.notStrictEqual(enc1.ciphertext, enc2.ciphertext, 'Ciphertexts must differ due to unique IV');
  });

  test('Tamper detection: Modified ciphertext causes decryption failure', () => {
    const encrypted = encryptData('Confidential shop data');
    // Tamper with first character of ciphertext
    const tamperedHex = (encrypted.ciphertext[0] === 'a' ? 'b' : 'a') + encrypted.ciphertext.slice(1);
    assert.throws(() => {
      decryptData(tamperedHex, encrypted.iv, encrypted.authTag);
    }, /Unsupported state or unable to authenticate data/);
  });

  test('Tamper detection: Modified auth tag causes decryption failure', () => {
    const encrypted = encryptData('Confidential shop data');
    const tamperedTag = (encrypted.authTag[0] === '0' ? '1' : '0') + encrypted.authTag.slice(1);
    assert.throws(() => {
      decryptData(encrypted.ciphertext, encrypted.iv, tamperedTag);
    }, /Unsupported state or unable to authenticate data/);
  });

  // 2. Timing-Safe String Comparison
  console.log('\n[2] Testing Timing-Safe String Comparison:');
  test('Identical strings match', () => {
    assert.strictEqual(timingSafeEqualString('9974', '9974'), true);
    assert.strictEqual(timingSafeEqualString('secret_token_abc', 'secret_token_abc'), true);
  });

  test('Non-matching strings or different lengths fail safely without throwing', () => {
    assert.strictEqual(timingSafeEqualString('9974', '9975'), false);
    assert.strictEqual(timingSafeEqualString('9974', '997'), false);
    assert.strictEqual(timingSafeEqualString('short', 'much_longer_string'), false);
    assert.strictEqual(timingSafeEqualString('', '9974'), false);
  });

  // 3. XSS Input Sanitization
  console.log('\n[3] Testing Input Sanitization:');
  test('Removes script tags and dangerous HTML characters', () => {
    const maliciousInput = '<script>alert("hacked")</script>Display Problem & Battery <img src=x onerror=alert(1)>';
    const sanitized = sanitizeInput(maliciousInput);
    assert(!sanitized.includes('<script>'), 'Must strip script tags');
    assert(!sanitized.includes('</script>'), 'Must strip script tags');
    assert(!sanitized.includes('<'), 'Must strip < bracket');
    assert(!sanitized.includes('>'), 'Must strip > bracket');
  });

  test('Preserves clean alphanumeric and normal punctuation', () => {
    const clean = 'Samsung Galaxy S23 Ultra - Broken Screen. Advance: Rs. 500';
    assert.strictEqual(sanitizeInput(clean), clean);
  });

  // 4. BCrypt PIN Hashing
  console.log('\n[4] Testing BCrypt PIN Hashing:');
  await test('Hashes PIN and verifies correctly', async () => {
    const pin = '9974';
    const hash = await hashPin(pin);
    assert(hash.startsWith('$2'), 'Should be valid bcrypt hash');
    const isMatch = await verifyPinHash(pin, hash);
    assert.strictEqual(isMatch, true, 'Correct PIN must verify');
    const isWrong = await verifyPinHash('0000', hash);
    assert.strictEqual(isWrong, false, 'Incorrect PIN must fail');
  });

  // 5. JWT Session Token Generation & Verification
  console.log('\n[5] Testing JWT Tokens:');
  test('Generates and verifies owner token', () => {
    const token = generateToken({ role: 'owner', name: 'Ashok Bhai' }, '1h');
    const verified = verifyToken(token);
    assert(verified !== null, 'Token must verify');
    assert.strictEqual(verified?.role, 'owner');
    assert.strictEqual(verified?.name, 'Ashok Bhai');
  });

  test('Rejects invalid or tampered tokens', () => {
    const token = generateToken({ role: 'employee', name: 'Worker' });
    const tampered = token.slice(0, -5) + 'xxxxx';
    assert.strictEqual(verifyToken(tampered), null);
    assert.strictEqual(verifyToken('totally_invalid_token'), null);
  });

  // 6. Rate Limiter Middleware
  console.log('\n[6] Testing In-Memory Rate Limiter:');
  test('Allows requests up to max and blocks excess with 429', () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 3,
      message: 'Rate limit exceeded',
    });

    const mockReq = {
      headers: {},
      socket: { remoteAddress: '192.168.1.100' },
    } as any;

    let blocked = false;
    let statusCode = 200;
    let jsonResponse: any = null;

    const mockRes = {
      setHeader: (_name: string, _val: any) => {},
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            jsonResponse = data;
            blocked = true;
          },
        };
      },
    } as any;

    let nextCount = 0;
    const next = () => { nextCount++; };

    // Requests 1, 2, 3 should succeed
    limiter(mockReq, mockRes, next);
    limiter(mockReq, mockRes, next);
    limiter(mockReq, mockRes, next);
    assert.strictEqual(nextCount, 3, 'First 3 requests should call next()');
    assert.strictEqual(blocked, false, 'Should not be blocked on 3rd request');

    // 4th request must be blocked
    limiter(mockReq, mockRes, next);
    assert.strictEqual(nextCount, 3, 'Blocked request should NOT call next()');
    assert.strictEqual(blocked, true, '4th request must be blocked');
    assert.strictEqual(statusCode, 429, 'Status must be 429 Too Many Requests');
    assert.strictEqual(jsonResponse.success, false);
  });

  // 7. Role Authorization Middleware (requireOwner)
  console.log('\n[7] Testing Role Authorization:');
  test('Rejects request without owner credentials with 403', () => {
    const req = { headers: {}, user: undefined } as any;
    let statusCode = 200;
    let sent = false;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: () => { sent = true; },
        };
      },
    } as any;
    let nextCalled = false;
    requireOwner(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Unauthorized request must not proceed');
    assert.strictEqual(statusCode, 403, 'Should return 403 Forbidden');
    assert.strictEqual(sent, true);
  });

  test('Allows owner with valid JWT user', () => {
    const req = {
      headers: {},
      user: { role: 'owner', name: 'Ashok Bhai' },
    } as any;
    const res = {} as any;
    let nextCalled = false;
    requireOwner(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'Owner JWT must allow access');
  });

  test('Rejects employee JWT trying to access owner resources', () => {
    const req = {
      headers: {},
      user: { role: 'employee', name: 'Mitesh' },
    } as any;
    let statusCode = 200;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return { json: () => {} };
      },
    } as any;
    let nextCalled = false;
    requireOwner(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Employee must not access owner resources');
    assert.strictEqual(statusCode, 403);
  });

  test('Allows owner with valid x-owner-pin header', () => {
    const req = {
      headers: { 'x-owner-pin': process.env.OWNER_PIN || '9974' },
      user: undefined,
    } as any;
    const res = {} as any;
    let nextCalled = false;
    requireOwner(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'Valid owner PIN header must allow access');
    assert.strictEqual(req.user?.role, 'owner');
  });

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
