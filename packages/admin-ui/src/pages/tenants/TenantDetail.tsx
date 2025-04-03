import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TenantDetail: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Tenant Detail
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the Tenant Detail page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TenantDetail; 