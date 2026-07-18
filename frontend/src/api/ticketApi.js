const BACKEND_BASE = process.env.REACT_APP_API_BASE || '';

async function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function bookTicket(ticketData) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/tickets/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Scan-Source': 'web-validation-page',
      ...headers,
    },
    body: JSON.stringify(ticketData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to book ticket');
  }
  return response.json();
}

async function getMyTickets() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/tickets/my-tickets`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch tickets');
  }
  return response.json();
}

async function getTicketById(ticketId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/tickets/${ticketId}`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch ticket');
  }
  return response.json();
}

async function validateTicket(ticketNumber, ticketId, qrToken, eventId) {
  const headers = await getAuthHeaders();
  const payload = {};
  if (ticketNumber) payload.ticketNumber = ticketNumber.trim();
  if (ticketId) payload.ticketId = ticketId.trim();
  if (qrToken) payload.qrToken = qrToken.trim();
  if (eventId) payload.eventId = eventId.trim();

  const response = await fetch(`${BACKEND_BASE}/api/tickets/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Unable to validate ticket');
  }
  
  return data;
}

async function getEventTickets(eventId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/tickets/event/${eventId}`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch event tickets');
  }
  return response.json();
}

async function getValidationStatsByEvent(eventId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/tickets/event/${eventId}/validation-stats`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch validation statistics');
  }
  return response.json();
}

async function getOrganizerAnalytics() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_BASE}/api/tickets/organizer/analytics`, {
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unable to fetch organiser analytics');
  }
  return response.json();
}

export { bookTicket, getMyTickets, getTicketById, getEventTickets, validateTicket, getValidationStatsByEvent, getOrganizerAnalytics };
