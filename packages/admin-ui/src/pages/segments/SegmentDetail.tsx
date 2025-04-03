import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SegmentDetail: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Segment Detail
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the Segment Detail page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SegmentDetail; 