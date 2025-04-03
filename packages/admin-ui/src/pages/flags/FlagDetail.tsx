import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const FlagDetail: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Flag Detail
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the Flag Detail page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default FlagDetail; 