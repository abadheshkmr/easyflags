import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import flagService from '../../services/flagService';
import { RootState } from '../index';

interface Condition {
  id: string;
  attribute: string;
  operator: string;
  value: string;
}

interface TargetingRule {
  id: string;
  name: string;
  description?: string;
  percentage: number;
  enabled: boolean;
  conditions: Condition[];
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  targetingRules: TargetingRule[];
}

interface FlagsState {
  flags: FeatureFlag[];
  selectedFlag: FeatureFlag | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: FlagsState = {
  flags: [],
  selectedFlag: null,
  isLoading: false,
  error: null,
};

export const fetchFlags = createAsyncThunk(
  'flags/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth, tenants } = getState() as RootState;
      const tenantId = tenants.currentTenant?.id;
      
      const flags = await flagService.getAllFlags(tenantId);
      return flags;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch flags');
    }
  }
);

export const fetchFlagByKey = createAsyncThunk(
  'flags/fetchByKey',
  async (key: string, { rejectWithValue }) => {
    try {
      const flag = await flagService.getFlagByKey(key);
      return flag;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch flag');
    }
  }
);

export const createFlag = createAsyncThunk(
  'flags/create',
  async (flag: Partial<FeatureFlag>, { rejectWithValue }) => {
    try {
      const newFlag = await flagService.createFlag(flag);
      return newFlag;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create flag');
    }
  }
);

export const updateFlag = createAsyncThunk(
  'flags/update',
  async (
    { key, updates }: { key: string; updates: Partial<FeatureFlag> },
    { rejectWithValue }
  ) => {
    try {
      const updatedFlag = await flagService.updateFlag(key, updates);
      return updatedFlag;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update flag');
    }
  }
);

export const toggleFlag = createAsyncThunk(
  'flags/toggle',
  async (
    { key, enabled }: { key: string; enabled: boolean },
    { rejectWithValue }
  ) => {
    try {
      const updatedFlag = await flagService.toggleFlag(key, enabled);
      return updatedFlag;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to toggle flag');
    }
  }
);

export const deleteFlag = createAsyncThunk(
  'flags/delete',
  async (key: string, { rejectWithValue }) => {
    try {
      await flagService.deleteFlag(key);
      return key;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete flag');
    }
  }
);

export const addTargetingRule = createAsyncThunk(
  'flags/addTargetingRule',
  async (
    { flagKey, rule }: { 
      flagKey: string; 
      rule: Omit<TargetingRule, 'id'>;
    },
    { rejectWithValue }
  ) => {
    try {
      const updatedFlag = await flagService.addTargetingRule(flagKey, rule);
      return updatedFlag;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to add targeting rule');
    }
  }
);

const flagsSlice = createSlice({
  name: 'flags',
  initialState,
  reducers: {
    setSelectedFlag: (state, action: PayloadAction<FeatureFlag | null>) => {
      state.selectedFlag = action.payload;
    },
    clearSelectedFlag: (state) => {
      state.selectedFlag = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all flags
      .addCase(fetchFlags.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFlags.fulfilled, (state, action) => {
        state.isLoading = false;
        state.flags = action.payload;
      })
      .addCase(fetchFlags.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch flag by key
      .addCase(fetchFlagByKey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFlagByKey.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedFlag = action.payload;
      })
      .addCase(fetchFlagByKey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create flag
      .addCase(createFlag.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFlag.fulfilled, (state, action) => {
        state.isLoading = false;
        state.flags.push(action.payload);
        state.selectedFlag = action.payload;
      })
      .addCase(createFlag.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update flag
      .addCase(updateFlag.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFlag.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.flags.findIndex((flag) => flag.id === action.payload.id);
        if (index !== -1) {
          state.flags[index] = action.payload;
        }
        if (state.selectedFlag?.id === action.payload.id) {
          state.selectedFlag = action.payload;
        }
      })
      .addCase(updateFlag.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Toggle flag
      .addCase(toggleFlag.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleFlag.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.flags.findIndex((flag) => flag.id === action.payload.id);
        if (index !== -1) {
          state.flags[index] = action.payload;
        }
        if (state.selectedFlag?.id === action.payload.id) {
          state.selectedFlag = action.payload;
        }
      })
      .addCase(toggleFlag.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete flag
      .addCase(deleteFlag.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteFlag.fulfilled, (state, action) => {
        state.isLoading = false;
        state.flags = state.flags.filter((flag) => flag.key !== action.payload);
        if (state.selectedFlag?.key === action.payload) {
          state.selectedFlag = null;
        }
      })
      .addCase(deleteFlag.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Add targeting rule
      .addCase(addTargetingRule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addTargetingRule.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.flags.findIndex((flag) => flag.id === action.payload.id);
        if (index !== -1) {
          state.flags[index] = action.payload;
        }
        if (state.selectedFlag?.id === action.payload.id) {
          state.selectedFlag = action.payload;
        }
      })
      .addCase(addTargetingRule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedFlag, clearSelectedFlag } = flagsSlice.actions;
export default flagsSlice.reducer; 