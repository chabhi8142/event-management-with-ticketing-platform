import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Typography,
  Stack,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import TicketIcon from '@mui/icons-material/ConfirmationNumber';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Uiimage from '../assets/image_test.jpg';


function HomePage() {
  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: { xs: '2rem', md: '3.5rem' },
                  lineHeight: 1.2,
                }}
              >
                Create Amazing Events
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.95,
                  fontWeight: 300,
                  letterSpacing: 0.5,
                }}
              >
                Manage events, sell tickets, and engage attendees all in one powerful platform
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to="/events"
                  sx={{
                    background: 'white',
                    color: '#667eea',
                    fontWeight: 600,
                    px: 4,
                    '&:hover': {
                      background: '#f0f0f0',
                    },
                  }}
                >
                  Browse Events
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to="/register"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    fontWeight: 600,
                    px: 4,
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)',
                      borderColor: 'white',
                    },
                  }}
                >
                  Get Started
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'center' }}>
              <Box
                component="img"
                src={Uiimage}
                alt="Event management illustration"
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxWidth: 500,
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Powerful Features
          </Typography>
          <Typography variant="h6" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Everything you need to manage successful events and engage your audience
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Feature 1 */}
          <Grid item xs={12} md={6} lg={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                border: '1px solid #f0f0f0',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 5,
                  borderColor: '#667eea',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ fontSize: '3rem', mb: 2 }}>
                  <EventIcon sx={{ fontSize: 'inherit', color: '#667eea' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Easy Event Creation
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create and manage events with an intuitive interface. Set details, dates, and pricing effortlessly.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 2 */}
          <Grid item xs={12} md={6} lg={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                border: '1px solid #f0f0f0',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 5,
                  borderColor: '#667eea',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ fontSize: '3rem', mb: 2 }}>
                  <TicketIcon sx={{ fontSize: 'inherit', color: '#764ba2' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Digital Tickets
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Sell tickets online with instant delivery. Support multiple payment methods and pricing tiers.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 */}
          <Grid item xs={12} md={6} lg={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                border: '1px solid #f0f0f0',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 5,
                  borderColor: '#667eea',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ fontSize: '3rem', mb: 2 }}>
                  <QrCode2Icon sx={{ fontSize: 'inherit', color: '#667eea' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  QR Code Validation
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Verify attendees with QR codes. Seamless check-in experience at event entrance.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 4 */}
          <Grid item xs={12} md={6} lg={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                border: '1px solid #f0f0f0',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 5,
                  borderColor: '#667eea',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ fontSize: '3rem', mb: 2 }}>
                  <PeopleIcon sx={{ fontSize: 'inherit', color: '#764ba2' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Attendee Management
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Track attendees, manage registrations, and send communications all in one place.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 5 */}
          <Grid item xs={12} md={6} lg={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                border: '1px solid #f0f0f0',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 5,
                  borderColor: '#667eea',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ fontSize: '3rem', mb: 2 }}>
                  <SecurityIcon sx={{ fontSize: 'inherit', color: '#667eea' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Role-Based Access
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Secure permissions for admins, organizers, and attendees. Full control over access levels.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 6 */}
          <Grid item xs={12} md={6} lg={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                border: '1px solid #f0f0f0',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 5,
                  borderColor: '#667eea',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ fontSize: '3rem', mb: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 'inherit', color: '#764ba2' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Analytics & Reports
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Track revenue, attendance, and insights. Make data-driven decisions for future events.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ background: '#f8f9fa', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              How It Works
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Three simple steps to launch your event
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ maxWidth: 900, mx: 'auto' }}>
            {/* Step 1 */}
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Paper
                sx={{
                  p: 3,
                  mb: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  fontSize: '2rem',
                  fontWeight: 800,
                }}
              >
                1
              </Paper>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Create Event
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Set up your event, add details, and configure ticket types and pricing.
              </Typography>
            </Grid>

            {/* Step 2 */}
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Paper
                sx={{
                  p: 3,
                  mb: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  fontSize: '2rem',
                  fontWeight: 800,
                }}
              >
                2
              </Paper>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Publish & Share
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Publish your event and share it with your audience. Start accepting ticket bookings.
              </Typography>
            </Grid>

            {/* Step 3 */}
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Paper
                sx={{
                  p: 3,
                  mb: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  fontSize: '2rem',
                  fontWeight: 800,
                }}
              >
                3
              </Paper>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Manage & Track
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Monitor attendance, validate tickets, and track revenue in real-time.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* User Roles Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            For Every Role
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Tailored features for different user types
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Organizers */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                border: '2px solid #667eea',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                  👥 For Organizers
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                    <Typography variant="body2">Create unlimited events</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                    <Typography variant="body2">Manage ticketing</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                    <Typography variant="body2">View attendee analytics</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                    <Typography variant="body2">Track revenue</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Attendees */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                border: '2px solid #764ba2',
                background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.05) 0%, rgba(102, 126, 234, 0.05) 100%)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#764ba2' }}>
                  🎫 For Attendees
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#764ba2', flexShrink: 0 }} />
                    <Typography variant="body2">Discover events</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#764ba2', flexShrink: 0 }} />
                    <Typography variant="body2">Book tickets instantly</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#764ba2', flexShrink: 0 }} />
                    <Typography variant="body2">Manage your bookings</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#764ba2', flexShrink: 0 }} />
                    <Typography variant="body2">Digital ticket access</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Admins */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                border: '2px solid #667eea',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                  🔐 For Admins
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                    <Typography variant="body2">Approve organizers</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                    <Typography variant="body2">Manage all users</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                    <Typography variant="body2">System oversight</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                    <Typography variant="body2">Moderation tools</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
            Join thousands of event organizers and attendees enjoying seamless event management
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/register"
              endIcon={<ArrowRightIcon />}
              sx={{
                background: 'white',
                color: '#667eea',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  background: '#f0f0f0',
                },
              }}
            >
              Sign Up Now
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/events"
              sx={{
                borderColor: 'white',
                color: 'white',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Explore Events
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer Info */}
      <Box sx={{ background: '#f8f9fa', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} sx={{ textAlign: 'center' }}>
            <Grid item xs={12} sm={3}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                500+
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Events Created
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#764ba2', mb: 1 }}>
                10K+
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Happy Attendees
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                99.9%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Uptime
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#764ba2', mb: 1 }}>
                24/7
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Support
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default HomePage;