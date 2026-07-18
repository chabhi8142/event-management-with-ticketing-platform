import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Typography,
  Chip,
  Divider,
  Stack,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getPendingOrganisers, approveOrganiser, rejectOrganiser } from '../api/adminApi';

function AdminOrganiserApprovalPage() {
  const [organisers, setOrganisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    action: null,
    userId: null,
    organiserName: '',
  });

  useEffect(() => {
    loadPendingOrganisers();
  }, []);

  const loadPendingOrganisers = async () => {
    try {
      const data = await getPendingOrganisers();
      setOrganisers(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (action, userId, organiserName) => {
    setActionDialog({ open: true, action, userId, organiserName });
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, action: null, userId: null, organiserName: '' });
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
    try {
      setError(null);
      if (action === 'approve') {
        await approveOrganiser(userId);
        setSuccessMessage(`${actionDialog.organiserName} has been approved!`);
      } else if (action === 'reject') {
        await rejectOrganiser(userId);
        setSuccessMessage(`${actionDialog.organiserName} has been rejected.`);
      }
      setTimeout(() => {
        loadPendingOrganisers();
        setSuccessMessage(null);
      }, 1500);
      closeActionDialog();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 6 }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Organiser Approval
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Review and approve pending organiser accounts. Once approved, they can create and manage events.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

        {organisers.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              border: '1px solid #e0e0e0',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              All Caught Up!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              No pending organiser approvals at this time. All applications have been processed.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {organisers.map((organiser) => (
              <Grid item xs={12} md={6} lg={4} key={organiser.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: '#667eea',
                    },
                  }}
                >
                  <CardHeader
                    title={organiser.name}
                    titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
                    sx={{ pb: 1 }}
                  />
                  <Divider />
                  <CardContent sx={{ flex: 1, py: 2 }}>
                    {/* Email */}
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <EmailIcon sx={{ color: 'primary.main', mt: 0.5, fontSize: 20 }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            Email Address
                          </Typography>
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {organiser.email}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Request Date */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <CalendarTodayIcon sx={{ color: 'primary.main', mt: 0.5, fontSize: 20 }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            Requested On
                          </Typography>
                          <Typography variant="body2">
                            {new Date(organiser.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status Badge */}
                      <Chip
                        label="Pending Review"
                        variant="outlined"
                        color="warning"
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    </Stack>
                  </CardContent>
                  <Divider />
                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      color="success"
                      onClick={() => openActionDialog('approve', organiser.id, organiser.name)}
                    >
                      Approve
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      color="error"
                      onClick={() => openActionDialog('reject', organiser.id, organiser.name)}
                    >
                      Reject
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

      <Dialog open={actionDialog.open} onClose={closeActionDialog}>
        <DialogTitle>
          {actionDialog.action === 'approve' ? 'Approve Organiser' : 'Reject Organiser'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionDialog.action === 'approve'
              ? `Are you sure you want to approve "${actionDialog.organiserName}"? They will be able to create and manage events.`
              : `Are you sure you want to reject "${actionDialog.organiserName}"? They will be notified and their account will be deleted.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionDialog}>Cancel</Button>
          <Button
            onClick={handleAction}
            color={actionDialog.action === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </Box>
  );
}

export default AdminOrganiserApprovalPage;
