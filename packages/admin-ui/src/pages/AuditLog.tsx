import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const AuditLog: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Audit Log
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the Audit Log page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AuditLog; 