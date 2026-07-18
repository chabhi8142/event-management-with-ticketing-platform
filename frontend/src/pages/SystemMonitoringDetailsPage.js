import React from 'react';
import {
  Alert,
  Box,
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
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PaidIcon from '@mui/icons-material/Paid';
import HistoryIcon from '@mui/icons-material/History';
import { getSystemMonitoring } from '../api/adminApi';

const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

function formatCurrency(value) {
  return currency.format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ icon, label, value, caption, color }) {
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
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {label}
            </Typography>
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

function BreakdownPanel({ title, items, total }) {
  const entries = Object.entries(items || {});

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {title}
      </Typography>
      {entries.length === 0 ? (
        <Typography variant="body2" color="textSecondary">No data available</Typography>
      ) : (
        entries.map(([label, count]) => {
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <Box key={label} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {count} ({percent}%)
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 1 }} />
            </Box>
          );
        })
      )}
    </Paper>
  );
}

function SystemMonitoringDetailsPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const monitoring = await getSystemMonitoring();
        setData(monitoring);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          background: '#f5f7fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const totals = data?.totals || {};
  const revenue = data?.revenueSummary || {};
  const validation = data?.validationSummary || {};
  const maxTrendCount = Math.max(...(data?.ticketTrend || []).map((item) => item.count), 1);

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            System Monitoring
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Platform-wide usage, revenue, validation quality, and recent activity.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<PeopleIcon />} label="Total Users" value={totals.users || 0} caption={`${data?.pendingOrganisers || 0} pending organisers`} color="#2563eb" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EventIcon />} label="Total Events" value={totals.events || 0} caption="Draft, published, and cancelled" color="#7c3aed" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ConfirmationNumberIcon />} label="Tickets Booked" value={totals.tickets || 0} caption={`${totals.cancelledTickets || 0} cancelled/refunded`} color="#0891b2" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<QrCode2Icon />} label="QR Validations" value={totals.validations || 0} caption={`${validation.successRate || 0}% success rate`} color="#16a34a" />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <BreakdownPanel title="Users By Role" items={data?.usersByRole} total={totals.users || 0} />
          </Grid>
          <Grid item xs={12} md={4}>
            <BreakdownPanel title="Users By Status" items={data?.usersByStatus} total={totals.users || 0} />
          </Grid>
          <Grid item xs={12} md={4}>
            <BreakdownPanel title="Events By Status" items={data?.eventsByStatus} total={totals.events || 0} />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Tickets Booked Over Time
              </Typography>
              {(data?.ticketTrend || []).map((item) => {
                const percent = Math.round((item.count / maxTrendCount) * 100);
                return (
                  <Box key={item.date} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.date}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.count} tickets · {formatCurrency(item.revenue)}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PaidIcon color="success" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Revenue Summary
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Gross revenue</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(revenue.grossRevenue)}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="textSecondary">Refunded revenue</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>{formatCurrency(revenue.refundedRevenue)}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="textSecondary">Net revenue</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{formatCurrency(revenue.netRevenue)}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Validation Quality
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Successful scans</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{validation.successful || 0}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Duplicate scans</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{validation.duplicates || 0}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Failed scans</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>{validation.failed || 0}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                Success rate: {validation.successRate || 0}%
              </Typography>
              <LinearProgress variant="determinate" value={validation.successRate || 0} sx={{ height: 10, borderRadius: 1, mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                Duplicate rate: {validation.duplicateRate || 0}%
              </Typography>
              <LinearProgress color="warning" variant="determinate" value={validation.duplicateRate || 0} sx={{ height: 10, borderRadius: 1 }} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HistoryIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent System Activity
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data?.recentActivity || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="body2" color="textSecondary">No activity recorded yet</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.recentActivity.map((activity, index) => (
                        <TableRow key={`${activity.type}-${activity.createdAt}-${index}`}>
                          <TableCell>{formatDateTime(activity.createdAt)}</TableCell>
                          <TableCell>
                            <Chip label={activity.title} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{activity.description || '-'}</TableCell>
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

export default SystemMonitoringDetailsPage;
