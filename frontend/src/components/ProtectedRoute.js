import React from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';

function ProtectedRoute({ user, requiredRole, children }) {
  const navigate = useNavigate();

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user doesn't have the required role, show unauthorized message
  if (requiredRole && !requiredRole.includes(user.role)) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LockIcon sx={{ fontSize: 60, color: 'error.main' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
            Unauthorized Access
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Your role ({user.role}) does not have permission to access this page.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Only users with the following roles can access this page: {requiredRole.join(', ')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // User has access, render the component
  return children;
}

export default ProtectedRoute;
