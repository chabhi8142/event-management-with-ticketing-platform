import React, { useMemo } from 'react';
import { AppBar, Button, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function NavBar({ onLogout, userEmail, userRole }) {
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    onLogout();
    window.location.href = '/';
  };

  // Memoize the role-based buttons to prevent unnecessary re-renders
  const roleButtons = useMemo(() => {
    if (userRole === 'organiser') {
      return (
        <>
          <Button color="inherit" component={RouterLink} to="/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={RouterLink} to="/events/manage">
            Manage Events
          </Button>
        </>
      );
    }
    if (userRole === 'attendee') {
      return (
        <Button color="inherit" component={RouterLink} to="/my-tickets">
          My Tickets
        </Button>
      );
    }
    if (userRole === 'admin') {
      return (
        <Button color="inherit" component={RouterLink} to="/admin/dashboard">
          Admin Panel
        </Button>
      );
    }
    return null;
  }, [userRole]);

  // Memoize auth button to prevent flickering
  const authButton = useMemo(() => {
    if (userEmail) {
      return (
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      );
    }
    return (
      <Button color="inherit" component={RouterLink} to="/login">
        Login
      </Button>
    );
  }, [userEmail]);

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/" 
          sx={{ color: '#fff', textDecoration: 'none', flexGrow: 1 }}
        >
          Event Management
        </Typography>
        <Button color="inherit" component={RouterLink} to="/events">
          Events
        </Button>
        {roleButtons}
        {authButton}
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
