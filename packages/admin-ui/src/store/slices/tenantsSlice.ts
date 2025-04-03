import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import tenantService from '../../services/tenantService';

export interface Tenant {
  id: string;
  name: string;
  description?: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantsState {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TenantsState = {
  tenants: [],
  currentTenant: null,
  isLoading: false,
  error: null,
};

export const fetchTenants = createAsyncThunk(
  'tenants/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const tenants = await tenantService.getAllTenants();
      return tenants;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch tenants');
    }
  }
);

export const fetchTenantById = createAsyncThunk(
  'tenants/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const tenant = await tenantService.getTenantById(id);
      return tenant;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch tenant');
    }
  }
);

export const createTenant = createAsyncThunk(
  'tenants/create',
  async (tenant: Partial<Tenant>, { rejectWithValue }) => {
    try {
      const newTenant = await tenantService.createTenant(tenant);
      return newTenant;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create tenant');
    }
  }
);

export const updateTenant = createAsyncThunk(
  'tenants/update',
  async (
    { id, updates }: { id: string; updates: Partial<Tenant> },
    { rejectWithValue }
  ) => {
    try {
      const updatedTenant = await tenantService.updateTenant(id, updates);
      return updatedTenant;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update tenant');
    }
  }
);

export const deleteTenant = createAsyncThunk(
  'tenants/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await tenantService.deleteTenant(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete tenant');
    }
  }
);

const tenantsSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    setCurrentTenant: (state, action: PayloadAction<Tenant>) => {
      state.currentTenant = action.payload;
      localStorage.setItem('currentTenantId', action.payload.id);
    },
    clearCurrentTenant: (state) => {
      state.currentTenant = null;
      localStorage.removeItem('currentTenantId');
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all tenants
      .addCase(fetchTenants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenants = action.payload;
        
        // If we have a stored tenant ID, set the current tenant
        const storedTenantId = localStorage.getItem('currentTenantId');
        if (storedTenantId) {
          const tenant = action.payload.find((t) => t.id === storedTenantId);
          if (tenant) {
            state.currentTenant = tenant;
          }
        } else if (action.payload.length > 0) {
          // Set the first tenant as current if none is selected
          state.currentTenant = action.payload[0];
          localStorage.setItem('currentTenantId', action.payload[0].id);
        }
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch tenant by ID
      .addCase(fetchTenantById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenantById.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the tenant in the list if it exists
        const index = state.tenants.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        } else {
          state.tenants.push(action.payload);
        }
        
        // If this is the current tenant, update it
        if (state.currentTenant?.id === action.payload.id) {
          state.currentTenant = action.payload;
        }
      })
      .addCase(fetchTenantById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create tenant
      .addCase(createTenant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTenant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenants.push(action.payload);
        // If this is the first tenant, set it as current
        if (state.tenants.length === 1) {
          state.currentTenant = action.payload;
          localStorage.setItem('currentTenantId', action.payload.id);
        }
      })
      .addCase(createTenant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update tenant
      .addCase(updateTenant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTenant.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tenants.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        }
        if (state.currentTenant?.id === action.payload.id) {
          state.currentTenant = action.payload;
        }
      })
      .addCase(updateTenant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete tenant
      .addCase(deleteTenant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenants = state.tenants.filter((t) => t.id !== action.payload);
        
        // If the deleted tenant was the current tenant, set the first available tenant as current
        if (state.currentTenant?.id === action.payload) {
          if (state.tenants.length > 0) {
            state.currentTenant = state.tenants[0];
            localStorage.setItem('currentTenantId', state.tenants[0].id);
          } else {
            state.currentTenant = null;
            localStorage.removeItem('currentTenantId');
          }
        }
      })
      .addCase(deleteTenant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentTenant, clearCurrentTenant } = tenantsSlice.actions;
export default tenantsSlice.reducer; 