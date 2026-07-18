import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import DashboardPage from './pages/DashboardPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import EventManagementPage from './pages/EventManagementPage';
import BookTicketPage from './pages/BookTicketPage';
import MyTicketsPage from './pages/MyTicketsPage';
import OrganizerTicketsPage from './pages/OrganizerTicketsPage';
import OrganizerAnalyticsPage from './pages/OrganizerAnalyticsPage';
import TicketValidationPage from './pages/TicketValidationPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import AdminOrganiserApprovalPage from './pages/AdminOrganiserApprovalPage';
import SystemMonitoringDetailsPage from './pages/SystemMonitoringDetailsPage';
import { verifyToken } from './api/authApi';

function App() {
  const [user, setUser] = useState(() => {
    // Restore user from localStorage on app load
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Verify auth status on mount
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          // No token, clear user
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthLoading(false);
          return;
        }

        // Token exists, verify it
        const tokenData = await verifyToken();
        if (tokenData) {
          // Token is valid, update user with backend data
          const userData = { email: tokenData.email, role: tokenData.role };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Token invalid, clear everything
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } catch (error) {
        // Network error - keep user from localStorage if it exists
        console.error('Auth verification error:', error);
        const saved = localStorage.getItem('user');
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } finally {
        setIsAuthLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const handleSetUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  // Show loading spinner while verifying auth
  if (isAuthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <CssBaseline />
      <NavBar onLogout={handleLogout} userEmail={user?.email} userRole={user?.role} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage setUser={handleSetUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/events" element={<EventsPage user={user} />} />
        <Route path="/events/:eventId" element={<EventDetailsPage user={user} />} />

        {/* Attendee Routes */}
        <Route 
          path="/book-ticket/:eventId" 
          element={
            <ProtectedRoute user={user} requiredRole={['attendee', 'organiser', 'admin']}>
              <BookTicketPage user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-tickets" 
          element={
            <ProtectedRoute user={user} requiredRole={['attendee', 'organiser', 'admin']}>
              <MyTicketsPage user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user}>
              <DashboardPage user={user} />
            </ProtectedRoute>
          } 
        />

        {/* Organizer Routes */}
        <Route 
          path="/events/create" 
          element={
            <ProtectedRoute user={user} requiredRole={['organiser', 'admin']}>
              <CreateEventPage user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/events/manage" 
          element={
            <ProtectedRoute user={user} requiredRole={['organiser', 'admin']}>
              <EventManagementPage user={user} />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/events/edit/:eventId"
          element={
            <ProtectedRoute user={user} requiredRole={['organiser', 'admin']}>
              <EditEventPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/events/:eventId/tickets" 
          element={
            <ProtectedRoute user={user} requiredRole={['organiser', 'admin']}>
              <OrganizerTicketsPage user={user} />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/events/analytics"
          element={
            <ProtectedRoute user={user} requiredRole={['organiser', 'admin']}>
              <OrganizerAnalyticsPage user={user} />
            </ProtectedRoute>
          }
        />

        {/* Ticket Validation Route - Organizers and Admins */}
        <Route 
          path="/validate-tickets" 
          element={
            <ProtectedRoute user={user} requiredRole={['organiser', 'admin']}>
              <TicketValidationPage user={user} />
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
          <Route
            path="/admin/dashboard" 
            element={
              <ProtectedRoute user={user} requiredRole={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system-monitoring"
            element={
              <ProtectedRoute user={user} requiredRole={['admin']}>
                <SystemMonitoringDetailsPage />
              </ProtectedRoute>
            }
          />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute user={user} requiredRole={['admin']}>
              <AdminUserManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/organisers" 
          element={
            <ProtectedRoute user={user} requiredRole={['admin']}>
              <AdminOrganiserApprovalPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
