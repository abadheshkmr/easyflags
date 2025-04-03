import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Profile: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        User Profile
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          This is a placeholder for the User Profile page.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile; 