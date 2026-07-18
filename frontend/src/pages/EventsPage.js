import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
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
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PeopleIcon from '@mui/icons-material/People';
import { fetchEvents } from '../api/eventApi';
import { getMyTickets } from '../api/ticketApi';
import EventSearchBar from '../components/EventSearchBar';
import EventFilterBar from '../components/EventFilterBar';
import {
  filterAndSortEvents,
  getRecommendedEvents,
  getRemainingCapacity,
  isEventBookingClosed,
} from '../utils/eventDiscovery';

function EventsPage({ user }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    category: '',
    startDate: '',
    endDate: '',
    location: '',
    minPrice: '',
    maxPrice: '',
  });
  const [sort, setSort] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await fetchEvents();
        setEvents(data);
        if (user) {
          try {
            const tickets = await getMyTickets();
            setMyTickets(tickets);
          } catch (ticketError) {
            setMyTickets([]);
          }
        }
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [user]);

  const handleBooking = (eventId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/book-ticket/${eventId}`);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  const recommendedEvents = getRecommendedEvents(events, myTickets);
  const filteredEvents = filterAndSortEvents(events, searchQuery, filter, sort);

  const renderEventCard = (eventItem, compact = false) => {
    const remainingCapacity = getRemainingCapacity(eventItem);
    const capacity = Number(eventItem.capacity || 0);
    const booked = Number(eventItem.bookedTickets || 0);
    const bookingPercentage = capacity > 0 ? Math.min(100, (booked / capacity) * 100) : 0;
    const bookingClosed = isEventBookingClosed(eventItem);
    const canBook = eventItem.status === 'published' && remainingCapacity > 0 && !bookingClosed;
    const venueLine = [eventItem.venueName, eventItem.location, eventItem.city].filter(Boolean).join(', ') || 'Online';

    return (
    <Grid item xs={12} md={6} lg={4} key={eventItem.id}>
      <Card
        onClick={() => navigate(`/events/${eventItem.id}`)}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          borderRadius: 2,
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
          transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)',
            borderColor: '#c7d2fe',
          },
        }}
      >
        <Box
          sx={{
            height: 6,
            background: eventItem.status === 'cancelled'
              ? '#ef4444'
              : bookingClosed
                ? '#f59e0b'
                : 'linear-gradient(90deg, #2563eb, #7c3aed)',
          }}
        />
        <CardContent sx={{ flex: 1, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                {eventItem.title}
              </Typography>
              {user && user.role === 'admin' && (eventItem.organizerEmail || eventItem.organizerId) && (
                <Typography variant="caption" color="textSecondary">
                  Organizer: {eventItem.organizerEmail || eventItem.organizerId}
                </Typography>
              )}
            </Box>
            <Chip
              label={eventItem.status === 'published' ? 'Published' : eventItem.status === 'cancelled' ? 'Cancelled' : 'Draft'}
              color={eventItem.status === 'published' ? 'success' : eventItem.status === 'cancelled' ? 'error' : 'default'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={eventItem.category || 'General'} size="small" sx={{ backgroundColor: '#eef2ff', color: '#3730a3', fontWeight: 700 }} />
            <Chip label={eventItem.eventType || 'In person'} size="small" variant="outlined" />
            {(eventItem.bookedTickets || 0) > 0 && (
              <Chip label={`${eventItem.bookedTickets} booked`} size="small" color="primary" variant="outlined" />
            )}
            {bookingClosed && (
              <Chip label="Booking closed" size="small" color="warning" variant="outlined" />
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{
              mb: 2.5,
              color: 'text.secondary',
              minHeight: compact ? 38 : 46,
              display: '-webkit-box',
              WebkitLineClamp: compact ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {eventItem.description || 'No description available.'}
          </Typography>

          <Stack spacing={1.25} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
              <EventIcon sx={{ fontSize: 18, color: '#4f46e5' }} />
              <Typography variant="body2" color="text.secondary">
                {eventItem.date || 'TBA'}{eventItem.time ? ` at ${eventItem.time}` : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
              <LocationOnIcon sx={{ fontSize: 18, color: '#4f46e5', mt: 0.2 }} />
              <Typography variant="body2" color="text.secondary">
                {venueLine}
              </Typography>
            </Box>
          </Stack>

          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <PeopleIcon sx={{ fontSize: 18, color: '#64748b' }} />
                <Typography variant="caption" color="text.secondary">
                  {remainingCapacity} of {capacity || 0} left
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <LocalOfferIcon sx={{ fontSize: 17, color: '#16a34a' }} />
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#166534' }}>
                  £{eventItem.price || 0}
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={bookingPercentage}
              sx={{
                height: 7,
                borderRadius: 999,
                backgroundColor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  background: remainingCapacity <= 5 ? '#ef4444' : 'linear-gradient(90deg, #2563eb, #7c3aed)',
                },
              }}
            />
          </Paper>

          {(eventItem.speakerName || eventItem.bookingDeadline || eventItem.tags?.length > 0) && (
            <Box sx={{ display: 'grid', gap: 0.5, minHeight: compact ? 22 : 44 }}>
              {eventItem.speakerName && (
                <Typography variant="caption" color="text.secondary">
                  Host: {eventItem.speakerName}
                </Typography>
              )}
              {eventItem.bookingDeadline && (
                <Typography variant="caption" color="text.secondary">
                  Booking deadline: {eventItem.bookingDeadline}
                </Typography>
              )}
              {eventItem.tags?.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Tags: {eventItem.tags.slice(0, 3).join(', ')}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ p: 3, pt: 0, gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            endIcon={canBook ? <ArrowForwardIcon /> : null}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              handleBooking(eventItem.id);
            }}
            disabled={!canBook}
            sx={{
              py: 1.1,
              fontWeight: 800,
              background: canBook ? 'linear-gradient(90deg, #2563eb, #7c3aed)' : undefined,
            }}
          >
            {eventItem.status === 'cancelled' ? 'Cancelled' : eventItem.status !== 'published' ? 'Coming Soon' : bookingClosed ? 'Booking Closed' : remainingCapacity <= 0 ? 'Fully Booked' : 'Book Ticket'}
          </Button>
        </CardActions>
      </Card>
    </Grid>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #4f46e5 52%, #7c3aed 100%)',
          color: 'white',
          py: { xs: 5, md: 7 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontSize: { xs: 34, md: 46 } }}>
                Browse Events
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 760 }}>
                Discover upcoming events, compare availability, and book securely with signed QR tickets.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.22)' }}>
                <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', fontWeight: 800 }}>
                  Live Catalogue
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>{events.length}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>Events</Typography>
                  </Box>
                  <Divider flexItem orientation="vertical" sx={{ borderColor: 'rgba(255,255,255,0.28)' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>{filteredEvents.length}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>Matching</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: { xs: 2, md: 2.5 }, mb: 4, mt: { xs: -3, md: -5 }, borderRadius: 2, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)' }}>
          <EventFilterBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />
          <EventSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by event, speaker, tag, venue, or city..."
          />
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {recommendedEvents.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Recommended For You
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Based on your previous bookings and similar event locations.
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {recommendedEvents.map((eventItem) => renderEventCard(eventItem, true))}
            </Grid>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-end', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              All Events
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {filteredEvents.length} result{filteredEvents.length === 1 ? '' : 's'} available
            </Typography>
          </Box>
        </Box>

        {filteredEvents.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No events found. Try a different search or filter combination.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredEvents.map((eventItem) => renderEventCard(eventItem))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default EventsPage;
