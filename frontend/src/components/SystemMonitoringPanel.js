import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { fetchEvents } from '../api/eventApi';
import { listAllUsers } from '../api/adminApi';

function SystemMonitoringPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, events: 0, tickets: 0, qrValidations: 0 });

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [users, events] = await Promise.all([
          listAllUsers(),
          fetchEvents(),
        ]);
        let tickets = 0;
        let qrValidations = 0;
        events.forEach(ev => {
          tickets += ev.bookedTickets || 0;
          qrValidations += ev.qrValidations || 0;
        });
        setStats({ users: users.length, events: events.length, tickets, qrValidations });
      } catch (e) {
        setStats({ users: 0, events: 0, tickets: 0, qrValidations: 0 });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>System Monitoring</Typography>
      <Divider sx={{ mb: 3 }} />
      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6">{stats.users}</Typography>
              <Typography variant="body2" color="textSecondary">Total Users</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventIcon color="secondary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6">{stats.events}</Typography>
              <Typography variant="body2" color="textSecondary">Total Events</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <QrCode2Icon color="success" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6">{stats.tickets}</Typography>
              <Typography variant="body2" color="textSecondary">Tickets Booked</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <QrCode2Icon color="action" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6">{stats.qrValidations}</Typography>
              <Typography variant="body2" color="textSecondary">QR Validations</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default SystemMonitoringPanel;
