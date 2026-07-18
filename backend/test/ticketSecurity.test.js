const test = require('node:test');
const assert = require('node:assert/strict');
const {
  base64UrlDecode,
  base64UrlEncode,
  createSignedQrToken,
  createValidationCode,
  hashValue,
  verifySignedQrToken,
} = require('../utils/ticketSecurity');

test('base64UrlEncode and base64UrlDecode round-trip JSON text', () => {
  const text = JSON.stringify({ ticketId: 'ticket-1', eventId: 'event-1' });
  assert.equal(base64UrlDecode(base64UrlEncode(text)), text);
});

test('hashValue returns a stable sha256 hex digest', () => {
  assert.equal(hashValue('abc'), hashValue('abc'));
  assert.match(hashValue('abc'), /^[a-f0-9]{64}$/);
});

test('hashValue changes when input changes', () => {
  assert.notEqual(hashValue('abc'), hashValue('abcd'));
});

test('createValidationCode returns URL-safe random tokens', () => {
  const code = createValidationCode();
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  assert.ok(code.length >= 24);
});

test('createSignedQrToken creates EVTQR version 1 tokens', () => {
  const token = createSignedQrToken({ ticketId: 't1', eventId: 'e1', validationCode: 'secret', issuedAt: '2026-01-01T00:00:00.000Z' });
  assert.match(token, /^EVTQR\.v1\./);
});

test('verifySignedQrToken returns original signed payload', () => {
  const token = createSignedQrToken({ ticketId: 't1', eventId: 'e1', validationCode: 'secret', issuedAt: '2026-01-01T00:00:00.000Z' });
  assert.deepEqual(verifySignedQrToken(token), {
    ticketId: 't1',
    eventId: 'e1',
    validationCode: 'secret',
    issuedAt: '2026-01-01T00:00:00.000Z',
  });
});

test('verifySignedQrToken rejects malformed tokens', () => {
  assert.throws(() => verifySignedQrToken('ticket-document-id'), /Invalid QR token format/);
});

test('verifySignedQrToken rejects tampered payloads', () => {
  const token = createSignedQrToken({ ticketId: 't1', eventId: 'e1', validationCode: 'secret', issuedAt: '2026-01-01T00:00:00.000Z' });
  const parts = token.split('.');
  const tamperedPayload = base64UrlEncode(JSON.stringify({ ticketId: 't2', eventId: 'e1', validationCode: 'secret' }));
  assert.throws(() => verifySignedQrToken(`EVTQR.v1.${tamperedPayload}.${parts[3]}`), /Invalid QR token signature/);
});

test('verifySignedQrToken rejects tampered signatures', () => {
  const token = createSignedQrToken({ ticketId: 't1', eventId: 'e1', validationCode: 'secret', issuedAt: '2026-01-01T00:00:00.000Z' });
  assert.throws(() => verifySignedQrToken(`${token}x`), /Invalid QR token signature/);
});

test('signed QR token binds ticket and event identifiers', () => {
  const token = createSignedQrToken({ ticketId: 'ticket-42', eventId: 'event-77', validationCode: 'secret', issuedAt: '2026-01-01T00:00:00.000Z' });
  const payload = verifySignedQrToken(token);
  assert.equal(payload.ticketId, 'ticket-42');
  assert.equal(payload.eventId, 'event-77');
});
