import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TenantList: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Tenants
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the Tenants list page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TenantList; 