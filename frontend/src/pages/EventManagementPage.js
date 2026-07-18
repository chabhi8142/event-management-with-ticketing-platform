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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  TextField,
  Typography,
  Paper,
  LinearProgress,
  Stack,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { fetchMyEvents, deleteEvent, publishEvent, cancelEvent } from '../api/eventApi';
import EventSearchBar from '../components/EventSearchBar';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import AnalyticsIcon from '@mui/icons-material/Analytics';

function EventManagementPage({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, eventId: null, eventTitle: '' });
  const [cancelDialog, setCancelDialog] = useState({ open: false, eventId: null, eventTitle: '', reason: '' });
  const [isCancellingEvent, setIsCancellingEvent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchMyEvents();
      setEvents(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(deleteDialog.eventId);
      setEvents(events.filter(event => event.id !== deleteDialog.eventId));
      setDeleteDialog({ open: false, eventId: null, eventTitle: '' });
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePublish = async (eventId) => {
    try {
      await publishEvent(eventId);
      // Refresh events to show updated status
      loadEvents();
    } catch (error) {
      setError(error.message);
    }
  };

  const openDeleteDialog = (eventId, eventTitle) => {
    setDeleteDialog({ open: true, eventId, eventTitle });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, eventId: null, eventTitle: '' });
  };

  const openCancelDialog = (eventId, eventTitle) => {
    setCancelDialog({ open: true, eventId, eventTitle, reason: '' });
  };

  const closeCancelDialog = () => {
    if (isCancellingEvent) return;
    setCancelDialog({ open: false, eventId: null, eventTitle: '', reason: '' });
  };

  const handleCancelEvent = async () => {
    setIsCancellingEvent(true);
    try {
      const response = await cancelEvent(cancelDialog.eventId, cancelDialog.reason);
      await loadEvents();
      setError(null);
      setCancelDialog({ open: false, eventId: null, eventTitle: '', reason: '' });
      console.log(response.message);
    } catch (cancelError) {
      setError(cancelError.message);
    } finally {
      setIsCancellingEvent(false);
    }
  };

  const filteredEvents = events.filter((eventItem) => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.trim().toLowerCase();
    return (
      eventItem.title?.toLowerCase().includes(query) ||
      eventItem.location?.toLowerCase().includes(query) ||
      eventItem.city?.toLowerCase().includes(query) ||
      eventItem.venueName?.toLowerCase().includes(query) ||
      eventItem.category?.toLowerCase().includes(query) ||
      eventItem.eventType?.toLowerCase().includes(query) ||
      eventItem.speakerName?.toLowerCase().includes(query) ||
      eventItem.description?.toLowerCase().includes(query)
    );
  });
  const publishedCount = events.filter((eventItem) => eventItem.status === 'published').length;
  const draftCount = events.filter((eventItem) => eventItem.status === 'draft').length;
  const cancelledCount = events.filter((eventItem) => eventItem.status === 'cancelled').length;
  const totalRevenue = events.reduce((sum, eventItem) => sum + (Number(eventItem.price || 0) * Number(eventItem.bookedTickets || 0)), 0);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 54%, #6d28d9 100%)',
          color: 'white',
          py: { xs: 5, md: 7 },
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EventIcon sx={{ fontSize: 40 }} />
              <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: 34, md: 46 } }}>
                Manage Your Events
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Create, edit, and manage all your events in one place
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3, mt: { xs: -3, md: -5 } }}>
          {[
            { label: 'Published', value: publishedCount, color: '#16a34a' },
            { label: 'Drafts', value: draftCount, color: '#f59e0b' },
            { label: 'Cancelled', value: cancelledCount, color: '#dc2626' },
            { label: 'Revenue', value: `£${totalRevenue.toFixed(2)}`, color: '#2563eb' },
          ].map((item) => (
            <Paper key={item.label} sx={{ flex: 1, p: 2.5, borderRadius: 2, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: item.color }}>{item.value}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{item.label}</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper sx={{ p: 2.5, borderRadius: 2, mb: 3, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}>
        {/* Event Search Bar */}
        <EventSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search your events by name, location, or description..."
        />
        </Paper>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Create New Event Button */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/events/create"
            size="large"
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
              px: 4,
              fontWeight: 900,
            }}
          >
            Create New Event
          </Button>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/events/analytics"
            size="large"
            startIcon={<AnalyticsIcon />}
            sx={{ fontWeight: 800 }}
          >
            View Analytics
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredEvents.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: 'white', borderRadius: 2 }}>
            <EventIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              No events found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Try a different search or create a new event.
            </Typography>
            <Button 
              variant="contained" 
              component={RouterLink} 
              to="/events/create"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Create Event
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredEvents.map((eventItem) => {
              const capacity = eventItem.capacity || 0;
              const booked = eventItem.bookedTickets || 0;
              const remaining = capacity - booked;
              const bookingPercentage = capacity > 0 ? (booked / capacity) * 100 : 0;
              const revenue = (eventItem.price || 0) * booked;

              return (
                <Grid item xs={12} md={6} lg={4} key={eventItem.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)',
                      },
                    }}
                  >
                    <Box sx={{ height: 6, background: eventItem.status === 'published' ? '#16a34a' : eventItem.status === 'cancelled' ? '#dc2626' : '#f59e0b' }} />
                    <CardContent sx={{ flex: 1, p: 3 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, flex: 1 }}>
                          {eventItem.title}
                        </Typography>
                        <Chip
                          label={eventItem.status === 'published' ? 'Published' : eventItem.status === 'cancelled' ? 'Cancelled' : 'Draft'}
                          color={eventItem.status === 'published' ? 'success' : eventItem.status === 'cancelled' ? 'error' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {/* Description */}
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 40 }}>
                        {eventItem.description || 'No description'}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip label={eventItem.category || 'General'} size="small" sx={{ backgroundColor: '#eef2ff', color: '#3730a3', fontWeight: 800 }} />
                        <Chip label={eventItem.eventType || 'In person'} size="small" variant="outlined" />
                        {eventItem.bookingDeadline && (
                          <Chip label={`Deadline ${eventItem.bookingDeadline}`} size="small" variant="outlined" color="warning" />
                        )}
                      </Box>

                      {/* Event Details */}
                      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" color="textSecondary">
                          📅 {eventItem.date} at {eventItem.time}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          📍 {[eventItem.venueName, eventItem.location, eventItem.city].filter(Boolean).join(', ') || 'Online'}
                        </Typography>
                        {eventItem.speakerName && (
                          <Typography variant="caption" color="textSecondary">
                            Host: {eventItem.speakerName}
                          </Typography>
                        )}
                        <Typography variant="caption" color="textSecondary">
                          💷 £{eventItem.price} per head
                        </Typography>
                      </Box>

                      {/* Booking Progress */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Bookings: {booked}/{capacity}
                          </Typography>
                          <Typography variant="caption" color={remaining <= 5 ? 'error' : 'success'}>
                            {remaining} remaining
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={bookingPercentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: remaining <= 5 ? '#f44336' : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            }
                          }}
                        />
                      </Box>

                      {/* Revenue */}
                      <Box sx={{ p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, mb: 2, border: '1px solid #e5e7eb' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Revenue
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                              £{revenue.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>

                    {/* Actions */}
                    <CardActions sx={{ gap: 1, flexWrap: 'wrap', justifyContent: 'space-between', p: 3, pt: 0 }}>
                      {eventItem.status === 'draft' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<PublishIcon />}
                          onClick={() => handlePublish(eventItem.id)}
                          sx={{ flex: '1 1 120px', minWidth: 120, py: 1.1 }}
                        >
                          Publish
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        component={RouterLink}
                        to={`/events/edit/${eventItem.id}`}
                        disabled={eventItem.status === 'cancelled'}
                        sx={{ flex: '1 1 120px', minWidth: 120, py: 1.1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        onClick={() => navigate(`/events/${eventItem.id}/tickets`)}
                        sx={{ flex: '1 1 120px', minWidth: 120, py: 1.1 }}
                      >
                        Analytics
                      </Button>
                      {eventItem.status !== 'cancelled' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<CancelIcon />}
                          onClick={() => openCancelDialog(eventItem.id, eventItem.title)}
                          sx={{ flex: '1 1 120px', minWidth: 120, py: 1.1 }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => openDeleteDialog(eventItem.id, eventItem.title)}
                        sx={{ flex: '1 1 120px', minWidth: 120, py: 1.1 }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.eventTitle}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelDialog.open}
        onClose={closeCancelDialog}
        fullWidth
        maxWidth="sm"
        disableEscapeKeyDown={isCancellingEvent}
      >
        <DialogTitle>Cancel Event</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Cancelling "{cancelDialog.eventTitle}" will block future bookings, mark existing tickets as cancelled, create ticket-holder notifications, and process simulated refunds.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation reason"
            value={cancelDialog.reason}
            onChange={(event) => setCancelDialog((current) => ({ ...current, reason: event.target.value }))}
            placeholder="Optional reason shown to ticket holders"
            disabled={isCancellingEvent}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog} disabled={isCancellingEvent}>Keep Event</Button>
          <Button
            onClick={handleCancelEvent}
            color="warning"
            variant="contained"
            disabled={isCancellingEvent}
            startIcon={isCancellingEvent ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {isCancellingEvent ? 'Cancelling...' : 'Cancel Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EventManagementPage;
