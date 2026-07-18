const test = require('node:test');
const assert = require('node:assert/strict');
const {
  assertEventBookable,
  calculateNextBookedCount,
  getRemainingCapacity,
  isBookingDeadlinePassed,
} = require('../utils/bookingRules');

test('getRemainingCapacity subtracts booked tickets from capacity', () => {
  assert.equal(getRemainingCapacity({ capacity: 10, bookedTickets: 4 }), 6);
});

test('getRemainingCapacity never returns negative values', () => {
  assert.equal(getRemainingCapacity({ capacity: 2, bookedTickets: 5 }), 0);
});

test('getRemainingCapacity treats missing bookedTickets as zero', () => {
  assert.equal(getRemainingCapacity({ capacity: 8 }), 8);
});

test('assertEventBookable allows published events with remaining capacity', () => {
  assert.doesNotThrow(() => assertEventBookable({ status: 'published', capacity: 5, bookedTickets: 1 }));
});

test('assertEventBookable blocks draft events', () => {
  assert.throws(
    () => assertEventBookable({ status: 'draft', capacity: 5, bookedTickets: 1 }),
    /not open for booking/
  );
});

test('assertEventBookable blocks cancelled events', () => {
  assert.throws(
    () => assertEventBookable({ status: 'cancelled', capacity: 5, bookedTickets: 1 }),
    /cancelled/
  );
});

test('assertEventBookable blocks fully booked events', () => {
  assert.throws(
    () => assertEventBookable({ status: 'published', capacity: 5, bookedTickets: 5 }),
    /fully booked/
  );
});

test('calculateNextBookedCount increments from zero when event is bookable', () => {
  assert.equal(calculateNextBookedCount({ status: 'published', capacity: 5 }), 1);
});

test('calculateNextBookedCount increments existing booked count', () => {
  assert.equal(calculateNextBookedCount({ status: 'published', capacity: 5, bookedTickets: 2 }), 3);
});

test('calculateNextBookedCount preserves booking guard errors', () => {
  assert.throws(
    () => calculateNextBookedCount({ status: 'published', capacity: 1, bookedTickets: 1 }),
    /fully booked/
  );
});

test('isBookingDeadlinePassed returns false when no deadline exists', () => {
  assert.equal(isBookingDeadlinePassed({}, new Date('2026-06-10T10:00:00Z')), false);
});

test('isBookingDeadlinePassed keeps booking open on the deadline date', () => {
  assert.equal(
    isBookingDeadlinePassed({ bookingDeadline: '2026-06-10' }, new Date(2026, 5, 10, 23, 59)),
    false
  );
});

test('assertEventBookable blocks events after booking deadline', () => {
  assert.throws(
    () => assertEventBookable(
      { status: 'published', capacity: 5, bookedTickets: 1, bookingDeadline: '2026-06-10' },
      new Date('2026-06-11T09:00:00Z')
    ),
    /deadline/
  );
});
