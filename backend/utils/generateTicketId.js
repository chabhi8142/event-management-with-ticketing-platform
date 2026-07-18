function createTicketNumber() {
  const randomSegment = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestampSegment = Date.now().toString().slice(-6);
  return `TICKET-${timestampSegment}-${randomSegment}`;
}

module.exports = {
  createTicketNumber,
};
