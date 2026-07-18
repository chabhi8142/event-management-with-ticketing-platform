import React from 'react';
import { Box, TextField, MenuItem, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function TicketSearchFilterBar({ search, setSearch, status, setStatus, date, setDate }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      <TextField
        size="small"
        variant="outlined"
        placeholder="Search by event name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
          sx: { borderRadius: 2, backgroundColor: 'white' },
        }}
        sx={{ minWidth: { xs: '100%', sm: 260 }, flex: { xs: '1 1 100%', sm: '1 1 260px' } }}
      />
      <TextField
        select
        size="small"
        label="Status"
        value={status}
        onChange={e => setStatus(e.target.value)}
        sx={{ minWidth: { xs: '100%', sm: 150 } }}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="booked">Booked</MenuItem>
        <MenuItem value="validated">Validated</MenuItem>
        <MenuItem value="cancelled">Cancelled</MenuItem>
      </TextField>
      <TextField
        size="small"
        label="Booked Date"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: { xs: '100%', sm: 180 } }}
      />
    </Box>
  );
}

export default TicketSearchFilterBar;
