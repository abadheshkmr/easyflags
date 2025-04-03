import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const CreateSegment: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Segment
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the Create Segment page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default CreateSegment; 