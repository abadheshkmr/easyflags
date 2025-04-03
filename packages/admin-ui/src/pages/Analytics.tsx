import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Analytics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the Analytics page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Analytics; 