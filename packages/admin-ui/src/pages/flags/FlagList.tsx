import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { fetchFlags, toggleFlag, FeatureFlag } from '../../store/slices/flagsSlice';
import { RootState } from '../../store';

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof FeatureFlag | 'actions';
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: HeadCell[] = [
  { id: 'name', label: 'Flag Name', numeric: false, sortable: true },
  { id: 'key', label: 'Key', numeric: false, sortable: true },
  { id: 'enabled', label: 'Status', numeric: false, sortable: true },
  { id: 'updatedAt', label: 'Last Updated', numeric: false, sortable: true },
  { id: 'actions', label: 'Actions', numeric: false, sortable: false },
];

const FlagList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { flags, isLoading } = useSelector((state: RootState) => state.flags);
  const { currentTenant } = useSelector((state: RootState) => state.tenants);
  
  // State for sorting
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof FeatureFlag>('updatedAt');
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for searching
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for filtering
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  
  // State for action menu
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFlagKey, setSelectedFlagKey] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchFlags());
  }, [dispatch, currentTenant]);

  // Sort function
  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
  ): (a: { [key in Key]: any }, b: { [key in Key]: any }) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // Filter function
  const getFilteredFlags = () => {
    return flags
      .filter((flag) => {
        // Status filter
        if (statusFilter === 'enabled' && !flag.enabled) return false;
        if (statusFilter === 'disabled' && flag.enabled) return false;
        
        // Search filter
        if (searchTerm && !flag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !flag.key.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        return true;
      })
      .sort(getComparator(order, orderBy));
  };

  const filteredFlags = getFilteredFlags();

  // Handlers
  const handleRequestSort = (property: keyof FeatureFlag) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleStatusFilterChange = (status: 'all' | 'enabled' | 'disabled') => {
    setStatusFilter(status);
    handleFilterClose();
    setPage(0);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, flagKey: string) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedFlagKey(flagKey);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedFlagKey(null);
  };

  const handleToggle = (key: string, enabled: boolean) => {
    dispatch(toggleFlag({ key, enabled: !enabled }));
  };

  const handleEdit = (key: string) => {
    navigate(`/flags/${key}`);
    handleActionMenuClose();
  };

  const handleDelete = (_key: string) => {
    // Implement delete functionality
    // dispatch(deleteFlag(key));
    handleActionMenuClose();
  };

  const handleRefresh = () => {
    dispatch(fetchFlags());
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

  // Empty rows logic for pagination
  const emptyRows = Math.max(0, (1 + page) * rowsPerPage - filteredFlags.length);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Feature Flags
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/flags/create')}
        >
          New Flag
        </Button>
      </Box>

      {/* Filters & Search Bar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search flags by name or key..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              variant="outlined"
            >
              Filter
              {statusFilter !== 'all' && (
                <Chip
                  label={statusFilter === 'enabled' ? 'Enabled' : 'Disabled'}
                  size="small"
                  color={statusFilter === 'enabled' ? 'success' : 'error'}
                  sx={{ ml: 1 }}
                />
              )}
            </Button>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem
                selected={statusFilter === 'all'}
                onClick={() => handleStatusFilterChange('all')}
              >
                All Flags
              </MenuItem>
              <MenuItem
                selected={statusFilter === 'enabled'}
                onClick={() => handleStatusFilterChange('enabled')}
              >
                Enabled Only
              </MenuItem>
              <MenuItem
                selected={statusFilter === 'disabled'}
                onClick={() => handleStatusFilterChange('disabled')}
              >
                Disabled Only
              </MenuItem>
            </Menu>
          </Grid>
          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              variant="outlined"
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Flag Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id as keyof FeatureFlag)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFlags
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((flag) => (
                  <TableRow
                    hover
                    key={flag.id}
                    onClick={() => navigate(`/flags/${flag.key}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{flag.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {flag.description?.slice(0, 60)}
                        {flag.description && flag.description.length > 60 ? '...' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>{flag.key}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Switch
                          checked={flag.enabled}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggle(flag.key, flag.enabled);
                          }}
                          color={flag.enabled ? 'success' : 'error'}
                        />
                        <Chip
                          label={flag.enabled ? 'Enabled' : 'Disabled'}
                          color={flag.enabled ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(flag.updatedAt)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(flag.key);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionMenuOpen(e, flag.key);
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={5} />
                </TableRow>
              )}
              {filteredFlags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography variant="h6" color="textSecondary">
                      No feature flags found
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {searchTerm
                        ? `No results match "${searchTerm}"`
                        : statusFilter !== 'all'
                        ? `No ${statusFilter} flags found`
                        : 'Create your first feature flag to get started'}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/flags/create')}
                    >
                      Create New Flag
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredFlags.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionMenuClose}
      >
        <MenuItem
          onClick={() => selectedFlagKey && handleEdit(selectedFlagKey)}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => selectedFlagKey && handleDelete(selectedFlagKey)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FlagList; 