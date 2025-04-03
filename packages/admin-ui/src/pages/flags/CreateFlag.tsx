import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const CreateFlag: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Flag
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the Create Flag page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default CreateFlag; 