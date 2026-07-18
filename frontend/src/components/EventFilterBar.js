import React from 'react';
import { Box, Button, TextField, MenuItem, InputAdornment } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import { categoryOptions } from '../utils/eventDiscovery';

const sortOptions = [
  { value: '', label: 'None' },
  { value: 'date_asc', label: 'Date ↑' },
  { value: 'date_desc', label: 'Date ↓' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'popularity_desc', label: 'Most Popular' },
  { value: 'availability_desc', label: 'Most Available' },
];

function EventFilterBar({ filter, setFilter, sort, setSort }) {
  const updateFilter = (field) => (event) => {
    setFilter((current) => ({ ...current, [field]: event.target.value }));
  };

  const clearFilters = () => {
    setFilter({
      category: '',
      startDate: '',
      endDate: '',
      location: '',
      minPrice: '',
      maxPrice: '',
    });
    setSort('');
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        label="Category"
        select
        size="small"
        value={filter.category || ''}
        onChange={updateFilter('category')}
        sx={{ minWidth: { xs: '100%', sm: 160 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
      >
        {categoryOptions.map((category) => (
          <MenuItem key={category} value={category === 'All' ? '' : category}>
            {category}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="From Date"
        type="date"
        size="small"
        value={filter.startDate || ''}
        onChange={updateFilter('startDate')}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: { xs: '100%', sm: 170 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
      />
      <TextField
        label="To Date"
        type="date"
        size="small"
        value={filter.endDate || ''}
        onChange={updateFilter('endDate')}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: { xs: '100%', sm: 170 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
      />
      <TextField
        label="Location"
        size="small"
        value={filter.location || ''}
        onChange={updateFilter('location')}
        sx={{ minWidth: { xs: '100%', sm: 170 }, flex: { xs: '1 1 100%', sm: '1 1 170px' } }}
      />
      <TextField
        label="Min Price"
        type="number"
        size="small"
        value={filter.minPrice || ''}
        onChange={updateFilter('minPrice')}
        sx={{ width: { xs: 'calc(50% - 6px)', sm: 120 } }}
      />
      <TextField
        label="Max Price"
        type="number"
        size="small"
        value={filter.maxPrice || ''}
        onChange={updateFilter('maxPrice')}
        sx={{ width: { xs: 'calc(50% - 6px)', sm: 120 } }}
      />
      <TextField
        label="Sort By"
        select
        size="small"
        value={sort}
        onChange={e => setSort(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SortIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: { xs: '100%', sm: 170 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
      >
        {sortOptions.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>
      <Button variant="outlined" onClick={clearFilters} sx={{ height: 40, px: 2.5 }}>
        Clear
      </Button>
    </Box>
  );
}

export default EventFilterBar;
