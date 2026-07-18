import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import { fetchEventById } from '../api/eventApi';
import { getRemainingCapacity, isEventBookingClosed } from '../utils/eventDiscovery';

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}

function EventDetailsPage({ user }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchEventById(eventId);
        setEvent(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{error || 'Event not found'}</Alert>
      </Container>
    );
  }

  const remainingCapacity = getRemainingCapacity(event);
  const bookingClosed = isEventBookingClosed(event);
  const canBook = event.status === 'published' && remainingCapacity > 0 && !bookingClosed;
  const venueLine = [event.venueName, event.location, event.city].filter(Boolean).join(', ') || 'Online';
  const addressLine = [event.address, event.postcode].filter(Boolean).join(', ');
  const capacity = Number(event.capacity || 0);
  const booked = Number(event.bookedTickets || 0);
  const bookingPercentage = capacity > 0 ? Math.min(100, (booked / capacity) * 100) : 0;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 54%, #6d28d9 100%)',
          color: 'white',
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="lg">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/events')}
            sx={{
              mb: 3,
              color: 'white',
              borderColor: 'rgba(255,255,255,0.45)',
              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.08)' },
            }}
          >
            Back To Events
          </Button>

          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label={event.category || 'General'} sx={{ backgroundColor: 'white', color: '#1d4ed8', fontWeight: 800 }} />
                <Chip label={event.eventType || 'In person'} sx={{ backgroundColor: 'rgba(255,255,255,0.16)', color: 'white', border: '1px solid rgba(255,255,255,0.28)' }} />
                {event.minimumAge !== '' && event.minimumAge !== undefined && (
                  <Chip label={`${event.minimumAge}+`} sx={{ backgroundColor: 'rgba(255,255,255,0.16)', color: 'white', border: '1px solid rgba(255,255,255,0.28)' }} />
                )}
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: 34, md: 48 }, lineHeight: 1.08, mb: 1.5 }}>
                {event.title}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 780 }}>
                {event.description || 'No description available.'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.22)' }}>
                <Typography variant="caption" sx={{ opacity: 0.82, textTransform: 'uppercase', fontWeight: 800 }}>
                  Event Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <CheckCircleIcon />
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {event.status === 'published' ? 'Open for booking' : event.status === 'cancelled' ? 'Cancelled' : 'Draft'}
                  </Typography>
                </Box>
                {event.organizerEmail && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.86 }}>
                    Organised by {event.organizerEmail}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                  Event Details
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 1.5, p: 2, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <EventIcon sx={{ color: '#4f46e5' }} />
                      <DetailRow label="Date" value={event.date || 'TBA'} />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 1.5, p: 2, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <AccessTimeIcon sx={{ color: '#4f46e5' }} />
                      <DetailRow label="Time" value={event.time || 'TBA'} />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 1.5, p: 2, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <LocationOnIcon sx={{ color: '#4f46e5' }} />
                      <Box>
                        <DetailRow label="Location" value={venueLine} />
                        {addressLine && (
                          <Typography variant="body2" color="text.secondary">
                            {addressLine}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 1.5, p: 2, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <LocalOfferIcon sx={{ color: '#16a34a' }} />
                      <DetailRow label="Price" value={`£${event.price || 0}`} />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {(event.agenda || event.speakerName || event.speakerBio) && (
                <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                    Programme
                  </Typography>
                  <Stack spacing={2}>
                    {event.speakerName && (
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <PersonIcon sx={{ color: '#4f46e5' }} />
                        <DetailRow label="Speaker / Host" value={event.speakerName} />
                      </Box>
                    )}
                    {event.speakerBio && <DetailRow label="Speaker / Host Bio" value={event.speakerBio} />}
                    {event.agenda && <DetailRow label="Agenda" value={event.agenda} />}
                  </Stack>
                </Paper>
              )}

              {(event.eligibilityNotes || event.cancellationPolicy || event.refundPolicy || event.contactEmail || event.contactPhone) && (
                <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                    Policies And Contact
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailRow label="Eligibility" value={event.eligibilityNotes} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailRow label="Contact" value={[event.contactEmail, event.contactPhone].filter(Boolean).join(' | ')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailRow label="Cancellation Policy" value={event.cancellationPolicy} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailRow label="Refund Policy" value={event.refundPolicy} />
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {event.tags?.length > 0 && (
                <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {event.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" sx={{ backgroundColor: '#eef2ff', color: '#3730a3', fontWeight: 700 }} />
                    ))}
                  </Box>
                </Paper>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, position: { md: 'sticky' }, top: 24, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)' }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 800 }}>
                    Price per ticket
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#166534' }}>
                    £{event.price || 0}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <PeopleIcon sx={{ color: '#64748b' }} />
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        Availability
                      </Typography>
                    </Box>
                    <Typography variant="body2" color={remainingCapacity <= 5 ? 'error' : 'success.main'} sx={{ fontWeight: 900 }}>
                      {remainingCapacity} left
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={bookingPercentage}
                    sx={{
                      height: 9,
                      borderRadius: 999,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        background: remainingCapacity <= 5 ? '#ef4444' : 'linear-gradient(90deg, #2563eb, #7c3aed)',
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {booked} booked from {capacity || 0} total places
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <DetailRow label="Capacity" value={`${event.capacity || 0}`} />
                  <DetailRow label="Booked" value={event.bookedTickets || 0} />
                </Box>
                <DetailRow label="Booking Deadline" value={event.bookingDeadline ? `${event.bookingDeadline}${bookingClosed ? ' - closed' : ''}` : 'Until event date'} />

                {!user && (
                  <Alert severity="info">
                    Login is required before booking.
                  </Alert>
                )}
                {bookingClosed && (
                  <Alert severity="warning">
                    The booking deadline has passed for this event.
                  </Alert>
                )}
                <Button
                  variant="contained"
                  size="large"
                  endIcon={canBook ? <ArrowForwardIcon /> : null}
                  onClick={() => (user ? navigate(`/book-ticket/${event.id}`) : navigate('/login'))}
                  disabled={!canBook}
                  sx={{
                    py: 1.2,
                    fontWeight: 900,
                    background: canBook ? 'linear-gradient(90deg, #2563eb, #7c3aed)' : undefined,
                  }}
                >
                  {event.status === 'cancelled' ? 'Cancelled' : bookingClosed ? 'Booking Closed' : remainingCapacity <= 0 ? 'Fully Booked' : 'Book Ticket'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default EventDetailsPage;
