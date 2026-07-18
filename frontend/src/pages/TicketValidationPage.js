import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HistoryIcon from '@mui/icons-material/History';
import StatisticsIcon from '@mui/icons-material/BarChart';
import DownloadIcon from '@mui/icons-material/Download';
import EventIcon from '@mui/icons-material/Event';
import SyncIcon from '@mui/icons-material/Sync';
import { fetchMyEvents } from '../api/eventApi';
import { getEventTickets, validateTicket } from '../api/ticketApi';

const pendingOfflineQueueKey = 'pendingOfflineTicketValidations';

function buildOfflineTicketStatus(ticket) {
  if (ticket.status === 'cancelled') return { valid: false, message: 'Ticket is cancelled because the event was cancelled' };
  if (ticket.status === 'validated' || ticket.offlinePending) return { valid: false, message: 'Ticket already validated in offline event list' };
  return { valid: true, message: 'Ticket validated offline and queued for Firebase sync.' };
}

function getPendingOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(pendingOfflineQueueKey) || '[]');
  } catch (error) {
    return [];
  }
}

function setPendingOfflineQueue(queue) {
  localStorage.setItem(pendingOfflineQueueKey, JSON.stringify(queue));
}

function TicketValidationPage({ user }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventTickets, setSelectedEventTickets] = useState([]);
  const [eventLoading, setEventLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [validatedTicket, setValidatedTicket] = useState(null);
  const [validationMessage, setValidationMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOfflineScans, setPendingOfflineScans] = useState(() => getPendingOfflineQueue());
  const [validationHistory, setValidationHistory] = useState([]);
  const searchInputRef = useRef(null);

  useEffect(() => {
    async function loadEvents() {
      if (!user || !['organiser', 'admin'].includes(user.role)) return;
      setEventLoading(true);
      try {
        const data = await fetchMyEvents();
        setEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      } catch (error) {
        setValidationMessage({ type: 'error', text: error.message });
      } finally {
        setEventLoading(false);
      }
    }

    loadEvents();
  }, [user]);

  useEffect(() => {
    async function loadEventTickets() {
      if (!selectedEventId) {
        setSelectedEventTickets([]);
        return;
      }

      setTicketsLoading(true);
      try {
        const data = await getEventTickets(selectedEventId);
        const tickets = data.tickets || [];
        setSelectedEventTickets(tickets);
        localStorage.setItem(`offlineTickets:${selectedEventId}`, JSON.stringify(tickets));
      } catch (error) {
        const cachedTickets = localStorage.getItem(`offlineTickets:${selectedEventId}`);
        if (cachedTickets) {
          setSelectedEventTickets(JSON.parse(cachedTickets));
          setValidationMessage({
            type: 'warning',
            text: 'Could not refresh tickets from the server. Using the downloaded offline list for this selected event.',
          });
        } else {
          setValidationMessage({ type: 'error', text: error.message });
        }
      } finally {
        setTicketsLoading(false);
      }
    }

    loadEventTickets();
  }, [selectedEventId]);

  const updateOfflineTicketCache = (eventId, updater) => {
    const cacheKey = `offlineTickets:${eventId}`;
    const currentTickets = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const updatedTickets = currentTickets.map(updater);
    localStorage.setItem(cacheKey, JSON.stringify(updatedTickets));
    if (eventId === selectedEventId) {
      setSelectedEventTickets(updatedTickets);
    }
    return updatedTickets;
  };

  const queueOfflineValidation = ({ eventId, ticket, credential, credentialType }) => {
    const now = new Date().toISOString();
    const queueItem = {
      id: `${eventId}:${ticket.id}:${now}`,
      eventId,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      qrToken: credentialType === 'signed_qr' ? credential : null,
      credential,
      credentialType,
      attendeeName: ticket.attendeeName,
      eventTitle: ticket.eventTitle,
      offlineValidatedAt: now,
    };
    const nextQueue = [...getPendingOfflineQueue(), queueItem];
    setPendingOfflineQueue(nextQueue);
    setPendingOfflineScans(nextQueue);
    return queueItem;
  };

  const syncPendingOfflineScans = async () => {
    const queue = getPendingOfflineQueue();
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const remaining = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const result = await validateTicket(
          item.credentialType === 'ticket_number' ? item.credential : null,
          null,
          item.credentialType === 'signed_qr' ? item.credential : null,
          item.eventId
        );

        syncedCount += 1;
        updateOfflineTicketCache(item.eventId, (ticket) => (
          ticket.id === item.ticketId || ticket.ticketNumber === item.ticketNumber
            ? {
                ...ticket,
                status: 'validated',
                offlinePending: false,
                offlineSyncedAt: new Date().toISOString(),
                validatedAt: result.ticket?.validatedAt || ticket.validatedAt || item.offlineValidatedAt,
              }
            : ticket
        ));
      } catch (error) {
        const duplicateIsAcceptable = error.message?.toLowerCase().includes('already validated');
        if (duplicateIsAcceptable) {
          syncedCount += 1;
          updateOfflineTicketCache(item.eventId, (ticket) => (
            ticket.id === item.ticketId || ticket.ticketNumber === item.ticketNumber
              ? { ...ticket, status: 'validated', offlinePending: false, offlineSyncedAt: new Date().toISOString() }
              : ticket
          ));
        } else {
          remaining.push(item);
        }
      }
    }

    setPendingOfflineQueue(remaining);
    setPendingOfflineScans(remaining);
    setIsSyncing(false);

    if (syncedCount > 0) {
      setValidationMessage({
        type: remaining.length === 0 ? 'success' : 'warning',
        text: `${syncedCount} offline validation${syncedCount === 1 ? '' : 's'} synced to Firebase.${remaining.length ? ` ${remaining.length} still pending.` : ''}`,
      });
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      syncPendingOfflineScans();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const selectedEvent = events.find((eventItem) => eventItem.id === selectedEventId);

  const findOfflineTicket = (input) => {
    const isSignedQrToken = input.startsWith('EVTQR.');
    return selectedEventTickets.find((ticket) => (
      isSignedQrToken
        ? ticket.qrToken === input
        : ticket.ticketNumber?.toLowerCase() === input.toLowerCase()
    ));
  };

  const addHistoryEntry = (ticket, status, message) => {
    setValidationHistory((current) => [
      {
        ...ticket,
        validationTime: new Date().toLocaleTimeString(),
        status,
        offlineMessage: message,
      },
      ...current,
    ]);
  };

  const validateOffline = (trimmedInput) => {
    const ticket = findOfflineTicket(trimmedInput);
    if (!ticket) {
      setValidationMessage({ type: 'error', text: 'Offline check failed. Ticket is not in the downloaded list for this selected event.' });
      setValidatedTicket(null);
      return false;
    }

    const offlineStatus = buildOfflineTicketStatus(ticket);
    const credentialType = trimmedInput.startsWith('EVTQR.') ? 'signed_qr' : 'ticket_number';
    const offlineTicket = {
      ...ticket,
      status: offlineStatus.valid ? 'validated' : ticket.status,
      offlinePending: offlineStatus.valid ? true : ticket.offlinePending,
      offlineValidatedAt: offlineStatus.valid ? new Date().toISOString() : ticket.offlineValidatedAt,
      validationMethod: credentialType === 'signed_qr' ? 'offline_signed_qr' : 'offline_ticket_number',
    };

    if (offlineStatus.valid) {
      queueOfflineValidation({
        eventId: selectedEventId,
        ticket: offlineTicket,
        credential: trimmedInput,
        credentialType,
      });
      updateOfflineTicketCache(selectedEventId, (cachedTicket) => (
        cachedTicket.id === ticket.id || cachedTicket.ticketNumber === ticket.ticketNumber
          ? offlineTicket
          : cachedTicket
      ));
    }

    setValidatedTicket(offlineTicket);
    setValidationMessage({
      type: offlineStatus.valid ? 'success' : 'warning',
      text: offlineStatus.message,
    });
    addHistoryEntry(offlineTicket, offlineStatus.valid ? 'success' : 'duplicate', offlineStatus.message);
    setSearchInput('');
    searchInputRef.current?.focus();
    return true;
  };

  const downloadOfflineEventData = async () => {
    if (!selectedEventId) return;
    setTicketsLoading(true);
    try {
      const data = await getEventTickets(selectedEventId);
      const tickets = data.tickets || [];
      localStorage.setItem(`offlineTickets:${selectedEventId}`, JSON.stringify(tickets));
      setSelectedEventTickets(tickets);
      setValidationMessage({
        type: 'success',
        text: `${tickets.length} ticket record${tickets.length === 1 ? '' : 's'} downloaded into this browser for offline scanning.`,
      });
    } catch (error) {
      setValidationMessage({ type: 'error', text: error.message });
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleValidateTicket = async () => {
    const trimmedInput = searchInput.trim();
    if (!trimmedInput) {
      setValidationMessage({ type: 'error', text: 'Please enter a ticket number or QR code ID' });
      return;
    }
    if (!selectedEventId) {
      setValidationMessage({ type: 'error', text: 'Please select the event before validating tickets.' });
      return;
    }

    setIsLoading(true);
    setValidationMessage(null);
    setValidatedTicket(null);

    try {
      const isSignedQrToken = trimmedInput.startsWith('EVTQR.');
      const isTicketNumber = !isSignedQrToken;
      
      const result = await validateTicket(
        isTicketNumber ? trimmedInput : null,
        null,
        isSignedQrToken ? trimmedInput : null,
        selectedEventId
      );

      setValidatedTicket(result.ticket);
      setValidationMessage({
        type: result.valid ? 'success' : 'warning',
        text: result.message,
      });

      // Add to history
      if (result.ticket) {
        addHistoryEntry(result.ticket, result.valid ? 'success' : 'duplicate', result.message);
        updateOfflineTicketCache(selectedEventId, (ticket) => (
          ticket.id === result.ticket.id || ticket.ticketNumber === result.ticket.ticketNumber
            ? {
                ...ticket,
                status: 'validated',
                offlinePending: false,
                validatedAt: result.ticket.validatedAt || ticket.validatedAt,
              }
            : ticket
        ));
      }

      setSearchInput('');
      searchInputRef.current?.focus();
    } catch (error) {
      const usedOfflineFallback = validateOffline(trimmedInput);
      if (usedOfflineFallback) {
        return;
      }

      // More detailed error handling
      const errorMessage = error.message || 'Unable to validate ticket';
      if (errorMessage.includes('Ticket not found')) {
        setValidationMessage({ 
          type: 'error', 
          text: `Ticket not found. Please check the ticket number and try again.` 
        });
      } else {
        setValidationMessage({ 
          type: 'error', 
          text: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleValidateTicket();
    }
  };

  const successCount = validationHistory.filter(t => t.status === 'success').length;
  const duplicateCount = validationHistory.filter(t => t.status === 'duplicate').length;

  // Restrict to organizers and admins only
  if (!user || !['organiser', 'admin'].includes(user.role)) {
    return (
      <Container sx={{ py: 6, textAlign: 'center', minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Access Restricted</Typography>
          <Typography>Only organizers and admins can access the ticket validation page.</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 6 }}>
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <QrCode2Icon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Ticket Validation
          </Typography>
        </Box>
        <Typography variant="body1" color="textSecondary">
          Scan signed QR codes or enter ticket numbers to validate attendee check-ins
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Validation Input */}
        <Grid item xs={12} md={7}>
          {/* Input Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Select Event And Scan Ticket
              </Typography>

              <TextField
                fullWidth
                select
                label="Validation Event"
                value={selectedEventId}
                onChange={(event) => {
                  setSelectedEventId(event.target.value);
                  setValidatedTicket(null);
                  setValidationMessage(null);
                  setValidationHistory([]);
                }}
                disabled={eventLoading || isLoading}
                sx={{ mb: 2 }}
                helperText="Only tickets for the selected event will be accepted. Other event tickets are denied."
              >
                {events.map((eventItem) => (
                  <MenuItem key={eventItem.id} value={eventItem.id}>
                    {eventItem.title} {eventItem.date ? `- ${eventItem.date}` : ''}
                  </MenuItem>
                ))}
              </TextField>

              {selectedEvent && (
                <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <EventIcon color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedEvent.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {selectedEventTickets.length} offline ticket record{selectedEventTickets.length === 1 ? '' : 's'} ready in this browser
                    </Typography>
                  </Box>
                  {ticketsLoading && <CircularProgress size={18} />}
                </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={downloadOfflineEventData}
                      disabled={ticketsLoading}
                    >
                      Download Offline Event Data
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={isSyncing ? <CircularProgress size={16} /> : <SyncIcon />}
                      onClick={syncPendingOfflineScans}
                      disabled={isSyncing || pendingOfflineScans.length === 0 || !navigator.onLine}
                    >
                      Sync Pending ({pendingOfflineScans.length})
                    </Button>
                  </Box>
                  {pendingOfflineScans.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      {pendingOfflineScans.length} offline validation{pendingOfflineScans.length === 1 ? '' : 's'} waiting to sync to Firebase.
                    </Alert>
                  )}
                </Paper>
              )}

              <TextField
                fullWidth
                label="Ticket Number or Signed QR Token"
                placeholder="Enter ticket number or paste EVTQR signed token"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                inputRef={searchInputRef}
                disabled={isLoading}
                sx={{ mb: 3 }}
                autoFocus
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleValidateTicket}
                disabled={isLoading || !selectedEventId}
                startIcon={isLoading ? <CircularProgress size={20} /> : <QrCode2Icon />}
                sx={{
                  background: isLoading ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {isLoading ? 'Validating...' : 'Validate Ticket'}
              </Button>
            </CardContent>
          </Card>

          {/* Validation Message */}
          {validationMessage && (
            <Alert severity={validationMessage.type} sx={{ mb: 3 }}>
              {validationMessage.text}
            </Alert>
          )}

          {/* Validated Ticket Details */}
          {validatedTicket && (
            <Card
              sx={{
                mb: 3,
                borderLeft: `4px solid ${validatedTicket.status === 'validated' ? '#4caf50' : '#ff9800'}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {validatedTicket.status === 'validated' ? (
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />
                  ) : (
                    <ErrorIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {validatedTicket.attendeeName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Ticket #{validatedTicket.ticketNumber}
                    </Typography>
                  </Box>
                  <Chip
                    label={validatedTicket.status === 'validated' ? 'Validated' : 'Already Checked'}
                    color={validatedTicket.status === 'validated' ? 'success' : 'warning'}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Event
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {validatedTicket.eventTitle}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {validatedTicket.eventDate}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {validatedTicket.eventTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Location
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {validatedTicket.eventLocation}
                    </Typography>
                  </Grid>
                </Grid>

                {validatedTicket.validatedAt && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="textSecondary">
                      Validated at: {new Date(validatedTicket.validatedAt).toLocaleString()}
                    </Typography>
                    {validatedTicket.validationMethod && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                        Method: {validatedTicket.validationMethod === 'signed_qr' ? 'Signed QR token' : 'Ticket number'}
                      </Typography>
                    )}
                    {validatedTicket.validatedBy && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                        Validator: {validatedTicket.validatedBy}
                      </Typography>
                    )}
                  </>
                )}
                {validatedTicket.offlinePending && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Alert severity="warning">
                      Offline validation saved locally. It will be synced to Firebase when internet is available.
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Statistics */}
        <Grid item xs={12} md={5}>
          {/* Stats Cards */}
          <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="body2">Successful Validations</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {successCount}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ErrorIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="body2">Duplicate Scans</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {duplicateCount}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <StatisticsIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="body2">Total Scans</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {validationHistory.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Validation History */}
      {validationHistory.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <HistoryIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Validation History
            </Typography>
            <Chip label={`${validationHistory.length} scans`} size="small" />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Attendee Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ticket #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validationHistory.map((ticket, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{ticket.validationTime}</TableCell>
                    <TableCell>{ticket.attendeeName}</TableCell>
                    <TableCell>#{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.eventTitle}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ticket.status === 'success' ? 'Validated' : 'Duplicate'}
                        color={ticket.status === 'success' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Help Text */}
      <Paper sx={{ mt: 6, p: 4, backgroundColor: '#f0f7ff' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Validation Guide
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <Typography variant="body2" component="span">
              <strong>Signed QR:</strong> Scan or paste the EVTQR token shown in the attendee ticket.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" component="span">
              <strong>Manual Entry:</strong> Enter the visible ticket number when QR scanning is unavailable.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" component="span">
              <strong>Audit Trail:</strong> Each scan stores timestamp, validator, role, result, device source, and request metadata.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" component="span">
              <strong>Event-Specific Check:</strong> Select the event first. Tickets from other events are rejected even if the organiser owns both events.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" component="span">
              <strong>Offline Mode:</strong> Use Download Offline Event Data before entry starts. The same scanner UI will validate against the downloaded event list, update local status, and queue scans for Firebase sync when internet returns.
            </Typography>
          </li>
        </ul>
      </Paper>
    </Container>
    </Box>
  );
}

export default TicketValidationPage;
