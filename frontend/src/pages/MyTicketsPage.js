import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Chip,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GetAppIcon from '@mui/icons-material/GetApp';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CloseIcon from '@mui/icons-material/Close';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { getMyTickets } from '../api/ticketApi';
import TicketSearchFilterBar from '../components/TicketSearchFilterBar';

function MyTicketsPage({ user }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const qrRef = React.useRef();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadTickets();
  }, [user, navigate]);

  const loadTickets = async () => {
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQRModal = (ticket) => {
    setSelectedTicket(ticket);
    setQrModalOpen(true);
  };

  const handleCloseQRModal = () => {
    setQrModalOpen(false);
    setSelectedTicket(null);
  };

  const downloadQRCode = async () => {
    if (qrRef.current) {
      try {
        const canvas = await html2canvas(qrRef.current, {
          backgroundColor: 'white',
          scale: 2,
        });
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${selectedTicket.ticketNumber}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Error downloading QR code:', err);
      }
    }
  };

  const downloadTicket = () => {
    // Basic ticket download - generates a simple text file with ticket details
    const ticketDetails = `
TICKET CONFIRMATION
===================
Ticket Number: ${selectedTicket.ticketNumber}
Attendee Name: ${selectedTicket.attendeeName}
Event: ${selectedTicket.eventTitle}
Date: ${selectedTicket.eventDate}
Time: ${selectedTicket.eventTime}
Location: ${selectedTicket.eventLocation}
Price: £${selectedTicket.eventPrice}
Status: ${selectedTicket.status}
Booked On: ${new Date(selectedTicket.createdAt).toLocaleDateString()}

Please present this ticket along with the QR code at the event entrance.
    `.trim();

    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(ticketDetails);
    link.download = `ticket-${selectedTicket.ticketNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  if (loading) return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );

  // Filter tickets by search, status, and date
  function filteredTickets() {
    return tickets.filter(ticket => {
      const matchesSearch = !search.trim() || (ticket.eventTitle && ticket.eventTitle.toLowerCase().includes(search.trim().toLowerCase()));
      const matchesStatus = !status || (ticket.status === status);
      const matchesDate = !date || (ticket.createdAt && new Date(ticket.createdAt).toISOString().slice(0, 10) === date);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 54%, #6d28d9 100%)', color: 'white', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontSize: { xs: 34, md: 46 } }}>
            My Tickets
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            View QR codes, booking details, validation status, and cancellation/refund updates.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 2.5, mb: 4, mt: { xs: -3, md: -5 }, borderRadius: 2, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)' }}>
          <TicketSearchFilterBar
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
            date={date}
            setDate={setDate}
          />
        </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {filteredTickets().length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
            No tickets found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Try a different search or filter.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredTickets().map((ticket) => (
            <Grid item xs={12} md={6} key={ticket.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
                <Box sx={{ height: 6, background: ticket.status === 'cancelled' ? '#ef4444' : ticket.status === 'validated' ? '#16a34a' : 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
                {/* Header */}
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {ticket.attendeeName}
                      </Typography>
                      <Chip
                        label={ticket.status || 'booked'}
                        color={ticket.status === 'validated' ? 'success' : ticket.status === 'cancelled' ? 'error' : 'info'}
                        size="small"
                      />
                    </Box>
                  }
                  subheader={`Ticket #${ticket.ticketNumber}`}
                  sx={{ pb: 1, px: 3, pt: 2.5 }}
                />

                <Divider />

                {/* Content */}
                <CardContent sx={{ flex: 1, px: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                    {ticket.eventTitle}
                  </Typography>
                  {/* Event Date & Time */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <EventIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Date & Time
                      </Typography>
                      <Typography variant="body1">
                        {ticket.eventDate || 'TBA'} at {ticket.eventTime || 'TBA'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Location */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <LocationOnIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Location
                      </Typography>
                      <Typography variant="body1">
                        {ticket.eventLocation || 'TBA'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Booking Date */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Booked On
                    </Typography>
                    <Typography variant="body1">
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>

                  {/* QR Code Info */}
                  {ticket.status === 'booked' && (
                    <Paper sx={{ p: 2, backgroundColor: '#eff6ff', borderRadius: 2, mb: 2, border: '1px solid #bfdbfe' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QrCode2Icon sx={{ color: 'primary.main' }} />
                        <Typography variant="body2">
                          QR code will be available at the event entrance
                        </Typography>
                      </Box>
                    </Paper>
                  )}

                  {ticket.status === 'validated' && (
                    <Paper sx={{ p: 2, backgroundColor: '#ecfdf5', borderRadius: 2, mb: 2, border: '1px solid #bbf7d0' }}>
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                        ✓ Ticket validated on {new Date(ticket.validatedAt).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  )}

                  {ticket.status === 'cancelled' && (
                    <Paper sx={{ p: 2, backgroundColor: '#fef2f2', borderRadius: 2, mb: 2, border: '1px solid #fecaca' }}>
                      <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                        Event cancelled. Refund status: {ticket.refundStatus || 'not_required'}
                        {ticket.refundAmount ? ` (£${Number(ticket.refundAmount).toFixed(2)})` : ''}
                      </Typography>
                      {ticket.cancellationReason && (
                        <Typography variant="caption" color="textSecondary">
                          Reason: {ticket.cancellationReason}
                        </Typography>
                      )}
                    </Paper>
                  )}
                </CardContent>

                <Divider />

                {/* Actions */}
                <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2.5 }}>
	                  <Button 
	                    size="small"
                      variant="contained"
	                    color="primary"
	                    onClick={() => handleOpenQRModal(ticket)}
                      disabled={ticket.status === 'cancelled'}
	                  >
                    <QrCode2Icon sx={{ mr: 0.5 }} />
                    View QR
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      </Container>

      {/* QR Code Modal */}
      <Dialog 
        open={qrModalOpen} 
        onClose={handleCloseQRModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              QR Code - Ticket #{selectedTicket?.ticketNumber}
            </Typography>
            <Button 
              onClick={handleCloseQRModal}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack alignItems="center" spacing={3} sx={{ py: 3 }}>
            {/* QR Code */}
            <Box
              sx={{
                p: 2,
                backgroundColor: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: 1,
              }}
            >
              <QRCodeSVG
                ref={qrRef}
                value={selectedTicket?.qrToken || selectedTicket?.ticketNumber || 'ticket'}
                size={256}
                level="H"
                includeMargin={true}
              />
            </Box>

            {/* Ticket Info */}
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {selectedTicket?.attendeeName}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {selectedTicket?.eventTitle}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Ticket #{selectedTicket?.ticketNumber}
              </Typography>
            </Box>

            {/* Instructions */}
            <Paper sx={{ p: 2, backgroundColor: '#eff6ff', width: '100%', textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Present this QR code at the event entrance for check-in
              </Typography>
            </Paper>

            {/* Download Button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<GetAppIcon />}
              onClick={downloadQRCode}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Download QR Code
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default MyTicketsPage;
