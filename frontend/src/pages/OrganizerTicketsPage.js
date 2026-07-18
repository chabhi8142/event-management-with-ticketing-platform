import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CloseIcon from '@mui/icons-material/Close';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { getEventTickets, getValidationStatsByEvent } from '../api/ticketApi';

function OrganizerTicketsPage({ user }) {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [validationStats, setValidationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const qrRef = React.useRef();

  useEffect(() => {
    if (!user || user.role !== 'organiser') {
      navigate('/login');
      return;
    }
    loadTickets();
  }, [user, eventId, navigate]);

  const loadTickets = async () => {
    try {
      const data = await getEventTickets(eventId);
      setEvent(data.event);
      setTickets(data.tickets);
      
      // Fetch validation statistics
      try {
        const statsData = await getValidationStatsByEvent(eventId);
        setValidationStats(statsData);
      } catch (statsError) {
        console.log('Note: Validation statistics not available yet');
        // It's okay if stats aren't available
      }
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

  if (!user || user.role !== 'organiser') return null;

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/events/manage')} sx={{ mt: 2 }}>
          Back to Events
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/events/manage')}
        sx={{ mb: 3 }}
      >
        Back to Events
      </Button>

      {/* Event Summary */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              {event.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <EventIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary">Date & Time</Typography>
                <Typography variant="body1">{event.date} at {event.time}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <LocationOnIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary">Location</Typography>
                <Typography variant="body1">{event.location}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {tickets.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Tickets Booked</Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {tickets.filter(t => t.status === 'validated').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Validated</Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      £{(event.price || 0) * tickets.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Revenue</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* QR Validation Statistics */}
      {validationStats && (
        <Paper elevation={0} sx={{ p: 3, mb: 4, backgroundColor: '#f0f7ff', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <QrCode2Icon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              QR Validation Statistics
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {validationStats.summary.totalValidations}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Total Validations</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                    {validationStats.summary.uniqueAttendees}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Unique Attendees</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                    {validationStats.summary.latestValidation ? new Date(validationStats.summary.latestValidation).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Latest Validation</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                    {validationStats.validationStats.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Scan Records</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tickets List */}
      <Card elevation={2}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon />
              <Typography variant="h6">Booked Tickets</Typography>
            </Box>
          }
          subheader={`${tickets.length} attendee${tickets.length !== 1 ? 's' : ''}`}
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          {tickets.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No tickets booked yet</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Ticket Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Attendee Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Booked Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>QR Code</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                          {ticket.ticketNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{ticket.attendeeName}</TableCell>
                      <TableCell>{ticket.userEmail}</TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.status}
                          color={ticket.status === 'validated' ? 'success' : ticket.status === 'cancelled' ? 'error' : 'info'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<QrCode2Icon />}
                          variant="text"
                          onClick={() => handleOpenQRModal(ticket)}
                        >
                          QR Code
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* QR Validation History */}
      {validationStats && validationStats.validationStats.length > 0 && (
        <Card elevation={2} sx={{ mt: 4 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCode2Icon />
                <Typography variant="h6">QR Scan History</Typography>
              </Box>
            }
            subheader={`${validationStats.validationStats.length} scan${validationStats.validationStats.length !== 1 ? 's' : ''}`}
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Ticket #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Attendee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Validated By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Validated At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validationStats.validationStats.map((stat, index) => (
                    <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                          {stat.ticketNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{stat.attendeeName}</TableCell>
                      <TableCell>{stat.validatedBy || 'System'}</TableCell>
                      <TableCell>
                        {new Date(stat.validatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 3 }}>
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
                {event?.title}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Ticket #{selectedTicket?.ticketNumber}
              </Typography>
            </Box>

            {/* Status Badge */}
            <Chip
              label={selectedTicket?.status}
              color={selectedTicket?.status === 'validated' ? 'success' : selectedTicket?.status === 'cancelled' ? 'error' : 'info'}
              sx={{ fontSize: '0.9rem' }}
            />

            {/* Download Button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={downloadQRCode}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Download QR Code
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default OrganizerTicketsPage;
