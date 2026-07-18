import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import PaidIcon from '@mui/icons-material/Paid';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { getOrganizerAnalytics } from '../api/ticketApi';

const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

function formatCurrency(value) {
  return currency.format(Number(value || 0));
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function StatCard({ icon, value, label, caption, color }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: color,
              color: 'white',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
            <Typography variant="body2" color="textSecondary">{label}</Typography>
          </Box>
        </Box>
        {caption && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
            {caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function OrganizerAnalyticsPage({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const data = await getOrganizerAnalytics();
        setAnalytics(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const downloadAttendeeCsv = () => {
    const rows = analytics?.attendees || [];
    const headers = [
      'Ticket Number',
      'Attendee Name',
      'Email',
      'Event',
      'Event Date',
      'Ticket Status',
      'Payment Status',
      'Refund Status',
      'Price',
      'Booked At',
      'Validated At',
    ];
    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => [
        row.ticketNumber,
        row.attendeeName,
        row.email,
        row.eventTitle,
        row.eventDate,
        row.status,
        row.paymentStatus,
        row.refundStatus,
        row.price,
        row.bookedAt,
        row.validatedAt,
      ].map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'organiser-attendees.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!user || !['organiser', 'admin'].includes(user.role)) {
    return null;
  }

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
      </Container>
    );
  }

  const summary = analytics?.summary || {};
  const topEvents = analytics?.topEvents || [];
  const eventRows = analytics?.events || [];
  const maxTrendTickets = Math.max(...(analytics?.salesTrend || []).map((item) => item.tickets), 1);
  const validationTotal = (summary.validatedTickets || 0) + (summary.notValidatedTickets || 0);
  const validatedPercent = validationTotal > 0 ? Math.round((summary.validatedTickets / validationTotal) * 100) : 0;
  const notValidatedPercent = validationTotal > 0 ? 100 - validatedPercent : 0;

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Organiser Analytics
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Sales, revenue, capacity, validation, and attendee insights across your events.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={downloadAttendeeCsv}
            disabled={!analytics?.attendees?.length}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Export Attendees CSV
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EventIcon />} value={summary.totalEvents || 0} label="Events" caption={`${summary.averageUtilisation || 0}% average capacity utilisation`} color="#7c3aed" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<GroupIcon />} value={summary.totalTickets || 0} label="Tickets Sold" caption={`${summary.cancelledTickets || 0} cancelled/refunded`} color="#0891b2" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<PaidIcon />} value={formatCurrency(summary.totalRevenue)} label="Revenue" caption="Excludes cancelled tickets" color="#16a34a" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<QrCode2Icon />} value={`${validatedPercent}%`} label="Validated Tickets" caption={`${summary.validatedTickets || 0} validated, ${summary.notValidatedTickets || 0} pending`} color="#2563eb" />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Ticket Sales Trend
              </Typography>
              {(analytics?.salesTrend || []).map((item) => {
                const percent = Math.round((item.tickets / maxTrendTickets) * 100);
                return (
                  <Box key={item.date} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.date}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.tickets} tickets · {formatCurrency(item.revenue)}
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={percent} sx={{ height: 10, borderRadius: 1 }} />
                  </Box>
                );
              })}
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Validated vs Not Validated
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Validated: {summary.validatedTickets || 0} ({validatedPercent}%)
              </Typography>
              <LinearProgress variant="determinate" value={validatedPercent} sx={{ height: 12, borderRadius: 1, mb: 3 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                Not validated: {summary.notValidatedTickets || 0} ({notValidatedPercent}%)
              </Typography>
              <LinearProgress color="warning" variant="determinate" value={notValidatedPercent} sx={{ height: 12, borderRadius: 1 }} />
              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" color="textSecondary">
                Capacity utilisation compares active ticket sales against total configured event capacity.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Top-Performing Events
                </Typography>
              </Box>
              {topEvents.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No event performance data yet.</Typography>
              ) : (
                topEvents.map((event) => (
                  <Box key={event.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{event.title}</Typography>
                      <Typography variant="body2">{formatCurrency(event.revenue)}</Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {event.ticketsBooked} tickets · {event.utilisation}% capacity used
                    </Typography>
                  </Box>
                ))
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Revenue And Capacity By Event
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Event</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tickets</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Utilisation</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {eventRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>No events found.</TableCell>
                      </TableRow>
                    ) : (
                      eventRows.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.title}</TableCell>
                          <TableCell>
                            <Chip label={event.status} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{event.ticketsBooked}/{event.capacity}</TableCell>
                          <TableCell>
                            <Box sx={{ minWidth: 120 }}>
                              <Typography variant="caption">{event.utilisation}%</Typography>
                              <LinearProgress variant="determinate" value={Math.min(event.utilisation, 100)} sx={{ height: 6, borderRadius: 1 }} />
                            </Box>
                          </TableCell>
                          <TableCell>{formatCurrency(event.revenue)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default OrganizerAnalyticsPage;
