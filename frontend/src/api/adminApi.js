const BACKEND_BASE = process.env.REACT_APP_API_BASE || '';

async function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function listAllUsers() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/admin/users`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch users');
  }
  return response.json();
}

async function getPendingOrganisers() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/admin/organisers/pending`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch pending organisers');
  }
  return response.json();
}

async function approveOrganiser(userId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/admin/organisers/${userId}/approve`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to approve organiser');
  }
  return response.json();
}

async function rejectOrganiser(userId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/admin/organisers/${userId}/reject`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to reject organiser');
  }
  return response.json();
}

async function blockUser(userId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/admin/users/${userId}/block`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to block user');
  }
  return response.json();
}

async function unblockUser(userId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/admin/users/${userId}/unblock`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to unblock user');
  }
  return response.json();
}

async function deleteUserAccount(userId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to delete user');
  }
  return response.json();
}

async function getSystemMonitoring() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/admin/system-monitoring`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch system monitoring data');
  }
  return response.json();
}

export {
  listAllUsers,
  getPendingOrganisers,
  approveOrganiser,
  rejectOrganiser,
  blockUser,
  unblockUser,
  deleteUserAccount,
  getSystemMonitoring,
};
