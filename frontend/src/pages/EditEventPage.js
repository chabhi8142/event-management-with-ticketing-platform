import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchEventById, updateEvent } from '../api/eventApi';
import { categoryOptions } from '../utils/eventDiscovery';

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function EditEventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    eventType: 'In person',
    date: '',
    time: '',
    location: '',
    venueName: '',
    address: '',
    city: '',
    postcode: '',
    capacity: '',
    price: '',
    bookingDeadline: '',
    contactEmail: '',
    contactPhone: '',
    agenda: '',
    speakerName: '',
    speakerBio: '',
    tags: '',
    minimumAge: '',
    eligibilityNotes: '',
    cancellationPolicy: '',
    refundPolicy: '',
  });
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      setIsLoading(true);
      setMessage(null);

      try {
        const event = await fetchEventById(eventId);
        setFormData({
          title: event.title || '',
          description: event.description || '',
          category: event.category || 'General',
          eventType: event.eventType || 'In person',
          date: event.date || '',
          time: event.time || '',
          location: event.location || '',
          venueName: event.venueName || '',
          address: event.address || '',
          city: event.city || '',
          postcode: event.postcode || '',
          capacity: event.capacity ?? '',
          price: event.price ?? '',
          bookingDeadline: event.bookingDeadline || '',
          contactEmail: event.contactEmail || '',
          contactPhone: event.contactPhone || '',
          agenda: event.agenda || '',
          speakerName: event.speakerName || '',
          speakerBio: event.speakerBio || '',
          tags: Array.isArray(event.tags) ? event.tags.join(', ') : event.tags || '',
          minimumAge: event.minimumAge ?? '',
          eligibilityNotes: event.eligibilityNotes || '',
          cancellationPolicy: event.cancellationPolicy || '',
          refundPolicy: event.refundPolicy || '',
        });
      } catch (error) {
        setMessage({ type: 'error', text: error.message });
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  const handleChange = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleEventDateChange = (event) => {
    const nextDate = event.target.value;
    setFormData((current) => ({
      ...current,
      date: nextDate,
      bookingDeadline: current.bookingDeadline && nextDate && current.bookingDeadline > nextDate
        ? nextDate
        : current.bookingDeadline,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (formData.bookingDeadline && formData.bookingDeadline > formData.date) {
      setMessage({ type: 'error', text: 'Booking deadline cannot be after the event date.' });
      return;
    }

    setIsSaving(true);

    try {
      await updateEvent(eventId, {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
        price: parseFloat(formData.price),
        minimumAge: formData.minimumAge === '' ? '' : parseInt(formData.minimumAge, 10),
      });
      setMessage({ type: 'success', text: 'Event updated successfully!' });
      setTimeout(() => navigate('/events/manage'), 1000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  const today = new Date();
  const sixMonthsFromToday = new Date(today);
  sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 6);
  const minEventDate = formatDateInputValue(today);
  const maxEventDate = formatDateInputValue(sixMonthsFromToday);
  const bookingDeadlineMax = formData.date || maxEventDate;
  const bookingDeadlineMin = formData.bookingDeadline && formData.bookingDeadline < minEventDate
    ? formData.bookingDeadline
    : minEventDate;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 54%, #6d28d9 100%)', color: 'white', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: 34, md: 46 }, mb: 1 }}>
            Edit Event
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Update event details, capacity, booking deadline, contact information, and policies.
          </Typography>
        </Container>
      </Box>
    <Container maxWidth="md" sx={{ py: 4 }}>
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)', mt: { xs: -3, md: -5 } }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Core Details
        </Typography>
        <TextField
          label="Event Title"
          value={formData.title}
          onChange={handleChange('title')}
          required
          disabled={isSaving}
        />
        <TextField
          label="Description"
          value={formData.description}
          onChange={handleChange('description')}
          multiline
          rows={4}
          required
          disabled={isSaving}
        />
        <TextField
          label="Category"
          select
          value={formData.category}
          onChange={handleChange('category')}
          required
          disabled={isSaving}
        >
          {categoryOptions.filter((option) => option !== 'All').map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Event Type"
          select
          value={formData.eventType}
          onChange={handleChange('eventType')}
          required
          disabled={isSaving}
        >
          {['In person', 'Online', 'Hybrid'].map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
        <TextField
          label={
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              Date
              <Tooltip title="Choose a date from today up to six months from today. Past dates and dates beyond six months are not allowed.">
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
              </Tooltip>
            </Box>
          }
          type="date"
          value={formData.date}
          onChange={handleEventDateChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: minEventDate, max: maxEventDate }}
          required
          disabled={isSaving}
        />
        <TextField
          label="Time"
          type="time"
          value={formData.time}
          onChange={handleChange('time')}
          InputLabelProps={{ shrink: true }}
          required
          disabled={isSaving}
        />
        <TextField
          label="Location"
          value={formData.location}
          onChange={handleChange('location')}
          required
          disabled={isSaving}
        />
        <Divider sx={{ my: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Venue And Booking
        </Typography>
        <TextField
          label="Venue Name"
          value={formData.venueName}
          onChange={handleChange('venueName')}
          disabled={isSaving}
        />
        <TextField
          label="Address"
          value={formData.address}
          onChange={handleChange('address')}
          disabled={isSaving}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="City"
            value={formData.city}
            onChange={handleChange('city')}
            disabled={isSaving}
          />
          <TextField
            label="Postcode"
            value={formData.postcode}
            onChange={handleChange('postcode')}
            disabled={isSaving}
          />
        </Box>
        <TextField
          label="Capacity"
          type="number"
          value={formData.capacity}
          onChange={handleChange('capacity')}
          inputProps={{ min: 1 }}
          required
          disabled={isSaving}
        />
        <TextField
          label="Price per Head (£)"
          type="number"
          inputProps={{ min: 0, step: '0.01' }}
          value={formData.price}
          onChange={handleChange('price')}
          required
          disabled={isSaving}
        />
        <TextField
          label={
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              Booking Deadline
              <Tooltip title="After this date, new ticket bookings are automatically blocked. Leave blank to allow booking until the event date.">
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
              </Tooltip>
            </Box>
          }
          type="date"
          value={formData.bookingDeadline}
          onChange={handleChange('bookingDeadline')}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: bookingDeadlineMin, max: bookingDeadlineMax }}
          helperText={formData.date ? 'Pick any date up to the event date.' : 'Select the event date first if you want the deadline capped to that event.'}
          disabled={isSaving}
        />
        <Divider sx={{ my: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Contact And Content
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Contact Email"
            type="email"
            value={formData.contactEmail}
            onChange={handleChange('contactEmail')}
            disabled={isSaving}
          />
          <TextField
            label="Contact Phone"
            value={formData.contactPhone}
            onChange={handleChange('contactPhone')}
            disabled={isSaving}
          />
        </Box>
        <TextField
          label="Agenda"
          value={formData.agenda}
          onChange={handleChange('agenda')}
          multiline
          rows={3}
          disabled={isSaving}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Speaker / Host Name"
            value={formData.speakerName}
            onChange={handleChange('speakerName')}
            disabled={isSaving}
          />
          <TextField
            label="Minimum Age"
            type="number"
            value={formData.minimumAge}
            onChange={handleChange('minimumAge')}
            inputProps={{ min: 0 }}
            disabled={isSaving}
          />
        </Box>
        <TextField
          label="Speaker / Host Bio"
          value={formData.speakerBio}
          onChange={handleChange('speakerBio')}
          multiline
          rows={2}
          disabled={isSaving}
        />
        <TextField
          label="Tags"
          value={formData.tags}
          onChange={handleChange('tags')}
          placeholder="career, ai, networking"
          helperText="Comma-separated tags help search and recommendations."
          disabled={isSaving}
        />
        <TextField
          label="Eligibility Notes"
          value={formData.eligibilityNotes}
          onChange={handleChange('eligibilityNotes')}
          multiline
          rows={2}
          disabled={isSaving}
        />
        <Divider sx={{ my: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Policies
        </Typography>
        <TextField
          label="Cancellation Policy"
          value={formData.cancellationPolicy}
          onChange={handleChange('cancellationPolicy')}
          multiline
          rows={2}
          disabled={isSaving}
        />
        <TextField
          label="Refund Policy"
          value={formData.refundPolicy}
          onChange={handleChange('refundPolicy')}
          multiline
          rows={2}
          disabled={isSaving}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ py: 1.2, fontWeight: 900, background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/events/manage')}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </Box>
      </Box>
      </Paper>
    </Container>
    </Box>
  );
}

export default EditEventPage;
