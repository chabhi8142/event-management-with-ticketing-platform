const {
  filterAndSortEvents,
  getPopularityScore,
  getRecommendedEvents,
  getRemainingCapacity,
  isEventBookingClosed,
} = require('./eventDiscovery');

const events = [
  {
    id: 'e1',
    title: 'React Workshop',
    description: 'Frontend practice',
    category: 'Workshop',
    eventType: 'In person',
    location: 'Leicester',
    venueName: 'Innovation Hub',
    city: 'Leicester',
    tags: ['react', 'frontend'],
    date: '2026-06-10',
    price: 20,
    capacity: 50,
    bookedTickets: 10,
    status: 'published',
  },
  {
    id: 'e2',
    title: 'AI Conference',
    description: 'Research talks',
    category: 'Conference',
    eventType: 'Hybrid',
    location: 'London',
    venueName: 'Research Centre',
    city: 'London',
    speakerName: 'Dr Ada',
    tags: ['ai', 'research'],
    date: '2026-06-01',
    price: 100,
    capacity: 100,
    bookedTickets: 90,
    status: 'published',
  },
  {
    id: 'e3',
    title: 'Community Meetup',
    description: 'Networking evening',
    category: 'Community',
    eventType: 'Online',
    location: 'Leicester',
    city: 'Leicester',
    tags: ['community'],
    date: '2026-07-01',
    price: 0,
    capacity: 30,
    bookedTickets: 0,
    status: 'draft',
  },
];

test('getRemainingCapacity subtracts booked tickets from capacity', () => {
  expect(getRemainingCapacity(events[0])).toBe(40);
});

test('getRemainingCapacity never returns below zero', () => {
  expect(getRemainingCapacity({ capacity: 5, bookedTickets: 8 })).toBe(0);
});

test('getPopularityScore rewards bookings and utilisation', () => {
  expect(getPopularityScore(events[1])).toBeGreaterThan(getPopularityScore(events[0]));
});

test('filterAndSortEvents searches by title', () => {
  expect(filterAndSortEvents(events, 'react').map((event) => event.id)).toEqual(['e1']);
});

test('filterAndSortEvents searches by speaker and tags', () => {
  expect(filterAndSortEvents(events, 'ada').map((event) => event.id)).toEqual(['e2']);
  expect(filterAndSortEvents(events, 'frontend').map((event) => event.id)).toEqual(['e1']);
});

test('filterAndSortEvents filters by category', () => {
  expect(filterAndSortEvents(events, '', { category: 'Workshop' }).map((event) => event.id)).toEqual(['e1']);
});

test('filterAndSortEvents filters by date range', () => {
  expect(filterAndSortEvents(events, '', { startDate: '2026-06-05', endDate: '2026-06-30' }).map((event) => event.id)).toEqual(['e1']);
});

test('filterAndSortEvents filters by location case-insensitively', () => {
  expect(filterAndSortEvents(events, '', { location: 'leic' }).map((event) => event.id)).toEqual(['e1', 'e3']);
});

test('filterAndSortEvents filters by minimum price', () => {
  expect(filterAndSortEvents(events, '', { minPrice: '50' }).map((event) => event.id)).toEqual(['e2']);
});

test('filterAndSortEvents sorts by popularity descending', () => {
  expect(filterAndSortEvents(events, '', {}, 'popularity_desc').map((event) => event.id)[0]).toBe('e2');
});

test('getRecommendedEvents recommends similar category events not already booked', () => {
  const tickets = [{ eventId: 'old', eventCategory: 'Conference', eventLocation: 'London' }];
  expect(getRecommendedEvents(events, tickets).map((event) => event.id)[0]).toBe('e2');
});

test('isEventBookingClosed returns true after the booking deadline', () => {
  expect(isEventBookingClosed({ bookingDeadline: '2026-06-10' }, new Date('2026-06-11T08:00:00Z'))).toBe(true);
});

test('getRecommendedEvents excludes events with closed booking', () => {
  const closedEvent = { ...events[1], bookingDeadline: '2026-01-01' };
  const tickets = [{ eventId: 'old', eventCategory: 'Conference', eventLocation: 'London' }];
  expect(getRecommendedEvents([closedEvent], tickets).map((event) => event.id)).toEqual([]);
});
