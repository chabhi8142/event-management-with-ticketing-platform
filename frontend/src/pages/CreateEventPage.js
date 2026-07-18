import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api/eventApi';
import { categoryOptions } from '../utils/eventDiscovery';

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function CreateEventPage() {
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const today = new Date();
  const sixMonthsFromToday = new Date(today);
  sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 6);
  const minEventDate = formatDateInputValue(today);
  const maxEventDate = formatDateInputValue(sixMonthsFromToday);

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

  const bookingDeadlineMax = formData.date || maxEventDate;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (formData.date < minEventDate || formData.date > maxEventDate) {
      setMessage({
        type: 'error',
        text: `Please choose a date between ${minEventDate} and ${maxEventDate}.`,
      });
      return;
    }

    if (formData.bookingDeadline && formData.bookingDeadline > formData.date) {
      setMessage({ type: 'error', text: 'Booking deadline cannot be after the event date.' });
      return;
    }

    setIsLoading(true);

    try {
      const eventData = {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
        price: parseFloat(formData.price),
        minimumAge: formData.minimumAge === '' ? '' : parseInt(formData.minimumAge, 10),
      };

      await createEvent(eventData);
      setMessage({ type: 'success', text: 'Event created successfully!' });
      setTimeout(() => navigate('/events/manage'), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 54%, #6d28d9 100%)', color: 'white', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: 34, md: 46 }, mb: 1 }}>
            Create New Event
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Add event details, booking rules, contact information, and policies in one structured form.
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
          disabled={isLoading}
        />
        <TextField
          label="Description"
          value={formData.description}
          onChange={handleChange('description')}
          multiline
          rows={4}
          required
          disabled={isLoading}
        />
        <TextField
          label="Category"
          select
          value={formData.category}
          onChange={handleChange('category')}
          required
          disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
        />
        <TextField
          label="Time"
          type="time"
          value={formData.time}
          onChange={handleChange('time')}
          InputLabelProps={{ shrink: true }}
          required
          disabled={isLoading}
        />
        <TextField
          label="Location"
          value={formData.location}
          onChange={handleChange('location')}
          required
          disabled={isLoading}
        />
        <Divider sx={{ my: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Venue And Booking
        </Typography>
        <TextField
          label="Venue Name"
          value={formData.venueName}
          onChange={handleChange('venueName')}
          disabled={isLoading}
        />
        <TextField
          label="Address"
          value={formData.address}
          onChange={handleChange('address')}
          disabled={isLoading}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="City"
            value={formData.city}
            onChange={handleChange('city')}
            disabled={isLoading}
          />
          <TextField
            label="Postcode"
            value={formData.postcode}
            onChange={handleChange('postcode')}
            disabled={isLoading}
          />
        </Box>
        <TextField
          label="Capacity"
          type="number"
          value={formData.capacity}
          onChange={handleChange('capacity')}
          inputProps={{ min: 1 }}
          required
          disabled={isLoading}
        />
        <TextField
          label="Price per Head (£)"
          type="number"
          value={formData.price}
          onChange={handleChange('price')}
          inputProps={{ min: 0, step: '0.01' }}
          required
          disabled={isLoading}
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
          inputProps={{ min: minEventDate, max: bookingDeadlineMax }}
          helperText={formData.date ? 'Pick any date from today up to the event date.' : 'Select the event date first if you want the deadline capped to that event.'}
          disabled={isLoading}
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
            disabled={isLoading}
          />
          <TextField
            label="Contact Phone"
            value={formData.contactPhone}
            onChange={handleChange('contactPhone')}
            disabled={isLoading}
          />
        </Box>
        <TextField
          label="Agenda"
          value={formData.agenda}
          onChange={handleChange('agenda')}
          multiline
          rows={3}
          disabled={isLoading}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Speaker / Host Name"
            value={formData.speakerName}
            onChange={handleChange('speakerName')}
            disabled={isLoading}
          />
          <TextField
            label="Minimum Age"
            type="number"
            value={formData.minimumAge}
            onChange={handleChange('minimumAge')}
            inputProps={{ min: 0 }}
            disabled={isLoading}
          />
        </Box>
        <TextField
          label="Speaker / Host Bio"
          value={formData.speakerBio}
          onChange={handleChange('speakerBio')}
          multiline
          rows={2}
          disabled={isLoading}
        />
        <TextField
          label="Tags"
          value={formData.tags}
          onChange={handleChange('tags')}
          placeholder="career, ai, networking"
          helperText="Comma-separated tags help search and recommendations."
          disabled={isLoading}
        />
        <TextField
          label="Eligibility Notes"
          value={formData.eligibilityNotes}
          onChange={handleChange('eligibilityNotes')}
          multiline
          rows={2}
          disabled={isLoading}
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
          disabled={isLoading}
        />
        <TextField
          label="Refund Policy"
          value={formData.refundPolicy}
          onChange={handleChange('refundPolicy')}
          multiline
          rows={2}
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ py: 1.2, fontWeight: 900, background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
        >
          {isLoading ? 'Creating Event...' : 'Create Event'}
        </Button>
      </Box>
      </Paper>
    </Container>
    </Box>
  );
}

export default CreateEventPage;
