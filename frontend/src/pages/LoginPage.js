import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { loginUser, sendPasswordResetEmail } from '../api/authApi';

function LoginPage({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const authResponse = await loginUser({ email, password });
      if (authResponse.error) {
        setMessage({ type: 'error', text: authResponse.error });
        return;
      }

      setUser({ email: authResponse.email, role: authResponse.role });
      // Store the auth token for authenticated requests
      if (authResponse.idToken) {
        localStorage.setItem('authToken', authResponse.idToken);
      }
      navigate('/dashboard');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email first.' });
      return;
    }

    setIsResetLoading(true);
    setMessage(null);

    try {
      const resetResponse = await sendPasswordResetEmail(email);
      if (resetResponse.error) {
        setMessage({ type: 'error', text: resetResponse.error });
      } else {
        setMessage({ type: 'success', text: 'Password reset email sent.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 45%, #f5f3ff 100%)', py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' }, gap: 4, alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: '#0f172a', fontSize: { xs: 36, md: 48 } }}>
              Welcome back
            </Typography>
            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 400, maxWidth: 560 }}>
              Sign in to manage bookings, validate tickets, track event activity, and continue where you left off.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: 'wrap' }}>
              {['Secure QR tickets', 'Role-based access', 'Real-time dashboards'].map((item) => (
                <Paper key={item} sx={{ px: 1.5, py: 0.8, borderRadius: 2, color: '#1d4ed8', fontWeight: 800 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>{item}</Typography>
                </Paper>
              ))}
            </Stack>
          </Box>

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
              Login
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Use your registered email and password.
            </Typography>
            {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
            <Box component="form" onSubmit={handleLogin} sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isLoading}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={isLoading}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ py: 1.2, fontWeight: 900, background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <Button
                variant="text"
                onClick={handleReset}
                disabled={isResetLoading}
                startIcon={isResetLoading ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {isResetLoading ? 'Sending...' : 'Forgot password?'}
              </Button>
            </Box>
            <Divider sx={{ my: 3 }} />
            <Typography>
              New here? <Link component={RouterLink} to="/register" sx={{ fontWeight: 800 }}>Create an account</Link>
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default LoginPage;
