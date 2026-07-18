import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { fetchEvents } from '../api/eventApi';
import { bookTicket } from '../api/ticketApi';
import DummyPaymentModal from '../components/DummyPaymentModal';
import { isEventBookingClosed } from '../utils/eventDiscovery';

function BookTicketPage({ user }) {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [attendees, setAttendees] = useState([{ name: '' }]);
  const [isBooking, setIsBooking] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const events = await fetchEvents();
      const found = events.find(e => e.id === eventId);
      if (!found) {
        setError('Event not found');
        return;
      }
      setEvent(found);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCountChange = (newCount) => {
    const remainingCapacity = (event?.capacity || 0) - (event?.bookedTickets || 0);
    const count = Math.max(1, Math.min(newCount, remainingCapacity));
    setTicketCount(count);
    setAttendees(Array.from({ length: count }, (_, i) => attendees[i] || { name: '' }));
  };

  const handleAttendeeChange = (index, value) => {
    const newAttendees = [...attendees];
    newAttendees[index] = { name: value };
    setAttendees(newAttendees);
  };

  // Show payment modal first, then book
  const handleBookClick = () => {
    if (!user) {
      setError('You must be logged in to book tickets');
      return;
    }
    if (attendees.some(a => !a.name.trim())) {
      setError('Please enter all attendee names');
      return;
    }
    if (isEventBookingClosed(event)) {
      setError('Booking deadline has passed for this event.');
      return;
    }
    setPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setPaymentOpen(false);
    setIsBooking(true);
    setMessage(null);
    setError(null);
    try {
      for (const attendee of attendees) {
        await bookTicket({
          eventId,
          attendeeName: attendee.name,
        });
      }
      setMessage({ type: 'success', text: `Successfully booked ${ticketCount} ticket(s)!` });
      setTimeout(() => {
        navigate('/my-tickets');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '100px auto' }} />;
  if (!event) return <Typography color="error" sx={{ mt: 4, textAlign: 'center' }}>Event not found</Typography>;

  const remainingCapacity = Math.max(0, (event.capacity || 0) - (event.bookedTickets || 0));
  const totalPrice = (event.price || 0) * ticketCount;
  const bookingClosed = isEventBookingClosed(event);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Grid container spacing={4}>
        {/* Event Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              {event.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              <Chip label={event.category || 'General'} size="small" variant="outlined" />
              <Chip label={event.eventType || 'In person'} size="small" variant="outlined" />
              {event.minimumAge !== '' && event.minimumAge !== undefined && (
                <Chip label={`${event.minimumAge}+`} size="small" variant="outlined" />
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <EventIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary">Date</Typography>
                <Typography variant="body1">{event.date}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <AccessTimeIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary">Time</Typography>
                <Typography variant="body1">{event.time}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <LocationOnIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary">Location</Typography>
                <Typography variant="body1">
                  {[event.venueName, event.location, event.city].filter(Boolean).join(', ') || 'Online'}
                </Typography>
                {(event.address || event.postcode) && (
                  <Typography variant="caption" color="textSecondary">
                    {[event.address, event.postcode].filter(Boolean).join(', ')}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <LocalOfferIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary">Price per Head</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  £{event.price || 0}
                </Typography>
              </Box>
            </Box>

            {event.bookingDeadline && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Booking Deadline</Typography>
                <Typography variant="body1" sx={{ color: bookingClosed ? 'warning.main' : 'text.primary', fontWeight: bookingClosed ? 700 : 400 }}>
                  {event.bookingDeadline}{bookingClosed ? ' - closed' : ''}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="textSecondary">Total Capacity</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {event.capacity} people
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="textSecondary">Already Booked</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {event.bookedTickets || 0}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="textSecondary">Remaining</Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 600, 
                    color: ((event.capacity || 0) - (event.bookedTickets || 0)) <= 5 ? '#d32f2f' : '#388e3c'
                  }}
                >
                  {Math.max(0, (event.capacity || 0) - (event.bookedTickets || 0))}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              {event.description}
            </Typography>

            {(event.agenda || event.speakerName || event.eligibilityNotes || event.cancellationPolicy || event.refundPolicy || event.contactEmail || event.contactPhone) && (
              <Box sx={{ mt: 3, display: 'grid', gap: 1.5 }}>
                {event.speakerName && (
                  <Typography variant="body2">
                    <strong>Speaker / Host:</strong> {event.speakerName}
                  </Typography>
                )}
                {event.speakerBio && (
                  <Typography variant="body2" color="textSecondary">{event.speakerBio}</Typography>
                )}
                {event.agenda && (
                  <Typography variant="body2">
                    <strong>Agenda:</strong> {event.agenda}
                  </Typography>
                )}
                {event.eligibilityNotes && (
                  <Typography variant="body2">
                    <strong>Eligibility:</strong> {event.eligibilityNotes}
                  </Typography>
                )}
                {event.cancellationPolicy && (
                  <Typography variant="body2">
                    <strong>Cancellation:</strong> {event.cancellationPolicy}
                  </Typography>
                )}
                {event.refundPolicy && (
                  <Typography variant="body2">
                    <strong>Refund:</strong> {event.refundPolicy}
                  </Typography>
                )}
                {(event.contactEmail || event.contactPhone) && (
                  <Typography variant="body2">
                    <strong>Contact:</strong> {[event.contactEmail, event.contactPhone].filter(Boolean).join(' | ')}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Booking Form */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Book Tickets
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

              {/* Ticket Count */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Number of Tickets (Available: {remainingCapacity})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleTicketCountChange(ticketCount - 1)}
                    disabled={ticketCount <= 1}
                  >
                    −
                  </Button>
                  <TextField
                    type="number"
                    value={ticketCount}
                    onChange={(e) => handleTicketCountChange(parseInt(e.target.value) || 1)}
                    sx={{ width: 80 }}
                    inputProps={{ min: 1, max: remainingCapacity }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleTicketCountChange(ticketCount + 1)}
                    disabled={ticketCount >= remainingCapacity}
                  >
                    +
                  </Button>
                </Box>
                {remainingCapacity <= 5 && remainingCapacity > 0 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Only {remainingCapacity} ticket(s) remaining!
                  </Alert>
                )}
                {remainingCapacity === 0 && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    This event is fully booked.
                  </Alert>
                )}
                {bookingClosed && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Booking deadline has passed.
                  </Alert>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Attendee Names */}
              <Box sx={{ mb: 3, maxHeight: 300, overflowY: 'auto' }}>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  Attendee Details
                </Typography>
                {attendees.map((attendee, index) => (
                  <TextField
                    key={index}
                    fullWidth
                    label={`Attendee ${index + 1} Name`}
                    value={attendee.name}
                    onChange={(e) => handleAttendeeChange(index, e.target.value)}
                    placeholder="Full name"
                    disabled={isBooking}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Price Summary */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Price per Head:</Typography>
                  <Typography variant="body2">£{event.price || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Quantity:</Typography>
                  <Typography variant="body2">{ticketCount}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Total:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    £{totalPrice.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              {/* Book Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleBookClick}
                disabled={isBooking || !user || remainingCapacity === 0 || bookingClosed}
                sx={{ mb: 1 }}
              >
                {isBooking ? <CircularProgress size={24} /> : bookingClosed ? 'Booking Closed' : remainingCapacity === 0 ? 'Event Fully Booked' : 'Book Tickets'}
              </Button>
                    {/* Dummy Payment Modal */}
                    <DummyPaymentModal
                      open={paymentOpen}
                      onClose={() => setPaymentOpen(false)}
                      onSuccess={handlePaymentSuccess}
                      amount={totalPrice.toFixed(2)}
                      loading={isBooking}
                    />
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/events')}
                disabled={isBooking}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default BookTicketPage;
