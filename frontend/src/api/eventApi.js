const BACKEND_BASE = process.env.REACT_APP_API_BASE || '';

async function getAuthHeaders() {
  // For now, the token is stored in localStorage
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchEvents() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/events`, {
    headers,
  });
  if (!response.ok) {
    throw new Error('Unable to fetch events');
  }
  return response.json();
}

async function fetchMyEvents() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/events/mine`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch your events');
  }
  return response.json();
}

async function fetchEventById(eventId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/events/${eventId}`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch event');
  }
  return response.json();
}

async function createEvent(eventData) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to create event');
  }
  return response.json();
}

async function updateEvent(eventId, eventData) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to update event');
  }
  return response.json();
}

async function deleteEvent(eventId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/events/${eventId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to delete event');
  }
  return response.json();
}

async function publishEvent(eventId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/events/${eventId}/publish`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to publish event');
  }
  return response.json();
}

async function cancelEvent(eventId, reason) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/events/${eventId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to cancel event');
  }
  return response.json();
}

export { fetchEvents, fetchMyEvents, fetchEventById, createEvent, updateEvent, deleteEvent, publishEvent, cancelEvent };
