import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Flag as FlagIcon,
  PeopleAlt as PeopleAltIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { fetchFlags } from '../store/slices/flagsSlice';
import { RootState } from '../store';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { flags, isLoading } = useSelector((state: RootState) => state.flags);
  const { currentTenant } = useSelector((state: RootState) => state.tenants);

  useEffect(() => {
    // Load flags when the dashboard is mounted
    dispatch(fetchFlags());
  }, [dispatch, currentTenant]);

  const activeFlags = flags.filter((flag) => flag.enabled);
  const inactiveFlags = flags.filter((flag) => !flag.enabled);
  
  // Mock data for recent activity - this would come from an API in a real implementation
  const recentActivity = [
    { id: 1, type: 'flag_enabled', flagName: 'new-checkout-flow', user: 'John Doe', timestamp: '2023-05-20T10:30:00Z' },
    { id: 2, type: 'flag_created', flagName: 'dark-mode-v2', user: 'Jane Smith', timestamp: '2023-05-19T14:45:00Z' },
    { id: 3, type: 'rule_updated', flagName: 'premium-features', user: 'Alex Johnson', timestamp: '2023-05-18T09:15:00Z' },
    { id: 4, type: 'flag_disabled', flagName: 'beta-dashboard', user: 'Sarah Williams', timestamp: '2023-05-17T16:20:00Z' },
  ];

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'flag_enabled':
        return <Chip label="Enabled" color="success" size="small" />;
      case 'flag_disabled':
        return <Chip label="Disabled" color="error" size="small" />;
      case 'flag_created':
        return <Chip label="Created" color="primary" size="small" />;
      case 'rule_updated':
        return <Chip label="Updated" color="info" size="small" />;
      default:
        return <Chip label={type} size="small" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/flags/create')}
        >
          New Feature Flag
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FlagIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Active Flags
                </Typography>
              </Box>
              <Typography variant="h3" component="div" color="primary">
                {activeFlags.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {Math.round((activeFlags.length / (flags.length || 1)) * 100)}% of total flags
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FlagIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Inactive Flags
                </Typography>
              </Box>
              <Typography variant="h3" component="div" color="error">
                {inactiveFlags.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {Math.round((inactiveFlags.length / (flags.length || 1)) * 100)}% of total flags
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleAltIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  User Segments
                </Typography>
              </Box>
              <Typography variant="h3" component="div" color="info">
                5
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Used in 8 different flags
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Evaluations
                </Typography>
              </Box>
              <Typography variant="h3" component="div" color="success">
                15.2k
              </Typography>
              <Typography variant="body2" color="textSecondary">
                In the last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Recent Activity
          </Typography>
          <Button startIcon={<RefreshIcon />} onClick={() => dispatch(fetchFlags())}>
            Refresh
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Flag</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentActivity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{getActivityTypeLabel(activity.type)}</TableCell>
                  <TableCell>{activity.flagName}</TableCell>
                  <TableCell>{activity.user}</TableCell>
                  <TableCell>{formatDate(activity.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Quick Access */}
      <Box>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Quick Access
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Popular Feature Flags
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1}>
                  {activeFlags.slice(0, 3).map((flag) => (
                    <Box
                      key={flag.id}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/flags/${flag.key}`)}
                    >
                      <Typography variant="subtitle2">{flag.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {flag.key}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    fullWidth
                    onClick={() => navigate('/flags/create')}
                  >
                    Create New Flag
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PeopleAltIcon />}
                    fullWidth
                    onClick={() => navigate('/segments/create')}
                  >
                    Create User Segment
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    fullWidth
                    onClick={() => navigate('/analytics')}
                  >
                    View Analytics
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard; 