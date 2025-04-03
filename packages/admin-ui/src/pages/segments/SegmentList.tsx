import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SegmentList: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        User Segments
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the User Segments list page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SegmentList; 