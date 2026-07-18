import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EventIcon from '@mui/icons-material/Event';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

function AdminDashboardPage() {
  const adminCards = [
    {
      title: 'User Management',
      text: 'View all users, block or unblock accounts, and manage account access.',
      caption: 'Full control over user status and platform access',
      to: '/admin/users',
      button: 'Manage Users',
      icon: <PeopleIcon />,
      color: '#2563eb',
    },
    {
      title: 'Organiser Approval',
      text: 'Review pending organiser applications and approve or reject access requests.',
      caption: 'Protect event creation with approval workflow',
      to: '/admin/organisers',
      button: 'Approve Organisers',
      icon: <CheckCircleIcon />,
      color: '#16a34a',
    },
    {
      title: 'Organizer Events',
      text: 'View organiser-hosted events, monitor bookings, and track platform activity.',
      caption: 'Comprehensive overview of organised events',
      to: '/events',
      button: 'View Events',
      icon: <EventIcon />,
      color: '#7c3aed',
    },
    {
      title: 'System Monitoring',
      text: 'Review users, event status, ticket trends, validation rates, revenue, and activity logs.',
      caption: 'Platform health, analytics, and audit visibility',
      to: '/admin/system-monitoring',
      button: 'View Monitoring',
      icon: <AnalyticsIcon />,
      color: '#f59e0b',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
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
              <AdminPanelSettingsIcon sx={{ fontSize: 44 }} />
              <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: 34, md: 46 } }}>
                Admin Dashboard
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 760 }}>
              Centralised management for users, organisers, events, monitoring, and platform governance.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {['Role control', 'Organiser approval', 'System analytics'].map((label) => (
                <Chip key={label} label={label} sx={{ color: '#1d4ed8', backgroundColor: 'white', fontWeight: 800 }} />
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3} sx={{ mt: { xs: -3, md: -5 } }}>
          {adminCards.map((card, index) => (
            <Grid item xs={12} md={6} key={card.title}>
              <Paper
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 22px 52px rgba(15, 23, 42, 0.16)',
                    borderColor: '#c7d2fe',
                  },
                }}
              >
                <Stack spacing={2.2} sx={{ height: '100%' }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'white', backgroundColor: card.color }}>
                    {card.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {card.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {card.caption}
                    </Typography>
                  </Box>
                  <Button
                    variant={index === 0 || index === 3 ? 'contained' : 'outlined'}
                    component={RouterLink}
                    to={card.to}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      alignSelf: 'flex-start',
                      fontWeight: 900,
                      ...(index === 0 || index === 3
                        ? { background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }
                        : {}),
                    }}
                  >
                    {card.button}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper
          sx={{
            mt: 4,
            p: { xs: 2.5, md: 3 },
            background: 'white',
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
            Admin Operating Checklist
          </Typography>
          <Stack spacing={2}>
            <Typography variant="body2">
              Review pending organiser approvals regularly to maintain platform quality.
            </Typography>
            <Typography variant="body2">
              Monitor blocked users, validation activity, and booking trends for unusual patterns.
            </Typography>
            <Typography variant="body2">
              Use system monitoring to evidence platform health, revenue, ticket flow, and audit activity.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default AdminDashboardPage;
