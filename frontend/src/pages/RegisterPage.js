import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { registerAccount } from '../api/authApi';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee');
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await registerAccount({ name, email, password, role });
      if (response.error) {
        setMessage({ type: 'error', text: response.error });
        return;
      }

      const successText = role === 'organiser'
        ? 'Account created! Your organiser account is pending admin approval. You will be notified once approved.'
        : 'Account created. Please check your email for verification instructions.';

      setMessage({
        type: 'success',
        text: successText,
      });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%)', py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.95fr 1.05fr' }, gap: 4, alignItems: 'center' }}>
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
              Create account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose attendee access for bookings or organiser access to publish and manage events.
            </Typography>
            {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={isLoading}
              />
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
              <FormControl fullWidth disabled={isLoading}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  value={role}
                  label="Role"
                  onChange={(event) => setRole(event.target.value)}
                >
                  <MenuItem value="attendee">Attendee</MenuItem>
                  <MenuItem value="organiser">Organiser</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ py: 1.2, fontWeight: 900, background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </Box>
            <Divider sx={{ my: 3 }} />
            <Typography>
              Already registered? <Link component={RouterLink} to="/login" sx={{ fontWeight: 800 }}>Login</Link>
            </Typography>
          </Paper>

          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: '#0f172a', fontSize: { xs: 36, md: 48 } }}>
              Join the platform
            </Typography>
            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 400, maxWidth: 590 }}>
              Book events as an attendee or request organiser access to create events, monitor sales, and validate secure QR tickets.
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              {['Attendee ticket wallet', 'Organiser approval workflow', 'Admin controlled access'].map((item) => (
                <Paper key={item} sx={{ px: 2, py: 1.2, borderRadius: 2, color: '#334155' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{item}</Typography>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default RegisterPage;
