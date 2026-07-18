const BACKEND_BASE = process.env.REACT_APP_API_BASE || '';

async function registerAccount(data) {
  const response = await fetch(`${BACKEND_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function loginUser(data) {
  const response = await fetch(`${BACKEND_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function sendPasswordResetEmail(email) {
  const response = await fetch(`${BACKEND_BASE}/api/auth/send-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return response.json();
}

async function verifyToken() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const response = await fetch(`${BACKEND_BASE}/api/auth/verify-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.error('Token verification failed:', error);
  }
  return null;
}

export { registerAccount, loginUser, sendPasswordResetEmail, verifyToken };
