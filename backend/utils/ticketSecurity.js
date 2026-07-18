const crypto = require('crypto');

function getQrSecret() {
  return process.env.QR_SIGNING_SECRET || process.env.FIREBASE_AUTH_API_KEY || 'development-qr-secret';
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function hashValue(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function signPayload(payload) {
  return crypto.createHmac('sha256', getQrSecret()).update(payload).digest('base64url');
}

function createSignedQrToken({ ticketId, eventId, validationCode, issuedAt = new Date().toISOString() }) {
  const payload = base64UrlEncode(JSON.stringify({
    ticketId,
    eventId,
    validationCode,
    issuedAt,
  }));
  const signature = signPayload(payload);
  return `EVTQR.v1.${payload}.${signature}`;
}

function verifySignedQrToken(token) {
  const parts = String(token || '').trim().split('.');
  if (parts.length !== 4 || parts[0] !== 'EVTQR' || parts[1] !== 'v1') {
    throw new Error('Invalid QR token format');
  }

  const [, , payload, signature] = parts;
  const expectedSignature = signPayload(payload);
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new Error('Invalid QR token signature');
  }

  return JSON.parse(base64UrlDecode(payload));
}

function createValidationCode() {
  return crypto.randomBytes(24).toString('base64url');
}

module.exports = {
  base64UrlDecode,
  base64UrlEncode,
  createSignedQrToken,
  createValidationCode,
  hashValue,
  verifySignedQrToken,
};
