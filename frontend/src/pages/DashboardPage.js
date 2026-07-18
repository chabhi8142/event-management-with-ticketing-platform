import React from 'react';
import { Container, Paper, Typography, Button, Box, Grid, Stack, Chip } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AnalyticsIcon from '@mui/icons-material/Analytics';

function DashboardPage({ user }) {
  const navigate = useNavigate();

  // Redirect admin to admin dashboard
  React.useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4f46e5 55%, #7c3aed 100%)', color: 'white', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Chip label={(user?.role || 'attendee').toUpperCase()} sx={{ mb: 2, color: '#1d4ed8', backgroundColor: 'white', fontWeight: 900 }} />
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontSize: { xs: 34, md: 46 } }}>
            Dashboard
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Welcome back, {user?.email || 'user'}.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {user?.role === 'organiser' && (
          <Grid container spacing={3}>
            {[
              { title: 'Create New Event', text: 'Prepare an event with booking controls and full metadata.', to: '/events/create', icon: <EventIcon /> },
              { title: 'Manage My Events', text: 'Publish, edit, cancel, and monitor your event portfolio.', to: '/events/manage', icon: <ConfirmationNumberIcon /> },
              { title: 'Event Analytics', text: 'Review sales, revenue, validation, and capacity performance.', to: '/events/analytics', icon: <AnalyticsIcon /> },
              { title: 'Validate Tickets', text: 'Scan signed QR tickets and record validation audit history.', to: '/validate-tickets', icon: <QrCodeScannerIcon /> },
            ].map((item, index) => (
              <Grid item xs={12} md={6} key={item.title}>
                <Paper sx={{ p: 3, borderRadius: 2, height: '100%', boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)' }}>
                  <Stack spacing={2}>
                    <Box sx={{ width: 54, height: 54, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'white', background: index === 0 ? '#2563eb' : index === 1 ? '#7c3aed' : index === 2 ? '#16a34a' : '#f59e0b' }}>
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                    </Box>
                    <Button variant={index === 0 ? 'contained' : 'outlined'} component={RouterLink} to={item.to} sx={{ alignSelf: 'flex-start', fontWeight: 800 }}>
                      Open
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {user?.role === 'attendee' && (
          <Grid container spacing={3}>
            {[
              { title: 'Browse Events', text: 'Find events by category, date, location, price, and popularity.', to: '/events', icon: <EventIcon />, primary: true },
              { title: 'My Tickets', text: 'View bookings, download QR codes, and check ticket status.', to: '/my-tickets', icon: <ConfirmationNumberIcon /> },
            ].map((item) => (
              <Grid item xs={12} md={6} key={item.title}>
                <Paper sx={{ p: 3, borderRadius: 2, height: '100%', boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)' }}>
                  <Stack spacing={2}>
                    <Box sx={{ width: 54, height: 54, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'white', background: item.primary ? '#2563eb' : '#7c3aed' }}>
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                    </Box>
                    <Button variant={item.primary ? 'contained' : 'outlined'} component={RouterLink} to={item.to} sx={{ alignSelf: 'flex-start', fontWeight: 800 }}>
                      Open
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default DashboardPage;
