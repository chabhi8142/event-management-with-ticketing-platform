function getRemainingCapacity(eventData = {}) {
  return Math.max(0, Number(eventData.capacity || 0) - Number(eventData.bookedTickets || 0));
}

function formatDateOnly(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isBookingDeadlinePassed(eventData = {}, now = new Date()) {
  if (!eventData.bookingDeadline) {
    return false;
  }

  return formatDateOnly(now) > eventData.bookingDeadline;
}

function assertEventBookable(eventData = {}, now = new Date()) {
  if (eventData.status === 'cancelled') {
    const error = new Error('This event has been cancelled. Booking is closed.');
    error.statusCode = 400;
    throw error;
  }

  if (eventData.status !== 'published') {
    const error = new Error('This event is not open for booking.');
    error.statusCode = 400;
    throw error;
  }

  if (isBookingDeadlinePassed(eventData, now)) {
    const error = new Error('Booking deadline has passed for this event.');
    error.statusCode = 400;
    throw error;
  }

  if (getRemainingCapacity(eventData) <= 0) {
    const error = new Error('Event is fully booked. No tickets available.');
    error.statusCode = 400;
    throw error;
  }
}

function calculateNextBookedCount(eventData = {}, now = new Date()) {
  assertEventBookable(eventData, now);
  return Number(eventData.bookedTickets || 0) + 1;
}

module.exports = {
  assertEventBookable,
  calculateNextBookedCount,
  getRemainingCapacity,
  isBookingDeadlinePassed,
};
