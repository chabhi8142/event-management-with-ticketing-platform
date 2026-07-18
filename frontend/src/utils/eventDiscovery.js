const categoryOptions = [
  'All',
  'General',
  'Conference',
  'Workshop',
  'Seminar',
  'Concert',
  'Sports',
  'Networking',
  'Exhibition',
  'Community',
];

function getRemainingCapacity(eventItem = {}) {
  return Math.max(0, Number(eventItem.capacity || 0) - Number(eventItem.bookedTickets || 0));
}

function formatDateOnly(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isEventBookingClosed(eventItem = {}, now = new Date()) {
  return Boolean(eventItem.bookingDeadline && formatDateOnly(now) > eventItem.bookingDeadline);
}

function getPopularityScore(eventItem = {}) {
  const booked = Number(eventItem.bookedTickets || 0);
  const capacity = Number(eventItem.capacity || 0);
  const utilisation = capacity > 0 ? booked / capacity : 0;
  return booked + utilisation;
}

function filterAndSortEvents(events = [], searchQuery = '', filter = {}, sort = '') {
  let filtered = [...events];

  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase();
    filtered = filtered.filter((eventItem) => (
      eventItem.title?.toLowerCase().includes(query) ||
      eventItem.location?.toLowerCase().includes(query) ||
      eventItem.city?.toLowerCase().includes(query) ||
      eventItem.venueName?.toLowerCase().includes(query) ||
      eventItem.eventType?.toLowerCase().includes(query) ||
      eventItem.speakerName?.toLowerCase().includes(query) ||
      (eventItem.tags || []).some((tag) => String(tag).toLowerCase().includes(query)) ||
      eventItem.description?.toLowerCase().includes(query) ||
      eventItem.category?.toLowerCase().includes(query)
    ));
  }

  if (filter.category) {
    filtered = filtered.filter((eventItem) => (eventItem.category || 'General') === filter.category);
  }
  if (filter.startDate) {
    filtered = filtered.filter((eventItem) => eventItem.date && eventItem.date >= filter.startDate);
  }
  if (filter.endDate) {
    filtered = filtered.filter((eventItem) => eventItem.date && eventItem.date <= filter.endDate);
  }
  if (filter.location?.trim()) {
    const locationQuery = filter.location.trim().toLowerCase();
    filtered = filtered.filter((eventItem) => (
      (eventItem.location || '').toLowerCase().includes(locationQuery) ||
      (eventItem.city || '').toLowerCase().includes(locationQuery) ||
      (eventItem.address || '').toLowerCase().includes(locationQuery) ||
      (eventItem.postcode || '').toLowerCase().includes(locationQuery)
    ));
  }
  if (filter.minPrice !== '' && filter.minPrice !== undefined) {
    filtered = filtered.filter((eventItem) => Number(eventItem.price || 0) >= Number(filter.minPrice));
  }
  if (filter.maxPrice !== '' && filter.maxPrice !== undefined) {
    filtered = filtered.filter((eventItem) => Number(eventItem.price || 0) <= Number(filter.maxPrice));
  }

  if (sort === 'date_asc') {
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  if (sort === 'date_desc') {
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  if (sort === 'price_asc') {
    return filtered.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }
  if (sort === 'price_desc') {
    return filtered.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }
  if (sort === 'popularity_desc') {
    return filtered.sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
  }
  if (sort === 'availability_desc') {
    return filtered.sort((a, b) => getRemainingCapacity(b) - getRemainingCapacity(a));
  }

  return filtered;
}

function getRecommendedEvents(events = [], tickets = [], limit = 3) {
  const bookedEventIds = new Set(tickets.map((ticket) => ticket.eventId));
  const preferredCategories = new Set(tickets.map((ticket) => ticket.eventCategory).filter(Boolean));
  const preferredLocations = new Set(tickets.map((ticket) => ticket.eventLocation).filter(Boolean));

  return events
    .filter((eventItem) => (
      eventItem.status === 'published' &&
      !bookedEventIds.has(eventItem.id) &&
      !isEventBookingClosed(eventItem) &&
      getRemainingCapacity(eventItem) > 0
    ))
    .map((eventItem) => {
      const categoryMatch = preferredCategories.has(eventItem.category || 'General') ? 2 : 0;
      const locationMatch = preferredLocations.has(eventItem.location) ? 1 : 0;
      return {
        ...eventItem,
        recommendationScore: categoryMatch + locationMatch + getPopularityScore(eventItem),
      };
    })
    .filter((eventItem) => eventItem.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);
}

module.exports = {
  categoryOptions,
  filterAndSortEvents,
  getPopularityScore,
  getRecommendedEvents,
  getRemainingCapacity,
  isEventBookingClosed,
};
