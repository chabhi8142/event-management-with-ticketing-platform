import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  TextField,
  Stack,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { listAllUsers, blockUser, unblockUser, deleteUserAccount } from '../api/adminApi';

function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    action: null,
    userId: null,
    userName: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await listAllUsers();
      setUsers(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (action, userId, userName) => {
    setActionDialog({ open: true, action, userId, userName });
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, action: null, userId: null, userName: '' });
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  const handleAction = async () => {
    const { action, userId } = actionDialog;
    setIsActionLoading(true);
    try {
      if (action === 'block') {
        await blockUser(userId);
      } else if (action === 'unblock') {
        await unblockUser(userId);
      } else if (action === 'delete') {
        await deleteUserAccount(userId);
      }
      loadUsers();
      closeActionDialog();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeUsers = users.filter((user) => (user.status || 'active') === 'active').length;
  const blockedUsers = users.filter((user) => user.status === 'blocked').length;
  const organiserUsers = users.filter((user) => user.role === 'organiser').length;

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 54%, #6d28d9 100%)', color: 'white', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Stack spacing={1.5}>
            <PeopleIcon sx={{ fontSize: 42 }} />
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: 34, md: 46 } }}>
              User Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Manage users, roles, account status, and organiser access from one control surface.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3, mt: { xs: -3, md: -5 } }}>
          {[
            { label: 'Total Users', value: users.length, icon: <PeopleIcon />, color: '#2563eb' },
            { label: 'Active', value: activeUsers, icon: <CheckCircleIcon />, color: '#16a34a' },
            { label: 'Blocked', value: blockedUsers, icon: <BlockIcon />, color: '#dc2626' },
            { label: 'Organisers', value: organiserUsers, icon: <SupervisorAccountIcon />, color: '#7c3aed' },
          ].map((item) => (
            <Paper key={item.label} sx={{ flex: 1, p: 2.5, borderRadius: 2, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'white', backgroundColor: item.color }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>{item.value}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Search Bar */}
        <Paper sx={{ mb: 3, p: 2.5, borderRadius: 2, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}>
          <TextField
            fullWidth
            placeholder="Search by name, email, or role..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Paper>

        {/* Results Count */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Showing {filteredUsers.length} of {users.length} users
          </Typography>
        </Box>

        {/* Users Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#eef2ff' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Approved</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="textSecondary">
                      No users found matching your search
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" color={user.role === 'admin' ? 'error' : user.role === 'organiser' ? 'primary' : 'default'} sx={{ fontWeight: 700 }} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status || 'active'}
                    size="small"
                    color={user.status === 'blocked' ? 'error' : 'success'}
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isApproved ? 'Approved' : 'Pending'}
                    size="small"
                    color={user.isApproved ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  {user.status === 'active' ? (
                    <Button
                      size="small"
                      color="warning"
                      onClick={() => openActionDialog('block', user.id, user.name)}
                    >
                      Block
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      color="info"
                      onClick={() => openActionDialog('unblock', user.id, user.name)}
                    >
                      Unblock
                    </Button>
                  )}
                  <Button
                    size="small"
                    color="error"
                    onClick={() => openActionDialog('delete', user.id, user.name)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Confirmation Dialog */}
        <Dialog open={actionDialog.open} onClose={closeActionDialog} disableEscapeKeyDown={isActionLoading}>
          <DialogTitle>Confirm {actionDialog.action}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to {actionDialog.action} "{actionDialog.userName}"? This action may be irreversible.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeActionDialog} disabled={isActionLoading}>Cancel</Button>
            <Button 
              onClick={handleAction} 
              color="error" 
              variant="contained"
              disabled={isActionLoading}
              startIcon={isActionLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isActionLoading ? 'Processing...' : (actionDialog.action?.charAt(0).toUpperCase() + actionDialog.action?.slice(1))}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default AdminUserManagementPage;
