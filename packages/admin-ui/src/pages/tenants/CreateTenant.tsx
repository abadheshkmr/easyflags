import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const CreateTenant: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Tenant
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the Create Tenant page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default CreateTenant; 