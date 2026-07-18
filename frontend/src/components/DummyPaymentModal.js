import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, CircularProgress } from '@mui/material';

function DummyPaymentModal({ open, onClose, onSuccess, amount, loading }) {
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handlePay = () => {
    if (!card || !expiry || !cvv || !name) {
      setError('Please fill all fields');
      return;
    }
    setError('');
    onSuccess();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Dummy Payment</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter dummy payment details to complete your booking. No real payment will be processed.
        </Typography>
        <TextField
          label="Card Number"
          fullWidth
          margin="dense"
          value={card}
          onChange={e => setCard(e.target.value)}
          inputProps={{ maxLength: 19 }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Expiry (MM/YY)"
            margin="dense"
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
            sx={{ flex: 1 }}
            inputProps={{ maxLength: 5 }}
          />
          <TextField
            label="CVV"
            margin="dense"
            value={cvv}
            onChange={e => setCvv(e.target.value)}
            sx={{ flex: 1 }}
            inputProps={{ maxLength: 4 }}
          />
        </Box>
        <TextField
          label="Name on Card"
          fullWidth
          margin="dense"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main', textAlign: 'right' }}>
          Amount: £{amount}
        </Typography>
        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handlePay} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Pay Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DummyPaymentModal;
