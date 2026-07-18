import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function EventSearchBar({ value, onChange, placeholder = 'Search events...' }) {
  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'text.secondary' }} />
          </InputAdornment>
        ),
        sx: { borderRadius: 2, backgroundColor: 'white' },
      }}
      sx={{ mb: 0 }}
    />
  );
}

export default EventSearchBar;
